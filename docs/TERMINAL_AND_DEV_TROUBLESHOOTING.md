# Terminal & Dev Environment Troubleshooting

This doc covers **systemic** issues we've seen with terminals, `npm run dev`, and the Next.js dev server. Use it when you hit recurring failures (ENOENT manifests, Babel module not found, webpack cache errors, paste garbage in terminal).

---

## 1. Dev server / Next.js failures

### Symptoms
- `ENOENT: no such file or directory` for `.next/dev/fallback-build-manifest.json`, `prerender-manifest.json`, or webpack `*.pack.gz`
- `[BABEL]: Cannot find module 'debug'` or `Cannot find module 'babel-plugin-polyfill-corejs3'`
- `Caching failed for pack` / `rename '.../1.pack.gz_' -> '.../1.pack.gz'` errors
- Port 3000 in use, or Next bound to 3002 instead

### Root causes
- **Manifest chicken‑and‑egg**: Next 16 expects manifest files to exist before webpack compiles, but normally creates them during compile. We use `scripts/ensure-manifests.js` to bootstrap them.
- **Multiple dev servers**: Several `next dev` or `npm run dev` instances (e.g. one on 3000, one on 3002) both writing to `.next` → cache corruption and ENOENT.
- **Kill -9 on previous dev**: Force‑killing the dev server can leave `.next` (especially cache) in a bad state.
- **Missing Babel deps**: `@babel/preset-env` can pull in `babel-plugin-polyfill-corejs3`; `debug` is used by Babel core. Both must be resolvable.

### Fixes (in order)

1. **Use the dev script (always)**  
   Run `npm run dev`, not `next dev` directly. The script runs `kill-port` → `ensure-manifests` → `next dev` and fixes port/manifest issues.

2. **Clean slate when things are broken**  
   ```bash
   npm run dev:clean
   ```  
   This runs `kill-port` → `rimraf .next node_modules/.cache .turbo` → `ensure-manifests` → `next dev`. Use when you see repeated ENOENT or webpack cache errors.

3. **Ensure Babel deps are installed**  
   ```bash
   npm install
   ```  
   We rely on `debug` (dependencies) and `babel-plugin-polyfill-corejs3` (devDependencies). If you still see “Cannot find module” for these, try:
   ```bash
   rm -rf node_modules package-lock.json && npm install
   ```

4. **Only one dev server**  
   Avoid running `npm run dev` in multiple terminals. `kill-port` runs at the start of `npm run dev` and will stop existing `next dev` processes (including those on other ports). If you use `next dev` manually, stop it before starting `npm run dev`.

5. **Optional: verify Babel-related modules**  
   From the project root, run `node -e "require('debug'); require('babel-plugin-polyfill-corejs3');"`. If either fails, run `npm install` (or `rm -rf node_modules package-lock.json && npm install`).

---

## 2. Terminal paste / Cursor integrated terminal

### Symptoms
- Commands like `^[[200~rm -rf .next   npm run dev^[[201~` or `zZ_20047913` appear and fail (“command not found”).
- Multi‑line blocks (e.g. from docs) get pasted as a **single line** and run as one mangled command.

### Root causes
- **Bracketed paste**: Terminals send `\e[200~` (start) and `\e[201~` (end) around pasted text. Sometimes these escape sequences are treated as part of the command (e.g. Cursor/VS Code integrated terminal).
- **Multi‑line paste**: Some environments collapse pasted newlines into spaces, turning multiple commands into one.

### Fixes
- Prefer **pasting into a single line** or **one command at a time** when copying from docs.
- If you see `^[[200~` / `^[[201~` in the buffer, delete that line and re‑paste, or type the command manually.
- Run `npm run dev` and other project commands from the **project root**.

---

## 3. VS Code / Cursor terminal launch failures

If the **integrated terminal fails to open at all** (e.g. “The terminal process failed to launch”), that’s an editor/shell configuration issue, not this project. See [Troubleshoot Terminal launch failures](https://code.visualstudio.com/docs/supporting/troubleshoot-terminal-launch) and check:

- `terminal.integrated.defaultProfile` / `terminal.integrated.profiles`
- Shell path and args
- Anti‑virus or security tools blocking the terminal process

---

## 4. Scripts reference

| Script | Purpose |
|--------|---------|
| `npm run dev` | Kill port 3000 + any `next dev` → ensure manifests → start Next dev on 3000 |
| `npm run dev:clean` | Same, but first remove `.next`, `node_modules/.cache`, `.turbo` (via rimraf) for a clean slate |
| `scripts/kill-port-3000.js` | Kill processes on 3000 and `pkill -f "next dev"` |
| `scripts/ensure-manifests.js` | Create `.next/dev` manifest and cache dirs before `next dev` |

---

## 5. Caveats

- **`pkill -f "next dev"`**: Kill-port stops *any* process whose command line contains `next dev`. If you run multiple Next.js projects (e.g. another app in a different folder), `npm run dev` here will also stop those. Use a single dev server per project when possible.
- **`dev:clean`**: Uses `npx rimraf` for removal, so it works on macOS, Linux, and Windows. If `npx rimraf` fails, run `npm install` and retry.

---

## 6. Related docs

- **`DEV_SERVER_FIX_HANDOFF.md`** (project root) – Original Next 16 manifest/webpack fix and “production build first” flow.
- [VS Code – Troubleshoot Terminal launch failures](https://code.visualstudio.com/docs/supporting/troubleshoot-terminal-launch)
