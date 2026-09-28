# @df2md/cms — Sanity Studio

Project `rthdhol7`, datasets `production` / `staging`. Dev: `bun dev:studio` → http://localhost:3333.
Override the target with `SANITY_STUDIO_PROJECT_ID` / `SANITY_STUDIO_DATASET`.

```
schemaTypes/
  documents/   product, category, brand, page, homePage (singleton), siteSettings (singleton)
  objects/     link, meta, section-padding, block-content, simple-content, table, variant,
               image + legacy field helpers
  blocks/      page-builder blocks, grouped hero / content / shop / contact (+ index.ts → blocksField)
structure.ts   desk: Home page, Pages (orderable), Products (featured / by category / by brand),
               Category tree, Brands, Site settings
```

- Native Portable Text tables are enabled globally in `sanity.config.ts` (`table` → `rows[]` → `cells[]` → `value[]`, `headerRows`).
- Imported documents carry `legacy.wpId` (products/pages), `legacy.termId` (categories) or `legacy.acfValue` (brands); the import looks documents up by these, never by `_id`.
- Variant `_key`s are `v<wpVariationId>`. `variant.stripe` is read-only and written by `scripts/import` (Stripe sync).
- Block insert-menu thumbnails go in `static/images/preview/<block-type>.jpg`.
- `bun typegen` extracts the schema and writes `apps/web/sanity.types.ts`.
