# Login Sandbox

Isolated test area for the VX2 login system. Use it to develop or QA auth flows without touching the main app.

## Usage

**From a page (recommended):**

```tsx
import { LoginSandbox } from '../../sandbox/login';

export default function LoginSandboxPage() {
  return <LoginSandbox defaultMode="modals" label="Login Sandbox" />;
}
```

Access at: **/testing-grounds/login-sandbox**

## Modes

- **Modals** – Sign In, Sign Up, Forgot Password, and Profile Settings as overlays. Use the dev panel to open each modal inside the phone frame.
- **Screens** – Full-screen `LoginScreenVX2` and `SignUpScreenVX2` (gate-style). Toggle between Login and Sign Up from the dev panel.

## Props

| Prop           | Type                 | Default    | Description                                      |
|----------------|----------------------|------------|--------------------------------------------------|
| `defaultMode`  | `'modals' \| 'screens'` | `'modals'` | Initial mode (modals vs full-screen flows).      |
| `label`        | `string`             | `'Login Sandbox'` | Label shown under the phone frame.           |

## Requirements

- Firebase must be configured (e.g. `.env.local`).
- Auth rules: password 8+ chars with upper, lower, number; username 3–18 chars, starts with letter.

## Files

- `LoginSandbox.tsx` – main component (includes `AuthProvider`).
- `index.ts` – exports.
- `README.md` – this file.
