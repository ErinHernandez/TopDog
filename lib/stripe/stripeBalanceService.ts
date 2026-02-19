/**
 * Stripe Balance Service
 *
 * Manages user balance operations with atomic transactions and risk assessment.
 */

import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore';

import { captureError } from '../errorTracking';
import { getDb } from '../firebase-utils';
import { serverLogger } from '../logger/serverLogger';

import { toDisplayAmount } from './currencyConfig';
import type {
  RiskAssessment,
  RiskContext,
  UserPaymentData,
} from './stripeTypes';

/**
 * Balance update result with transaction details
 */
export interface BalanceUpdateResult {
  previousBalance: number;
  newBalance: number;
  amountDollars: number;
  operation: 'add' | 'subtract';
  timestamp: string;
}

/**
 * Update user's balance in Firebase using atomic transaction
 *
 * SECURITY: Uses Firestore transaction to prevent race conditions where
 * concurrent updates could result in incorrect balances.
 *
 * SECURITY FIX (Bug #6): Added currency parameter to handle zero-decimal currencies.
 * For currencies like JPY, KRW, VND, the amount is already in the smallest unit
 * and should NOT be divided by 100.
 *
 * @param userId - Firebase user ID
 * @param amountSmallestUnit - Amount in smallest unit (cents for USD, yen for JPY, etc.)
 * @param operation - 'add' for deposits, 'subtract' for withdrawals
 * @param idempotencyKey - Optional key to prevent duplicate operations
 * @param currency - ISO 4217 currency code (defaults to 'USD')
 * @returns Promise resolving to new balance
 */
export async function updateUserBalance(
  userId: string,
  amountSmallestUnit: number,
  operation: 'add' | 'subtract',
  idempotencyKey?: string,
  currency: string = 'USD'
): Promise<number> {
  try {
    const db = getDb();
    const userRef = doc(db, 'users', userId);

    // SECURITY FIX (Bug #6): Use currency-aware conversion to handle zero-decimal currencies
    // For USD: 2500 cents -> 25.00 dollars
    // For JPY: 2500 yen -> 2500 yen (zero-decimal, no conversion)
    // For BHD: 2500 fils -> 2.500 dinars (three-decimal)
    const amountDisplayUnits = toDisplayAmount(amountSmallestUnit, currency);

    // SECURITY: Check for duplicate operations if idempotency key provided
    if (idempotencyKey) {
      const balanceOpsRef = collection(db, 'balanceOperations');
      const duplicateQuery = query(
        balanceOpsRef,
        where('idempotencyKey', '==', idempotencyKey)
      );
      const duplicateSnapshot = await getDocs(duplicateQuery);

      if (!duplicateSnapshot.empty) {
        serverLogger.warn('Duplicate balance operation detected', null, {
          userId,
          idempotencyKey,
          operation,
          currency,
        });
        // Return the existing balance instead of processing duplicate
        const userDoc = await getDoc(userRef);
        return (userDoc.data()?.balance || 0) as number;
      }
    }

    // SECURITY: Use atomic transaction to prevent race conditions
    const result = await runTransaction(db, async (transaction) => {
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const currentBalance = (userDoc.data().balance || 0) as number;

      const newBalance = operation === 'add'
        ? currentBalance + amountDisplayUnits
        : currentBalance - amountDisplayUnits;

      // SECURITY: Prevent negative balances
      if (newBalance < 0) {
        throw new Error(`Insufficient balance. Current: ${currentBalance.toFixed(2)}, Requested: ${amountDisplayUnits.toFixed(2)}`);
      }

      // Update balance atomically within transaction
      transaction.update(userRef, {
        balance: newBalance,
        lastBalanceUpdate: serverTimestamp(),
      });

      // If idempotency key provided, record this operation
      if (idempotencyKey) {
        const balanceOpRef = doc(collection(db, 'balanceOperations'));
        transaction.set(balanceOpRef, {
          userId,
          idempotencyKey,
          operation,
          amountSmallestUnit,
          amountDisplayUnits,
          currency,
          previousBalance: currentBalance,
          newBalance,
          createdAt: serverTimestamp(),
        });
      }

      return {
        previousBalance: currentBalance,
        newBalance,
      };
    });

    serverLogger.info('Balance updated successfully', {
      userId,
      operation,
      amountDisplayUnits,
      currency,
      previousBalance: result.previousBalance,
      newBalance: result.newBalance,
      idempotencyKey,
    });

    return result.newBalance;
  } catch (error: unknown) {
    await captureError(error as Error, {
      tags: { component: 'stripe', operation: 'updateUserBalance' },
      extra: { userId, amountSmallestUnit, operation, currency },
    });
    throw error;
  }
}

/**
 * Get user's current balance (read-only, does not modify)
 */
export async function getUserBalance(userId: string): Promise<number> {
  try {
    const db = getDb();
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return 0;
    }

    return (userDoc.data().balance || 0) as number;
  } catch (error: unknown) {
    await captureError(error as Error, {
      tags: { component: 'stripe', operation: 'getUserBalance' },
      extra: { userId },
    });
    throw error;
  }
}

/**
 * Assess risk for a payment
 * Integrates with existing paymentSecurity.js
 */
export async function assessPaymentRisk(
  userId: string,
  amountCents: number,
  context: RiskContext
): Promise<RiskAssessment> {
  try {
    // Get user data for risk assessment
    const db = getDb();
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    const userData = userDoc.exists() ? userDoc.data() : {};

    let riskScore = 0;
    const factors: string[] = [];

    // Amount-based risk
    if (amountCents > 100000) { // > $1000
      riskScore += 20;
      factors.push('high_amount');
    }
    if (amountCents % 10000 === 0 && amountCents > 50000) { // Round amounts > $500
      riskScore += 15;
      factors.push('round_amount');
    }

    // Geographic risk
    if (context.country && context.country !== userData.registrationCountry) {
      riskScore += 25;
      factors.push('country_mismatch');
    }

    // New device risk
    if (context.newDevice) {
      riskScore += 20;
      factors.push('new_device');
    }

    // Velocity checks (would need transaction history query)
    // This is a simplified version

    // Time-based risk
    const hour = new Date().getHours();
    if (hour >= 2 && hour <= 6) {
      riskScore += 10;
      factors.push('unusual_time');
    }

    // Determine recommendation
    let recommendation: RiskAssessment['recommendation'];
    if (riskScore <= 30) {
      recommendation = 'approve';
    } else if (riskScore <= 50) {
      recommendation = 'review';
    } else if (riskScore <= 70) {
      recommendation = 'challenge';
    } else if (riskScore <= 90) {
      recommendation = 'manual_review';
    } else {
      recommendation = 'decline';
    }

    return {
      score: Math.min(riskScore, 100),
      factors,
      recommendation,
    };
  } catch (error: unknown) {
    // Don't fail the payment if risk assessment fails, just log
    serverLogger.error('Risk assessment failed', error instanceof Error ? error : new Error(String(error)));
    return {
      score: 0,
      factors: ['assessment_failed'],
      recommendation: 'review',
    };
  }
}
