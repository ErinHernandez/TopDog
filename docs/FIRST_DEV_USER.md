# First Dev User

A normal user account used as the primary dev seed. **TopDog does not treat this as a dev account** — no special login bypass, no synthetic balance, no `dev-user-t`-style handling. It behaves like any other user.

## Credentials

| Field    | Value                 |
|----------|------------------------|
| Email    | `teddygurskis@gmail.com` |
| Password | `pP_20047913`         |
| Username | `OcularPatDowns` (stored as `ocularpatdowns`) |

## Creating the user

Run once against your dev Firebase project (or emulators) to create the user in Auth and Firestore:

```bash
node scripts/create-first-dev-user.js
```

Requires `.env.local` (or env) with:

- `FIREBASE_SERVICE_ACCOUNT` (JSON string)
- `NEXT_PUBLIC_FIREBASE_*` (for Firestore client)

## Behavior in the app

- Login uses normal Firebase Auth (email/password). There is no special case for this email or username in `AuthContext` or elsewhere.
- Balance and profile come from Firestore like any other user; `useUser` does not give this user a synthetic balance (unlike the `dev-user-t` / `t`/`t` dev login).

The only “dev” aspect is that this account is intended for local/dev use and is created by a script rather than the signup flow.
