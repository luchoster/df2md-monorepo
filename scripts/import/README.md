# @df2md/import — WordPress → Sanity

Implements REBUILD-PLAN §3. Every step writes to `out/` (git-ignored) so each can be inspected and re-run alone.

```sh
# one-time: unpack the referenced media next to the scripts
mkdir -p uploads && tar xzf ../../../backups/restore-clean-2026-09-19.tgz -C uploads --strip-components=3 wp-api/wp-content/uploads

bun run extract     # dump → out/wp.json + out/customers.json    (no MySQL/Docker needed)
bun run transform   # wp.json → out/documents.json + out/warnings.json   (offline)
bun run validate    # dry-run load + `sanity documents validate` against the Studio schema (needs `sanity login`)
bun run load        # → SANITY_DATASET (default staging); add --production for the live dataset
bun run verify      # GROQ counts, dangling refs, 20 sampled products diffed against wp.json
```

| Step | Notes |
|---|---|
| `01-extract` | Streams `backup-2026-09-19-db.sql.gz` directly (`--dump <path>` or `WP_DUMP`). Column names come from the dump's `CREATE TABLE`; MySQL escapes are decoded properly (the old `parse_dump.py` turned `\r\n` into `rn`). Fails if counts drift from the inventory (`--allow-drift` to override, `--include-drafts` to add the 535 drafts). |
| `02-transform` | HTML → Portable Text through `@portabletext/block-tools`, validated against the Studio's own `block-content` type. WPBakery shortcodes expanded (`vc_custom_heading`, `vc_btn`, `vc_single_image`, `vc_raw_html`) or stripped; `wpautop` applied; `<table>` → native `table` blocks with `headerRows`. References are `legacy:<type>:<key>` placeholders, images `_wpImage` placeholders. |
| `03-load` | Resolves legacy keys to existing `_id`s (`legacy.wpId` / `termId` / `acfValue`), new documents get random ids. Uploads images from `uploads/` (cache: `out/assets.json`); brand-site hotlinks are fetched from their URL, `--fetch-remote` does the same for WP images missing locally. Keeps `variants[].stripe` already written by the Stripe sync. 50 mutations per transaction. |
| `04-verify` | Exit 1 on any mismatch. |

## Findings from the dump (vs. the plan's inventory)

- **Variants: 1,127, not 1,845.** 1,845 is every published variation, but 718 of them hang off draft/pending/private products. The 690 published products own 1,127; one unpriced "any size" variant is dropped → 1,126 in Sanity.
- **Brands: 84.** 81 ACF choices + 3 brands used on products but missing from the choices (ZiwiPeak, Kitty Corner, Holistic Hound). "Stella and Chewy" is aliased to "Stella and Chewy's".
- 19 products have a `_default_attributes` size that no longer exists → first variant is the default.
- 411 nutrition/feeding tables converted; 22 images are hotlinked from brand websites.
- The FAQ page is one long bold-question/answer text; it imports as rich content and is a good candidate to rebuild as a `faq-list` block in Studio.
- The contact page's `<form>` is dropped (the new site uses the `contact-map` / `zip-check` blocks).
