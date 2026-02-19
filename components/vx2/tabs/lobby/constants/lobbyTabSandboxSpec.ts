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
  /** Top inset for lobby content; frame already reserves island space, so keep minimal to move content up */
  safe_area_top_px: 0,
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

/**
 * Props for LobbyTabSandboxContent that match the current lobby sandbox iteration.
 * Use this in LobbyTabVX2 when in phone frame so the app lobby matches the sandbox.
 */
export const LOBBY_TAB_CURRENT_ITERATION = {
  contentScaleOverride: 1 as const,
  scrollable: false as const,
  outlineOverrides: {
    on: LOBBY_TAB_SANDBOX_SPEC.outline.enabled,
    thickness: LOBBY_TAB_SANDBOX_SPEC.outline.thickness_px,
    inset: LOBBY_TAB_SANDBOX_SPEC.outline.inset_px,
    radius: LOBBY_TAB_SANDBOX_SPEC.outline.radius_px,
  },
  globeSizePx: LOBBY_TAB_SANDBOX_SPEC.lobby.globe_size_px,
} as const;
