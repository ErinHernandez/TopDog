# Draft alerts – when we ask

**Do not ask for notification permission or “receive alerts?” on app open or sign up.**  
That feels product-y immediately. We only ask in one place:

## When we ask

**When the user leaves their first draft room.**  
The first time they try to leave any draft room (top bar or “Exit Draft” link), we show a modal:

- **Title:** “Get alerts when you leave?”
- **Body:** “Do you want to receive draft alerts when you're not on this screen?”
- **Options:**
  - “When I'm elsewhere in the app (other tabs, My Teams, etc.)”
  - “When I leave the app or switch browser tabs”
- **Actions:** “Enable” (saves preferences, requests permission if “outside app” chosen) or “No thanks”

After they answer, we mark the prompt as seen (`topdog_draft_alerts_prompt_seen`) and show the normal leave-confirmation modal. We never show this prompt again.

## Defaults

- **Draft alerts default to OFF.** New users and missing preferences use `DEFAULT_ALERT_PREFERENCES` with all values `false` (`lib/draftAlerts/constants.ts`).
- Profile Settings → Preferences still lets them toggle individual alerts at any time.

## Implementation

- **First-time prompt:** `NavigateAwayAlertsPromptModal` in the draft room; shown when leave is requested and `topdog_draft_alerts_prompt_seen` is not set.
- **Defaults:** `lib/draftAlerts/constants.ts`, ProfileSettingsModal initial state, and useDraftAlerts all use off-by-default.
- **No prompt on open/sign up:** We do not call `Notification.requestPermission` or show any alert-opt-in UI on app load or after sign up. The only in-context ask is the “navigate away” modal above.
