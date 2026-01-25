/**
 * Lobby Tab Sandbox spec – single source of truth for phone frame, content area,
 * outline, and lobby layout. Use this in lobby-tab-sandbox and LobbyTabVX2
 * (phone-frame layout) for px-per-px consistency.
 *
 * Handoff: lobby_tab_sandbox_current_iteration
 */

export const LOBBY_TAB_SANDBOX_SPEC = {
  handoff: 'lobby_tab_sandbox_current_iteration',
  phone_frame: {
    width_px: 375,
    height_px: 812,
  },
  content_area_above_tab_bar: {
    width_px: 375,
    height_px: 731,
  },
  tab_bar_height_px: 81,
  safe_area_top_px: 14,
  content_scale: 0.92,
  outline: {
    enabled: true,
    inset_px: 24,
    thickness_px: 8,
    radius_px: 8,
  },
  lobby: {
    outer_padding_px: 21,
    bottom_row_gap_px: 16,
    globe_size_px: 276,
  },
} as const;

export type LobbyTabSandboxSpec = typeof LOBBY_TAB_SANDBOX_SPEC;
