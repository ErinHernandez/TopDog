import Stripe from 'stripe';
import { 
  withErrorHandling, 
  validateMethod, 
  requireEnvVar,
  createSuccessResponse,
  createErrorResponse,
  ErrorType,
} from '../../lib/apiErrorHandler';

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

export default async function handler(req, res) {
  return withErrorHandling(req, res, async (req, res, logger) => {
    validateMethod(req, ['POST'], logger);
    requireEnvVar('STRIPE_SECRET_KEY', logger);

    if (!stripe) {
      const error = createErrorResponse(ErrorType.INTERNAL, 'Stripe not configured', 500, logger);
      return res.status(error.statusCode).json(error.body);
    }

    const { amount, userId } = req.body;

    if (!amount || amount < 500) { // Minimum $5.00
      const error = createErrorResponse(ErrorType.VALIDATION, 'Invalid amount (minimum $5.00)', 400, logger);
      return res.status(error.statusCode).json(error.body);
    }

    logger.info('Creating payment intent', { amount, userId: userId ? '***' : undefined });

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'usd',
      metadata: {
        userId: userId,
      },
    });

    const response = createSuccessResponse({
      clientSecret: paymentIntent.client_secret,
    }, 200, logger);
    
    return res.status(response.statusCode).json(response.body);
  });
} 