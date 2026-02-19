# VX2 Colors & Tokens – Deep Dive

**TL;DR:** Prefer **CSS custom properties** (`var(--...)`) in styles and **theme constants** from `components/vx2/core/constants/colors.ts` in JS/TS. Avoid hardcoded hex/rgba in vx2.

---

## Current State

- **Global tokens:** `styles/tokens.css` and `styles/variables/colors.css` define a large set of CSS custom properties (`--text-primary`, `--color-state-error`, `--bg-primary`, etc.).
- **VX2 constants:** `components/vx2/core/constants/colors.ts` defines the same palette as JS constants (e.g. `STATE_COLORS`, `TEXT_COLORS`, `BG_COLORS`).
- **Problem:** Many vx2 components still use **hardcoded** colors:
  - In **CSS modules:** `#EF4444`, `#1e40af`, `rgba(255, 255, 255, 0.08)` instead of `var(--color-state-error)` or semantic tokens.
  - In **TS/TSX:** Theme objects (e.g. modals, draft footer, player list) with literal hex/rgba; inline `color="#fff"`, `stroke="#10b981"`; and local constants like `DEFAULT_BACKGROUND_COLOR = '#1e40af'`.

This leads to inconsistency, harder theming, and duplicate values that can drift.

---

## Better Approach

### 1. In CSS (modules and global)

Use **CSS custom properties** only. No raw hex/rgba in vx2 CSS.

| Use case | Use this token | Avoid |
|----------|----------------|--------|
| Error text / destructive actions | `var(--color-state-error)` | `#EF4444`, `#ef4444` |
| Success / positive | `var(--color-state-success)` | `#10b981`, `#10B981` |
| Warning | `var(--color-state-warning)` | `#F59E0B`, `#f97316` |
| Primary text | `var(--text-primary)` | `#FFFFFF`, `#fff` |
| Secondary text | `var(--text-secondary)` | `#9CA3AF`, `#94A3B8` |
| Muted / placeholder | `var(--text-muted)` | `#6B7280` |
| Disabled text | `var(--text-disabled)` | `#4b5563` |
| Page/surface background | `var(--bg-primary)` | `#101927` |
| Card / panel background | `var(--bg-secondary)`, `var(--bg-card)` | `#1f2937`, `#1f2833` |
| Elevated surface | `var(--bg-elevated)` | `rgba(255, 255, 255, 0.08)` |
| Default border | `var(--border-default)` | `rgba(255, 255, 255, 0.1)` |
| Focus border | `var(--border-focus)` | `rgba(96, 165, 250, 0.5)` |
| Blue accent / active | `var(--color-state-active)` | `#60A5FA`, `#3B82F6` |
| Join / CTA button (lobby) | `var(--blue-600)` or semantic token | `#1e40af` |
| Modal backdrop | `var(--modal-backdrop)` | `rgba(0, 0, 0, 0.7)` |
| Font sizes | `var(--font-size-sm)`, `var(--font-size-base)` | `14px`, `16px` |

Full list of tokens: see `styles/tokens.css` and `styles/variables/colors.css`.

**Token reference (recent additions):**

| Token | Use |
|-------|-----|
| `--bg-color-success` | Success tint (e.g. trusted badge, location) |
| `--bg-color-warning` | Warning tint (e.g. security banner) |
| `--status-bar-icon-inactive` | Status bar inactive signal bars |
| `--shadow-card` | Card elevation (e.g. PlayerStatsCard) |
| `--shadow-modal` | Modal box-shadow color |
| `--paymongo-icon-bg` / `--paymongo-icon-text` | PayMongo deposit method icon (set from theme in TSX) |
| `POSITION_BADGE_THEME` (TS) | Per-position text/accent for badge contrast; use with `getPositionColor()` for full style (e.g. MyTeamsTabVX2) |

### 2. In TypeScript / TSX (theme objects, inline styles, canvas, third‑party)

Use **constants from** `components/vx2/core/constants/colors.ts`. Do not define new hex/rgba in the component.

- **Semantic groups:** `STATE_COLORS`, `TEXT_COLORS`, `BG_COLORS`, `BORDER_COLORS`, `UI_COLORS`, `TAB_BAR_COLORS`, etc.
- **Theme palettes:** Use shared theme objects for modals/draft UI so one place defines colors:
  - **Leave/exit modal:** `MODAL_THEME_LEAVE_CONFIRM` (backdrop, background, title, description, buttons, warning icon).
  - Add more `MODAL_THEME_*` or `DRAFT_THEME_*` in `colors.ts` as you migrate other modals/draft components.

Example (before → after):

```ts
// Before: hardcoded in component
const MODAL_COLORS = {
  backdrop: 'rgba(0, 0, 0, 0.7)',
  background: '#1E293B',
  title: '#FFFFFF',
  primaryButton: '#EF4444',
  // ...
};

// After: import from core constants
import { MODAL_THEME_LEAVE_CONFIRM } from '../../core/constants/colors';
// Use MODAL_THEME_LEAVE_CONFIRM.backdrop, .background, .title, etc.
```

For **inline props** (e.g. `<Close color="..." />`, `stroke="#fff"`), use the same constants:

```ts
import { TEXT_COLORS, STATE_COLORS } from '@/components/vx2/core/constants/colors';

<Close size={24} color={TEXT_COLORS.primary} />
<path stroke={STATE_COLORS.success} ... />
```

### 3. Single source of truth

- **CSS:** Values live in `styles/tokens.css` / `styles/variables/colors.css`. VX2 CSS should only reference `var(--...)`.
- **JS/TS:** Values live in `components/vx2/core/constants/colors.ts`. Theme objects and inline color props should import from there.
- Keep **tokens.css** and **colors.ts** in sync (same hex/rgba for the same semantics). When adding a new semantic color, add it to both places (or document the mapping).

---

## Migration Checklist (per component)

1. **CSS module:** Replace every raw color with the appropriate `var(--...)` from the table above or from `tokens.css`.
2. **TS/TSX:** Replace local color objects and literal hex/rgba with imports from `colors.ts` (e.g. `STATE_COLORS`, `MODAL_THEME_LEAVE_CONFIRM`).
3. **Inline SVG / icon color:** Use `TEXT_COLORS.*` or `STATE_COLORS.*` instead of `"#fff"`, `"#10b981"`, etc.
4. **New theme objects:** If a modal or draft UI needs its own palette, add a `*_THEME_*` constant in `colors.ts` that composes existing constants (and add any missing primitives to `UI_COLORS` or similar), then use that constant in the component.

---

## Examples Already Migrated

- **LeaveConfirmModal:** Uses `MODAL_THEME_LEAVE_CONFIRM` from `colors.ts` instead of local `MODAL_COLORS`.
- **NavigateAwayAlertsPromptModal:** Uses `MODAL_THEME_NAVIGATE_AWAY_ALERTS` and passes theme via `cssVars()`.
- **DraftFooter:** Removed local `FOOTER_COLORS`; colors come from global tokens (`--footer-*` in tokens.css).
- **DraftBoard:** Uses `DRAFT_BOARD_THEME` for user border color (urgent vs normal).
- **PlayerList / VirtualizedPlayerList:** Removed local `PLAYER_LIST_COLORS`; CSS uses global `--search-bg`, `--row-bg`.
- **TournamentJoinButton / TournamentProgressBar:** Use `LOBBY_THEME.joinButtonBg` and `LOBBY_THEME.progressBarFill`.
- **MobilePhoneFrame:** Uses `BG_COLORS.primary` for inner background.
- **StripeProvider:** `VX2_STRIPE_APPEARANCE` uses `STATE_COLORS`, `TEXT_COLORS`, `BG_COLORS`, `BORDER_COLORS` from `colors.ts`.
- **PicksBar:** Uses `PICKS_BAR_THEME` for card state colors and header text; removed local `CARD_COLORS` and `PICKS_BAR_PX` color fields.
- **QueueView / RosterView:** Removed local `QUEUE_COLORS`; CSS uses global tokens. RosterView Share icon uses `TEXT_COLORS.primary` (local `ROSTER_COLORS` still used for inline styles; can be migrated to a theme from colors.ts later).
- **PlayerExpandedCard:** Uses `TEXT_COLORS`, `BG_COLORS`, `STATE_COLORS`, `UI_COLORS` via `EXPANDED_CARD_COLORS`. **DraftBoard** / **VirtualizedPlayerList:** Share icon and queue-button SVG use `TEXT_COLORS.primary`.
- **draft-room/constants:** `TILED_BG_STYLE` / `TILED_BG_CSS` use `UI_COLORS.tiledBg`.
- **useImageShare:** `BRANDING.headerBgColor` uses `UI_COLORS.tiledBg`; logo fallback text uses `TEXT_COLORS.primary`; html2canvas `backgroundColor` uses `BG_COLORS.primary`.
- **PicksBarCard:** Uses `UI_COLORS.gray700`; removed local `COLORS`.
- **LobbyTabVX2 / TournamentCardV3 / TournamentCardV2:** Card visuals use `LOBBY_THEME` (cardBgFallback, cardBorderDefault, cardBorderFeatured, progressBg, cardTextPrimary, cardTextSecondary).
- **JoinTournamentModal:** `BOTTOM_SECTION_COLORS` uses `LOBBY_THEME.cardTextPrimary`, `cardTextSecondary`, `BG_COLORS.black`; Plus icons use `TEXT_COLORS.primary`; ProgressBar uses `LOBBY_THEME.progressBg`.
- **TournamentCard:** `CARD_COLORS` uses `LOBBY_THEME.cardBgFallback`, `progressBg`.
- **TournamentCardBottomSectionV2 / TournamentCardBottomSectionV3:** `COLORS` uses `LOBBY_THEME.cardTextPrimary`, `cardTextSecondary`, `progressBg`, `BG_COLORS.black`.
- **constants/cardSpacingV3:** `borderColor` and `progressBackgroundColor` use `UI_COLORS.tiledBg`, `LOBBY_THEME.progressBg`.
- **Auth modals:** ForgotPasswordModal, SignInModal, SignUpModal, LoginScreenVX2, PhoneAuthModal use `TEXT_COLORS.primary`, `STATE_COLORS.success`, `UI_COLORS.modalCloseIcon`, `BG_COLORS.black` for inline SVG/icon colors instead of `#fff`, `#000`, `#10b981`, `rgba(255,255,255,0.5)`.
- **DynamicIslandSandbox:** Island background uses `UI_COLORS.tiledBg`, urgency colors use `STATE_COLORS.error` / `STATE_COLORS.warning`, `BG_COLORS.black`.
- **ProfileTabVX2:** `PROFILE_COLORS` uses `UI_COLORS.gray500`, `gray600`, `TEXT_COLORS.primary`; CSS uses `var(--text-primary)`, `var(--black-text)`, `var(--border-default)`, `var(--color-dropdown-hover)`.
- **MyTeamsTabVX2:** Position row styling uses `getPositionStyle()` (bg from `getPositionColor`, text/accent from `POSITION_BADGE_THEME`); Check/Save icons use `TEXT_COLORS.primary` / `TEXT_COLORS.secondary`; inline SVG stroke uses `TEXT_COLORS.muted`.
- **LobbyTabSandboxContent.module.css:** Error/empty/loading text and background use `var(--color-state-error)`, `var(--text-secondary)`, `var(--text-muted)`, `var(--bg-elevated)`, `var(--font-size-sm)`.
- **iPhoneStatusBar.module.css:** Time, signal bars, and battery level use `var(--text-primary)` and `var(--status-bar-icon-inactive, rgba(255, 255, 255, 0.3))` instead of `#FFFFFF` / `rgba(255, 255, 255, 0.3)`.
- **PaystackWithdrawModalVX2:** Verification and error step SVGs use `STATE_COLORS.active` and `STATE_COLORS.error` from `colors.ts` instead of inline `#60a5fa` / `#ef4444`.
- **Location:** `LocationSettingsSection.module.css`, `LocationConsentModal.module.css`, `LocationSecurityBanner.module.css` use `var(--text-primary)`, `var(--overlay-dark)`, `var(--bg-color-blue)`, `var(--bg-color-red)`, `var(--bg-color-success)`, `var(--bg-color-warning)` for backdrop, icon containers, and buttons.
- **PlayerStatsCard:** Uses `PLAYER_STATS_THEME` from `colors.ts` (headerLabel, lineColor, draftButtonActive/Inactive); CSS uses `var(--text-primary)` and `var(--shadow-card)`.
- **PayMongoDepositModalVX2:** GCash/Maya/GrabPay icons use `PAYMONGO_DEPOSIT_THEME`; colors are set via `--paymongo-icon-bg` / `--paymongo-icon-text` in the component and consumed by `.paymentMethodIconBox` in the CSS module.
- **LiveDraftsTabVX2:** Progress bar “your turn” color uses `TEXT_COLORS.primary` from `colors.ts`.
- **ConnectOnboardingModalVX2:** CSS module uses tokens only: `--modal-backdrop`, `--modal-bg`, `--border-default`, `--text-primary` / `--text-secondary` / `--text-muted`, `--color-state-hover`, `--bg-color-success`, `--color-stat-bg`, `--color-state-success`, `--error-bg`, `--color-state-error`, `--black-text`, `--status-bar-icon-inactive` for spinner.

---

## Files to Migrate (high impact)

Components with many hardcoded colors that would benefit from the same pattern:

- Auth: `ForgotPasswordModal`, `SignInModal`, `SignUpModal`, `LoginScreenVX2`, `EnableBiometricsPrompt`, `PhoneAuthModal`, `DeleteAccountModal`
- Draft room: `NavigateAwayAlertsPromptModal`, `DraftFooter`, `DraftBoard`, `PlayerList`, `VirtualizedPlayerList`, `PicksBar`, `QueueView`, `RosterView`, `PlayerExpandedCard`, `useImageShare`
- Lobby: `TournamentJoinButton`, `TournamentProgressBar`, `TournamentCard*`, `JoinTournamentModal`, `LobbyTabVX2`
- Shell: `MobilePhoneFrame`, `AppHeaderVX2`
- Tabs: `TabBarVX2`, `MyTeamsTabVX2`, `ProfileTabVX2`, `LiveDraftsTabVX2`
- Modals: remaining payment modal CSS fallbacks (e.g. PayMongoDepositModalVX2 hex fallbacks)
- Other: `DynamicIslandSandbox`, `StripeProvider`

Prefer doing one component (or one modal + one CSS file) at a time and testing before moving to the next.
