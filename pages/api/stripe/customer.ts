/**
 * Stripe Customer API
 * 
 * Manages Stripe Customer lifecycle and links to Firebase users.
 * 
 * POST /api/stripe/customer - Create or retrieve customer
 * GET /api/stripe/customer?userId={userId} - Get customer with payment methods
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { 
  withErrorHandling, 
  validateMethod, 
  createSuccessResponse,
  createErrorResponse,
  ErrorType,
} from '../../../lib/apiErrorHandler';
import {
  getOrCreateCustomer,
  getCustomerWithPaymentMethods,
  getUserPaymentData,
} from '../../../lib/stripe';

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse
) {
  return withErrorHandling(req, res, async (req, res, logger) => {
    validateMethod(req, ['GET', 'POST'], logger);
    
    if (req.method === 'POST') {
      return handleCreateCustomer(req, res, logger);
    } else {
      return handleGetCustomer(req, res, logger);
    }
  });
}

/**
 * POST - Create or retrieve Stripe Customer
 */
async function handleCreateCustomer(
  req: NextApiRequest,
  res: NextApiResponse,
  logger: { info: (msg: string, data?: unknown) => void }
) {
  const { userId, email, name } = req.body;
  
  if (!userId || !email) {
    const error = createErrorResponse(
      ErrorType.VALIDATION,
      'userId and email are required',
      400,
      logger
    );
    return res.status(error.statusCode).json(error.body);
  }
  
  logger.info('Creating/retrieving Stripe customer', { userId, email });
  
  try {
    const customer = await getOrCreateCustomer({
      userId,
      email,
      name,
    });
    
    const response = createSuccessResponse({
      customerId: customer.id,
      email: customer.email,
      name: customer.name,
      created: customer.created,
    }, 200, logger);
    
    return res.status(response.statusCode).json(response.body);
  } catch (error) {
    const err = error as Error;
    logger.info('Failed to create customer', { error: err.message });
    
    const errorResponse = createErrorResponse(
      ErrorType.STRIPE,
      err.message || 'Failed to create customer',
      500,
      logger
    );
    return res.status(errorResponse.statusCode).json(errorResponse.body);
  }
}

/**
 * GET - Retrieve customer with payment methods
 */
async function handleGetCustomer(
  req: NextApiRequest,
  res: NextApiResponse,
  logger: { info: (msg: string, data?: unknown) => void }
) {
  const { userId } = req.query;
  
  if (!userId || typeof userId !== 'string') {
    const error = createErrorResponse(
      ErrorType.VALIDATION,
      'userId query parameter is required',
      400,
      logger
    );
    return res.status(error.statusCode).json(error.body);
  }
  
  logger.info('Retrieving customer data', { userId });
  
  try {
    // Get user's Stripe customer ID from Firebase
    const paymentData = await getUserPaymentData(userId);
    
    if (!paymentData?.stripeCustomerId) {
      const error = createErrorResponse(
        ErrorType.NOT_FOUND,
        'No Stripe customer found for this user',
        404,
        logger
      );
      return res.status(error.statusCode).json(error.body);
    }
    
    // Get full customer data with payment methods
    const customerData = await getCustomerWithPaymentMethods(
      paymentData.stripeCustomerId
    );
    
    // Format payment methods for client
    const paymentMethods = customerData.paymentMethods.map(pm => ({
      id: pm.id,
      type: pm.type,
      card: pm.card ? {
        brand: pm.card.brand,
        last4: pm.card.last4,
        expMonth: pm.card.exp_month,
        expYear: pm.card.exp_year,
      } : undefined,
      created: pm.created,
      isDefault: pm.id === customerData.defaultPaymentMethodId,
    }));
    
    const response = createSuccessResponse({
      customerId: customerData.customer.id,
      email: customerData.customer.email,
      name: customerData.customer.name,
      paymentMethods,
      defaultPaymentMethodId: customerData.defaultPaymentMethodId,
    }, 200, logger);
    
    return res.status(response.statusCode).json(response.body);
  } catch (error) {
    const err = error as Error;
    logger.info('Failed to retrieve customer', { error: err.message });
    
    const errorResponse = createErrorResponse(
      ErrorType.STRIPE,
      err.message || 'Failed to retrieve customer',
      500,
      logger
    );
    return res.status(errorResponse.statusCode).json(errorResponse.body);
  }
}

