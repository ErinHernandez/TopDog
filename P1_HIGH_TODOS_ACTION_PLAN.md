# P1-HIGH TODOs Action Plan
**10 items to address this sprint**

---

## ✅ Completed

### 1. Security Logger Sentry Integration ✅
- **File:** `lib/securityLogger.js:61`
- **Status:** ✅ Fixed
- **Change:** Integrated Sentry for security event logging
- **Impact:** Security events now sent to Sentry in production

---

## 📋 Remaining P1-HIGH Items

### 2. ProfileSettingsModal - Email/Phone API Integration
- **File:** `components/vx2/auth/components/ProfileSettingsModal.tsx:1068`
- **Priority:** High (user-facing feature)
- **Action:** Implement API endpoint to add email/phone to user account
- **Estimated Time:** 4-6 hours
- **Steps:**
  1. Create API route: `pages/api/user/update-contact.ts`
  2. Add validation for email/phone format
  3. Update Firestore user document
  4. Add error handling
  5. Update ProfileSettingsModal to call API

### 3-6. Logger DEBUG Constants (Low Impact)
- **Files:**
  - `lib/clientLogger.ts:22`
  - `lib/apiErrorHandler.ts:51`
  - `lib/apiErrorHandler.js:39`
- **Priority:** Low (code cleanup)
- **Action:** These are just enum definitions, not actual TODOs
- **Status:** Can be ignored or cleaned up later

### 7. Security Monitoring - External Alerting
- **File:** `lib/securityMonitoring.js:132`
- **Priority:** High (security monitoring)
- **Action:** Integrate with PagerDuty, Slack, or email
- **Estimated Time:** 2-4 hours
- **Options:**
  - **Slack:** Use Slack webhook (easiest)
  - **Email:** Use SendGrid/AWS SES
  - **PagerDuty:** For critical alerts only
- **Recommendation:** Start with Slack webhook

### 8. Stripe Exchange Rate Conversion
- **File:** `lib/stripe/stripeService.ts:556`
- **Priority:** Medium (feature enhancement)
- **Action:** Implement exchange rate conversion for non-USD withdrawals
- **Estimated Time:** 4-8 hours
- **Steps:**
  1. Add exchange rate API integration (e.g., Fixer.io, ExchangeRate-API)
  2. Calculate USD equivalent
  3. Update withdrawal logic
  4. Add tests

### 9. Paymongo Payout - Save for Future
- **File:** `pages/api/paymongo/payout.ts:203`
- **Priority:** Medium (feature enhancement)
- **Action:** Implement "save payment method for future" feature
- **Estimated Time:** 6-8 hours
- **Steps:**
  1. Store payment method tokens
  2. Add UI option to save
  3. Retrieve saved methods
  4. Use saved method for future payouts

### 10. Paystack Transfer - 2FA Verification
- **File:** `pages/api/paystack/transfer/initiate.ts:338`
- **Priority:** High (security)
- **Action:** Verify 2FA if enabled on Paystack account
- **Estimated Time:** 3-4 hours
- **Steps:**
  1. Check if 2FA is enabled
  2. Request 2FA code from user
  3. Verify code with Paystack API
  4. Proceed with transfer only after verification

### 11. Xendit Disbursement - Save for Future
- **File:** `pages/api/xendit/disbursement.ts:198`
- **Priority:** Medium (feature enhancement)
- **Action:** Implement "save payment method for future" feature
- **Estimated Time:** 6-8 hours
- **Similar to Paymongo payout above**

---

## 🎯 Recommended Priority Order

### Sprint 1 (This Week)
1. ✅ Security Logger Sentry Integration - **DONE**
2. **Paystack 2FA Verification** - Security critical
3. **Security Monitoring Alerts** - Security monitoring

### Sprint 2 (Next Week)
4. **ProfileSettingsModal API** - User-facing feature
5. **Stripe Exchange Rate** - Feature enhancement

### Sprint 3 (Following Week)
6. **Paymongo Save for Future** - Feature enhancement
7. **Xendit Save for Future** - Feature enhancement

### Backlog (Low Priority)
8-11. Logger DEBUG constants - Code cleanup (can ignore)

---

## 📝 Implementation Templates

### API Route Template
```typescript
// pages/api/user/update-contact.ts
import { withErrorHandling } from '@/lib/apiErrorHandler';
import { serverLogger } from '@/lib/logger';

export default async function handler(req, res) {
  return withErrorHandling(req, res, async (req, res, logger) => {
    // Validate method
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Validate input
    const { email, phone } = req.body;
    if (!email && !phone) {
      return res.status(400).json({ error: 'Email or phone required' });
    }

    // Update user document
    // ... implementation

    return res.status(200).json({ success: true });
  });
}
```

### Slack Webhook Integration
```typescript
// lib/securityMonitoring.js
async function sendSlackAlert(message: string, severity: string) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `[${severity}] ${message}`,
    }),
  });
}
```

---

## 📊 Progress Tracking

| Item | Status | Assigned | Due Date |
|------|--------|----------|----------|
| Security Logger Sentry | ✅ Done | - | - |
| Paystack 2FA | ⏳ Pending | - | This week |
| Security Monitoring Alerts | ⏳ Pending | - | This week |
| ProfileSettingsModal API | ⏳ Pending | - | Next week |
| Stripe Exchange Rate | ⏳ Pending | - | Next week |
| Paymongo Save Future | ⏳ Pending | - | Following week |
| Xendit Save Future | ⏳ Pending | - | Following week |
| Logger Constants | ⏳ Backlog | - | Low priority |

---

**Total Estimated Time:** 25-38 hours  
**Sprint 1:** 5-8 hours (2 items)  
**Sprint 2:** 8-14 hours (2 items)  
**Sprint 3:** 12-16 hours (2 items)
