# Cursor ↔ Claude Workflow Checklist

A simple guide to keep your codebase in sync when working across both platforms.

---

## Switching from Cursor → Claude

1. **Save all files** in Cursor
2. **Commit your changes:**
   ```bash
   git add .
   git commit -m "describe what you changed"
   ```
3. **Push to GitHub:**
   ```bash
   git push
   ```
4. ✅ Now you're safe to work with Claude

---

## Switching from Claude → Cursor

1. **Make sure Claude has committed any changes** (just ask Claude to commit and push)
2. **In Cursor's terminal, pull the changes:**
   ```bash
   git pull
   ```
3. ✅ Now Cursor has the latest code

---

## Quick Sanity Check

Before editing in either platform, run:
```bash
git status
```

- **"nothing to commit, working tree clean"** = You're synced, good to go
- **"Changes not staged for commit"** = You have uncommitted work — commit first before switching

---

## Emergency: Both Got Out of Sync

If you accidentally edited in both places:
1. Don't panic
2. Figure out which changes matter most
3. Use `git stash` to temporarily save one set of changes
4. Pull the other changes
5. Apply stashed changes back with `git stash pop`
6. Resolve any conflicts manually

---

## Pro Tips

- **Before any Claude session:** Get in the habit of running `git push` in Cursor
- **End of Claude session:** Ask Claude to commit and push before closing
- **When in doubt:** `git status` is your friend
