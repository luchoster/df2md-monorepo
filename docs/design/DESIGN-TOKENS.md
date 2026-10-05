# dogfood2mydoor.com: design tokens and visual reference

Extracted 2026-09-28 from the live site (CRA SPA on Netlify). Sources:
- `/static/css/main.4c77853a.chunk.css` and its **source map**, which ships the original SCSS (`_variables.scss`, `components/*.scss`, `containers/*.scss`)
- `/static/css/2.ee431c97.chunk.css` (vendor CSS: react-dates, MUI and similar)
- `main.6e447613.chunk.js` and its source map (original React sources)
- Playwright `getComputedStyle` at 1200 px and 576 px

Raw material is in the scratchpad `site/` dir (`src-css/`, `src-js/`, `styles.json`).

> **Important: the live site is in maintenance mode.** `routes.js` in the shipped bundle reads:
> `// MAINTENANCE: every path renders the home page while the backend is down.`
> The only route is `{ path: '/', component: Home }` with no `exact`, so `/shop`, `/about`, `/faq` and every other path render the same maintenance home page. I verified this: the screenshots of `/`, `/shop` and `/about` are byte-identical. The header nav, search, account and cart were also removed. The WordPress API (`public.dogfood2mydoor.com/wp-json`) and the Node API (`private.dogfood2mydoor.com`) could not be reached (the egress proxy returned 403), and the code comment says they are down anyway. As a result, **the shop, category, product, about, contact and FAQ pages, the hero slides, the menus and the product data cannot be rendered or captured.** The styling for those pages still ships in the CSS, and it is documented below from the SCSS source. That part is unverified visually.
>
> The original route table, commented out in `routes.js`: `/` (exact), `/subscriptions`, `/subscriptions/:subscription_id`, `/shop`, `/reviews`, `/shop/category/:category`, `/shop/:slug` (product), `/:slug` (WordPress page: about, contact, faq and so on). Main menu = WP menu id `15`.

Stack of the old site: Bootstrap 4.4 (stock variables, not customised), material-ui v0 (`muiTheme`), react-slick, react-headroom, font-awesome 4.7, animate.css, Snipcart v2.

---

## 1. Color palette

### 1a. Colors seen in the live render (computed)

| Hex | Where (computed) |
|---|---|
| `#00AD4C` | Header bar background (`.header`), `.btn-primary` bg and border, mobile topbar bg, Snipcart header |
| `#FFFFFF` | Page background, top contact bar bg, header text, logo (white PNG), newsletter h1/h3/links |
| `#005870` | Maintenance `h1` ("We'll be right back") |
| `#616161` | Body text (`body { color }`) |
| `#212121` | Headings h1 to h6 (e.g. footer "Contact" h2) |
| `#000000` | Links in the top contact bar (`.header--top a`) |
| `#00ACD2` | Default link color (`body a`), used by the footer phone and email links. **Not in the planned tokens** |
| `#0056B3` | Link hover (Bootstrap default `a:hover`, underlined). Header links hover to `#FFD300` instead |
| `#0099CF` | Newsletter/contact band: dominant color of `section_bg.png` (with a `#0092C7` badge watermark). **Not in the planned tokens** |
| `#F5F5F5` | Footer background |
| `#EEEEEE` | Copyright strip background |
| `#BDBDBD` | Copyright text |
| `#E6E6E6` | Divider graphic line and badge (`divider-badge.png`) |

### 1b. Colors defined in SCSS or used by the (currently hidden) shop UI

| Hex | SCSS name / usage |
|---|---|
| `#00AD4C` | `$main_green` / palette `primary`: header, primary buttons, qty input border |
| `#3DB659` | `$tertiary_green` / `secondary_green`; MUI `accent1Color` |
| `#A4CC4A` | palette `lightGreen` (defined, not referenced in the compiled CSS) |
| `#006D1F` | `.home-notice .btn-primary` (dark green, uppercase) |
| `#33DC75` | header "order" button bg (`.order-btn`) |
| `#85DCA9` | mobile topbar hamburger icon color |
| `#005870` | `$main_blue`: `.btn-secondary` bg, active pagination/link bg (`.active a`), product-card title hover, "my account" links; MUI `primary2Color` |
| `#0886C4` | `$secondary_blue`: `.btn-secondary` border, `.active a` border, `.home-notice` band bg, quick-order dialog title bg, slider dots, Snipcart buttons |
| `#0C212D` | `$dark_blue`: checkout info panel bg, quick-order totals box |
| `#00778D` | palette `teal` (defined, not used) |
| `#F7911E` | `$main_orange`: active slider dot, Snipcart header total bg; MUI `primary3Color` |
| `#FFD300` | `$main_yellow`: header and nav link **hover** color |
| `#FDE9A4` | palette `yellow` (defined, not used) |
| `#FF1617` | sale/discount amount inside `.your-price span` |
| `#F6B61D` | Snipcart "remove item" |
| `#50BCD0` | Snipcart next/finalize buttons and actions bar bottom border |
| `#111111` | desktop category nav bar (`.main-nav`) bg |
| `#333333` | palette `bg-alt`; Snipcart link text |
| `#3A3A3A` | palette invert bg |
| `#474747` | Snipcart user header bg |
| `#82999D` | Snipcart current-user panel |
| `#337AB7` / `#DDD` | pagination link text / border |
| `#EEE` | product tab bottom border, Snipcart step bg |
| `rgba(0,0,0,.125)` | palette `border` |
| `rgba(0,0,0,.05)` | palette `border-bg` |
| `rgba(255,255,255,.75)` | hero text box background (`.hero-text-bg`) |
| `rgba(96,80,76,.5)` → `.9` on hover | best-seller slider arrow buttons |
| `rgba(227,227,227,.5)` | order list background |
| `rgb(0,109,240)` | info tooltip |

### 1c. Planned tokens compared with the site

| Planned token | Site value | Status |
|---|---|---|
| brand `#00AD4C` | `$main_green` `#00AD4C` (computed `rgb(0,173,76)`) | ✅ match |
| brand-light `#3db659` | `$tertiary_green` | ✅ match (only MUI accent and palette; not seen in the live render) |
| brand-lime `#a4cc4a` | palette `lightGreen` | ✅ defined but **unused** in the compiled CSS |
| navy `#005870` | `$main_blue` | ✅ match (maintenance h1, secondary button) |
| sky `#0886c4` | `$secondary_blue` | ✅ match, **but** the visible blue band is the image `section_bg.png` = **`#0099CF`**. Add `sky-band #0099cf` or use the image |
| ink `#0c212d` | `$dark_blue` | ✅ match (checkout panel only) |
| teal `#00778d` | palette `teal` | ✅ defined but **unused** |
| accent `#f7911e` | `$main_orange` | ✅ match |
| sun `#ffd300` | `$main_yellow` | ✅ match (link hover in header) |
| sun-soft `#fde9a4` | palette `yellow` | ✅ defined but **unused** |
| ink-900 `#212121` | `$black` / heading color | ✅ match |
| surface-alt `#333` | palette `bg-alt` | ✅ defined; only Snipcart links use `#333` |
| line `rgb(0 0 0/.125)` | palette `border` | ✅ match |
| **missing** | `#616161` body text | ➕ add `--color-body` |
| **missing** | `#00ACD2` default link | ➕ add `--color-link` |
| **missing** | `#F5F5F5` footer bg, `#EEEEEE` copyright bg, `#BDBDBD` copyright text | ➕ add surface/muted tokens |
| **missing** | `#0099CF` contact band (image) | ➕ optional |
| **missing** | `#E6E6E6` divider line | ➕ optional |

---

## 2. Typography

The fonts are Trueno by Julieta Ulanovsky, SIL OFL 1.1, so redistribution is OK. The old CSS declares **every weight as a separate family at `font-weight: normal`** (`TruenoLight`, `TruenoSemiBold` and so on). For the rebuild, use one family `Trueno` with real weights:

| Old family name | New weight | File (`apps/web/public/fonts/`) | Used by |
|---|---|---|---|
| TruenoUltraLight | 200 | `trueno-200.woff2` | `.reg-price` (struck/regular price) |
| TruenoLight | 300 | `trueno-300.woff2` | **body** (all running text), order list title |
| TruenoRegular | 400 | `trueno-400.woff2` | `.btn` (all buttons), "view all" link, checkout titles |
| TruenoSemiBold | 600 | `trueno-600.woff2` | **h1 to h6**, header slogan, header menu items, `.your-price`, hero CTA button |
| TruenoBold | 700 | `trueno-700.woff2` | desktop category nav links (`.main-nav .nav-link`, uppercase) |
| TruenoExtraBold | 800 | `trueno-800.woff2` | thank-you page h1 |

**Dropped** (declared in the CSS but never referenced by any rule): Trueno Black (900) and all italics (UltraLight It, Light It, Regular It, SemiBold It, Bold It, ExtraBold It, Black It), plus all Outline and Outline Italic cuts (Bold/ExtraBold/Black Outline). The originals are in the scratchpad `site/media/*.otf`.

Quirk: the maintenance notice and the MUI theme ask for `'TruenoLt', sans-serif`. That family does not exist, so the notice paragraphs render in the **system sans-serif** (Arial/Helvetica). To match pixel-for-pixel, render those `<p>` in `Arial, sans-serif`. Otherwise use Trueno 300.

Only TruenoLight and TruenoSemiBold actually load on the live page. Headings compute to `font-weight: 500` (Bootstrap), but the single-weight face means they look like SemiBold with no synthetic bolding. In Tailwind use `font-semibold` (600).

### Computed type (the same at 1200 px and 576 px; Bootstrap RFS does not kick in)

| Element | Family | Size / line-height | Weight | Color | Other |
|---|---|---|---|---|---|
| body | Trueno 300 | 16px / 24px (1.5) | light | `#616161` | |
| h1 (Bootstrap) | Trueno 600 | 40px / 48px (1.2) | semibold | `#212121` | mb 8px |
| h2 | Trueno 600 | 32px / 38.4px | | `#212121` | footer "Contact" |
| h3 | Trueno 600 | 28px / **49px (1.75)** | | `#212121` | custom line-height |
| h4 | Trueno 600 | 24px / 1.2 | | | |
| h5 | Trueno 600 | 20px / 24px | | | header slogan (white, pt 5px) |
| Top contact bar | Trueno 300 | 24px / 36px | | `#616161`, link `#000` | centered |
| Maintenance h1 | Trueno 600 | 40px / 48px | | `#005870` | mb 16px, centered |
| Maintenance p | system sans (see quirk) | 17.6px (1.1rem) / 1.6 | | `#616161` | max-w 560px, mb 12px |
| Newsletter h1 | Trueno 600 | 40px / 48px | | `#fff` | centered |
| Newsletter h3 + links | Trueno 600 | 28px / 49px | | `#fff` | centered |
| Footer li / links | Trueno 300 | 16px / 24px | | text `#616161`, links `#00ACD2` | |
| Copyright | Trueno 300 | 16px (≥768), **12px (<768)** / 100px | | `#BDBDBD` | |
| `.btn` | Trueno 400 | 16px / 1.5 | **bold** (synthetic) | | |
| Hero CTA | Trueno 600 | 22px (inline) | | `#fff` | |
| Hero text `p` | Trueno 300 | 28px desktop; 12px / 1.3 below 768px | | black | |
| Header menu item | Trueno 600 | 1.5em (1.25em ≥768) | | `#fff` → hover `#FFD300` | inline, mx 14px |
| Category nav link | Trueno 700 | 1.25rem (1.75rem ≥1900) | | `#fff` | uppercase |
| `.your-price` (product page) | Trueno 600 | 40px / 1 | | `#212121`, sale span `#FF1617` | centered |
| `.reg-price` (product page) | Trueno 200 | 25px | | | |
| Product-card title `.desc` | Trueno 300 | line-height 1.8em, max 2 lines (3.6em) | | `#212121` → hover `#005870` | |
| Snipcart UI | Verdana | | | | forced on all Snipcart text |

Letter-spacing: none anywhere. Text-transform: uppercase on the category nav, `.select-brand`/`.select-category` filters, dialog titles and `.home-notice .btn-primary`; capitalize on size options.

---

## 3. Layout

### Breakpoints and containers
- The compiled Bootstrap grid uses the stock breakpoints **576 / 768 / 992 / 1200**. `.container` max-widths are **540 / 720 / 960 / 1140**. `.row` margins are reset to 0 (`body .row { margin: 0 }`), and gutters are 15px.
- The custom SCSS also defines `xxl: 1900px` (container 1610px), but it is used in only one rule (category nav font 1.75rem at ≥1900).
- Extra ad-hoc queries: header `.user-info` changes at 1650/1651px.
- Most pages were full-bleed `.row` sections rather than `.container`.

### Header (desktop ≥992px)
- It is wrapped in **react-headroom**: the header scrolls away on scroll-down and slides back in on scroll-up. Not permanently sticky.
- `.header--top`: 50px tall, white, `padding: 0 20px`, grid, contact line centered: `(702) 971-2484 | info@dogfood2mydoor.com` (Trueno 300, 24px).
- `.header`: **150px tall**, bg `#00AD4C`, `padding: 25px 20px`, `grid-template-columns: 2fr 3fr 2fr`, items centered vertically.
  - Col 1: logo `logo-white.png` (424×126 source) at **height 90px** (≈303px wide), links to `/`. Below it is the slogan h5 "Locally owned - Shop Local" (white, 20px, pt 5px).
  - Col 2 (search) and col 3 (account, cart, menu) are empty or hidden in maintenance mode. An inline `<style>` in index.html sets `.header__right-icons.main-menu.text-right { display: none }`.
  - Pre-maintenance, col 3 held a `.menu-list` of WP menu items: Trueno 600 1.25em, white, hover `#FFD300`, 0.25s ease-in-out.
- `.main-nav` (pre-maintenance, ≥992): 60px bar, bg `#111`, uppercase Trueno 700 links spaced with `justify-content: space-evenly`. On hover a mega-dropdown fades in (animate.css fadeIn 0.5s): 3-column grid, gap 10px, max-height 400px with scroll, and a white 12px rotated-square arrow with shadow `-1px -1px 0 rgba(82,95,127,.4)`.
- **Total desktop header height: 200px** (50 + 150).

### Header (mobile <992px)
- Live: **nothing renders**. `.header--top` and `.header` are `display: none` below lg, and the mobile topbar component was removed for maintenance.
- Pre-maintenance (`.topbar-mobile`): green `#00AD4C` bar, flex `space-evenly`, hamburger icon `#85DCA9` at line-height 65px, logo height 70px (50px below 768px), fixed position below 576px. It opened an MUI Drawer (`min-width: 65vw; max-width: 75%`) containing the categories and a scrollable brands list (max-height 300px).

### Home hero slider (pre-maintenance; data came from WP `hero_content.hero_slide[]`)
- react-slick, autoplay 8s, infinite, 1 slide, dots on ≥768 and hidden below.
- Slide `.home-hero`: **height 560px** (250px <768, 200px <576), background image `center / cover no-repeat`.
- Text box `.hero-content-wrapper.col-md-6`: left or right placement (`offset-6` when `hero_text_position = right`). Optional `.hero-text-bg` = `rgba(255,255,255,.75)`. Inner container max-width 600px, padding 20px (width 60% on mobile). Text is a `<p>` at 28px black, then the CTA `.btn.btn-primary` (green, white Trueno 600 22px).
- The slide text itself cannot be recovered (WP API is down).

### Best-sellers carousel (pre-maintenance)
- Slides 380px tall. Prev/next arrows are 40×100 boxes `rgba(96,80,76,.5)` → `.9` on hover, with the white chevron `slider-arrow-right.svg`.
- Dots are `#0886C4`, active `#F7911E`, positioned 40px below.
- Card: image height 200px auto width, title `.desc` clamped to 2 lines (58px tall), centered price, "add to cart" 20px below.

### Shop page and product cards (pre-maintenance, from SCSS)
- Grid `.product-grid`: 1 column (<768), 2 columns with gap 20px (≥768), 3 columns (≥1200). Card max-width 400px.
- Card `.product-container`: margin 20px auto. Image `max-height: 250px; max-width: 100%` (fixed height 150px at ≥768 in the shop list). Title `.desc` is 50px tall, line-height 40px, centered, overflow hidden, 20px top margin. Button margin 20px 0.
- No fixed image aspect ratio; images are contained by height.
- Sidebar filters: MUI selects for brand and category, uppercase, 12px at ≥768. The A–Z filter and category tree markup lived in removed components, so no styles survive beyond this.
- Pagination: Bootstrap-3-style links, `padding: 6px 12px`, 1px `#ddd` border, text `#337AB7`, first item radius 4px on the left. Active: bg `#005870`, border `#0886C4`, text white.

### Product page (pre-maintenance)
- Breadcrumbs: padding-left 20px, `/` separators in `#ccc`.
- Image `max-height: 450px` (200px <768).
- Price block: `.reg-price` 25px UltraLight, `.your-price` 40px SemiBold, centered. Price buttons are in a flex row with `space-evenly`. The autoship checkbox has a 20px top margin, the size select is capitalized, and add-to-cart has a 20px vertical margin.
- Quantity input `#quantity`: 40px wide, height `calc(2.25rem + 2px)`, green top and bottom borders.
- Tabs (MUI): white background, tab text black with a 1px `#eee` bottom border (8px font below 768px). Tab content has 50px top margin. Tables inside tabs: full width, 2px border, centered.
- First-autoship discount: 20% off the first autoship order (logic in `firstAutoShipDiscounts.js`).

### Dialogs, checkout and forms
- Quick-order dialog: title bg `#0886C4`, white, uppercase. Body padding 20px. Totals box: `#0C212D`, padding 20px, radius 0.25rem, white text.
- Checkout panel: bg `#0C212D`, padding 25px, text `#BDBDBD`, titles white Trueno 400. Braintree fields are white with radius 0.25rem.
- Inputs: Bootstrap 4 `.form-control`: 1px `#CED4DA`, radius 0.25rem (4px), padding 6px 12px, text `#495057`. Focus: border `#80BDFF`, ring `0 0 0 .2rem rgba(0,123,255,.25)`. Contact form: grid with 20px gap, max-width 75%, inputs padded 10px.
- Search input (header): radius 10px, max-width 500px (min 500px at ≥1200), white fill.

### Buttons
| Variant | Background | Border | Text | Radius | Padding | Font |
|---|---|---|---|---|---|---|
| `.btn` base | transparent | 1px transparent | `#212529` | 4px (.25rem) | 6px 12px | Trueno 400 **bold**, 16px/1.5, margin `10px auto` |
| `.btn-primary` | `#00AD4C` | `#00AD4C` | `#fff` | 4px | same | `.btn.btn-primary` (0,2,0, declared later) beats Bootstrap `.btn-primary:hover`, so **hover shows no visible change** (stays green). Focus ring is Bootstrap blue `rgba(38,143,255,.5)` |
| `.btn-secondary` | `#005870` | `#0886C4` | `#fff` | 4px | same | |
| `.home-notice .btn-primary` | `#006D1F` | `#006D1F` | `#fff` | 4px | | uppercase |
| Snipcart buttons | `#0886C4` | | `#fff` | | | Verdana |

Transitions: links in the header use `all .25s ease-in-out`, buttons use Bootstrap's `.15s ease-in-out`.

### Radii and shadows
- Radii: 4px (buttons, inputs, boxes), 10px (search field), 3px (Snipcart textarea), 1px (dropdown arrow).
- Shadows: `0 2px 2px 0 rgba(0,0,0,.5)` (Snipcart header), `0 -2px 2px 0 rgba(0,0,0,.3)` (Snipcart actions bar), `-1px -1px 0 rgba(82,95,127,.4)` (dropdown arrow), focus ring `0 0 0 .2rem rgba(0,123,255,.25)`.

### Spacing rhythm
The site has no strict scale. Recurring values: 10, 15 (gutter), 20, 25, 30, 50, 60px. Sections use `padding: 50px 0` (`.content-container`) or `60px 16px` (maintenance notice); `.content-wrapper` uses `margin: 60px auto`. The divider is 120px tall with 30px vertical margin and 90% width.

### Footer (computed)
- `footer.row`: bg `#F5F5F5`, padding-top 20px.
- Inner `.col-md-4` (390px at 1200) holds the h2 "Contact" (32px, `#212121`), then two `.col-md-6` columns:
  - Address list: "1550 W. Horizon Ridge Pkwy." and "Suite N, Henderson NV, 89012".
  - Social icons (Instagram gradient SVG and Facebook `#1976D2` SVG, 24×24, 8px gap), then a tel link `(702) 971-2484` and a mailto link `info@dogfood2mydoor.com` in `#00ACD2`.
  - Lists have no bullets and no padding.
- Below 768px the columns stack.
- Copyright strip: full width, **100px tall**, bg `#EEE`, text `#BDBDBD`, line-height 100px, left-aligned with 15px padding, 20px top margin. Text: "{year} Dog Food 2 My Door | All Rights Reserved" (12px below 768px).

---

## 4. Tailwind 4 theme

```css
@import "tailwindcss";

@font-face { font-family: "Trueno"; src: url("/fonts/trueno-200.woff2") format("woff2"); font-weight: 200; font-style: normal; font-display: swap; }
@font-face { font-family: "Trueno"; src: url("/fonts/trueno-300.woff2") format("woff2"); font-weight: 300; font-style: normal; font-display: swap; }
@font-face { font-family: "Trueno"; src: url("/fonts/trueno-400.woff2") format("woff2"); font-weight: 400; font-style: normal; font-display: swap; }
@font-face { font-family: "Trueno"; src: url("/fonts/trueno-600.woff2") format("woff2"); font-weight: 600; font-style: normal; font-display: swap; }
@font-face { font-family: "Trueno"; src: url("/fonts/trueno-700.woff2") format("woff2"); font-weight: 700; font-style: normal; font-display: swap; }
@font-face { font-family: "Trueno"; src: url("/fonts/trueno-800.woff2") format("woff2"); font-weight: 800; font-style: normal; font-display: swap; }

@theme {
  /* fonts */
  --font-sans: "Trueno", ui-sans-serif, system-ui, sans-serif;      /* body = weight 300 */
  --font-display: "Trueno", ui-sans-serif, system-ui, sans-serif;   /* headings = weight 600 */
  --font-cart: Verdana, sans-serif;                                  /* Snipcart */

  /* brand */
  --color-brand: #00ad4c;
  --color-brand-light: #3db659;
  --color-brand-lime: #a4cc4a;
  --color-brand-dark: #006d1f;
  --color-navy: #005870;
  --color-sky: #0886c4;
  --color-sky-band: #0099cf;      /* section_bg.png */
  --color-ink: #0c212d;
  --color-teal: #00778d;
  --color-accent: #f7911e;
  --color-sun: #ffd300;
  --color-sun-soft: #fde9a4;
  --color-sale: #ff1617;

  /* neutrals */
  --color-ink-900: #212121;       /* headings */
  --color-body: #616161;          /* body text */
  --color-link: #00acd2;
  --color-surface: #ffffff;
  --color-surface-alt: #333333;
  --color-footer: #f5f5f5;
  --color-footer-bar: #eeeeee;
  --color-muted: #bdbdbd;         /* copyright text, checkout text */
  --color-rule: #e6e6e6;          /* divider */
  --color-nav: #111111;           /* category nav bar */
  --color-line: rgb(0 0 0 / 0.125);
  --color-line-soft: rgb(0 0 0 / 0.05);

  /* breakpoints (Bootstrap 4 + custom xxl) */
  --breakpoint-sm: 576px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 992px;
  --breakpoint-xl: 1200px;
  --breakpoint-2xl: 1900px;

  /* containers (use with max-w-*) */
  --container-sm: 540px;
  --container-md: 720px;
  --container-lg: 960px;
  --container-xl: 1140px;
  --container-2xl: 1610px;

  /* radii */
  --radius-xs: 1px;
  --radius-sm: 3px;
  --radius: 4px;          /* buttons, inputs, boxes (.25rem) */
  --radius-lg: 10px;      /* search field */

  /* shadows */
  --shadow-bar: 0 2px 2px 0 rgb(0 0 0 / 0.5);
  --shadow-bar-up: 0 -2px 2px 0 rgb(0 0 0 / 0.3);
  --shadow-arrow: -1px -1px 0 rgb(82 95 127 / 0.4);
  --shadow-focus: 0 0 0 0.2rem rgb(0 123 255 / 0.25);

  /* fixed dimensions */
  --spacing-topbar: 50px;
  --spacing-header: 150px;
  --spacing-hero: 560px;
}

@layer base {
  body { @apply font-sans font-light text-body bg-surface text-base leading-normal; }
  h1, h2, h3, h4, h5, h6 { @apply font-display font-semibold text-ink-900 leading-[1.2] mb-2; }
  h1 { @apply text-[40px]; } h2 { @apply text-[32px]; } h3 { @apply text-[28px] leading-[1.75]; }
  h4 { @apply text-2xl; } h5 { @apply text-xl; } h6 { @apply text-base; }
  a { @apply text-link; } a:hover { @apply underline; }
}
```

---

## 5. Page inventory (what exists today)

### Home `/` (and, in maintenance mode, every other path)
Screenshots: `docs/design/screenshots/home-1200.png` and `home-576.png`. The 768/992/1440 captures and the `/shop` and `/about` duplicates are in the scratchpad `shots/`.

| # | Section | Content | Desktop (1200) | Mobile (576) |
|---|---|---|---|---|
| 1 | Top contact bar | "(702) 971-2484 \| info@dogfood2mydoor.com" | 50px, white | hidden |
| 2 | Green header | white logo (90px tall) + "Locally owned - Shop Local" | 150px, `#00AD4C` | hidden |
| 3 | Hero slider | *not rendered* (WP data unavailable) | – | – |
| 4 | Maintenance notice | h1 "We'll be right back" (navy); p "Our website is currently down for maintenance. We're working hard to get everything back up and running as soon as possible."; p "Thank you for your patience. Please check back soon." | padding 60px 16px, centered | same |
| 5 | Divider | `divider-badge.png` centered: thin `#E6E6E6` lines on both sides of the badge | 90% width, 120px, margin 30px | same |
| 6 | WP content | `.content-container > .col-md-8.center-block` with WP HTML (empty now) | 100px of padding only | same |
| 7 | Google Map | iframe, full width, 450px attribute, CSS `height: 50vh !important` (blocked in capture, so it shows as grey) | 50vh | 50vh |
| 8 | Contact band (`.newsletter`) | `section-bg-badge.png` cover (`#0099CF` with badge watermark on the right). h1 "Please contact the store for any orders or help."; h3 "Call us at (702) 971-2484"; h3 "or email info@dogfood2mydoor.com", all white and centered | 50vh tall, col-md-6 centered (600px) | full width |
| 9 | Footer | see §3 Footer | 3 columns (only the first is used) | stacked |
| 10 | Copyright | "2026 Dog Food 2 My Door \| All Rights Reserved" | 100px strip | 12px text |

Note: fullPage screenshots use a 900px viewport, so `50vh` = 450px.

### Shop, category, product, about, contact, FAQ, reviews, subscriptions
These pages **cannot be captured.** Their routes are disabled in the live bundle and their data API is offline. Use §3 (SCSS-derived) for their component styling. The content (category names, brands, product copy, FAQ text, hero slide text) has to come from another source, such as a WP database export.

---

## 6. Assets

| File | Source | Notes |
|---|---|---|
| `apps/web/public/brand/logo-white.png` | inlined data-URI in main JS (`assets/logo.png`) | 424×126, **white** logo for the green header. No SVG exists on the site |
| `apps/web/public/brand/favicon.png` | `/favicon.png` | 64×64 (the manifest says 192). Manifest `theme_color` is `#5cb85c` |
| `apps/web/public/brand/section-bg-badge.png` | `/static/media/section_bg.692bd84b.png` | 2048×790, blue band with badge watermark |
| `apps/web/public/brand/divider-badge.png` | inlined data-URI in CSS (`.divider`, `assets/separator.png`) | 1985×144, grey badge divider |
| `apps/web/public/brand/slider-arrow-right.svg` | `/static/media/slider-arrow-right.57a5b7a6.svg` | white chevron, 12.85×21.92 |
| Footer social icons | inline SVG React components (Instagram gradient `#ffc107→#f44336→#9c27b0`; Facebook `#1976D2`) | copy from scratchpad `src-js/components/icons/` |
| `apps/web/public/fonts/trueno-{200,300,400,600,700,800}.woff2` | OTFs from `/static/media/`, converted with fontTools | OFL 1.1 |

No paw icons, delivery truck or background patterns exist in the shipped CSS or JS. Any such images lived in WordPress media, which is unreachable.
