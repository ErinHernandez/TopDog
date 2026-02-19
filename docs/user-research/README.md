# User Research

This directory contains user research, market analysis, and data-driven insights to support product and engineering decisions.

## Directory Structure

```
user-research/
├── README.md                          # This file
└── mobile-platform-analysis/          # iOS/Android market research
    ├── 2026-02-01-ios-version-country-analysis.md
    └── 2026-02-01-ios-analysis-charts.html
```

## Research Categories

### Mobile Platform Analysis

Research related to iOS/Android market share, version distribution, device demographics, and mobile strategy.

| Date | Document | Description |
|------|----------|-------------|
| 2026-02-01 | **[iOS Strategic Plan](./mobile-platform-analysis/2026-02-01-ios-strategic-plan.md)** | **Comprehensive strategic plan - START HERE** |
| 2026-02-01 | [iOS Version & Country Analysis](./mobile-platform-analysis/2026-02-01-ios-version-country-analysis.md) | Comprehensive analysis of iPhone/iOS distribution by country |
| 2026-02-01 | [iOS Analysis Charts](./mobile-platform-analysis/2026-02-01-ios-analysis-charts.html) | Interactive visualizations (open in browser) |
| 2026-02-01 | [Legacy iOS Devices Deep Dive](./mobile-platform-analysis/2026-02-01-legacy-ios-devices-deep-dive.md) | Detailed analysis of older iPhones and legacy iOS versions |
| 2026-02-01 | [Legacy Devices Charts](./mobile-platform-analysis/2026-02-01-legacy-devices-charts.html) | Interactive charts for legacy device data (open in browser) |
| 2026-02-01 | [NFL International + iOS Matrix](./mobile-platform-analysis/2026-02-01-nfl-international-ios-matrix.md) | NFL fans + iOS + demographics + values framework |
| 2026-02-01 | [Data Sources](./mobile-platform-analysis/2026-02-01-data-sources.md) | Full citation of all research sources with URLs |

### Related Implementation Plans

| Date | Document | Description |
|------|----------|-------------|
| 2026-02-01 | [iOS Implementation Plan](../ios-implementation-plan/2026-02-01-ios-implementation-plan.md) | Technical plan to implement iOS 16+ support |

## Research Guidelines

### Naming Convention

All research documents should follow this naming pattern:

```
YYYY-MM-DD-descriptive-name.md
```

Example: `2026-02-01-ios-version-country-analysis.md`

### Required Metadata

Each research document should include:

1. **Research Date** - When the research was conducted
2. **Data Currency** - How current the underlying data is
3. **Data Sources** - Where the data came from
4. **Purpose** - What decision this research supports

### Data Freshness

Market data ages quickly. Consider these refresh intervals:

| Data Type | Recommended Refresh |
|-----------|---------------------|
| OS version distribution | Quarterly |
| Device market share | Quarterly |
| Regional market share | Semi-annually |
| Demographic data | Annually |
| Pricing/economic data | Annually |

## Contributing

When adding new research:

1. Create a dated file in the appropriate subdirectory
2. Include all required metadata
3. Update this README with the new document
4. Note data sources and any limitations

## Contact

For questions about existing research or to request new analysis, contact the product team.
