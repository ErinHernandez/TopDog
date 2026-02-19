import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/lib/auth/AuthProvider';
import { getStripePromise } from '@/lib/stripe/client';
import { useSubscription } from '@/lib/studio/subscription/useSubscription';
import styles from '@/styles/pricing.module.css';

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  priceId: string;
  features: string[];
}

const PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: '/month',
    description: 'Get started with essential features',
    priceId: '',
    features: [
      'Up to 5 projects',
      '100MB storage per project',
      'Basic AI editing',
      'Community support',
      'Standard export formats',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 12,
    period: '/month',
    description: 'For professionals and creatives',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY || 'price_placeholder_pro',
    features: [
      'Unlimited projects',
      '10GB storage per project',
      'Advanced AI editing tools',
      'Priority email support',
      'Premium export formats',
      'Team collaboration (up to 3 members)',
      'Custom branding',
    ],
  },
  {
    id: 'team',
    name: 'Team',
    price: 29,
    period: '/month per seat',
    description: 'For teams and enterprises',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_TEAM_MONTHLY || 'price_placeholder_team',
    features: [
      'Unlimited projects',
      '100GB storage per project',
      'Advanced AI editing tools',
      'Priority phone and email support',
      'Premium export formats',
      'Team collaboration (unlimited members)',
      'Custom branding and white-label options',
      'Advanced analytics',
      'API access',
      'Dedicated account manager',
    ],
  },
];

interface CheckoutParams {
  priceId: string;
  planName: string;
}

async function handleCheckout(params: CheckoutParams, userToken: string | null) {
  try {
    if (!userToken) {
      return;
    }

    const response = await fetch('/api/studio/checkout/create-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        priceId: params.priceId,
        planName: params.planName,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[Pricing] Checkout failed:', error);
      return;
    }

    const data = await response.json() as { sessionId: string; url?: string };

    if (data.url) {
      window.location.href = data.url;
    } else if (data.sessionId) {
      const stripe = await getStripePromise();
      if (!stripe) {
        console.error('[Pricing] Stripe not initialized');
        return;
      }

      const result = await stripe.redirectToCheckout({ sessionId: data.sessionId });
      if (result.error) {
        console.error('[Pricing] Redirect to checkout failed:', result.error);
      }
    }
  } catch (error) {
    console.error('[Pricing] Unexpected error during checkout:', error);
  }
}

async function handlePortalRedirect(userToken: string | null) {
  try {
    if (!userToken) {
      return;
    }

    const response = await fetch('/api/studio/checkout/portal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json() as { error?: string };
      console.error('[Pricing] Portal redirect failed:', error);
      return;
    }

    const data = await response.json() as { url?: string };
    if (data.url) {
      window.location.href = data.url;
    }
  } catch (error) {
    console.error('[Pricing] Unexpected error accessing billing portal:', error);
  }
}

export default function PricingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { subscription, loading: subscriptionLoading } = useSubscription();
  const [userToken, setUserToken] = useState<string | null>(null);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState<'success' | 'cancelled' | null>(null);

  useEffect(() => {
    if (router.query.checkout === 'success') {
      setCheckoutStatus('success');
      setTimeout(() => setCheckoutStatus(null), 5000);
    } else if (router.query.checkout === 'cancelled') {
      setCheckoutStatus('cancelled');
      setTimeout(() => setCheckoutStatus(null), 5000);
    }
  }, [router.query]);

  useEffect(() => {
    async function getToken() {
      if (user && !authLoading) {
        try {
          const token = await user.getIdToken(false);
          setUserToken(token);
        } catch (error) {
          console.error('[Pricing] Failed to get user token:', error);
        }
      }
    }

    getToken();
  }, [user, authLoading]);

  const handlePlanClick = async (plan: PricingPlan) => {
    if (plan.id === 'free') {
      if (!user) {
        router.push('/login');
      }
      return;
    }

    if (!user) {
      router.push('/login');
      return;
    }

    setLoadingCheckout(true);
    await handleCheckout(
      {
        priceId: plan.priceId,
        planName: plan.name,
      },
      userToken
    );
    setLoadingCheckout(false);
  };

  const isCurrentPlan = (planId: string): boolean => {
    return subscription.tier === planId;
  };

  const isPaidPlan = (planId: string): boolean => {
    return planId === 'pro' || planId === 'team';
  };

  return (
    <main className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Choose Your Plan</h1>
        <p className={styles.description}>
          Select the perfect plan for your creative needs. Upgrade or downgrade anytime.
        </p>
      </div>

      {checkoutStatus === 'success' && (
        <div className={styles.checkoutSuccess}>
          Thank you for your purchase! Your plan is now active.
        </div>
      )}

      {checkoutStatus === 'cancelled' && (
        <div className={styles.checkoutCancelled}>
          Your checkout was cancelled. Feel free to try again whenever you are ready.
        </div>
      )}

      <div className={styles.plansGrid}>
        {PLANS.map((plan) => (
          <div key={plan.id} className={styles.planCard}>
            {user && !subscriptionLoading && isCurrentPlan(plan.id) && (
              <div
                style={{
                  display: 'inline-block',
                  backgroundColor: '#3b82f6',
                  color: '#ffffff',
                  padding: '4px 12px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '600',
                  marginBottom: '12px',
                }}
              >
                Current Plan
              </div>
            )}

            <div className={styles.planHeader}>
              <h2 className={styles.planName}>{plan.name}</h2>
              <div className={styles.planPrice}>
                {plan.price === 0 ? (
                  'Free'
                ) : (
                  <>
                    ${plan.price}
                    <span className={styles.planPricePeriod}>{plan.period}</span>
                  </>
                )}
              </div>
              <p className={styles.planDescription}>{plan.description}</p>
            </div>

            <ul className={styles.planFeatures}>
              {plan.features.map((feature, index) => (
                <li key={index} className={styles.featureItem}>
                  <span className={styles.featureCheckmark}>✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button
              className={`${styles.planAction} ${
                plan.id === 'free' ? styles.actionSecondary : styles.actionPrimary
              }`}
              onClick={() => handlePlanClick(plan)}
              disabled={(loadingCheckout && plan.id !== 'free') || (user && !subscriptionLoading && isCurrentPlan(plan.id))}
              aria-label={
                plan.id === 'free'
                  ? `Get started with ${plan.name} plan`
                  : `Subscribe to ${plan.name} plan for $${plan.price}${plan.period}`
              }
            >
              {loadingCheckout && plan.id !== 'free' ? (
                <>
                  <span className={styles.loadingSpinner} />
                  {' Processing...'}
                </>
              ) : user && !subscriptionLoading && isCurrentPlan(plan.id) ? (
                'Current Plan'
              ) : plan.id === 'free' ? (
                user ? 'Active' : 'Get Started'
              ) : (
                'Get Started'
              )}
            </button>
          </div>
        ))}
      </div>

      {user && !subscriptionLoading && isPaidPlan(subscription.tier) && (
        <div className={styles.footer}>
          <button
            className={styles.manageLink}
            onClick={() => handlePortalRedirect(userToken)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            Manage your subscription
          </button>
        </div>
      )}
    </main>
  );
}
