# MockDraftable Scraper on Fly.io

Scraper source lives at **scraper 3** (not `scraper` or `scraper 2`).

## Directory

```bash
cd ~/Downloads/scraper\ 3/mockdraftable
# or
cd "/Users/td.d/Downloads/scraper 3/mockdraftable"
```

## Fly.io commands (run from scraper 3/mockdraftable)

**One-time setup** (app and volume may already exist):

```bash
fly apps create mockdraftable-scraper
fly volumes create scraper_data --size 3 --app mockdraftable-scraper --region ord -y
```

**Deploy** (after code changes):

```bash
fly deploy --app mockdraftable-scraper
```

**Run the scraper** (ensure at least one machine is running first):

```bash
fly scale count 1 --app mockdraftable-scraper
fly ssh console --app mockdraftable-scraper --command "python run_scraper.py"
```

## Note

- Always use **scraper 3**; do not use `scraper` or `scraper 2`.
- `fly.toml` uses `[[restart]] policy = "never"` (array form). If you replace it from a zip, fix any `[restart] policy = "no"` to that format.
