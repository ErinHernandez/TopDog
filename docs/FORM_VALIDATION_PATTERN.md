# Form validation: show inline errors only after blur

**Use this pattern site-wide** whenever a form shows an inline error (red message under a field) for validation (e.g. “Please enter a valid email”, “Password is required”).

## Rule

- **Show the inline error only after the user leaves the field (blur / “click out”).**
- **Hide the inline error while the field is focused**, even if it was previously blurred and invalid.

Do not show the message on every keystroke or on submit before the user has left the field.

## Implementation

1. **Touched** – Set “touched” only in the field’s `onBlur`. Do not set touched in submit handlers (submit can still show a banner/toast and focus the field).
2. **Focused** – Track focus (e.g. `emailFocused`) and set it in `onFocus` / `onBlur`.
3. **Error passed to the control** – Pass `error={fieldFocused ? null : derivedError}` so the inline error is hidden while the field is focused. `derivedError` is your normal rule (e.g. `touched && value && !isValid ? 'Please enter a valid email' : null`).
4. **Input component** – The shared `Input` (or equivalent) must support optional `onFocus` and `onBlur` and receive the computed `error` from the parent.

## Example (conceptual)

```ts
const [emailTouched, setEmailTouched] = useState(false);
const [emailFocused, setEmailFocused] = useState(false);

const showEmailError = emailTouched && email && !isValidEmail;
const errorToShow = emailFocused ? null : (showEmailError ? 'Please enter a valid email' : null);

<Input
  value={email}
  onChange={setEmail}
  onBlur={() => { setEmailTouched(true); setEmailFocused(false); }}
  onFocus={() => setEmailFocused(true)}
  error={errorToShow}
  touched={emailTouched}
/>
```

## Where it’s used

- **SignInModal** – identifier and password
- **SignUpModal** – email (CredentialsStep)
- **SignUpScreenVX2** – email (CredentialsStep)
- **ForgotPasswordModal** – email/phone in InputStep

Use the same logic in any new form that shows per-field validation messages.
