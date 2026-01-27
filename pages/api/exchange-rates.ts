/**
 * Exchange Rates API
 *
 * GET /api/exchange-rates
 * Returns exchange rate conversion for balance display
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { serverLogger } from '../../lib/logger/serverLogger';

// Cache exchange rates for 5 minutes
interface ExchangeRateCache {
  rates: Record<string, number>;
  lastUpdated: number;
}

let rateCache: ExchangeRateCache | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch fresh exchange rates from provider
 */
async function fetchExchangeRates(): Promise<Record<string, number>> {
  // Return cached rates if still fresh
  if (rateCache && Date.now() - rateCache.lastUpdated < CACHE_TTL_MS) {
    return rateCache.rates;
  }

  const apiKey = process.env.EXCHANGE_RATE_API_KEY;

  // If no API key configured, return fallback rates
  if (!apiKey) {
    serverLogger.warn('Exchange rate API key not configured, using fallback rates');
    return getFallbackRates();
  }

  try {
    // Using Open Exchange Rates API (can be replaced with your preferred provider)
    const response = await fetch(
      `https://openexchangerates.org/api/latest.json?app_id=${apiKey}&base=USD`
    );

    if (!response.ok) {
      throw new Error(`Exchange rate API returned ${response.status}`);
    }

    const data = await response.json();

    rateCache = {
      rates: data.rates,
      lastUpdated: Date.now(),
    };

    return data.rates;
  } catch (error) {
    serverLogger.error('Failed to fetch exchange rates', {
      error: (error as Error).message,
    });

    // Return cached rates if available, otherwise fallback
    if (rateCache) {
      return rateCache.rates;
    }

    return getFallbackRates();
  }
}

/**
 * Fallback exchange rates (approximate, updated periodically)
 */
function getFallbackRates(): Record<string, number> {
  return {
    USD: 1,
    EUR: 0.92,
    GBP: 0.79,
    CAD: 1.36,
    AUD: 1.53,
    JPY: 149.5,
    CHF: 0.88,
    INR: 83.2,
    CNY: 7.24,
    MXN: 17.15,
    BRL: 4.97,
    // Add more as needed
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { from = 'USD', to, amount } = req.query;

    // Get exchange rates
    const rates = await fetchExchangeRates();

    // If specific conversion requested
    if (to && amount) {
      const targetCurrency = to as string;
      const sourceAmount = parseFloat(amount as string);

      if (isNaN(sourceAmount)) {
        return res.status(400).json({ error: 'Invalid amount' });
      }

      const rate = rates[targetCurrency];

      if (!rate) {
        return res.status(400).json({ error: `Unsupported currency: ${targetCurrency}` });
      }

      // If converting from non-USD, first convert to USD
      let usdAmount = sourceAmount;
      if (from !== 'USD') {
        const fromRate = rates[from as string];
        if (!fromRate) {
          return res.status(400).json({ error: `Unsupported source currency: ${from}` });
        }
        usdAmount = sourceAmount / fromRate;
      }

      const convertedAmount = usdAmount * rate;

      return res.status(200).json({
        from,
        to: targetCurrency,
        amount: sourceAmount,
        convertedAmount,
        rate,
        timestamp: Date.now(),
      });
    }

    // Return all rates
    return res.status(200).json({
      base: 'USD',
      rates,
      timestamp: Date.now(),
    });
  } catch (error) {
    serverLogger.error('Exchange rates API error', {
      error: (error as Error).message,
    });

    return res.status(500).json({
      error: 'Failed to fetch exchange rates',
    });
  }
}
