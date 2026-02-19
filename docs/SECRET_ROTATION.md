# Secret Rotation Procedures

This document outlines the procedures for rotating secrets and API keys used by the TopDog Fantasy Football platform. Regular rotation of secrets is a critical security practice that limits the impact of potential compromises.

## Table of Contents

1. [Rotation Schedule](#rotation-schedule)
2. [Pre-Rotation Checklist](#pre-rotation-checklist)
3. [Database Credentials](#database-credentials)
4. [Payment Provider Keys](#payment-provider-keys)
5. [Authentication Secrets](#authentication-secrets)
6. [Third-Party API Keys](#third-party-api-keys)
7. [Post-Rotation Verification](#post-rotation-verification)
8. [Emergency Rotation](#emergency-rotation)
9. [Rollback Procedures](#rollback-procedures)

---

## Rotation Schedule

| Secret Type | Rotation Frequency | Last Rotated | Next Rotation |
|-------------|-------------------|--------------|---------------|
| Database credentials | 90 days | [DATE] | [DATE] |
| JWT signing keys | 90 days | [DATE] | [DATE] |
| Stripe API keys | 180 days | [DATE] | [DATE] |
| Paystack API keys | 180 days | [DATE] | [DATE] |
| Session secrets | 90 days | [DATE] | [DATE] |
| Webhook secrets | 90 days | [DATE] | [DATE] |

**Note**: Update dates after each rotation. Set calendar reminders for upcoming rotations.

---

## Pre-Rotation Checklist

Before rotating any secret:

- [ ] Schedule rotation during low-traffic period (typically 2-4 AM UTC)
- [ ] Notify on-call team of planned rotation
- [ ] Ensure rollback plan is ready
- [ ] Verify access to all deployment environments
- [ ] Have old secret values documented securely (for rollback)
- [ ] Test rotation procedure in staging environment first

---

## Database Credentials

### Supabase Database

**Environment Variables:**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
- `DATABASE_URL`

**Rotation Steps:**

1. **Generate new keys in Supabase Dashboard**
   ```
   1. Log into Supabase Dashboard
   2. Navigate to Project Settings > API
   3. Click "Generate new keys"
   4. Copy new anon key and service role key
   ```

2. **Update environment variables**
   ```bash
   # Update in Vercel (or your deployment platform)
   vercel env rm SUPABASE_SERVICE_ROLE_KEY production
   vercel env add SUPABASE_SERVICE_ROLE_KEY production
   # Paste new key when prompted

   vercel env rm SUPABASE_ANON_KEY production
   vercel env add SUPABASE_ANON_KEY production
   # Paste new key when prompted
   ```

3. **Trigger redeployment**
   ```bash
   vercel --prod
   ```

4. **Verify connectivity**
   ```bash
   # Run health check
   curl https://your-domain.com/api/health
   ```

5. **Revoke old keys**
   - Old keys are automatically invalidated when new ones are generated

---

## Payment Provider Keys

### Stripe

**Environment Variables:**
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`

**Rotation Steps:**

1. **Create new API keys (rolling rotation)**
   ```
   1. Log into Stripe Dashboard
   2. Navigate to Developers > API Keys
   3. Click "Create restricted key" or "Roll keys"
   4. Copy new secret key (starts with sk_live_)
   5. Copy new publishable key (starts with pk_live_)
   ```

2. **Update webhook endpoint secret**
   ```
   1. Navigate to Developers > Webhooks
   2. Select your webhook endpoint
   3. Click "Reveal" under Signing secret
   4. Click "Roll secret" to generate new one
   5. Copy new webhook secret (starts with whsec_)
   ```

3. **Update environment variables**
   ```bash
   vercel env rm STRIPE_SECRET_KEY production
   vercel env add STRIPE_SECRET_KEY production

   vercel env rm STRIPE_PUBLISHABLE_KEY production
   vercel env add STRIPE_PUBLISHABLE_KEY production

   vercel env rm STRIPE_WEBHOOK_SECRET production
   vercel env add STRIPE_WEBHOOK_SECRET production
   ```

4. **Redeploy and verify**
   ```bash
   vercel --prod

   # Test payment flow
   # Test webhook delivery in Stripe Dashboard
   ```

5. **Delete old keys after 24-hour grace period**
   - Monitor for any failed requests using old keys
   - Delete old keys from Stripe Dashboard

### Paystack

**Environment Variables:**
- `PAYSTACK_SECRET_KEY`
- `PAYSTACK_PUBLIC_KEY`
- `PAYSTACK_WEBHOOK_SECRET`

**Rotation Steps:**

1. **Generate new keys**
   ```
   1. Log into Paystack Dashboard
   2. Navigate to Settings > API Keys & Webhooks
   3. Generate new keys
   4. Copy secret key (starts with sk_live_)
   5. Copy public key (starts with pk_live_)
   ```

2. **Update webhook secret**
   ```
   1. Navigate to Settings > API Keys & Webhooks
   2. Update webhook URL if needed
   3. Copy new webhook secret
   ```

3. **Update environment variables and redeploy**
   ```bash
   vercel env rm PAYSTACK_SECRET_KEY production
   vercel env add PAYSTACK_SECRET_KEY production

   vercel env rm PAYSTACK_PUBLIC_KEY production
   vercel env add PAYSTACK_PUBLIC_KEY production

   vercel env rm PAYSTACK_WEBHOOK_SECRET production
   vercel env add PAYSTACK_WEBHOOK_SECRET production

   vercel --prod
   ```

---

## Authentication Secrets

### JWT Signing Keys

**Environment Variables:**
- `JWT_SECRET`
- `NEXTAUTH_SECRET`

**Rotation Steps:**

1. **Generate new secret**
   ```bash
   # Generate a secure random secret
   openssl rand -base64 64
   ```

2. **Implement dual-key validation (grace period)**

   Before rotation, update the JWT validation code to accept both old and new secrets:

   ```typescript
   // Temporary dual-key validation
   const OLD_JWT_SECRET = process.env.OLD_JWT_SECRET;
   const NEW_JWT_SECRET = process.env.JWT_SECRET;

   function verifyToken(token: string): JWTPayload | null {
     // Try new secret first
     try {
       return jwt.verify(token, NEW_JWT_SECRET);
     } catch {
       // Fall back to old secret during grace period
       if (OLD_JWT_SECRET) {
         try {
           return jwt.verify(token, OLD_JWT_SECRET);
         } catch {
           return null;
         }
       }
       return null;
     }
   }
   ```

3. **Update environment variables**
   ```bash
   # Save old secret for grace period
   vercel env add OLD_JWT_SECRET production
   # Paste current JWT_SECRET value

   # Update main secret
   vercel env rm JWT_SECRET production
   vercel env add JWT_SECRET production
   # Paste new generated secret
   ```

4. **Deploy with dual-key support**
   ```bash
   vercel --prod
   ```

5. **Remove old secret after grace period (7 days recommended)**
   ```bash
   vercel env rm OLD_JWT_SECRET production
   vercel --prod
   ```

### Session Secrets

**Environment Variables:**
- `SESSION_SECRET`

**Rotation Steps:**

1. **Generate new secret**
   ```bash
   openssl rand -base64 32
   ```

2. **Update and redeploy**
   ```bash
   vercel env rm SESSION_SECRET production
   vercel env add SESSION_SECRET production
   vercel --prod
   ```

**Note**: Session rotation will invalidate all active sessions. Users will need to log in again.

---

## Third-Party API Keys

### Email Service (if applicable)

**Environment Variables:**
- `SENDGRID_API_KEY` or `RESEND_API_KEY`

**Rotation Steps:**

1. Generate new API key in provider dashboard
2. Update environment variable
3. Redeploy
4. Verify email sending works
5. Delete old API key

### Analytics/Monitoring

**Environment Variables:**
- `SENTRY_DSN`
- `ANALYTICS_KEY`

**Rotation Steps:**

1. Generate new keys in respective dashboards
2. Update environment variables
3. Redeploy
4. Verify data is being received
5. Revoke old keys

---

## Post-Rotation Verification

After any secret rotation, verify the following:

### Automated Checks

```bash
# 1. Health check endpoint
curl -s https://your-domain.com/api/health | jq .

# 2. Database connectivity
curl -s https://your-domain.com/api/health/db | jq .

# 3. Payment provider connectivity
curl -s https://your-domain.com/api/health/payments | jq .
```

### Manual Verification

- [ ] User can log in successfully
- [ ] User can view their dashboard
- [ ] Payment flow completes (use test mode if possible)
- [ ] Webhooks are being received (check provider dashboards)
- [ ] No errors in application logs
- [ ] No increase in error rates in monitoring

### Monitoring Period

- Monitor error rates for 24 hours post-rotation
- Keep old secrets available for emergency rollback during this period
- Set up alerts for authentication/payment failures

---

## Emergency Rotation

Use this procedure if a secret has been compromised.

### Immediate Actions

1. **Assess the scope**
   - Which secret was compromised?
   - How was it exposed?
   - What's the potential impact?

2. **Rotate immediately**
   - Don't wait for low-traffic period
   - Follow standard rotation procedure at accelerated pace

3. **Audit recent activity**
   ```sql
   -- Check for suspicious activity in the last 24 hours
   SELECT * FROM audit_logs
   WHERE created_at > NOW() - INTERVAL '24 hours'
   ORDER BY created_at DESC;
   ```

4. **Notify stakeholders**
   - Security team
   - Engineering leadership
   - Legal/compliance if user data may be affected

5. **Document the incident**
   - Timeline of events
   - Actions taken
   - Root cause analysis
   - Prevention measures

### Provider-Specific Emergency Procedures

**Stripe Emergency:**
```
1. Log into Stripe Dashboard immediately
2. Go to Developers > API Keys
3. Click "Roll all keys" for immediate rotation
4. Update all environment variables
5. Redeploy all services
```

**Supabase Emergency:**
```
1. Log into Supabase Dashboard
2. Go to Project Settings > API
3. Generate new keys immediately
4. Update all environment variables
5. Redeploy all services
```

---

## Rollback Procedures

If rotation causes issues:

### Quick Rollback

1. **Restore old secret**
   ```bash
   vercel env rm [SECRET_NAME] production
   vercel env add [SECRET_NAME] production
   # Paste the OLD secret value
   vercel --prod
   ```

2. **Verify functionality**
   - Run health checks
   - Test affected functionality

3. **Investigate root cause**
   - Why did new secret fail?
   - Was it a configuration issue?
   - Was there a code dependency on old secret format?

### If Old Secret Was Already Revoked

1. **Generate new secret** (third secret)
2. **Update code if needed** to handle new format
3. **Deploy with new secret**
4. **Test thoroughly before confirming**

---

## Secret Storage Best Practices

1. **Never commit secrets to version control**
   - Use `.env.local` for local development
   - Add `.env*` to `.gitignore`

2. **Use environment variable management**
   - Vercel Environment Variables for production
   - Consider HashiCorp Vault for enterprise deployments

3. **Limit secret access**
   - Only team members who need access should have it
   - Use role-based access in provider dashboards

4. **Audit secret access**
   - Review who has access quarterly
   - Remove access for departed team members immediately

5. **Document all secrets**
   - Maintain a secure registry of all secrets and their purposes
   - Update this document when adding new secrets

---

## Appendix: Secret Inventory

| Secret Name | Purpose | Provider | Rotation Owner |
|-------------|---------|----------|----------------|
| `SUPABASE_URL` | Database connection | Supabase | Backend Team |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin database access | Supabase | Backend Team |
| `SUPABASE_ANON_KEY` | Public database access | Supabase | Backend Team |
| `STRIPE_SECRET_KEY` | Payment processing | Stripe | Payments Team |
| `STRIPE_PUBLISHABLE_KEY` | Client-side payments | Stripe | Payments Team |
| `STRIPE_WEBHOOK_SECRET` | Webhook verification | Stripe | Payments Team |
| `PAYSTACK_SECRET_KEY` | Payment processing | Paystack | Payments Team |
| `PAYSTACK_PUBLIC_KEY` | Client-side payments | Paystack | Payments Team |
| `PAYSTACK_WEBHOOK_SECRET` | Webhook verification | Paystack | Payments Team |
| `JWT_SECRET` | Token signing | Internal | Security Team |
| `NEXTAUTH_SECRET` | NextAuth session | Internal | Security Team |
| `SESSION_SECRET` | Session encryption | Internal | Security Team |

---

*Last Updated: [DATE]*
*Document Owner: Security Team*
*Review Frequency: Quarterly*
