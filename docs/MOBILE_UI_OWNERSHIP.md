# Mobile UI Ownership

This document clarifies the ownership and status of mobile UI components in the BestBall codebase.

---

## Primary Framework: `components/vx2/`

**Status:** ACTIVE - Primary mobile UI framework

VX2 is the enterprise-grade mobile application framework. All new mobile UI development should use vx2 components.

### Key Features
- Comprehensive component library (290+ files)
- Modern React patterns with hooks
- TypeScript throughout
- Consistent design system
- Responsive layouts
- Draft room functionality
- Navigation system
- Authentication flows

### Structure
```
components/vx2/
├── auth/           # Authentication components
├── draft-logic/    # Draft room logic and adapters
├── draft-room/     # Draft room UI components
├── navigation/     # Navigation and routing
├── shell/          # App shell and layout
├── common/         # Shared UI components
└── ...
```

---

## Legacy Framework: `components/mobile/`

**Status:** DEPRECATED

The legacy mobile components remain for backward compatibility only. These should NOT be used for new development.

### Components
| Component | Replacement | Migration Status |
|-----------|-------------|------------------|
| `DraftBoardModal.tsx` | `vx2/draft-room/` | Pending |
| `MobileFooter.tsx` | `vx2/navigation/` | Pending |
| `MobileLayout.tsx` | `vx2/shell/` | Pending |

### Migration Timeline
- **Phase 1 (Q2 2026):** Identify all usages of legacy components
- **Phase 2 (Q3 2026):** Migrate remaining usages to vx2
- **Phase 3 (Q4 2026):** Remove `components/mobile/` directory

---

## Development Guidelines

### For New Features
1. Always use components from `@/components/vx2/`
2. Follow existing vx2 patterns and conventions
3. Add new shared components to `vx2/common/`

### For Bug Fixes
1. If the bug is in `components/mobile/`, consider migrating to vx2 instead of patching
2. If migration is not feasible, fix in place but add TODO comment for future migration

### Import Patterns
```typescript
// ✅ CORRECT - Use vx2 components
import { DraftRoom } from '@/components/vx2/draft-room';
import { MobileNav } from '@/components/vx2/navigation';
import { AppShell } from '@/components/vx2/shell';

// ❌ DEPRECATED - Do not use for new code
import { DraftBoardModal } from '@/components/mobile/DraftBoardModal';
import { MobileFooter } from '@/components/mobile/MobileFooter';
```

---

## Questions?

Contact the frontend team or refer to the VX2 component documentation in `components/vx2/README.md`.

---

**Last Updated:** January 2026  
**Owner:** Frontend Team
