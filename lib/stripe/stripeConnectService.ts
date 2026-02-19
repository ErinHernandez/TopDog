/**
 * Stripe Connect Service
 *
 * Manages Stripe Connect accounts and payouts for user withdrawals.
 */

import { doc, getDoc, setDoc, serverTimestamp, runTransaction } from 'firebase/firestore';
import Stripe from 'stripe';

import { requireAppUrl } from '../envHelpers';
import { captureError } from '../errorTracking';
import { getDb } from '../firebase-utils';
import { serverLogger } from '../logger/serverLogger';

import { toDisplayAmount } from './currencyConfig';
import { getStripeExchangeRate } from './exchangeRates';
import { getStripeInstance } from './stripeInstance';
import type {
  CreateConnectAccountRequest,
  ConnectAccountStatus,
  CreatePayoutRequest,
  PayoutResponse,
  UserPaymentData,
} from './stripeTypes';

/**
 * Create or retrieve a Stripe Connect account for payouts
 */
export async function getOrCreateConnectAccount(
  request: CreateConnectAccountRequest
): Promise<ConnectAccountStatus> {
  const stripe = getStripeInstance();
  const {
    userId,
    email,
    type = 'express',
    country = 'US',
    businessType = 'individual',
  } = request;

  try {
    // Check if user already has a Connect account
    const db = getDb();
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data() as UserPaymentData;

      if (userData.stripeConnectAccountId) {
        // Retrieve existing account status
        return getConnectAccountStatus(userData.stripeConnectAccountId);
      }
    }

    // Create new Connect account
    const account = await stripe.accounts.create({
      type,
      country,
      email,
      business_type: businessType,
      capabilities: {
        transfers: { requested: true },
      },
      metadata: {
        firebaseUserId: userId,
      },
    });

    // Store account ID in Firebase (use merge for safety)
    await setDoc(userRef, {
      stripeConnectAccountId: account.id,
      stripeConnectOnboarded: false,
    }, { merge: true });

    return getConnectAccountStatus(account.id);
  } catch (error: unknown) {
    await captureError(error as Error, {
      tags: { component: 'stripe', operation: 'getOrCreateConnectAccount' },
      extra: { userId, email },
    });
    throw error;
  }
}

/**
 * Get Connect account status and onboarding link if needed
 */
export async function getConnectAccountStatus(
  accountId: string
): Promise<ConnectAccountStatus> {
  const stripe = getStripeInstance();

  try {
    const account = await stripe.accounts.retrieve(accountId);

    const status: ConnectAccountStatus = {
      accountId: account.id,
      chargesEnabled: account.charges_enabled ?? false,
      payoutsEnabled: account.payouts_enabled ?? false,
      detailsSubmitted: account.details_submitted ?? false,
      requirements: account.requirements ? {
        currentlyDue: account.requirements.currently_due ?? [],
        eventuallyDue: account.requirements.eventually_due ?? [],
        pastDue: account.requirements.past_due ?? [],
      } : undefined,
    };

    // Generate onboarding link if not complete
    if (!status.detailsSubmitted || status.requirements?.currentlyDue?.length) {
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${requireAppUrl()}/connect/refresh`,
        return_url: `${requireAppUrl()}/connect/complete`,
        type: 'account_onboarding',
      });

      status.onboardingUrl = accountLink.url;
    }

    return status;
  } catch (error: unknown) {
    await captureError(error as Error, {
      tags: { component: 'stripe', operation: 'getConnectAccountStatus' },
      extra: { accountId },
    });
    throw error;
  }
}

/**
 * Create a payout to a user's Connect account
 *
 * Supports multiple currencies. The payout currency typically matches
 * the user's account balance currency.
 */
export async function createPayout(
  request: CreatePayoutRequest
): Promise<PayoutResponse> {
  const stripe = getStripeInstance();
  const {
    userId,
    amountCents,
    currency = 'usd',
    description = 'Withdrawal',
    idempotencyKey,
    metadata = {},
  } = request;

  const currencyLower = currency.toLowerCase();
  const currencyUpper = currency.toUpperCase();

  try {
    // Get user's Connect account
    const db = getDb();
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const userData = userDoc.data() as UserPaymentData;

    if (!userData.stripeConnectAccountId) {
      throw new Error('No payout account configured');
    }

    // Check account status
    const accountStatus = await getConnectAccountStatus(userData.stripeConnectAccountId);

    if (!accountStatus.payoutsEnabled) {
      throw new Error('Payout account is not fully set up');
    }

    // SECURITY FIX #2: Use atomic Firestore transaction to check balance and create transfer
    // This prevents TOCTOU race conditions where two concurrent requests both pass
    // the balance check but together exceed the user's balance.
    // The transaction ensures only one will succeed - the other will fail with "Insufficient balance"
    await runTransaction(db, async (transaction) => {
      // Read user balance within transaction for consistency
      const userSnapshot = await transaction.get(userRef);

      if (!userSnapshot.exists()) {
        throw new Error('User not found during balance check');
      }

      const currentBalance = (userSnapshot.data().balance || 0) as number;

      // Convert withdrawal amount to display amount in its currency
      const withdrawalDisplayAmount = toDisplayAmount(amountCents, currencyUpper);

      // Convert withdrawal amount to USD equivalent for balance comparison
      let withdrawalAmountUSD: number;
      let exchangeRate: number | null = null;

      if (currencyUpper === 'USD') {
        // For USD, no conversion needed
        withdrawalAmountUSD = withdrawalDisplayAmount;
      } else {
        // Get current exchange rate for the currency
        // Rate format: 1 USD = X local currency (e.g., 1 USD = 1.55 AUD)
        // To convert local currency to USD: localAmount / rate
        const rateData = await getStripeExchangeRate(currencyUpper);
        exchangeRate = rateData.rate;

        // Convert withdrawal amount to USD
        // withdrawalDisplayAmount is in local currency
        // USD equivalent = localAmount / rate (since rate = local/USD)
        withdrawalAmountUSD = withdrawalDisplayAmount / exchangeRate;

        // Log conversion for debugging
        serverLogger.debug('Exchange rate conversion for withdrawal', {
          currency: currencyUpper,
          localAmount: withdrawalDisplayAmount,
          exchangeRate,
          usdEquivalent: withdrawalAmountUSD,
          rateDisplay: rateData.rateDisplay,
        });
      }

      // ATOMIC CHECK: Compare USD equivalent to current balance within transaction
      if (withdrawalAmountUSD > currentBalance) {
        const errorMessage = exchangeRate
          ? `Insufficient balance. ` +
            `Requested: ${withdrawalDisplayAmount.toFixed(2)} ${currencyUpper} ` +
            `(${withdrawalAmountUSD.toFixed(2)} USD), ` +
            `Available: ${currentBalance.toFixed(2)} USD`
          : `Insufficient balance. ` +
            `Requested: ${withdrawalDisplayAmount.toFixed(2)} ${currencyUpper}, ` +
            `Available: ${currentBalance.toFixed(2)} USD`;

        throw new Error(errorMessage);
      }

      // ATOMIC UPDATE: Debit balance within same transaction
      const newBalance = currentBalance - withdrawalAmountUSD;
      transaction.update(userRef, {
        balance: newBalance,
        lastBalanceUpdate: serverTimestamp(),
      });

      // Note: We create the Stripe transfer AFTER the transaction to allow
      // it to fail without rolling back our balance deduction. This is intentional
      // because we want to ensure balance is debited atomically, and Stripe
      // transfers are idempotent (we have idempotencyKey).
    });

    // Create a transfer to the Connect account (after balance is atomically debited)
    const transfer = await stripe.transfers.create(
      {
        amount: amountCents,
        currency: currencyLower,
        destination: userData.stripeConnectAccountId,
        description,
        metadata: {
          firebaseUserId: userId,
          originalCurrency: currencyUpper,
          ...metadata,
        },
      },
      idempotencyKey ? { idempotencyKey } : undefined
    );

    return {
      payoutId: transfer.id,
      amountCents: transfer.amount,
      currency: currencyUpper,
      status: 'pending',
      arrivalDate: undefined, // Will be updated via webhook
    };
  } catch (error: unknown) {
    await captureError(error as Error, {
      tags: { component: 'stripe', operation: 'createPayout' },
      extra: { userId, amountCents, currency: currencyUpper },
    });
    throw error;
  }
}
