# Secrets Rotation Guide

Procedure for rotating every secret the Idesaign platform consumes.
Run through this checklist quarterly, or immediately after a suspected leak.

---

## Quick Reference

| Secret | Rotation Source | Vercel Env Var | Downtime? |
|--------|----------------|----------------|-----------|
| Firebase Admin private key | Firebase Console > Service Accounts | `FIREBASE_PRIVATE_KEY` | Zero (old key stays valid until deleted) |
| Firebase Client keys | Firebase Console > Project Settings | `NEXT_PUBLIC_FIREBASE_*` | Redeploy required |
| Stripe secret key | Stripe Dashboard > Developers > API keys > Roll key | `STRIPE_SECRET_KEY` | Zero (24h overlap) |
| Stripe webhook secret | Stripe Dashboard > Developers > Webhooks > Signing secret | `STRIPE_WEBHOOK_SECRET` | Brief (update before next event) |
| OpenAI API key | platform.openai.com > API keys | `OPENAI_API_KEY` | Zero (create new, delete old) |
| Stability AI key | platform.stability.ai > Account | `STABILITY_API_KEY` | Zero |
| Replicate API token | replicate.com > Account settings | `REPLICATE_API_KEY` | Zero |
| Google AI key | console.cloud.google.com > Credentials | `GOOGLE_AI_API_KEY` | Zero |
| Upstash Redis credentials | Upstash Console > Database | `UPSTASH_REDIS_*` | Zero (new DB or reset password) |
| Twilio credentials | Twilio Console > Account Info | `TWILIO_*` | Zero |
| Sentry DSN | Sentry > Settings > Client Keys | `SENTRY_DSN` | Zero |
| Sentry Auth Token | Sentry > Settings > Auth Tokens | `SENTRY_AUTH_TOKEN` | Zero |
| Vercel Token | Vercel > Settings > Tokens | CI secret `VERCEL_TOKEN` | CI only |

---

## Step-by-step: Stripe key rotation

Stripe supports rolling keys with a 24-hour overlap window.

1. Go to Stripe Dashboard > Developers > API keys.
2. Click "Roll key" on the secret key. Stripe creates a new key and keeps
   the old one active for 24 hours.
3. Copy the new `sk_live_...` value.
4. Update in Vercel: `vercel env rm STRIPE_SECRET_KEY production` then
   `vercel env add STRIPE_SECRET_KEY production`.
5. Trigger a production deployment: `vercel --prod`.
6. Verify the health endpoint: `curl https://idesaign.ai/api/health`.
7. After 24 hours Stripe automatically deactivates the old key.

For **staging**, repeat with `sk_test_` keys and the Preview environment.

---

## Step-by-step: Firebase Admin key rotation

1. Go to Firebase Console > Project Settings > Service Accounts.
2. Click "Generate New Private Key". Download the JSON file.
3. Extract `client_email` and `private_key` from the JSON.
4. Update in Vercel:
   - `FIREBASE_CLIENT_EMAIL` = the new client_email
   - `FIREBASE_PRIVATE_KEY` = the new private_key (including `-----BEGIN...`)
5. Deploy to production.
6. Verify by hitting an authenticated API route.
7. Go back to Firebase Console and delete the OLD service account key.

---

## Vercel environment management

Vercel scopes env vars by environment: Production, Preview, Development.

```bash
# List all env vars (names only, no values)
vercel env ls

# Add a secret to production
vercel env add SECRET_NAME production

# Add to staging (Preview deployments)
vercel env add SECRET_NAME preview

# Remove
vercel env rm SECRET_NAME production
```

After updating any env var, you must redeploy for the change to take effect:

```bash
vercel --prod              # production
vercel                     # preview (or push to a PR branch)
```

---

## Automated secret audit

The `security.yml` GitHub Actions workflow runs weekly and checks:
- npm dependency vulnerabilities
- License compliance

For secret scanning, enable GitHub's built-in secret scanning:
1. Repository Settings > Code security and analysis
2. Enable "Secret scanning" and "Push protection"

This prevents accidental commits of API keys, tokens, and credentials.

---

## Emergency response: suspected key leak

1. **Identify** which key was exposed (check git history, logs, error messages).
2. **Rotate immediately** using the steps above for that specific service.
3. **Redeploy** to production and staging.
4. **Audit** usage logs for the compromised key:
   - Stripe: Dashboard > Developers > Logs
   - Firebase: Cloud Console > IAM > Audit Logs
   - OpenAI: platform.openai.com > Usage
5. **Notify** the team and document the incident.
6. **Review** how the leak happened and add safeguards (e.g., git pre-commit hooks).
