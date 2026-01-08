# Teams Tab Firebase Costs - 100,000 Users Summary

## Quick Reference

**Assumptions:**
- 100,000 daily active users
- Average 10-50 teams per user
- Game-day optimized approach (real-time only on game days until Week 17)

---

## Annual Cost Breakdown

### Team Data Costs

| Approach | Annual Cost | Monthly Average | Notes |
|----------|-------------|-----------------|-------|
| **Mock Data** | $0 | $0 | No Firebase usage |
| **One-Time Fetch** | $2,160-10,800 | $180-900 | Simple, predictable |
| **Real-Time (Year-Round)** | $18,000-60,000 | $1,500-5,000 | Not recommended |
| **Real-Time (Game Days Only)** | $1,500-6,000 | $125-500 | **Recommended** |

### Player News Costs

**Assumptions:**
- Player news stored in separate Firestore collection
- Batch updates (not real-time listeners) - more cost-effective
- 100,000 daily active users
- Each user fetches player news for their team's players (average 15 players/team × 10-50 teams = 150-750 players)
- Average 50-200 news items per update batch

**Detailed Calculation:**

| Period | Days | Frequency | Updates/Year | Reads/Update | Total Reads | Annual Cost |
|--------|------|-----------|--------------|--------------|-------------|-------------|
| **Aug-Week 17** | ~150 | 3x daily | 450 | 50-200K | 22.5M-90M | ~$600-1,800 |
| **After Week 17-July** | ~215 | 1x daily | 215 | 50-200K | 10.75M-43M | ~$200-700 |
| **Total** | 365 | Variable | 665 | Variable | 33.25M-133M | **~$800-2,500** |

**Notes:**
- Uses batch updates (one-time fetch per update), not real-time listeners
- Cost scales with number of news items, not number of users
- Can be optimized with caching and CDN
- Separate from team data listeners (doesn't affect team data costs)

### Total Annual Costs

| System | Annual Cost | Monthly Average |
|--------|-------------|-----------------|
| **Team Data (Game-Day Optimized)** | $1,500-6,000 | $125-500 |
| **Player News (3x/1x daily)** | $800-2,500 | $67-208 |
| **TOTAL** | **$2,300-8,500** | **$192-708** |

---

## Cost Comparison

| Approach | Annual Cost | vs Year-Round | Savings |
|----------|-------------|---------------|---------|
| **Year-Round Real-Time** | $18,000-60,000 | Baseline | - |
| **Game-Day Optimized** | $2,300-8,500 | 75-85% less | **$15,700-51,500/year** |

---

## Monthly Cost Breakdown

### Game-Day Optimized (Recommended)

**During Season (Aug-Week 17, ~150 days):**
- Team data: Real-time on game/post-game days (~85-102 days), one-time on non-game days
- Player news: 3x daily batch updates
- **Monthly cost breakdown:**
  - Team data: ~$100-400/month (averaged)
  - Player news: ~$50-150/month (averaged)
  - **Total: ~$150-550/month**

**Off-Season (After Week 17-July, ~215 days):**
- Team data: One-time fetch only (no real-time listeners)
- Player news: 1x daily batch updates
- **Monthly cost breakdown:**
  - Team data: ~$80-300/month (averaged)
  - Player news: ~$17-58/month (averaged)
  - **Total: ~$97-358/month**

**Annual Average: ~$192-708/month**
- Team data: ~$125-500/month
- Player news: ~$67-208/month

---

## Cost Optimization Tips

1. **Use game-day optimization**: Saves 75-85% vs year-round
2. **Disable listeners after Week 17**: Tournaments complete, no updates needed
3. **Separate player news**: Doesn't require team data listeners
4. **Monitor usage**: Set alerts at $1,000, $2,500, $5,000/month
5. **Cache aggressively**: Reduce redundant reads
6. **Use pagination**: For users with 50+ teams

---

## Scaling Projections

| Users | Game-Day Optimized | Year-Round Real-Time |
|-------|-------------------|---------------------|
| **1,000** | $15-60/year | $180-600/year |
| **10,000** | $150-600/year | $1,800-6,000/year |
| **100,000** | $1,500-6,000/year | $18,000-60,000/year |
| **1,000,000** | $15,000-60,000/year | $180,000-600,000/year |

**Cost scales linearly with user count.**

---

## Budget Planning

### Conservative Estimate (100K users)
- **Team data**: $1,500/year
- **Player news**: $800/year
- **Total**: **$2,300/year** (~$192/month)

### Moderate Estimate (100K users)
- **Team data**: $3,000/year
- **Player news**: $1,500/year
- **Total**: **$4,500/year** (~$375/month)

### High Estimate (100K users)
- **Team data**: $6,000/year
- **Player news**: $2,500/year
- **Total**: **$8,500/year** (~$708/month)

---

## Key Takeaways

1. **Game-day optimization is critical**: Saves $15,700-51,500/year at 100K users
2. **Player news is separate**: ~$800-2,500/year, doesn't affect team listener costs
3. **Cost scales linearly**: 10x users = 10x cost
4. **Monitor closely**: Set up alerts to avoid surprises
5. **Plan for growth**: Costs increase proportionally with user base

---

## ROI Analysis

**Investment:**
- Implementation: 8-12 hours development
- Maintenance: ~8-12 hours/year

**Savings (100K users):**
- vs Year-round: $15,700-51,500/year
- vs Seasonal: $3,700-11,500/year
- vs Game days only: $300-1,500/year

**Break-even:**
- Implementation pays for itself in <1 month
- Ongoing maintenance: Negligible vs savings

---

## Monitoring Recommendations

### Firebase Usage Alerts

```typescript
// Set up alerts for 100K users
const alerts = {
  warning: 1000000, // $1,000/month
  critical: 2500000, // $2,500/month
  emergency: 5000000, // $5,000/month
};
```

### Key Metrics to Track

1. **Daily reads**: Should be ~30M-150M/day (one-time) or lower
2. **Listener count**: Should be ~100K on game days, 0 on non-game days
3. **Cost per user**: Target <$0.10/user/year
4. **Update frequency**: Track actual vs expected

---

## Cost Optimization Checklist

- [ ] Implement game-day optimization
- [ ] Disable listeners after Week 17
- [ ] Separate player news system
- [ ] Set up cost monitoring alerts
- [ ] Implement caching layer
- [ ] Use pagination for large team lists
- [ ] Monitor actual usage vs projections
- [ ] Review costs monthly
- [ ] Optimize queries (composite indexes)
- [ ] Consider CDN caching for static data

