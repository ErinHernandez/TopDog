/**
 * Stripe Customer Service
 *
 * Manages customer operations including creation, retrieval, and payment method handling.
 */

import { doc, getDoc, setDoc } from 'firebase/firestore';
import Stripe from 'stripe';

import { captureError } from '../errorTracking';
import { getDb } from '../firebase-utils';
import { serverLogger } from '../logger/serverLogger';

import { getStripeInstance } from './stripeInstance';
import type {
  CreateCustomerRequest,
  CustomerWithPaymentMethods,
  UserPaymentData,
} from './stripeTypes';

/**
 * Get or create a Stripe Customer for a Firebase user
 * Idempotent - returns existing customer if found
 */
export async function getOrCreateCustomer(
  request: CreateCustomerRequest
): Promise<Stripe.Customer> {
  const stripe = getStripeInstance();
  const { userId, email, name, metadata = {} } = request;

  try {
    // Check if user already has a Stripe customer ID in Firebase
    const db = getDb();
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data() as UserPaymentData;

      if (userData.stripeCustomerId) {
        // Retrieve existing customer
        try {
          const customer = await stripe.customers.retrieve(userData.stripeCustomerId);
          if (!customer.deleted) {
            return customer as Stripe.Customer;
          }
        } catch (err: unknown) {
          // Customer might have been deleted, create a new one
          serverLogger.warn('Stored customer ID invalid, creating new customer');
        }
      }
    }

    // Search for existing customer by email (fallback)
    if (email) {
      const existingCustomers = await stripe.customers.list({
        email,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        const customer = existingCustomers.data[0] as Stripe.Customer;

        // Update/create Firebase record with the found customer ID (use merge for anonymous users)
        await setDoc(userRef, {
          stripeCustomerId: customer.id,
        }, { merge: true });

        return customer;
      }
    }

    // Create new customer
    const customer = await stripe.customers.create({
      email: email || undefined,
      name,
      metadata: {
        firebaseUserId: userId,
        ...metadata,
      },
    });

    // Store customer ID in Firebase (use merge to handle anonymous users without existing documents)
    await setDoc(userRef, {
      stripeCustomerId: customer.id,
    }, { merge: true });

    return customer;
  } catch (error: unknown) {
    await captureError(error as Error, {
      tags: { component: 'stripe', operation: 'getOrCreateCustomer' },
      extra: { userId, email },
    });
    throw error;
  }
}

/**
 * Get customer with their saved payment methods
 */
export async function getCustomerWithPaymentMethods(
  customerId: string
): Promise<CustomerWithPaymentMethods> {
  const stripe = getStripeInstance();

  try {
    const [customer, paymentMethods] = await Promise.all([
      stripe.customers.retrieve(customerId),
      stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      }),
    ]);

    if (customer.deleted) {
      throw new Error('Customer has been deleted');
    }

    const typedCustomer = customer as Stripe.Customer;

    return {
      customer: typedCustomer,
      paymentMethods: paymentMethods.data,
      defaultPaymentMethodId: typeof typedCustomer.invoice_settings?.default_payment_method === 'string'
        ? typedCustomer.invoice_settings.default_payment_method
        : undefined,
    };
  } catch (error: unknown) {
    await captureError(error as Error, {
      tags: { component: 'stripe', operation: 'getCustomerWithPaymentMethods' },
      extra: { customerId },
    });
    throw error;
  }
}

/**
 * Set default payment method for a customer
 */
export async function setDefaultPaymentMethod(
  customerId: string,
  paymentMethodId: string
): Promise<void> {
  const stripe = getStripeInstance();

  try {
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });
  } catch (error: unknown) {
    await captureError(error as Error, {
      tags: { component: 'stripe', operation: 'setDefaultPaymentMethod' },
      extra: { customerId, paymentMethodId },
    });
    throw error;
  }
}

/**
 * Detach a payment method from a customer
 */
export async function detachPaymentMethod(
  paymentMethodId: string
): Promise<void> {
  const stripe = getStripeInstance();

  try {
    await stripe.paymentMethods.detach(paymentMethodId);
  } catch (error: unknown) {
    await captureError(error as Error, {
      tags: { component: 'stripe', operation: 'detachPaymentMethod' },
      extra: { paymentMethodId },
    });
    throw error;
  }
}
