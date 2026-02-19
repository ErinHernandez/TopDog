# Draft Room Feature Matrix

**Purpose:** Compare features across all draft room versions to identify gaps in VX2  
**Date:** January 2025  
**Status:** Phase 1A - Feature Parity Audit  
**Reference:** TOPDOG_MASTER_REFACTORING_PLAN.md

---

## Legend

- ✅ = Implemented
- ❌ = Not implemented (by design)
- ⚠️ = Partially implemented
- ? = Need to verify
- P0 = Must have (blocks migration)
- P1 = Should have
- P2 = Nice to have

---

## Draft Room Versions

| Version | Location | Language | Status | Route |
|---------|----------|----------|--------|-------|
| **v2** | `components/draft/v2/` | JavaScript | ⚠️ Legacy | `/draft/v2/[roomId]` |
| **v3** | `components/draft/v3/` | JavaScript | ⚠️ Legacy | `/draft/v3/[roomId]` |
| **TopDog** | `pages/draft/topdog/` | TypeScript | ⚠️ Active | `/draft/topdog/[roomId]` |
| **VX** | `components/vx/` | TypeScript | ⚠️ Legacy | N/A (component only) |
| **VX2** | `components/vx2/draft-room/` | TypeScript | ✅ **TARGET** | `/draft/vx2/[roomId]` |

---

## Core Draft Features

| Feature | v2 | v3 | TopDog | VX | VX2 | Priority | Notes |
|---------|:--:|:--:|:------:|:--:|:---:|:--------:|-------|
| **Real-time pick updates** | ✅ | ✅ | ✅ | ✅ | ✅ | P0 | Firestore listeners |
| **Submit pick** | ✅ | ✅ | ✅ | ✅ | ✅ | P0 | Via API route |
| **Pick timer** | ✅ | ✅ | ✅ | ✅ | ✅ | P0 | Configurable (30s fast, 12h slow) |
| **Turn indicator** | ✅ | ✅ | ✅ | ✅ | ✅ | P0 | Shows current picker |
| **Draft completion** | ✅ | ✅ | ✅ | ✅ | ✅ | P0 | Status transitions |
| **Snake draft order** | ✅ | ✅ | ✅ | ✅ | ✅ | P0 | Reverses each round |
| **Pick validation** | ✅ | ✅ | ✅ | ✅ | ✅ | P0 | Server-side validation |
| **Atomic pick submission** | ✅ | ✅ | ✅ | ✅ | ✅ | P0 | Firestore transactions |

---

## Player Selection

| Feature | v2 | v3 | TopDog | VX | VX2 | Priority | Notes |
|---------|:--:|:--:|:------:|:--:|:---:|:--------:|-------|
| **Player list** | ✅ | ✅ | ✅ | ✅ | ✅ | P0 | Available players |
| **Player search** | ✅ | ✅ | ✅ | ✅ | ✅ | P0 | Text search |
| **Position filters** | ✅ | ✅ | ✅ | ✅ | ✅ | P1 | QB, RB, WR, TE, FLEX |
| **ADP display** | ✅ | ✅ | ✅ | ✅ | ✅ | P1 | Average draft position (extensively implemented) |
| **Player stats** | ✅ | ✅ | ✅ | ✅ | ⚠️ | P2 | Basic stats shown (ADP, projected points, bye week) |
| **Player details modal** | ✅ | ✅ | ✅ | ✅ | ✅ | P2 | PlayerExpandedCard component |
| **Bye week display** | ✅ | ✅ | ✅ | ✅ | ✅ | P1 | Week off indicator (implemented in types and components) |
| **Team display** | ✅ | ✅ | ✅ | ✅ | ✅ | P0 | NFL team abbreviation |
| **Jersey number** | ✅ | ✅ | ✅ | ✅ | ❌ | P2 | Player jersey number (not implemented) |

---

## Automation

| Feature | v2 | v3 | TopDog | VX | VX2 | Priority | Notes |
|---------|:--:|:--:|:------:|:--:|:---:|:--------:|-------|
| **Autopick enable/disable** | ✅ | ✅ | ✅ | ✅ | ✅ | P0 | Auto-pick when timer expires |
| **Draft queue** | ✅ | ✅ | ✅ | ✅ | ✅ | P1 | Queue management (useDraftQueue) |
| **Custom rankings** | ✅ | ✅ | ✅ | ✅ | ❌ | P2 | User-defined player rankings (not implemented, marked as future feature) |
| **Auto-pick from queue** | ✅ | ✅ | ✅ | ✅ | ✅ | P0 | Picks from queue when timer expires |
| **Auto-pick fallback (ADP)** | ✅ | ✅ | ✅ | ✅ | ✅ | P0 | Falls back to ADP if queue empty |

---

## UI/UX

| Feature | v2 | v3 | TopDog | VX | VX2 | Priority | Notes |
|---------|:--:|:--:|:------:|:--:|:---:|:--------:|-------|
| **Desktop layout** | ✅ | ✅ | ✅ | ❌ | ❌ | P1 | Desktop support (defer) |
| **Mobile layout** | ❌ | ❌ | ❌ | ✅ | ✅ | P0 | Mobile-first design |
| **Tablet layout** | ❌ | ❌ | ❌ | ⚠️ | ✅ | P1 | Tablet support in VX2 |
| **Responsive design** | ✅ | ✅ | ✅ | ✅ | ✅ | P0 | Adapts to screen size |
| **Loading states** | ✅ | ✅ | ✅ | ✅ | ✅ | P0 | Proper loading indicators |
| **Error handling** | ✅ | ✅ | ✅ | ✅ | ✅ | P0 | Error boundaries |
| **Tutorial/onboarding** | ❌ | ❌ | ❌ | ❌ | ✅ | P2 | DraftTutorialModal |

---

## Roster View

| Feature | v2 | v3 | TopDog | VX | VX2 | Priority | Notes |
|---------|:--:|:--:|:------:|:--:|:---:|:--------:|-------|
| **My roster** | ✅ | ✅ | ✅ | ✅ | ✅ | P0 | User's team roster |
| **Other rosters** | ✅ | ✅ | ✅ | ✅ | ✅ | P1 | View other teams |
| **Position slots** | ✅ | ✅ | ✅ | ✅ | ✅ | P0 | 9 starters + 9 bench |
| **Position badges** | ✅ | ✅ | ✅ | ✅ | ✅ | P0 | Color-coded positions |
| **Player photos** | ✅ | ✅ | ✅ | ✅ | ✅ | P0 | Player headshots |
| **Team selector** | ✅ | ✅ | ✅ | ✅ | ✅ | P1 | Dropdown to view other teams |

---

## Draft History

| Feature | v2 | v3 | TopDog | VX | VX2 | Priority | Notes |
|---------|:--:|:--:|:------:|:--:|:---:|:--------:|-------|
| **Pick history** | ✅ | ✅ | ✅ | ✅ | ✅ | P0 | All picks displayed |
| **Pick ticker** | ✅ | ✅ | ✅ | ✅ | ✅ | P1 | Recent picks scroll |
| **Draft board** | ✅ | ✅ | ✅ | ✅ | ✅ | P0 | Grid view (DraftBoard) |
| **Picks bar** | ✅ | ✅ | ✅ | ✅ | ✅ | P0 | Horizontal scrolling picks |
| **Pick details** | ✅ | ✅ | ✅ | ✅ | ✅ | P1 | Player info on pick |

---

## Slow Draft

| Feature | v2 | v3 | TopDog | VX | VX2 | Priority | Notes |
|---------|:--:|:--:|:------:|:--:|:---:|:--------:|-------|
| **12-hour timer** | ✅ | ✅ | ✅ | ✅ | ✅ | P0 | Slow draft support (timer accepts any duration, supports 43,200 seconds) |
| **Quick pick** | ✅ | ✅ | ✅ | ✅ | ❌ | P1 | Fast pick option (not explicitly found, but fastMode exists for testing) |
| **Timer pause** | ✅ | ✅ | ✅ | ✅ | ✅ | P1 | Pause draft (useDraftTimer.pause, useDraftRoom.togglePause) |
| **Timer resume** | ✅ | ✅ | ✅ | ✅ | ✅ | P1 | Resume draft (useDraftTimer.resume, useDraftRoom.togglePause) |

---

## Advanced Features

| Feature | v2 | v3 | TopDog | VX | VX2 | Priority | Notes |
|---------|:--:|:--:|:------:|:--:|:---:|:--------:|-------|
| **Share draft** | ❌ | ❌ | ❌ | ❌ | ✅ | P2 | ShareOptionsModal |
| **Image export** | ❌ | ❌ | ❌ | ❌ | ✅ | P2 | Export draft board as image |
| **Virtualized list** | ❌ | ❌ | ❌ | ❌ | ✅ | P1 | Performance optimization |
| **Grace period** | ❌ | ❌ | ❌ | ❌ | ✅ | P1 | Extra time before auto-pick |
| **Dev tools** | ✅ | ✅ | ✅ | ✅ | ✅ | P2 | Development utilities |

---

## Next Steps

1. **Verify VX2 features marked with `?`** - Check codebase for:
   - ADP display
   - Bye week display
   - Jersey number
   - Custom rankings
   - 12-hour timer support
   - Quick pick
   - Timer pause/resume

2. **Document gaps** - Create `docs/VX2_GAPS.md` with:
   - P0 gaps (block migration)
   - P1 gaps (should have)
   - P2 gaps (nice to have)

3. **Prioritize** - Focus on P0 gaps first

---

**Last Updated:** January 2025  
**Next Review:** After feature verification complete
