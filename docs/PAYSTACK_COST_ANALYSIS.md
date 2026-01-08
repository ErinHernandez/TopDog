# Paystack Cost Analysis
## Comprehensive Fee Structure & Cost Comparison

> **Date**: January 6, 2026  
> **Context**: Detailed cost analysis for Paystack integration (Africa - 8 methods)

---

## Executive Summary

**Key Finding**: Paystack fees are **significantly lower** than Stripe for African markets, especially for local transactions. However, fee structures vary by country and payment method.

**Cost Comparison (Local Transactions):**
- **Stripe**: 2.9% + $0.30 (or 5.4% + $0.30 for international)
- **Paystack Nigeria**: 1.5% + NGN 100 (~$0.11) = **~1.5% effective rate**
- **Paystack Ghana**: 1.95% flat = **1.95% effective rate**
- **Paystack Kenya (M-Pesa)**: 1.5% flat = **1.5% effective rate**
- **Paystack South Africa**: 2.9% + ZAR 1 (~$0.05) = **~2.9% effective rate**

**Bottom Line**: Paystack is **40-50% cheaper** than Stripe for African local transactions.

---

## 1. PAYSTACK FEE STRUCTURE BY COUNTRY

### 1.1 Nigeria (NGN)

**Local Card Transactions:**
- **Fee**: 1.5% + NGN 100 per transaction
- **NGN 100 waived**: For transactions under NGN 2,500
- **Fee cap**: NGN 2,000 per transaction (maximum fee)
- **Settlement**: Naira (NGN)

**Example Calculations:**

| Transaction Amount | Fee Calculation | Total Fee | Effective Rate |
|-------------------|-----------------|-----------|----------------|
| NGN 1,000 | 1.5% = NGN 15 (NGN 100 waived) | NGN 15 | 1.5% |
| NGN 5,000 | 1.5% + NGN 100 = NGN 175 | NGN 175 | 3.5% |
| NGN 10,000 | 1.5% + NGN 100 = NGN 250 | NGN 250 | 2.5% |
| NGN 50,000 | 1.5% + NGN 100 = NGN 850 | NGN 850 | 1.7% |
| NGN 100,000 | 1.5% + NGN 100 = NGN 1,600 | NGN 1,600 | 1.6% |
| NGN 200,000 | 1.5% + NGN 100 = NGN 3,100 → **Capped at NGN 2,000** | NGN 2,000 | **1.0%** |

**Key Insight**: For large transactions (NGN 200,000+), effective rate drops to **1.0%** due to cap.

**International Card Transactions:**
- **Fee**: 3.9% + NGN 100 per transaction
- **Settlement**: Naira by default, USD option available
- **Use Case**: Foreign cards used in Nigeria

**Bank Transfers:**
- **Fee**: 1.5% + NGN 100 (same as local cards)
- **Settlement**: Naira

**USSD Transactions:**
- **Fee**: 1.5% + NGN 100 per transaction
- **NGN 100 waived**: For transactions under NGN 2,500
- **Fee cap**: NGN 2,000 per transaction
- **Use Case**: Code-based payment (no internet required)

**Transfers (Payouts to Users):**
- **NGN 5,000 and below**: NGN 10 per transfer
- **NGN 5,001 - NGN 50,000**: NGN 25 per transfer
- **Above NGN 50,000**: NGN 50 per transfer

**Dedicated Virtual Accounts:**
- **Fee**: 1% per transaction
- **Cap**: NGN 300 per transaction
- **Use Case**: Recurring payments, subscriptions

---

### 1.2 Ghana (GHS)

**All Transactions (Local & International):**
- **Fee**: 1.95% flat per transaction
- **No flat fee**: Unlike Nigeria, no NGN 100 equivalent
- **Settlement**: Ghanaian Cedi (GHS)

**Example Calculations:**

| Transaction Amount | Fee Calculation | Total Fee | Effective Rate |
|-------------------|-----------------|-----------|----------------|
| GHS 10 | 1.95% | GHS 0.20 | 1.95% |
| GHS 50 | 1.95% | GHS 0.98 | 1.95% |
| GHS 100 | 1.95% | GHS 1.95 | 1.95% |
| GHS 500 | 1.95% | GHS 9.75 | 1.95% |

**Key Insight**: **Simplest fee structure** - flat 1.95% regardless of amount.

**Transfers (Payouts):**
- **To Mobile Money**: GHS 1 per transfer
- **To Bank Account**: GHS 8 per transfer

---

### 1.3 Kenya (KES)

**M-Pesa Transactions:**
- **Fee**: 1.5% flat per transaction
- **Settlement**: Kenyan Shilling (KES)
- **Use Case**: Mobile money (dominant payment method)

**Card Transactions:**
- **Local Cards**: 2.9% per transaction
- **International Cards**: 3.8% per transaction
- **Settlement**: Kenyan Shilling (KES)

**Transfers to M-Pesa Wallet:**
- **KES 1 - KES 1,500**: KES 20 per transfer
- **KES 1,501 - KES 20,000**: KES 40 per transfer
- **Above KES 20,001**: KES 60 per transfer

**Transfers to Bank Accounts:**
- **KES 1 - KES 10,000**: KES 80 per transfer
- **KES 10,001 - KES 50,000**: KES 120 per transfer
- **Above KES 50,001**: KES 140 per transfer

**Key Insight**: **M-Pesa is cheapest** (1.5%) - critical for Kenyan market.

---

### 1.4 South Africa (ZAR)

**Local Card Transactions:**
- **Fee**: 2.9% + ZAR 1 per transaction
- **ZAR 1 waived**: For transactions less than ZAR 10
- **Excludes VAT**: Additional 15% VAT on fees
- **Settlement**: South African Rand (ZAR)

**Example Calculations (excluding VAT):**

| Transaction Amount | Fee Calculation | Total Fee | Effective Rate |
|-------------------|-----------------|-----------|----------------|
| ZAR 5 | 2.9% (ZAR 1 waived) | ZAR 0.15 | 3.0% |
| ZAR 50 | 2.9% + ZAR 1 = ZAR 2.45 | ZAR 2.45 | 4.9% |
| ZAR 100 | 2.9% + ZAR 1 = ZAR 3.90 | ZAR 3.90 | 3.9% |
| ZAR 500 | 2.9% + ZAR 1 = ZAR 15.50 | ZAR 15.50 | 3.1% |
| ZAR 1,000 | 2.9% + ZAR 1 = ZAR 30 | ZAR 30 | 3.0% |

**Note**: Add 15% VAT to all fees (ZAR 1 = ~$0.05, VAT = ~$0.01).

**International Card Transactions:**
- **Fee**: 3.1% + ZAR 1 per transaction
- **Excludes VAT**: Additional 15% VAT on fees

**Instant EFT Transactions:**
- **Fee**: 2% per transaction
- **No flat fee**: Unlike cards
- **Use Case**: Direct bank transfer

**Transfers:**
- **Fee**: ZAR 3 per transfer (failed or successful)
- **Use Case**: Payouts to users

---

### 1.5 Côte d'Ivoire (XOF) - Optional

**Mobile Money:**
- **Fee**: 1.95% per transaction (excluding VAT)

**Card Transactions:**
- **Local Cards**: 3.2% per transaction (excluding VAT)
- **International Cards**: 3.8% per transaction (excluding VAT)

**Note**: Not in your initial 8 methods, but available if needed.

---

## 2. COST COMPARISON: PAYSTACK VS STRIPE

### 2.1 Nigeria Comparison

**Scenario: NGN 50,000 deposit (~$60 USD)**

| Provider | Fee Structure | Total Fee | Effective Rate |
|----------|--------------|-----------|----------------|
| **Paystack (Local)** | 1.5% + NGN 100 | NGN 850 (~$1.02) | **1.7%** |
| **Stripe (International)** | 5.4% + $0.30 | $3.54 | **5.9%** |
| **Savings with Paystack** | - | - | **-4.2%** (71% cheaper) |

**Scenario: NGN 200,000 deposit (~$240 USD)**

| Provider | Fee Structure | Total Fee | Effective Rate |
|----------|--------------|-----------|----------------|
| **Paystack (Local)** | 1.5% + NGN 100 → **Capped at NGN 2,000** | NGN 2,000 (~$2.40) | **1.0%** |
| **Stripe (International)** | 5.4% + $0.30 | $13.26 | **5.5%** |
| **Savings with Paystack** | - | - | **-4.5%** (82% cheaper) |

**Key Insight**: Paystack is **71-82% cheaper** than Stripe for Nigerian transactions.

---

### 2.2 Ghana Comparison

**Scenario: GHS 100 deposit (~$8 USD)**

| Provider | Fee Structure | Total Fee | Effective Rate |
|----------|--------------|-----------|----------------|
| **Paystack** | 1.95% flat | GHS 1.95 (~$0.16) | **1.95%** |
| **Stripe (International)** | 5.4% + $0.30 | $0.73 | **9.1%** |
| **Savings with Paystack** | - | - | **-7.2%** (78% cheaper) |

**Key Insight**: Paystack is **78% cheaper** than Stripe for Ghanaian transactions.

---

### 2.3 Kenya Comparison (M-Pesa)

**Scenario: KES 1,000 deposit (~$7 USD)**

| Provider | Fee Structure | Total Fee | Effective Rate |
|----------|--------------|-----------|----------------|
| **Paystack (M-Pesa)** | 1.5% flat | KES 15 (~$0.11) | **1.5%** |
| **Stripe (International)** | 5.4% + $0.30 | $0.68 | **9.7%** |
| **Savings with Paystack** | - | - | **-8.2%** (84% cheaper) |

**Key Insight**: Paystack M-Pesa is **84% cheaper** than Stripe for Kenyan transactions.

---

### 2.4 South Africa Comparison

**Scenario: ZAR 500 deposit (~$27 USD)**

| Provider | Fee Structure | Total Fee | Effective Rate |
|----------|--------------|-----------|----------------|
| **Paystack (Local)** | 2.9% + ZAR 1 | ZAR 15.50 (~$0.84) | **3.1%** |
| **Stripe (International)** | 5.4% + $0.30 | $1.76 | **6.5%** |
| **Savings with Paystack** | - | - | **-3.4%** (52% cheaper) |

**Note**: Paystack fees exclude VAT (add 15%), Stripe includes all fees.

**Key Insight**: Paystack is **52% cheaper** than Stripe for South African transactions (even with VAT).

---

## 3. TOTAL COST OF OWNERSHIP (TCO)

### 3.1 Integration Costs

**One-Time Development:**
- Paystack integration: ~40 hours
- At $100/hour: **$4,000**
- At $150/hour: **$6,000**

**Ongoing Maintenance:**
- ~5-10 hours/month
- At $100/hour: **$500-1,000/month**
- Annual: **$6,000-12,000/year**

### 3.2 Transaction Cost Savings

**Assumptions:**
- 1,000 African users/month
- Average deposit: $50 USD equivalent
- 50% use Paystack (500 transactions/month)
- 50% would use Stripe if Paystack unavailable

**Monthly Transaction Volume:**
- 500 transactions × $50 = **$25,000/month**

**Cost Comparison:**

| Provider | Fee Rate | Monthly Fees | Annual Fees |
|----------|----------|--------------|-------------|
| **Paystack** | ~1.5-2.9% avg | $375-725 | $4,500-8,700 |
| **Stripe** | 5.4% + $0.30 | $1,500 | $18,000 |
| **Savings** | - | **$775-1,125/month** | **$9,300-13,500/year** |

**Break-Even Analysis:**
- Integration cost: $4,000-6,000
- Monthly savings: $775-1,125
- **Break-even: 4-8 months**

**Key Insight**: Integration pays for itself in **4-8 months** if you have African users.

---

## 4. FEE STRUCTURE ANALYSIS

### 4.1 Advantages of Paystack Pricing

1. **Lower Base Rates**
   - Nigeria: 1.5% vs Stripe's 5.4%
   - Ghana: 1.95% vs Stripe's 5.4%
   - Kenya M-Pesa: 1.5% vs Stripe's 5.4%

2. **Fee Caps (Nigeria)**
   - Maximum NGN 2,000 per transaction
   - Large transactions become very cost-effective (1.0% effective rate)

3. **No Monthly Fees**
   - Pay-per-transaction only
   - No setup fees
   - No monthly minimums

4. **Local Settlement**
   - Settle in local currency (NGN, GHS, KES, ZAR)
   - Avoid currency conversion fees
   - Faster settlement (1-2 days vs 3-5 days)

### 4.2 Disadvantages of Paystack Pricing

1. **Flat Fee Component (Nigeria)**
   - NGN 100 flat fee hurts small transactions
   - Under NGN 2,500: waived (good)
   - Over NGN 2,500: adds to cost

2. **VAT (South Africa)**
   - 15% VAT on fees
   - Adds ~0.4% to effective rate
   - Must be factored into pricing

3. **Currency Volatility**
   - Settle in local currencies
   - Exposure to currency fluctuations
   - Need hedging strategy for large volumes

4. **Multiple Fee Structures**
   - Different rates per country
   - Different rates per method
   - More complex to calculate/predict

---

## 5. COST OPTIMIZATION STRATEGIES

### 5.1 Transaction Size Optimization

**Nigeria:**
- **Small transactions (< NGN 2,500)**: NGN 100 waived → 1.5% effective rate
- **Medium transactions (NGN 5,000-50,000)**: 1.5% + NGN 100 → 1.7-3.5% effective rate
- **Large transactions (> NGN 200,000)**: Fee cap → 1.0% effective rate

**Strategy**: Encourage larger deposits to benefit from fee cap.

**Example:**
- 10 × NGN 20,000 deposits = NGN 3,000 total fees (1.5% each)
- 1 × NGN 200,000 deposit = NGN 2,000 total fee (1.0% due to cap)
- **Savings: NGN 1,000 (33% reduction)**

### 5.2 Payment Method Selection

**Kenya:**
- **M-Pesa**: 1.5% (cheapest)
- **Local Cards**: 2.9%
- **International Cards**: 3.8%

**Strategy**: Encourage M-Pesa for Kenyan users (1.5% vs 2.9-3.8%).

**Ghana:**
- **All methods**: 1.95% (same rate)

**Strategy**: No optimization needed - all methods same cost.

### 5.3 Settlement Currency Strategy

**Option 1: Local Currency Settlement**
- **Pros**: Lower fees, faster settlement, no conversion fees
- **Cons**: Currency exposure, accounting complexity

**Option 2: USD Settlement (if available)**
- **Pros**: Unified accounting, no currency exposure
- **Cons**: May have conversion fees, slower settlement

**Recommendation**: **Local currency settlement** for cost savings, hedge large volumes.

---

## 6. HIDDEN COSTS & CONSIDERATIONS

### 6.1 Currency Conversion

**If you need USD:**
- Paystack settles in local currency (NGN, GHS, KES, ZAR)
- You'll need to convert to USD
- Conversion fees: ~1-2% (bank/wire transfer)
- **Add 1-2% to effective rate**

**Mitigation:**
- Use currency conversion service (Wise, Revolut)
- Negotiate better rates with bank
- Accept local currency in your system

### 6.2 Withdrawal/Payout Costs

**Nigeria:**
- NGN 10-50 per payout (depending on amount)
- If user deposits NGN 50,000 and withdraws NGN 50,000:
  - Deposit fee: NGN 850
  - Withdrawal fee: NGN 25-50
  - **Total: NGN 875-900 (1.75-1.8%)**

**Ghana:**
- GHS 1 (mobile money) or GHS 8 (bank)
- If user deposits GHS 100 and withdraws GHS 100:
  - Deposit fee: GHS 1.95
  - Withdrawal fee: GHS 1-8
  - **Total: GHS 2.95-9.95 (2.95-9.95%)**

**Key Insight**: Withdrawal fees can significantly impact total cost, especially for small amounts.

### 6.3 Failed Transaction Costs

**South Africa:**
- ZAR 3 per transfer (failed or successful)
- If transaction fails, you still pay ZAR 3
- **Factor into cost calculations**

### 6.4 Compliance & Regulatory Costs

**Potential Costs:**
- KYC verification (may be included or separate)
- Regulatory reporting
- License fees (varies by country)
- Legal review

**Note**: These are typically one-time or annual, not per-transaction.

---

## 7. COST PROJECTIONS BY VOLUME

### 7.1 Low Volume Scenario

**Assumptions:**
- 100 African users/month
- Average deposit: $30 USD equivalent
- 50% use Paystack (50 transactions/month)

**Monthly Volume:**
- 50 transactions × $30 = $1,500/month

**Monthly Costs:**

| Country | Transactions | Avg Fee Rate | Monthly Fees |
|---------|--------------|--------------|--------------|
| Nigeria | 20 | 1.7% | $0.51 |
| Ghana | 15 | 1.95% | $0.44 |
| Kenya | 10 | 1.5% | $0.23 |
| South Africa | 5 | 3.1% | $0.47 |
| **Total** | **50** | **~1.8% avg** | **$1.65/month** |

**vs Stripe:**
- Stripe fees: $81/month (5.4% + $0.30)
- **Savings: $79.35/month**

**Annual Savings: $952/year**

---

### 7.2 Medium Volume Scenario

**Assumptions:**
- 1,000 African users/month
- Average deposit: $50 USD equivalent
- 50% use Paystack (500 transactions/month)

**Monthly Volume:**
- 500 transactions × $50 = $25,000/month

**Monthly Costs:**

| Country | Transactions | Avg Fee Rate | Monthly Fees |
|---------|--------------|--------------|--------------|
| Nigeria | 200 | 1.7% | $170 |
| Ghana | 150 | 1.95% | $146 |
| Kenya | 100 | 1.5% | $75 |
| South Africa | 50 | 3.1% | $78 |
| **Total** | **500** | **~1.9% avg** | **$469/month** |

**vs Stripe:**
- Stripe fees: $1,500/month (5.4% + $0.30)
- **Savings: $1,031/month**

**Annual Savings: $12,372/year**

---

### 7.3 High Volume Scenario

**Assumptions:**
- 5,000 African users/month
- Average deposit: $75 USD equivalent
- 50% use Paystack (2,500 transactions/month)

**Monthly Volume:**
- 2,500 transactions × $75 = $187,500/month

**Monthly Costs:**

| Country | Transactions | Avg Fee Rate | Monthly Fees |
|---------|--------------|--------------|--------------|
| Nigeria | 1,000 | 1.5% (large tx benefit) | $1,125 |
| Ghana | 750 | 1.95% | $1,095 |
| Kenya | 500 | 1.5% | $563 |
| South Africa | 250 | 3.1% | $581 |
| **Total** | **2,500** | **~1.8% avg** | **$3,364/month** |

**vs Stripe:**
- Stripe fees: $10,125/month (5.4% + $0.30)
- **Savings: $6,761/month**

**Annual Savings: $81,132/year**

---

## 8. RECOMMENDATIONS

### 8.1 Cost-Benefit Analysis

**Integration Investment:**
- Development: $4,000-6,000 (one-time)
- Maintenance: $6,000-12,000/year (ongoing)

**Cost Savings:**
- Low volume: $952/year
- Medium volume: $12,372/year
- High volume: $81,132/year

**ROI Timeline:**
- **Low volume**: Not worth it (savings < maintenance cost)
- **Medium volume**: Break-even in 1 year, positive ROI after
- **High volume**: Break-even in 1-2 months, very positive ROI

**Recommendation**: 
- **If < 500 African users/month**: Defer integration
- **If 500-2,000 African users/month**: Integrate Paystack
- **If > 2,000 African users/month**: Integrate immediately

### 8.2 Pricing Strategy

**Option 1: Absorb All Fees (Current Philosophy)**
- User pays: $50
- You receive: $49.15 (after 1.7% Paystack fee)
- **Cost to you: $0.85**

**Option 2: Pass Fees to User**
- User pays: $50.85 (you add fee)
- You receive: $50 (after Paystack fee)
- **Cost to you: $0**

**Option 3: Hybrid**
- Absorb Paystack fees (lower than Stripe)
- Pass currency conversion fees (if applicable)

**Recommendation**: **Absorb Paystack fees** - they're already 70-80% lower than Stripe, good UX.

### 8.3 Transaction Size Strategy

**For Nigeria:**
- Encourage deposits > NGN 200,000 to benefit from fee cap (1.0% vs 1.7%)
- Or encourage deposits < NGN 2,500 to avoid NGN 100 flat fee

**For Other Countries:**
- No optimization needed (flat rates)

---

## 9. SUMMARY

### 9.1 Key Cost Insights

1. **Paystack is 50-80% cheaper** than Stripe for African transactions
2. **Fee structures vary by country** - Nigeria has caps, Ghana is flat, Kenya M-Pesa is cheapest
3. **Large transactions benefit from caps** (Nigeria: 1.0% effective rate for NGN 200,000+)
4. **Withdrawal fees add to total cost** - factor into pricing
5. **Currency conversion may add 1-2%** if you need USD

### 9.2 Break-Even Analysis

| Monthly African Users | Monthly Savings | Annual Savings | ROI Timeline |
|----------------------|-----------------|----------------|--------------|
| 100 | $79 | $952 | Not worth it |
| 500 | $1,031 | $12,372 | 1 year |
| 2,500 | $6,761 | $81,132 | 1-2 months |

### 9.3 Final Recommendation

**Integrate Paystack if:**
- You have 500+ African users/month, OR
- You expect to grow African user base, OR
- You want to offer best-in-class payment experience in Africa

**Defer Paystack if:**
- You have < 100 African users/month, AND
- No growth expected in Africa, AND
- Development resources are constrained

**Cost is not the blocker** - Paystack is significantly cheaper. The decision should be based on **user base size and growth potential**.

---

*For questions or clarifications, refer to:*
- *Paystack Pricing: https://paystack.com/pricing*
- *Paystack Documentation: https://paystack.com/docs*
- *Integration Analysis: `PAYMENT_INTEGRATION_PRE_PLANNING_ANALYSIS.md`*

