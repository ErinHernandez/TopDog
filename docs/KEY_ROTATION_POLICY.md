# Key Rotation Policy

## Overview

This document outlines the key rotation procedures for TopDog's sensitive credentials and API keys. Regular key rotation is essential for maintaining security and limiting exposure if credentials are compromised.

## Rotation Schedule

| Key Type | Rotation Frequency | Priority |
|----------|-------------------|----------|
| Stripe API Keys | Every 90 days | HIGH |
| Firebase Service Account | Every 180 days | HIGH |
| Paystack Secret Key | Every 90 days | HIGH |
| Xendit API Key | Every 90 days | HIGH |
| PayMongo Secret Key | Every 90 days | HIGH |
| Webhook Secrets | Every 90 days | HIGH |
| Sentry DSN | Only if compromised | MEDIUM |
| Azure Storage Keys | Every 90 days | MEDIUM |

## Rotation Procedures

### 1. Stripe Keys

**Steps:**
1. Log into Stripe Dashboard > Developers > API Keys
2. Click "Roll secret key" (creates new key, old key works for 72 hours)
3. Update `STRIPE_SECRET_KEY` in Vercel environment variables
4. Update `STRIPE_WEBHOOK_SECRET` if rolling webhook signing secret
5. Deploy and verify webhooks are functioning
6. After 72 hours, old key auto-expires

**Verification:**
- Test a small deposit in production
- Verify webhook events are received
- Check Stripe Dashboard for successful API calls

### 2. Firebase Service Account

**Steps:**
1. Go to Firebase Console > Project Settings > Service Accounts
2. Click "Generate new private key"
3. Update `FIREBASE_SERVICE_ACCOUNT` in Vercel with new JSON
4. Deploy and verify admin operations work
5. Delete old service account key from Firebase Console

**Verification:**
- Test admin authentication
- Verify Firestore read/write operations
- Check Cloud Functions (if used)

### 3. Paystack Keys

**Steps:**
1. Log into Paystack Dashboard > Settings > API Keys & Webhooks
2. Regenerate secret key
3. Update `PAYSTACK_SECRET_KEY` in Vercel
4. Update `PAYSTACK_WEBHOOK_SECRET` if changed
5. Deploy and test

**Verification:**
- Test transaction initialization
- Verify webhook signature validation
- Check transfer operations

### 4. Xendit Keys

**Steps:**
1. Log into Xendit Dashboard > Settings > API Keys
2. Generate new API key
3. Update `XENDIT_API_KEY` in Vercel
4. Update `XENDIT_WEBHOOK_TOKEN` if changed
5. Deactivate old key after verification

**Verification:**
- Test virtual account creation
- Verify e-wallet payments
- Check disbursement operations

### 5. PayMongo Keys

**Steps:**
1. Log into PayMongo Dashboard > Developers > API Keys
2. Generate new secret key
3. Update `PAYMONGO_SECRET_KEY` in Vercel
4. Update `PAYMONGO_WEBHOOK_SECRET` if changed
5. Deploy and test

**Verification:**
- Test source creation
- Verify payment capture
- Check payout operations

## Emergency Rotation

If a key is suspected to be compromised:

1. **Immediately** rotate the compromised key
2. Review logs for unauthorized access
3. Check for suspicious transactions
4. Notify affected users if necessary
5. Document the incident

## Environment Variable Checklist

All secrets are stored in Vercel environment variables:

```
# Payment Providers
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_CONNECT_WEBHOOK_SECRET
PAYSTACK_SECRET_KEY
PAYSTACK_WEBHOOK_SECRET
XENDIT_API_KEY
XENDIT_WEBHOOK_TOKEN
PAYMONGO_SECRET_KEY
PAYMONGO_WEBHOOK_SECRET

# Firebase
FIREBASE_SERVICE_ACCOUNT

# Error Tracking
NEXT_PUBLIC_SENTRY_DSN
SENTRY_AUTH_TOKEN

# Storage
AZURE_STORAGE_CONNECTION_STRING
```

## Automation Recommendations

1. Set up calendar reminders for 90-day rotation cycle
2. Use Vercel's deployment hooks to validate environment variables
3. Implement key expiry monitoring in Sentry
4. Consider using a secrets manager (e.g., Vault, AWS Secrets Manager)

## Post-Rotation Checklist

After each rotation:

- [ ] New key deployed to production
- [ ] Webhooks verified functioning
- [ ] Payment flows tested (deposit, withdraw)
- [ ] Admin functions verified
- [ ] Old key deactivated/expired
- [ ] Rotation logged in security audit trail
- [ ] Team notified of successful rotation

## Contact

For security concerns or questions about key rotation:
- Security Lead: [Contact Info]
- DevOps: [Contact Info]

---
Last Updated: January 2025
