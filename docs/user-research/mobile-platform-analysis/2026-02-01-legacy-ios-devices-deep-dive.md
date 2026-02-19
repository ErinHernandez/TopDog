# Legacy iOS Devices & Older iOS Versions - Deep Dive Analysis

**Research Date:** February 1, 2026  
**Data Currency:** November 2025 - January 2026  
**Purpose:** Detailed analysis of low-end/oldest iPhones and legacy iOS versions still in operation

---

## Executive Summary

Approximately **3-5% of active iOS devices** are running iOS 15 or older, representing **45-75 million devices worldwide**. These devices are concentrated in:
- Emerging markets (Africa, India, Southeast Asia, Latin America)
- Secondary/refurbished device markets
- Users with older hardware that cannot upgrade
- Users who deliberately avoid updates

---

## 1. Complete iPhone Model → iOS Version Mapping

### Devices Capped at iOS 12 (Released 2018)

| Model | Release Year | Status | Max iOS | Est. Active Users |
|-------|--------------|--------|---------|-------------------|
| iPhone 5s | 2013 | **Obsolete** | iOS 12.5.7 | 5-10M |
| iPhone 6 | 2014 | **Obsolete** | iOS 12.5.7 | 10-15M |
| iPhone 6 Plus | 2014 | **Obsolete** | iOS 12.5.7 | 5-10M |

**Total iOS 12-capped devices:** ~20-35 million

**Key Constraints:**
- No security updates since 2023
- Cannot access apps requiring iOS 13+
- 32-bit app support ended
- No Face ID, limited biometrics
- A7/A8 chip (significantly slower)

---

### Devices Capped at iOS 15 (Released 2021)

| Model | Release Year | Status | Max iOS | Est. Active Users |
|-------|--------------|--------|---------|-------------------|
| iPhone 6s | 2015 | **Obsolete** | iOS 15.8.3 | 15-25M |
| iPhone 6s Plus | 2015 | **Obsolete** | iOS 15.8.3 | 10-15M |
| iPhone SE (gen 1) | 2016 | **Vintage** | iOS 15.8.3 | 10-20M |
| iPhone 7 | 2016 | **Vintage** | iOS 15.8.3 | 20-30M |
| iPhone 7 Plus | 2016 | **Vintage** | iOS 15.8.3 | 15-20M |
| iPod touch (gen 7) | 2019 | Active | iOS 15.8.3 | 5-10M |

**Total iOS 15-capped devices:** ~75-120 million

**Key Constraints:**
- Security updates continue (last: iOS 15.8.3)
- A9/A10 chip (adequate but aging)
- No Face ID
- No ProMotion display
- Limited AR capabilities
- Some newer APIs unavailable

---

### Devices Capped at iOS 16 (Released 2022)

| Model | Release Year | Status | Max iOS | Est. Active Users |
|-------|--------------|--------|---------|-------------------|
| iPhone 8 | 2017 | **Vintage** | iOS 16.7.x | 25-35M |
| iPhone 8 Plus | 2017 | **Vintage** | iOS 16.7.x | 20-25M |
| iPhone X | 2017 | **Vintage** | iOS 16.7.x | 30-40M |

**Total iOS 16-capped devices:** ~75-100 million

**Key Constraints:**
- Security updates continue
- A11 Bionic chip (still capable)
- Face ID (iPhone X) / Touch ID (iPhone 8)
- No always-on display
- Limited Apple Intelligence features
- Some iOS 17+ APIs unavailable

---

### Devices Capped at iOS 18 (Released 2024)

| Model | Release Year | Status | Max iOS | Est. Active Users |
|-------|--------------|--------|---------|-------------------|
| iPhone XS | 2018 | Active | iOS 18.x | 40-50M |
| iPhone XS Max | 2018 | Active | iOS 18.x | 30-40M |
| iPhone XR | 2018 | Active | iOS 18.x | 50-70M |

**Total iOS 18-capped devices:** ~120-160 million

**Key Constraints:**
- Currently receiving updates
- A12 Bionic chip (good performance)
- Will lose support with iOS 27 (expected 2026)
- Limited Apple Intelligence features

---

## 2. Legacy iOS Version Market Share (Detailed)

### Global Distribution (January 2026)

| iOS Version | Market Share | Est. Devices | Primary Device Pool |
|-------------|--------------|--------------|---------------------|
| **iOS 18.7** | 30.3% | ~455M | iPhone XS and newer |
| **iOS 18.6** | 29.8% | ~447M | iPhone XS and newer |
| **iOS 26.1** | 10.7% | ~160M | iPhone XS and newer |
| **iOS 18.5** | 6.0% | ~90M | iPhone XS and newer |
| **iOS 26.2** | 2.0% | ~30M | iPhone XS and newer |
| **iOS 16.7** | 2.3% | ~35M | iPhone 8, X (capped) |
| **iOS 18.3** | 1.8% | ~27M | iPhone XS and newer |
| **iOS 15.8** | 1.8% | ~27M | iPhone 6s, 7, SE1 (capped) |
| **iOS 11.0** | 1.7% | ~26M | Anomaly/bots |
| **iOS 17.6** | 1.7% | ~26M | Non-updaters |
| **iOS 26.0** | 1.3% | ~20M | Early adopters |
| **iOS 12.5** | 0.4% | ~6M | iPhone 5s, 6 (capped) |

### Cumulative Coverage (November 2025)

| Minimum iOS | Cumulative Coverage | Devices Excluded |
|-------------|---------------------|------------------|
| iOS 26 | 7.1% | 1.4B |
| iOS 18 | 82.8% | 258M |
| iOS 17 | 88.1% | 179M |
| iOS 16 | 93.1% | 104M |
| iOS 15 | 95.9% | 62M |
| iOS 14 | 96.3% | 56M |
| iOS 13 | 96.5% | 53M |
| iOS 12 | 97.0% | 45M |

---

## 3. Legacy iOS Version Breakdown (Granular)

### iOS 15.x Distribution (2.7% total = ~40M devices)

| Version | Share of iOS 15 | Global Share | Est. Devices |
|---------|-----------------|--------------|--------------|
| iOS 15.8 | 64.8% | 1.75% | ~26M |
| iOS 15.7 | 7.4% | 0.20% | ~3M |
| iOS 15.6 | 11.1% | 0.30% | ~4.5M |
| iOS 15.5 | 3.7% | 0.10% | ~1.5M |
| iOS 15.4 | 3.7% | 0.10% | ~1.5M |
| iOS 15.0-15.3 | 9.3% | 0.25% | ~4M |

**Key Insight:** iOS 15.8 dominates because it's the final security update for iPhone 6s/7/SE1, meaning these devices auto-updated to this version.

---

### iOS 16.x Distribution (5.9% total - including cumulative = ~89M devices)

| Version | Global Share | Est. Devices | Notes |
|---------|--------------|--------------|-------|
| iOS 16.7 | 2.3% | ~35M | Latest for iPhone 8/X |
| iOS 16.6 | 0.5% | ~7.5M | Previous security update |
| iOS 16.5 | 0.2% | ~3M | |
| iOS 16.3 | 0.5% | ~7.5M | |
| iOS 16.2 | 0.3% | ~4.5M | |
| iOS 16.1 | 0.5% | ~7.5M | |
| iOS 16.0 | 0.3% | ~4.5M | |

---

### iOS 12-14 Distribution (Very Legacy)

| Version | Global Share | Est. Devices | Notes |
|---------|--------------|--------------|-------|
| iOS 14.8 | 0.1% | ~1.5M | Users who stopped updating |
| iOS 14.6-14.7 | 0.1% | ~1.5M | |
| iOS 14.0-14.5 | 0.2% | ~3M | |
| iOS 13.x (all) | 0.2% | ~3M | Rare |
| iOS 12.5 | 0.4% | ~6M | iPhone 5s/6 final version |
| iOS 12.0-12.4 | 0.1% | ~1.5M | |
| iOS 11.x and older | 1.7%* | ~26M | *Likely bot traffic/anomaly |

---

## 4. Regional Distribution of Legacy Devices

### Legacy iOS Concentration by Region

| Region | iOS 15 & older | iOS 16 & older | Primary Cause |
|--------|----------------|----------------|---------------|
| Africa | 8-12% | 15-20% | Economic constraints, refurb market |
| India | 5-8% | 12-15% | Price sensitivity, refurb market |
| Southeast Asia | 6-10% | 14-18% | Mixed economy, refurb growth |
| Latin America | 5-8% | 12-16% | Economic constraints |
| China | 4-6% | 10-14% | Long device retention |
| Eastern Europe | 3-5% | 8-12% | Mixed economy |
| Western Europe | 2-3% | 5-8% | Mature market |
| North America | 2-3% | 4-6% | Mature market, fast upgraders |
| Japan | 1-2% | 3-5% | Very fast upgraders |

---

## 5. Refurbished/Secondary Market Analysis

### Top-Selling Refurbished iPhone Models (H1 2025)

| Rank | Model | Primary Markets | Typical iOS |
|------|-------|-----------------|-------------|
| 1 | iPhone 12 | Global | iOS 18+ |
| 2 | iPhone 13 | Global | iOS 18+ |
| 3 | iPhone 11 | Africa, India, SEA | iOS 17-18 |
| 4 | iPhone XR | Emerging markets | iOS 16-18 |
| 5 | iPhone 14 | India, SEA | iOS 18+ |
| 6 | iPhone SE (gen 2) | Budget-conscious | iOS 17-18 |

### Regional Refurbished Market Growth (H1 2025)

| Region | YoY Growth | Top iPhone Models |
|--------|------------|-------------------|
| Africa | +6% | iPhone 13, 12, 11 |
| India | +5% (+19% for Apple) | iPhone 13, 14, 12 |
| Southeast Asia | +5% | iPhone 12, 13 |
| Latin America | +3% | iPhone 12, 11 |
| Western Europe | +1% | iPhone 13, 14 |
| North America | +1% | iPhone 13, 14 |

**Key Insight:** The refurbished market is shifting toward newer models (iPhone 12-14), not legacy devices (iPhone 8 and older). This means the iOS 15/16 capped device population is stable/declining, not growing.

---

## 6. Device Longevity & Support Timeline

### Apple Support Status Definitions

| Status | Definition | Service Availability |
|--------|------------|---------------------|
| **Active** | Currently supported | Full hardware & software support |
| **Vintage** | 5-7 years old | Limited parts, subject to availability |
| **Obsolete** | 7+ years old | No hardware service, no software updates |

### Current iPhone Support Status (January 2026)

| Status | Models | Count |
|--------|--------|-------|
| **Obsolete** | iPhone 5s, 6, 6 Plus, 6s (32GB), 6s Plus (32GB) | 5 models |
| **Vintage** | iPhone 6s, 6s Plus, SE (gen 1), 7, 7 Plus, 8, 8 Plus, X | 8 models |
| **Active** | iPhone XS and newer | 20+ models |

### Projected iOS Support Cutoffs

| iOS Version | Release | Devices Dropped | Est. Devices Affected |
|-------------|---------|-----------------|----------------------|
| iOS 26 (2025) | Sept 2025 | None new | — |
| iOS 27 (2026) | Sept 2026 | iPhone XS, XR (likely) | ~120-160M |
| iOS 28 (2027) | Sept 2027 | iPhone 11 (likely) | ~80-100M |

---

## 7. Enterprise Decision Matrix for Legacy Support

### Cost-Benefit Analysis

| Min iOS | Coverage | Legacy Code Overhead | Recommended For |
|---------|----------|---------------------|-----------------|
| iOS 18+ | 84.9% | None | New apps, cutting-edge features |
| iOS 17+ | 89.5% | Minimal | **Most enterprise apps** |
| iOS 16+ | 94.1% | Moderate | Apps needing iPhone 8/X support |
| iOS 15+ | 96.8% | Significant | Apps targeting emerging markets |
| iOS 14+ | 96.3% | High | Rarely justified |
| iOS 12+ | 97.0% | Very High | Almost never justified |

### Technical Constraints by iOS Version

| Feature | iOS 12 | iOS 13 | iOS 14 | iOS 15 | iOS 16 | iOS 17+ |
|---------|--------|--------|--------|--------|--------|---------|
| Swift Concurrency | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| SwiftUI 2.0+ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| App Clips | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Widgets (Home Screen) | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Live Activities | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Interactive Widgets | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| StoreKit 2 | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Focus Modes API | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| SharePlay | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Apple Intelligence | ❌ | ❌ | ❌ | ❌ | ❌ | Partial* |

*Full Apple Intelligence requires iOS 18+ and A17 Pro or newer

---

## 8. Key Findings for Enterprise Decision

### The "Long Tail" Problem

1. **iOS 15-capped devices (iPhone 6s/7/SE1):** ~75-120M devices
   - Declining as devices fail/get replaced
   - Concentrated in emerging markets
   - Refurbished market shifting away from these models
   - **Recommendation:** Support only if emerging markets are critical

2. **iOS 16-capped devices (iPhone 8/X):** ~75-100M devices
   - Still significant installed base
   - A11 chip still performs adequately
   - Security updates ongoing
   - **Recommendation:** Consider supporting if broad reach needed

3. **iOS 12-capped devices (iPhone 5s/6):** ~20-35M devices
   - No security updates
   - Very old hardware (A7/A8)
   - Essentially unsupportable for modern apps
   - **Recommendation:** Do not support

### Regional Strategy

| If your target market includes... | Minimum iOS |
|-----------------------------------|-------------|
| US, Japan, Western Europe only | iOS 17+ |
| Global including China | iOS 16+ |
| Emerging markets (broad reach needed) | iOS 15+ (carefully evaluate) |

### Bottom Line

- **iOS 17+ (89.5% coverage)** is the recommended minimum for most enterprise apps
- **iOS 16+ (94.1% coverage)** adds ~70M devices but requires supporting iPhone 8/X
- **iOS 15+ (96.8% coverage)** adds ~40M more devices but significant legacy overhead
- **Supporting iOS 14 or older is rarely justified** for the ~3M additional devices

---

## Appendix: Data Sources

- TelemetryDeck Survey (16M MAU, November 2025)
- StatCounter GlobalStats (December 2025 - January 2026)
- iOS Ref cumulative usage data (November 2025)
- Counterpoint Research refurbished market reports (H1 2025)
- Apple Support documentation (January 2026)
- ioscompatibility.com market share calculator (January 2026)

---

## Document History

| Date | Version | Changes |
|------|---------|---------|
| 2026-02-01 | 1.0 | Initial deep dive on legacy devices |

---

*This analysis supplements the main iOS Version & Country Analysis report dated 2026-02-01.*
