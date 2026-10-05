# Old storefront (df_web, React 16 CRA): behaviour and layout spec

Written 2026-09-28 from the source snapshot at
`scratchpad/dfz/df_web` (no git history; file mtimes 2025-03-06, maintenance edits 2025-09-21).
All `file:line` references are relative to `df_web/src/` unless they start with `public/`.
Colors, fonts, Tailwind `@theme` and computed type are in **`DESIGN-TOKENS.md`**. This document uses its token names (`brand`, `navy`, `sky`, `ink`, `accent`, `sun`, `sale`, `body`, `ink-900`, `link`, `footer`, `footer-bar`, `muted`, `nav`) and does not repeat them.

> **Read this first: three eras of code live side by side in this repo.**
> 1. **Legacy (Node API + Braintree + Auth0)**: `containers/checkout.js`, `containers/my-account/*`, `containers/deprecated-my-account.js`, `containers/authentication.js`, `containers/auth-cb.js`, `containers/forgot-password/*`, `components/cart*`, `components/quick-order.js`, `components/braintree-credit-card.js`, `components/forms/**`, `actions/{order,payment,subscription,user}.js`. **None of these is routed, even in the pre-maintenance route table** (`routes.js:35-48`). Several would crash if mounted: the `user`, `cart`, `order`, `payment` and `subscriptions` reducers are not registered (`reducers/index.js:10-18`), `User` is not exported from `actions/index.js:11`, and `Auth` is not exported from `lib/index.js:4`.
> 2. **Snipcart v2 era (the production shop before maintenance)**: product/shop/category/page/reviews/subscriptions containers, `price-variation-select.js`, `SnipcartEventListener.js`, `mixins/Discounts.js`, `utils/*`. Checkout, customer accounts and recurring billing were done by Snipcart plus a separate "validator" service (`REACT_APP_SNIPCART_VALIDATOR_DOMAIN`).
> 3. **Maintenance (current live)**: `routes.js:31-33` routes everything to Home. The header and footer are stripped (`header.js:1`, `footer.js:1`) and best sellers are replaced by `MaintenanceNotice` (`home.js:5-7`).
>
> The rebuild should follow **era 2** for storefront UX. Era 1 is the only source for the **checkout form rules** (delivery time picker, pickup, zip list, 20% first-subscription discount), so those rules are recorded here too.

---

## 1. Routes

Route table (pre-maintenance, commented out at `routes.js:34-48`). `RouteActor` parses `location.search` with `qs` into `props.query` (`routes.js:17-29`) and calls `window.scroll(0,0)` on every history change (`routes.js:58`).

App-wide loads on mount (`app.js:23-29`): `GET {WP}/dogfood/v1/brand/`, `GET {WP}/dogfood/v1/category/` and `GET {WP}/wp-api-menus/v2/menus/15` (main menu).

| Path | Container | Data loaded (api-map key → endpoint, `lib/api/api-map.js`) | Auth |
|---|---|---|---|
| `/` (exact) | `containers/home.js` | `page` → `dogfood/v1/page/home-page` (`home.js:14-15`); pre-maintenance also `products` → `dogfood/v1/product/?featured=1` (best sellers, `best-sellers-slider.js:12-14`) | no |
| `/subscriptions` (exact) | `containers/subscriptions/index.js` | Validator `GET {VALIDATOR}api/customer/subscriptions?customerIdentifier={email}&offset={n}&status=active\|paused`, once per status (`subscriptions/index.js:72-93`) | Snipcart customer login (soft). If there is no user it renders two empty lists (`:67-71`) |
| `/subscriptions/:subscription_id` (exact) | `containers/subscriptions/edit.js` | Validator `GET {VALIDATOR}api/subscriptions/{id}` (`edit.js:51-58`); update `PUT` same URL (`:82-96`) | Snipcart login (soft). If there is no user, **the loading dog spins forever** (`edit.js:146`) |
| `/shop` (exact) | `containers/shop.js` | `products` → `dogfood/v1/product/?{query}` with the whole query string passed through (`shop.js:13-17`) | no |
| `/reviews` (exact) | `containers/page-reviews.js` | `page` → `dogfood/v1/page/reviews` + Broadly script (`page-reviews.js:9-18`) | no |
| `/shop/category/:category` (exact) | `containers/categories.js` | `products` → `dogfood/v1/product/?cat={slug}[&brand=][&page=]` (`categories.js:12-16,21-27`) | no |
| `/shop/:slug` | `containers/product.js` | `product` → `dogfood/v1/product/{slug}` (`product.js:14-15`) + featured products for the slider | no |
| `/:slug` | `containers/page.js` | `page` → `dogfood/v1/page/{slug}` (`page.js:9-10`) | no |

Referenced but **not routed**: `/shop/checkout` (`cart.js:161`; it would match `/shop/:slug` and try to load a product called "checkout"), `/login` (`forgot-password.js:37`), `/thank-you` (PHP redirect target, `public/zipcode.php:22`; falls to the `/:slug` WP page), `/faq` (`price-variation-select.js:284`; a WP page).

Legacy Node API endpoints (era 1, unrouted UI): `v1/public/signup`, `v1/public/reset-password`, `v1/payment-method[/:token]`, `v1/bt-gateway/token`, `v1/profile`, `v1/profile/pet`, `v1/order`, `v1/subscription[/:id]` (`api-map.js:13-23`). Node calls send `Authorization: Bearer {localStorage.access_token}` with credentials (`lib/api/index.js:53-63`).

Env var **names** used (values are not in source): `REACT_APP_WP_API`, `REACT_APP_NODE_API`, `REACT_APP_SNIPCART_API_KEY` (`public/index.html:12`), `REACT_APP_SNIPCART_VALIDATOR_DOMAIN`, `REACT_APP_SNIPCART_VALIDATOR_AUTH_TOKEN`, `REACT_APP_AUTH0_{DOMAIN,ID,REDIRECT_URI,AUDIENCE}`.

**Rebuild mapping:** `/`, `/shop`, `/shop/category/[slug]`, `/shop/[slug]`, `/subscriptions`, `/subscriptions/[id]` and `/[slug]` keep their paths. `/reviews` becomes a Sanity page, or `/[slug]` with a reviews block. Checkout, thank-you and account pages are new (Stripe Checkout + Supabase Auth).

---

## 2. Global layout

### 2.1 Document shell
- `public/index.html:6`: viewport `width=device-width, initial-scale=1, shrink-to-fit=no, maximum-scale=1, user-scalable=no`. **Do not replicate** the zoom lock (accessibility). Title "Dog Food 2 My Door" (`:10`). `theme-color #000000` (`:7`) is not the manifest's `#5cb85c` (`public/manifest.json:13`).
- The page loads jQuery 2.2.2, Snipcart 2.0 JS and Snipcart base CSS from CDNs (`index.html:11-13`).
- `index.scss:1-9` loads Bootstrap 4.3.1, **three WPBakery (js_composer) stylesheets from the WP server** (`:3-5`), font-awesome 4.7, animate.css and slick + slick-theme.
- Base `body` (`index.scss:39-66`): `overflow-x:hidden`, font TruenoLight, color `body`, links `link`, h1–h6 TruenoSemiBold `ink-900`, h3 line-height 1.75, **`.row { margin: 0 }`** (every Bootstrap row loses its −15px gutters), `.content-wrapper { margin: 60px auto }`.
- Utilities (`app.scss`): `.truncate` = width 90%, nowrap, ellipsis (`:3-8`); `.center-block` = auto side margins !important (`:37-40`); `.divider` = `separator.png` centered, 120px tall, width 90%, margin 30px auto (`:46-51`); `.btn` = TruenoRegular **bold**, margin 10px auto (`:53-57`); `.btn-primary` = `brand` bg and border (`:58-61`); `.btn-secondary` = `navy` bg, `sky` border, white text (`:62-66`); `.active a` = white on `navy`, border `sky` (`:69-74`); `.loading-dog img` = 100% × 100% (`:76-79`); number inputs have no spinners (`:28-35`).
- Global error modal: material-ui v0 `Dialog` titled **"Error occur"**, z-index 1501, body = error message (`components/modal-error.js:4-13`), opened whenever `state.err` is set (`app.js:35-39`).
- MUI v0 theme (`index.js:19-37`): primary1 `#00AD4C`, primary2 `#005870`, primary3 `#F7911E`, accent1 `#3DB659`, text `#000`, fontFamily `'TruenoLt'` (nonexistent family; see DESIGN-TOKENS §2 quirk).

### 2.2 Header (as it exists now: `components/header.js`)
Element tree:
```
<Headroom>                                   header.js:52  (react-headroom defaults)
  div.header--top                            :53
    div.user-info.row
      div.col.align-center-center.text-center   "(702) 971-2484 | " + a[mailto:info@dogfood2mydoor.com]
  div.header.hidden-md-down                  :63  (hidden-md-down is a BS4-alpha class, no effect)
    div.header__logo
      a[href=/] > img.logo (assets/logo.png, alt "Logo")
      h5.header__logo__slogan  "Locally owned - Shop Local"
    div.header__right-icons.main-menu.text-right
      div.user-info.row.text-right > div.col.align-center-center > h2(white, empty) ×2   :71-75
      (commented-out) ul.menu-list.text-right.hidden-xs-down > li.menu-item > Link(item.url){item.title}   :78-86
```
Styles (`style/components/header.scss`):

| Selector | Rule | Line |
|---|---|---|
| `.header--top` | bg white; height 50px; `display:none` → `grid` at ≥992; font-size 1.5rem (24px); align-items center; padding 0 20px; `a { color: black }` | 92-105 |
| `.header` | bg `brand`; height 150px; padding 25px 20px; color white; `display:none` → at ≥992 `grid; grid-template-columns: 2fr 3fr 2fr; align-items:center` | 10-20 |
| `.header a` | white, `transition: all .25s ease-in-out`, hover `sun` + no underline | 23-30 |
| `.header .logo` | height 90px | 35-37 |
| `.header__logo__slogan` | white, padding-top 5px (h5 = 20px TruenoSemiBold) | 80-85 |
| `.header__search` | `justify-self:center`, white (grid column 2, the search slot) | 86-89 |
| `.header .user-info` | font-size 1.5rem at ≤1650px, 2rem at ≥1651px; `h2` 1.5rem / 1.75rem; `.user-avatar` margin-right 10px | 38-56 |
| `.header .main-menu .menu-list` | no bullets, margin-top 10px; `.menu-item` inline, margin 0 14px, 1.5em TruenoSemiBold (1.25em !important at ≥768, `_responsive.scss:75-77`); links white → `sun`; `.order-btn` bg `#33DC75` | 57-79 |
| `.search-input` (MUI TextField) | max-width 500px; radius 10px; margin-left 30px (0 at ≥992); min-width 500px at ≥1200; fieldset white bg at ≥992; focused outline white; input bold black | 108-142 |
| `.topbar-mobile` | z-index 0; hidden at ≥992 | 3-8 |

Both `.header--top` and `.header` are `display:none` below 992px, so **below lg the current live header renders nothing**.

**Pre-maintenance header (reconstructed from the surviving styles and components; the JSX itself was deleted):**
- Column 1: logo + slogan (as now).
- Column 2: search (`.header__search`) containing `components/forms/Search.jsx`, an MUI outlined TextField labelled **"Search"** that on submit does `window.location.replace('/shop?starts_with=' + term)` (`Search.jsx:6-9`), a full page reload.
- Column 3: WP main-menu items (menu id 15, `app.js:27`) as `li.menu-item > Link to={item.url}` (`header.js:78-86`), the Snipcart cart icon (`.cart-icon`: `fa-shopping-cart` 24px black, count `padding-left:10px`, `cart.scss:1-10`; markup `div.snipcart-checkout.cart.cart-icon > div.snipcart-summary.cart-count > span.snipcart-total-items.qty + i.fa.fa-shopping-cart`, `sidebar.js:67-74`) and account links. Login state came from Snipcart: `Snipcart.api.user.current()` polled once after 1000 ms, plus `authentication.success` / `user.loggedout` subscriptions (`header.js:15-48`). The `isUserLoggedIn` state is still computed but no longer rendered.
- Category bar `.main-nav` (≥992 only, `header.scss:144-238`): bg `nav` (#111), height 60px, grid centered; `ul` flex `space-evenly`, no margin; `li` inline-grid, uppercase; `.nav-link` white TruenoBold 1.25rem (1.75rem at ≥1900). Hovering `.nav-item` shows `.dropdown-menu` as a grid (`fadeIn` .5s; fadeOut .5s on leave) with gap 10px, 3 columns (`.one-column` → 1 column, no scroll), max-height 400px, `overflow-y:scroll`, top 95%. `.dropdown-menu__arrow::before` is a 12×12 white square rotated 45°, radius `1px 0 0 0`, shadow `-1px -1px 0 rgba(82,95,127,.4)`, at top 8px, left 20px. The data came from `state.categories.categories`, a parent/children tree (`reducers/categories.js:13-24`). No JSX survives.
- **Mobile (<992): `components/sidebar.js`**
  ```
  AppBar.topbar-mobile.row (position=relative)
    Toolbar
      IconButton(edge=start) > i.fa.fa-bars.menu-icon.fa-2x        → toggles Drawer
      Link[/] > img.logo-mobile
      IconButton "more" (MoreVert) → Menu#simple-menu:
        MenuItem: Snipcart cart summary (count + black cart icon)
        MenuItem: Link /subscriptions "Subscriptions"   (only if props.subscriptions)
        MenuItem: .snipcart-edit-profile "Profile"
        MenuItem: .snipcart-user-profile "Orders"
        div.snipcart-user-logout > MenuItem "Logout"
    Toolbar  "Next Day Free Delivery. No Minimum Order."                sidebar.js:109
  Drawer.drawer (anchor left, paper .drawer__paper)
    <Search/>
    div.drawer__paper__snipcart-links
    List(nav, subheader "Main Menu") > Divider + <SidebarFilters/>    (brands.choices, categories)
  ```
  Styles: `.topbar-mobile` bg `brand` !important; its inner div flex `space-evenly`, padding 0; `.menu-icon` color `#85DCA9`, line-height 65px; `.logo-mobile` height 70px, padding `0 10px 8px`, flex-grow 1 (`sidebar.scss:1-17`). Below 768px `.logo-mobile` is 50px tall with padding `5px 10px 0` (`_responsive.scss:36-39`), and below 576px `.topbar-mobile` is `position: fixed` (`_responsive.scss:8-10`). Drawer paper `min-width:65vw; max-width:75%`; `.brands-overflow` max-height 300px, scroll (`sidebar.scss:19-28`).

**react-headroom**: used with **no props** (`header.js:52`), so its defaults apply. The wrapper reserves the header height. Scrolling down past the header unpins it (translateY −100%); any scroll up pins it back (position fixed, 200 ms ease-in-out transform). At the top of the page it returns to static. The desktop header is 200px (50 + 150); with `.main-nav` it was 260px.

### 2.3 Footer (`components/footer.js`, `style/components/footer.scss`)
```
footer.row                                           footer.js:52
  div.col-md-12 > div.row > div.col-md-4
    h2 "Contact"
    div.row
      div.col-md-6 (style padding-left:0) > ul > li "1550 W. Horizon Ridge Pkwy." / li "Suite N, Henderson NV, 89012"
      div.col-md-6 > ul
        li.d-flex.flex-row > a[instagram.com/dogfood2mydoor/, _blank] <Instagram/>  +  a.ml-2[facebook.com/dogfood2mydoor/, _blank] <Facebook/>
        li > a[tel:7029712484] "(702) 971-2484"
        li > a[mailto:info@dogfood2mydoor.com] "info@dogfood2mydoor.com"
  div.col-md-12.center-block.copyright > p > span{YEAR} span" Dog Food 2 My Door " "|" span" All Rights Reserved "
```
- `footer` bg `footer` (#F5F5F5), padding-top 20px; `ul` no bullets, padding-left 0 (`footer.scss:1-7`).
- `.copyright`: color `muted`, height 100px, line-height 100px, margin-top 20px, bg `footer-bar`; `p` has no margin (`footer.scss:8-17`). Font 12px below 768px (`_responsive.scss:33-35`).
- Icons are 24×24 inline SVGs: Instagram uses gradient stops `#ffc107 / #f44336 / #9c27b0` (`icons/Instagram.js:3-19`); Facebook is `#1976D2` with `#FAFAFA` glyph (`icons/Facebook.js:3-27`).
- Only 1 of 3 columns is used. The maintenance comment says "shop/account/about/policy links removed" (`footer.js:1`), but the old link lists are lost, so rebuild them from the Sanity menu.

### 2.4 Maintenance notice (`components/maintenance-notice.js`)
styled-components `div.maintenance-notice`: width 100%, padding 60px 16px, centered, font `'TruenoLt'` (falls back to the system font). `h1` `navy`, margin-bottom 16px. `p` max-width 560px, 1.1rem, line-height 1.6, margin `0 auto 12px` (`:4-21`). Copy (`:25-30`): h1 "We’ll be right back"; p "Our website is currently down for maintenance. We’re working hard to get everything back up and running as soon as possible."; p "Thank you for your patience. Please check back soon." Rebuild it as a toggleable site-settings banner, not as a route.

---

## 3. Home (`containers/home.js`)

Section order (`home.js:28-92`):

| # | Element | Notes |
|---|---|---|
| 0 | `<Helmet>` | description / og:description = `meta.yoast_wpseo_metadesc`; og:title and `<title>` = `yoast_wpseo_title`; og:type website; og:url `https://dogfood2mydoor.com/`; og:image `yoast_wpseo_opengraph_image` (`:29-46`) |
| 1 | `section.slider.hero` (home_slider) | only if `data.hero_content` (`:48`) |
| 2 | `section.row` → **pre-maintenance: `<BestSellersSlider/>`**; now `<MaintenanceNotice/>` | `:5-7,49-51` |
| 3 | `div.divider` | separator image, 120px |
| 4 | `section > div.row.content-container > div.center-block.col-md-8` with WP `content` HTML | `.content-container { padding: 50px 0 }` (`page.scss:9-11`) |
| 5 | `section.row > iframe.map` | Google Maps embed (place "Dog Food 2 My Door", 36.0182, −115.0568, `home.js:64`), width 100%, height attr 450, CSS `height: 50vh !important` (`home.scss:40-42`) |
| 6 | `section.newsletter.row.align-items-center > .col-md-6.center-block` | 50vh tall, `section_bg.png` center, cover (`home.scss:43-50`). Current copy: h1 "Please contact the store for any orders or help." (white); h3.text-white "Call us at (702) 971-2484"; h3.text-white "or email info@dogfood2mydoor.com" (links white). Pre-maintenance this was a **sign-up CTA** (`home.js:73`), whose copy is lost |

`.home-notice` (`home.scss:4-17`: padding 20px 0, bg `sky`, white, 1.5rem; `.btn` margin 0 10px; `.btn-primary` `#006D1F` uppercase) has styles but no markup (dead).

### 3.1 Hero slider (`components/home_slider.js`)
react-slick settings (`:7-45`):

| Setting | ≥1024 | <1024 | <768 | <480 |
|---|---|---|---|---|
| autoplay / autoplaySpeed | true / **8000 ms** | same | same | same |
| speed | slick default 500 ms | | | |
| infinite | true | true | true | true |
| slidesToShow / Scroll | 1 / 1 | 1 / 1 | 1 / 1 | 1 / 1 |
| dots | true | true | **false** | false |
| arrows | slick default (true) | | | |
| other | className `slider-component`, centerMode false, adaptiveHeight false | | `initialSlide: 2` (odd; starts on the 3rd slide) | |

Arrows use unstyled slick-theme defaults: 20px glyphs at left/right −25px, so they sit **off-canvas** on a full-width slider and are clipped by `body{overflow-x:hidden}`. Effectively there are no arrows. Dots are the slick-theme defaults (6px black "•", opacity .25, active .75, bottom −25px).

Slide data (WP `hero_content.hero_slide[]`): `hero_img, hero_text, hero_link, hero_button_text, hero_text_position ('left'|'right'), hero_text_background ('true' string)`.

Slide markup (`:53-95`):
```
div.home-hero.row.d-flex.align-items-center   style: background url(hero_img) center / cover no-repeat
  div.hero-content-wrapper.col-md-6 + ( position==='right' ? 'offset-6' : 'text-right' ) + ( background==='true' ? 'hero-text-bg' : '' )
    div.hero-content-container  style float: ( position==='left' ? 'right' : 'left' )
      p {hero_text}
      Link.btn-primary.btn[to=hero_link] style {color:#fff; fontFamily TruenoSemiBold; fontSize 22px} {hero_button_text}
```
- Heights: 560px (`home.scss:19`), **250px below 768px** (`_responsive.scss:43-45`), **200px below 576px** (`_responsive.scss:11-13`).
- Text box: wrapper text black; `.hero-text-bg` gives the **whole wrapper column** `rgba(255,255,255,.75)` (`home.scss:21-26`). Container max-width 600px, padding 20px (`:27-30`); `p` 28px (`:35-37`). Below 768px the container is width 60% !important and `p` is 12px / 1.3 with margin-bottom 10px (`_responsive.scss:46-51`). The mobile `button` rules (`:53-60`) never match, because the CTA is an `<a>`.
- Placement: "left" puts a text-right column on the left half with the box floated right (toward the center). "right" puts the column on the right half via `offset-6` with the box floated left. `offset-6` is not breakpoint-scoped, so below 768px the 100%-wide column is pushed 50% off-screen. **Bug; don't replicate.** In the rebuild, use a left/right half at md+ and full width on mobile.
- `h1` inside the wrapper: 5vw, white (`home.scss:31-34`). It is unused by the markup.

### 3.2 Best-sellers slider (`components/best-sellers-slider.js`)
- Data: `products?featured=1` (fetched only if the store is empty, `:12-14`). Heading `h1` "Best Sellers" + `span.view-all-link > Link /shop "View All"` (`:54-59`); `.view-all-link` is TruenoRegular 20px with margin-left 20px (`best-sellers-slider.scss:3-7`).
- Slick (`:17-50`): autoplay 8000 ms, infinite, **centerMode true**, dots, className `carousel-slider`.

  | viewport (max-width) | slidesToShow | slidesToScroll |
  |---|---|---|
  | >1280 | 5 | 1 |
  | ≤1280 | 3 | 1 |
  | ≤1024 | 2 | 2 |
  | ≤680 | 1 | 1 |
- Styles (`best-sellers-slider.scss`): `.best-sellers` padding-top 50px, overflow-x hidden (`:9-11`); `.your-price` font-size `larger` (`:12-14`); slider width 100%, margin 50px auto (`:15-18`). Arrows are 40×100 boxes at left/right 0, bg `rgba(96,80,76,.5)` → `.9` on hover, transition .25s, glyph = `slider-arrow-right.svg` (prev rotated 180°), z-index 10 (`:38-81`). Dots sit at bottom −40px; each button has bg `sky`, padding 0, empty `:before`; active `:before` bg `accent` (`:83-97`). With slick-theme's 20×20 li/button, the dots render as **20×20 square blue blocks, orange when active**.
- Card: the same `mapSingleProduct` as the shop (§4.3), with `.product` margin 0 10px; hovering the link turns `.desc` `navy` with no underline; `.desc` is `ink-900`, max-height 3.6em, line-height 1.8em (`:98-114`), height 58px (`product.scss:16-20`). `.prod-img img` height 200px, auto width (`:115-118`). `.add-to-cart` margin-top 20px (`:119-121`). `.truncate` (§2.1) forces one line with ellipsis, which overrides the 2-line clamp intent.
- Used on the Home (pre-maintenance) and at the bottom of every **product page** (`product.js:124-127`).

### 3.3 Zip-code form (`components/zipcode-form.js`)
- **It is not on the home page.** It is an MUI v0 `Dialog` opened only by the legacy checkout when the shipping zip select is set to **"Other"** (`checkout.js:179-181,253-256`).
- Dialog title **"Out of Delivery Zone"** (title class `.dialog-title` = `sky` bg, white, uppercase, `quick-order-dialog.scss:3-7`), body padding 20px. Width 95% below 768px (`_responsive.scss:40-42`).
- Copy (`:32-36`, verbatim, typo included): "We apologize for the inconvinience, but at the moment we are not delivering at any other zipcodes. Please send us your information and we'll contact you as soon as we expand to your area."
- Fields (all `type="text"`, `required`, 2×2 grid `col-md-6`): `full_name` "Full Name", `email` "Email", `phone` "Phone Number", `zipcode` "Zipcode" (`:40-93`). There is no format validation. The Submit button (MUI RaisedButton, primary, fullWidth, "Submit") is disabled until all four are non-empty (`:102-109`).
- Submit: native `POST /zipcode.php` (`:37`). The PHP mails the request to a **hard-coded personal Gmail address** (`public/zipcode.php:19`) and redirects to `/thank-you` (`:22`). The script has syntax errors (a missing `;` at `:16`, and `$formcontent` is undefined) and PHP never ran on Netlify, so **this never worked**. `public/mail.php` is the same pattern for a contact form.
- Allowed delivery zips (`lib/constant.js:26-36`): **89141, 89044, 89052, 89012, 89074, 89014, 89015, 89002**, plus "Other".

**Rebuild:** store the zip list in Sanity site settings, use it for checkout address validation (Stripe `shipping_address_collection` cannot restrict by zip, so validate before creating the session), and back the "notify me" form with a server action/DB row plus email.

---

## 4. Shop

### 4.1 URL and query params
| Param | Source | Effect |
|---|---|---|
| `brand` | sidebar brand click → `/shop?brand={brandName}` (`sidebar_filters.js:44-46`) | passed to the API; shown as a breadcrumb |
| `starts_with` | header search → `/shop?starts_with={term}` (`Search.jsx:8`) | passed to the API (despite the name it is used as the search box) |
| `page` | pagination | 1-based |
| `cat` | category route param (`categories.js:12`) | API filter |
| `featured=1` | best sellers | API filter |
| anything else | passed through untouched (`shop.js:15`) | |

Pagination links keep **either** `brand` **or** `starts_with`, never both (`shop.js:33-42`); the category version keeps `brand` only (`categories.js:46-53`). There is **no sort UI** and no sort param. The page size is **12** (`pagination.js:8`, server-side).

### 4.2 Layout (`containers/shop.js`)
```
main.row.shop-page.content-wrapper.justify-content-center          (margin 60px auto)
  section.products-container.animated.fadeIn
    ol.breadcrumb > li > Link[/shop/] "SHOP"   [+ li " {brand} " if ?brand]
    article.product-grid > product cards         (if count > 0)
    | div.row.center-block.loading-dog.align-items-center.justify-content-center > div.col(color white)
    |    img dog_load.gif "Loading ..."  +  div#results-not-found (visibility hidden)
    |       h2 "There were no results for your search..."  h3 "Please try with a different keyword"
    div.row.justify-content-center > <Pagination/>   (only if count >= 13)
```
- Loading and empty states share one block. The gif (800×600, scaled 100% width) shows whenever `count` is not > 0. If `count === 0`, a `setTimeout` reveals the "no results" text **after 7 s** while the gif keeps running (`shop.js:61-79`). In the rebuild, use a proper skeleton and an immediate empty state.
- `.product-grid` (`product.scss:47-62`): block below 768px; 2 columns with 20px gap at ≥768; 3 columns at ≥1200. Cards have margin 0, max-width 400px, padding-right 0.
- Breadcrumb (`product.scss:7-14`): `li` inline-block, separator `"/\00a0"` in `#ccc` with padding 0 5px, on top of the Bootstrap `.breadcrumb` defaults (flex, padding .75rem 1rem, bg `#e9ecef`, radius .25rem, mb 1rem).
- **No sidebar is rendered in `shop.js`**. Filters existed only in the mobile drawer (§2.2) and the desktop `.main-nav` mega menu.

### 4.3 Product card (`components/single-product.js`)
```
div.product-container.animated.fadeIn
  div.product
    Link[/shop/{slug}]
      div.prod-img.col.align-self-center.d-flex > img.center-block[src=image alt=name]
      p.desc.truncate[title=name] {name}
    <MapSelectSize data={item}/>   ← full price/size/autoship/add-to-cart widget (§5.2)
```
- Shop styles (`shop.scss:3-20`): container margin 20px auto. `.desc` height 50px, line-height 40px, centered, margin-top 20px, overflow hidden; with `.truncate` it is **one line, ellipsis, 90% width**. Image `max-height:250px; max-width:100%`, and at ≥768 `width:auto; height:150px` (`_responsive.scss:78-81`). `.add-to-cart` margin 20px 0.
- There is **no fixed aspect ratio**; images are sized by height. The **brand is not shown on the card**.
- Price: only the selected variation's `display_price`, formatted **`$ 12.34`** (with a space) or **"Out of Stock"** (`price-variation-select.js:195-203`). There are **no price ranges** and **no sale/compare-at display**: a "Regular Price:" line using `display_regular_price` is commented out (`:224-228`). `.reg-price` styling survives (TruenoUltraLight, 25px on the PDP) and can be reused for `compareAtPrice`.
- `.your-price` is TruenoSemiBold, `ink-900`, centered, **but the text sits inside a `<span>` that `.price-variations .your-price span { color: #ff1617 }` paints red** (`price-variation.scss:15-21`), so **every price renders in `sale` red**. Decide deliberately whether to keep it: use red only when `compareAtPrice` is set.

### 4.4 Sidebar filters (`components/sidebar_filters.js`)
```
aside.col-md-3 > div.sidebar-filters
  List(nav)
    ListItem "SELECT YOUR BRAND" + ExpandLess/More        → Collapse.brands-overflow (max-h 300px scroll)
        ListItem(inset) {brand}  ×  R.values(brands.choices)      → /shop?brand={brand}; closes drawer
    for each category with category_parent === 0, excluding cat_name "Uncategorized":
        ListItem > ListItemText.select-category {name}   (uppercase; 12px at ≥768)
           no children → /shop/category/{slug}{current ?search}  (keeps ?brand)
           children    → toggles a Collapse of inset child items → /shop/category/{child.slug}{search}
  p "* If the brand you are looking for is not listed above, please click" span.link > a[mailto:info@dogfood2mydoor.com] " HERE" " to let us know."
  Link[/shop] > MUI Button label="Clear Filter"
```
Bugs: `toggleDropdown(cat)` is called with the click event, so category dropdowns never open correctly (`:100`). The `Button label=` prop is ignored by MUI v4, so **"Clear Filter" renders as an empty button** (`:148`). The `leftIcon` caret prop is ignored. The Collapse state only allows one open dropdown (`:29-35`). There is **no A–Z letter bar** in this source: `starts_with` is only fed by the search box.

**Rebuild:** a category tree (2 levels, Sanity), a brand list, a search `q`, and `page`. Keep the "* If the brand you are looking for is not listed…" footnote.

### 4.5 Category page (`containers/categories.js`)
Same shell as the shop. Breadcrumb: `SHOP` / (`Link /shop?brand={brand}` if a brand is set) / `li.capitalize > Link /shop/category/{slug}` with the label = slug with `-` → space (`:61-76`). Empty result: `div.col-6.center-block.text-center > h2 "Coming Soon"` (`:81-85`). There is no loading state (renders nothing until data arrives). Pagination renders whenever data exists (`:88-96`).

### 4.6 Pagination (`components/pagination.js`, `pagination.scss`)
`react-js-pagination`: `itemsCountPerPage 12`, `pageRangeDisplayed 5`, Bootstrap-3 look: `li a` float left, padding 6px 12px, margin-left −1px, line-height 1.42857, color `#337ab7`, bg white, border 1px `#ddd`; the first link has left radius 4px; the active link (`.active a`) is white on `navy` with a `sky` border (`app.scss:69-74`). It renders « ‹ 1 2 3 4 5 › » (library defaults).

### 4.7 Quick-order dialog (`components/quick-order.js`, unrouted/legacy)
MUI Dialog **"Quick Reorder"** (`.dialog-title` `sky`/white/uppercase). It shows the **first line item of the last order** only: "Previous Order", "Continue Shopping" link, header row Item | Price | Quantity | Total, then the item row, then a `.ship-totals` box (bg `ink`, padding 20px, radius .25rem, white text, `quick-order-dialog.scss:10-22`) with Subtotal / Tax / TOTAL, and an "Add to Cart" block button that adds to the local (non-Snipcart) cart. This is dead code; a future "Buy again" feature could borrow the idea.

---

## 5. Product page

### 5.1 Layout (`containers/product.js`)
```
main.content-wrapper
  Helmet (yoast meta; og:url https://dogfood2mydoor.com/{slug} — note: missing /shop/)   :29-51
  section.row > div.col-md-10.center-block.animated.fadeIn
    ol.breadcrumb > li Link[/shop/] "SHOP"  + li " {category.name} " per category (plain text, not links)   :55-64
    hr   (margin-bottom 1rem !important, app.scss:14-16)
    div.row.single-product-details
      div.col-md-4.text-center > img.col.product-img[src=image alt=name]
      div.col-md-8
        h2 {name}
        <MapSelectSize data={product}/>      only if data.slug === route slug && variations non-empty   :77-80
        div.tabInfo > MUI v0 Tabs.product-tabs (inkBar width 100px, bg navy, z 1)
          Tab "Description"            ← data.description (HTML)
          Tab "Nutritional Facts"      ← data.nutritional_info (only if non-empty)
          Tab "Feeding Instructions"   ← data.feeding_instructions (only if non-empty)
  div.divider
  section > <BestSellersSlider/>       ← "related products" = the featured list, not category-related
```
- **Gallery: none.** A single `image`; `.product-img` width auto, max-height 450px (`product-details.scss:2-5`), height 200px !important below 768px (`_responsive.scss:63-65`).
- There is **no Ingredients tab**, **no `showAdditionalInfo` flag** anywhere in this source (verified by grep), and no accordion. The tabs render unconditionally, with Description always present.
- Tab styles (`product.scss:22-45`): tab bar bg white; tab text black with a 1px `#eee` bottom border (8px font below 768px, `_responsive.scss:66-72`); content margin-top 50px. **Tables in tab HTML**: width 100%, 2px solid border, margin 10px auto, text centered, `th` centered, `td` 1px solid border. This is the only styling for WP product tables. WP product content includes `table.feeding-guidelines` (thead "Your Pet’s Weight" colspan 2, "0 to 3 Months", "3 to 6 Months", "6 Months to Adult", "Adult", "Less Active"; first body row "Lbs." / "Kg." / "8 oz. Cups" cells with class `th2`), `.feeding-instructions`, `.nutritional-info`, `.nutritionRow` and similar (found in the WP fixture, not styled by the app beyond the generic table rule).
- Tooltip `.info-tooltip` bg `rgb(0,109,240)` (`product-details.scss:15-17`).

### 5.2 Price / variant / Autoship widget (`components/price-variation-select.js`)
Used on the PDP **and on every card** (shop, category, best sellers). The container is `div.price-variations` with inline `max-width: 450px` (`:221`).

```
p.your-price > span {"$ 12.34" | "Out of Stock"}                            :229-231
div.price-btns  (flex, space-evenly)                                          :235-246
  button.btn.option-size[+ .btn-secondary when selected][name=variation_id] {attribute_size}
div.row.align-items-center                                                     :269-322
  div.d-flex.flex-row
    MUI v0 Checkbox.autoship-checkbox label "Autoship"  (icon fill #0886C4; label #0886C4, 30px, bold, capitalize; margin-top 20px)
    a[href=/faq] > InfoIcon (16×16, #006DF0) data-tip "Learn more about autoship benefits"
    ReactTooltip#svgTooltip place right, type info, effect solid
  div.col-12 > span[hidden unless autoship] "*Ship this item every"
  div.col-4  > input.form-control[type=number][hidden unless autoship]        ← interval count (no min/max)
  div.col    > select.form-control.select-size[hidden unless autoship]
                 "" " -- Select One -- " | "day" "Days" | "week" "Weeks" | "month" "Month"
button.btn.btn-primary.btn-block.add-to-cart "Add to Cart"                    :323-336
```
Rules:
- **Default variant** = `variations[0]` (`:14-16,30-32`). A size button click sets `currentVariation = Number(button.name)` (`:68-76`). Unselected size buttons are plain `.btn` (transparent, bold TruenoRegular), and the selected one is `.btn-secondary` (`navy`/`sky`/white). Sizes are capitalized (`price-variation.scss:7-10`).
- **Price** = `variationObj.display_price.toFixed(2)`. When `is_in_stock` is false the price text becomes "Out of Stock", **but Add to Cart stays enabled** (bug).
- **Quantity: none in the UI** (the QtyCounter usage is commented out at `:263-265`). Every click adds qty 1 (`state.qty = 1`); quantity is changed inside the Snipcart cart. `components/qty_counter.js` (−/+ buttons `btn-danger`/`btn-success` with fa icons, `#quantity` input 40px wide with `brand` top and bottom borders, min 1 max 100, `qty_counter.scss`) is unused.
- **Autoship**: defaults off. With autoship on, Add to Cart is disabled until **both** the count and the unit are non-empty (`:324-331`). There is no validation of count ≥ 1 or of integers; `required={!autoship}` is inverted (`:307`). There is no default interval. Options are **Days / Weeks / Month** (sic) with values `day/week/month`.
- **Add to cart** (`:182-193`) builds a Snipcart v2 item (`getItemAttributes`, `:95-180`):

  | Field | Value |
  |---|---|
  | `id` | WP product `ID` (**not** variation id) |
  | `name`, `image` | product name, image |
  | `price` / `originalPrice` | selected `display_price` (or the discounted price, see §7) |
  | `quantity` | 1 |
  | `stackable` true, `duplicatable` false, `shippable` true, `taxable` true | |
  | `dimensions` | all null |
  | `customFields[0]` | `{name:'Size', type:'dropdown', value:<size>, operation:'+0.00', required:false, sanitizedName:'snipcart_custom_Size', options:'<size>[+/-diff]|…'}`, where diff = that variation's price − the selected price (2 dp). **The customer could switch size inside the Snipcart cart** and the price adjusted by the diff |
  | `metadata` | `{autoship:bool, product:{name,size}}` + `first_autoship:true, original_price` when discounted |
  | `paymentSchedule` | only if autoship: `{interval: 'day'\|'week'\|'month', intervalCount: <string from input>}` |
  | `url` | `${VALIDATOR_DOMAIN}${btoa(JSON.stringify({id, price:Number(price)}))}`, used by Snipcart's crawler to validate the price |
  Then `Snipcart.api.items.add`, **cart metadata `deliveryDate` = tomorrow `MM-DD-YYYY`**, and `Snipcart.api.modal.show()` (the cart opens after every add).

**Rebuild mapping:** Sanity `product.variants[] {option, price, compareAtPrice, inStock}` replaces `variations[] {variation_id, attributes.attribute_size, display_price, display_regular_price, is_in_stock, sku}`. Stripe Price objects: one-time plus recurring (`interval` day/week/month, `interval_count` N). Stripe Checkout allows only one recurring interval per session, so mixed intervals in one cart need separate subscriptions or a "one Autoship schedule per order" rule. This is a product decision; see §11.

---

## 6. Cart and checkout

### 6.1 Snipcart era (production before maintenance)
- The cart, checkout, addresses, payment, taxes, shipping and customer accounts were **all Snipcart v2 hosted UI**, restyled by `_snipcart.scss` and `_snipcart_fullscreen.scss` (Verdana everywhere; header `brand` with shadow `0 2px 2px rgba(0,0,0,.5)`; buttons `sky`; next/finalize `#50BCD0`; actions bar bg `#eee` with an 8px `#50BCD0` bottom border; step pills `#eee` at .5 opacity, active white; user header `#474747` with " | Profile" appended to the email; total badge `accent`; remove link `#F6B61D`; footer hidden; step icons replaced by the numbers 1–7).
- Integration points:
  - Item add: see §5.2. Cart metadata `deliveryDate` (tomorrow, `MM-DD-YYYY`), plus the first-Autoship fields (§7).
  - `cart.opened` → `cartDomEvents.onHashChange`, also bound to `window.onhashchange` (`SnipcartEventListener.js:42-45`). On the `#!/shipping-method` step it rewrites the first `.snip-product__important` element inside `#snipcart-shippings-list` to **tomorrow's date, `MMMM Do YYYY`** (`utils/cartDomEvents.js:4-28`). The variable is named "nextBusinessDay", but it is simply +1 calendar day with **no weekend or holiday or cutoff logic**.
  - `item.removed`, `order.completed`, `authentication.success`, `user.loggedout`: see §7.
- Mobile menu Snipcart hooks: `.snipcart-edit-profile` "Profile", `.snipcart-user-profile` "Orders", `.snipcart-user-logout` "Logout" (`sidebar.js:88-106`).
- Business copy: "Next Day Free Delivery. No Minimum Order." (`sidebar.js:109`).

### 6.2 Legacy checkout (`containers/checkout.js` + `components/forms/checkout/*`, unrouted, Braintree/Node)
Page shell: `section.page-checkout > ZipcodeForm + article.row.content-container > .col-sm-11.center-block`. It shows either ThankYou (when `order.new.id` is set and the cart is empty) or CartComp + CheckoutForm. A "Processing" MUI Dialog with the dog gif is shown while `processing` is true (`:300-306`).

**Cart summary (`components/cart/*`)**: h2 "Your Cart" + right link "← Continue Shopping" (`fa-long-arrow-left`, mr 10) to `/shop`; header row (blank) | Item | Price | Quantity | Total (Total hidden below md); rows: trash icon (`fa-trash-o fa-2x`, removes) | thumbnail (col-sm-3, hidden below md) + name | `$price` | qty | `$line total` (hidden below md); rows margin 20px auto, list margin 50px auto (`item-table.js`). Totals, right-aligned rows `col-md-3` label + `col-md-2` `h4` value: **Subtotal, Discount, After discount, Tax (= 8.25% × (subtotal − discount)), Total** (`total.js:7-63`, `constant.js:1`). The unused state `tax_rate: 0.08375` in `checkout.js:24` conflicts; **8.25%** is the value actually used. The Cart dialog variant (`components/cart.js`) shows "Your Cart is Empty", a "Ship To" block that hard-codes "Las Vegas NV", and "Proceed to Checkout" → `/shop/checkout`.

**Form** `form.row.checkout-info` (bg `ink`, padding 25px, text `muted`; `.title` white TruenoRegular; `.icon` padding-right 15px; shipping `.col` padding-left 10px; Braintree drop-in fields white with radius .25rem, `checkout.scss:3-35`). Three `col-md-4` columns:

| Column | Content (verbatim) |
|---|---|
| 1 `.shipping-form` | h4.title `fa-home` "Shipping Address"; **Address** (req, placeholder "Address", `shipping[address_1]`); **Apt/Ste** (optional); **City** select (req): "City" (disabled placeholder), **Las Vegas**, **Henderson**; **State** input disabled, value "Nevada"; **Zipcode** select (req): "Zipcode" placeholder + the 8 zips + "Other" (`shipping-address.js`). Checkbox "Save address for future use" (disabled when pickup). p " We currently only deliver to the zipcodes in the dropdown above. " Divider. label "Phone Number" + 3 required inputs: area code (3), prefix (3), line (4, placeholder "Phone Number"), combined as `(xxx) xxx-xxxx` (`phone.js`; regex `^\(\d{3}\)\s\d{3}\-\d{4}$`, `validation.js:4`). Divider. Delivery time picker (below). |
| 2 | **Pickup**: h4.title > Checkbox "Pick Up in Store" + p "Your items will be available for pick up in 1 hour or less." (`pickup-checkbox.js`). Divider. **Subscription**: Checkbox whose label = "Subscribe to get 20% off for the first order" if the user has 0 subscriptions and 0 orders, else "How ofter do you want your order delivered?" (sic) (`checkout.js:245-249`). When checked, a select: **Monthly** (`monthly` → period month, interval 1), **Weekly** (week, 1), **Bi-weekly** (week, 2) (`subscription-checkbox.js:14-23`, `constant.js:11-24`). Default `monthly` (`checkout.js:22`). |
| 3 | h4.title `fa-credit-card` "Payment Information"; select of saved cards "{cardType} ending in {last4}[ -- Default --]" + "New Payment Method" (disabled if none saved); if no token: Braintree drop-in + billing form (First Name, Last Name, Address, City, State, Zipcode, "Same as Shipping Address", "Set this payment method as default", buttons "Cancel" / "Step One -> Add your card"); submit `.btn.btn-success.btn-block`: "Complete Order" or "Step 2 -> Complete Order", disabled until a card token exists. |

**Business rules (legacy):**
- **Delivery time picker** (`delivery-timepicker/index.js`, `util.js`): hidden behind the checkbox **"Need a different delivery time ?"**. When shown: react-dates `SingleDatePicker` (1 month visible, `required`); **every day up to and including today is blocked** (`isInclusivelyBeforeDay(day, today)`, `:52`), so the earliest date is tomorrow. **No weekday, weekend, holiday or cutoff-hour rules.** The time select (`required`) has placeholder "*Time" (disabled) and **30-minute slots 08:00–18:00, 21 options** in 24h format (`util.js:1-23`). The request is sent as `customer_note = "Requested Delivery Time: YYYY-MM-DD - HH:mm"` (`checkout.js:135-139`). With no choice made, delivery is **tomorrow** ("Your order will be delivered tomorrow…", `thankyou.js:12-14`). Unchecking is meant to clear the values, but `clearDateAndTime` writes to `form.deliveryDate` instead of state, so the old values persist (**bug**, `checkout.js:229-232`).
- **Pickup**: toggling sets `shipping` to the store address `{address_1:'1550 W. Horizon Ridge Pkwy.Suite N', postcode:'89012', city:'Henderson', state:'NV'}` (`constant.js:3-9`, `checkout.js:103-113`) and disables all address inputs and "Save address". Unchecking restores the profile address. There is no fee difference and no time picker change.
- **First-subscription discount (legacy)**: `discount = subtotal × 0.20` when "subscribe" is checked **and** the user has 0 subscriptions **and** 0 past orders (`checkout.js:185-197`, recomputed on cart change `:76-100`). The order is sent with `subscription_discount: 1|0`. On submit, if subscribed, `POST v1/subscription` with `{billing_interval, billing_period, shipping, products[{product_id, variation_id, quantity}]}` is sent in addition to `POST v1/order` (`checkout.js:162-170`, `actions/subscription.js:7-26`).
- Zip "Other" opens the Out-of-Delivery-Zone dialog (§3.3). State is always NV.
- On submit the profile is updated if "save address" is checked or the phone changed (`checkout.js:151-160`).

### 6.3 Thank-you / indication (`components/indication/thankyou.js`)
`div.row > .col-sm-6.center-block > .thank-you-section.text-center` (20px text; `h1` 4.5rem TruenoExtraBold with margin-bottom 20px, `checkout.scss:37-44`):
- `img ty_img.png` (585×466: box with a green check),
- h1 **"Thank you for your order!"**
- p "We will send you an e-mail confirmation. (Occasionally emails will end up in your Spam Folder, please check yours if you don't recive an email confirmation.)" (sic, `checkout.js:261-262`)
- p "Your order will be delivered tomorrow. If you have any questions or need a different delivery date, just email us to info@dogfood2mydoor.com" (mailto link)

---

## 7. Discounts and Autoship

### 7.1 First-Autoship discount (Snipcart era), the rule to carry forward
| Aspect | Rule | Source |
|---|---|---|
| Amount | **20% off the unit price** of each Autoship item: `price − price*20/100`, rounded to 2 dp and returned as a string | `utils/firstAutoShipDiscounts.js:56-58` |
| Scope | Every Autoship line in the customer's **first Autoship order** (not just one item). Applies to all units of the line (unit price is discounted). One-time items get nothing | `mixins/Discounts.js:9-42` |
| Eligibility | The customer must be **logged in** (Snipcart user). The validator `GET api/validate-first-autoship/{user.id}` returns `{isApplied}`; if already applied → no discount. Anonymous → no discount at add time | `firstAutoShipDiscounts.js:38-54` |
| Late login | On `authentication.success`, every cart item with `metadata.autoship && !metadata.first_autoship` is re-priced (`items.update` with the new price, validator `url`, `metadata.original_price`, `first_autoship:true`) | `SnipcartEventListener.js:22-25`, `Discounts.js:7-43` |
| Cart bookkeeping | cart metadata `{firstAutoship:true, discountedTotal:"x.xx", discountedProducts:{[productId]: "discount"}}` accumulated per add | `firstAutoShipDiscounts.js:3-36` |
| Removal | On `item.removed`, that product's discount is subtracted from `discountedTotal` and its key deleted | `SnipcartEventListener.js:47-68` |
| After checkout | On `order.completed` with `metadata.firstAutoship`: set `localStorage.sc_metrics = {"sc":1}`. For each item with `subscription.id` and `first_autoship`: `PUT {VALIDATOR}api/subscriptions/{id}` `{amount: original_price, quantity, schedule:{interval, intervalCount}}` (**future renewals revert to full price**). Then `POST {VALIDATOR}api/register-discount/{user.id}` (marks the customer as used) | `SnipcartEventListener.js:70-136` |
| Reset | `sc_metrics` is removed on login and logout | `:27-31,38-40` |
| Marketing copy | Autoship info link → `/faq`, tooltip "Learn more about autoship benefits" | `price-variation-select.js:284-296` |

**Stripe equivalent:** a coupon with `percent_off: 20, duration: 'once'` applied to the subscription at creation (Checkout `discounts:[{coupon}]` in subscription mode discounts the first invoice only). Eligibility = the Supabase profile has no prior Autoship (a server-side check, never client). One-time items in the same session must be excluded from the coupon (`applies_to.products` = Autoship products, or use separate prices).

### 7.2 Interval selection
- PDP / card: free integer **N** (input, no bounds) × unit **day | week | month** (`price-variation-select.js:301-321`). Both are required only in the sense that Add to Cart is disabled until both are non-empty. It is sent as the Snipcart `paymentSchedule` (lower-case unit, string count).
- Subscription edit uses **capitalised** values `Day | Week | Month` (`SubscriptionEditForm.js:56-59`), which is inconsistent with the add flow. `INTERVAL_SHORT_KEYS` (`SnipcartEventListener.js:8-15`) is unused.
- Legacy checkout offered only Monthly / Weekly / Bi-weekly (§6.2).
- **Rebuild recommendation:** constrain to a validated set (e.g. every 1–12 weeks, or 2/3/4/6/8 weeks plus monthly), with N ≥ 1 enforced server-side. Stripe supports `interval` day/week/month/year with `interval_count` ≤ 1 year total.

### 7.3 Subscriptions list (`/subscriptions`, `containers/subscriptions/index.js` + `SubscriptionsList.js`)
- `section.page-my-account > article.row.content-container`: `.col-sm-11.center-block > h1 "My Subscriptions"`, then `.w-100.p-3` with two lists, **"Active"** and **"Paused"**, 10 per page (`limit 10`, `offset = page*10−10`). The first fetch is delayed 1000 ms to let Snipcart init (`:29`), and fetching refreshes on login/logout.
- Loading: dog gif in `.loading-dog` at max-width 25% (`:143-152`). Error alert (dismissible): "A problem was encountered trying to retrieve your subscriptions".
- Each list: optional error alert; `h3.mb-3 {title}`; if any rows, a `btn-group` "Bulk actions" with **Pause** (active list) or **Resume** (paused list) and **Cancel**, both `btn-secondary` and disabled until a row is checked. Empty: "You do not have {active|paused} subscriptions."
- Table `.table-responsive.table-hover > table.table`: **# (checkbox) | Product Name | Product Unit Price | Qty | Schedule ("{intervalCount} {interval}(s)") | Next Delivery (nextBillingDate, `MM-DD-YYYY`) | Created On (`MM-DD-YYYY`) | [Edit `btn-info`]**. Edit goes to `/subscriptions/{id}` (history.replace).
- Pause/Resume: `POST https://app.snipcart.com/api/customer/subscriptions/{id}/pause|resume`. Cancel: `DELETE …/subscriptions/{id}`. Both are called **directly from the browser with a hard-coded secret key** (§11). Errors: "Failed to perform {action} action" / "Failed to perform cancel action".
- **Cancel confirmation** (`CancelConfirmation.js`): fixed backdrop `rgba(0,0,0,.3)` with padding 50; white box radius 5, max-width 500, min-height 300, padding 30. Title **"Cancel Subscription"**, × close. Body **"A subscription can't be recovered after canceling it, do you wish to proceed?"**. Buttons **"Continue"** (`btn-primary`, performs the cancel) and **"Cancel"** (`btn-secondary`, closes).
- Pagination (Bootstrap `.pagination`): Previous / numbers / Next. **Buggy**: the page numbers are 0-based when >1 page, and Previous is not disabled on page 1 (`SubscriptionsList.js:92-134`).

### 7.4 Subscription edit (`/subscriptions/:id`, `SubscriptionEditForm.js`)
- `div.w-100.container`: `h1` (centered) = subscription name, `.dropdown-divider`, then a centered form (py-5):
  - **Schedule**: number `#interval-count` (min 1, col-sm-3) + `select.custom-select` (col-sm-4) " -- Select One -- " / Days (`Day`) / Weeks (`Week`) / Month (`Month`)
  - **Quantity**: number `#subscription-quantity`, min 1 (col-sm-6)
  - Buttons: **Cancel** (`btn-secondary m-0 mr-2`, → `/subscriptions`) and **Update** (`btn-primary m-0`)
- Update: `PUT {VALIDATOR}api/subscriptions/{id}` `{quantity, schedule:{interval, intervalCount:Number}}`, then a refetch. Errors: "Failed to update subscription, please try again, if the problem persists please contact support"; fetch errors: "Failed to fetch subscription by id, due to a connection problem with the provider remote service" / "A problem was encountered trying to retrieve your subscription with id {id}".
- **The customer can edit:** interval unit, interval count, quantity; pause/resume; cancel. **The customer cannot edit:** product/size, price, shipping address, next delivery date, or payment method (Snipcart handled payment elsewhere). There is no client validation beyond `min`.

### 7.5 My account / pets / profile (legacy, unrouted: `containers/my-account/*`)
- `h1 "My Profile"`, Divider, **ProfileForm**: h3 "Personal Information", **"Frist Name"** (sic) / "Last Name" (required), Phone (3-part), Email (disabled); h3 "Shipping Address" (same component as checkout, including the zip list); button "Update". Email is omitted from the PUT; phone is re-joined as `(xxx) xxx-xxxx` (`my-account.js:88-98`).
- **My Dogs** (h3 + link "Add New Dog", 13px `navy`; "Processing" in grey while saving): per pet h5 "Dog" + "Remove" (orange 13px) and three fields **Dog's Name**, **Dog's Date of Birth** (MUI DatePicker, opens to year, en-US), **Dog's Breed**, all required (`my-pets.js`). Existing pets are read-only; a new-pet row has an "Add" button. Empty: "You don't have any pet". Pets are stored as flattened WP meta `pets_info_{i}_{name|breed|date_of_birth}` with dates in `MM/DD/YYYY` (`reducers/user.js:11-33`, `actions/user.js:68-90`).
- **Payment Information**: h5 "Credit Cards" + "Add New" link; cards show "DEFAULT", "Number: {masked}", "Exp: {date}", and a "Remove" button; empty "There is no credit card".
- **My Subscription** (`my-subscriptions.js`): list items "Total: {total}", "Subscribed Date: MM.DD.YY", "Renew every {billing_interval} - {billing_period}", nested line items, and an "Unsubscribe" button; empty "You have no subscription".
- **Order History**: "Total: {total}", "Date: MM.DD.YY", nested Item/Price/Quantity/Total rows (`.order-list-items` bg `rgba(227,227,227,.5)`, padding 30px 0; `.order-list-title` TruenoLight, `orders.scss`).
- **Rebuild:** Supabase profile (name, phone, default address) + a `pets` table (name, breed, birth date) + Stripe Customer Portal for cards, and optionally for subscription management.

---

## 8. Auth flows (legacy Auth0, for mirroring in Supabase Auth)

In the Snipcart era, customers logged in through **Snipcart's own customer accounts**; the app only listened for events. The Auth0 screens below are the only custom auth UI in the repo.

| Screen | File | Copy / fields | Behaviour |
|---|---|---|---|
| Register | `containers/authentication.js` | `form.row.authentication-form` (margin 100px auto; `.form-body` and `.dialog-title` padding 24px 24px 20px, `authentication.scss`). h3.dialog-title **"Register"**. Fields: "First Name", "Last Name", "Your Email" (email), "Create a Password" (password), none marked required. h3 **"My Dogs"** + link **"Add New Dog"** → pet rows (§7.5). Divider. p "Already have an account? **Login**" (span.link). Button **"SUBMIT"** (`btn-primary`, disabled while processing) | `POST v1/public/signup` with pets' DOB as `MM/DD/YYYY`, then redirect to the Auth0 hosted login with `redirectTo` = current path (`actions/user.js:31-51`). Already logged in → `<Redirect to="/shop"/>`. Error → MUI Dialog **"Try Again!"** with a red alert showing the server message |
| Login | `lib/auth.js:16-22` | Auth0 **hosted page**, connection `Username-Password-Authentication`. An embedded `login(email,password)` also exists (`:24-38`), with error "Wrong email or password." (`actions/user.js:57`) | |
| Callback | `containers/auth-cb.js` | loading dog only | `parseHash` → store `access_token`, `id_token`, `expires_at` (= now + expiresIn×1000) in localStorage → `GET v1/profile` → push `?redirectTo` or `/` |
| Forgot password | `containers/forgot-password/index.js`, `components/forms/forgot-password.js` | h3.dialog-title **"Forgot password"**; p "Please enter your email address below"; email input (required, placeholder "Email"); button **"Send"**; p "Already have an account? Please Login **Here**" (→ `/login`). After submit: **"Please check your email to reset password"** | `POST v1/public/reset-password {email}`; errors are swallowed (always shows success) |
| Logout | `lib/auth.js:40-46` | n/a | Auth0 logout with `returnTo: https://dogfood2mydoor.com/`; clears the three localStorage keys |

**Supabase mapping:** sign-up (email + password + first/last name + optional dogs saved to a `pets` table), sign-in, magic link optional, reset password (always show the neutral success message, as the old app did), `/auth/callback` route with a `redirectTo` param, logout → `/`.

---

## 9. Static pages (`containers/page.js`, `page-reviews.js`)

```
article.animated.fadeIn
  Helmet (yoast title/description/og:*; og:url https://dogfood2mydoor.com/{slug})
  div.page-hero  style background: url(featured_image) center no-repeat      (only if featured_image)
  div.row.content-container > div.col-md-8.center-block
    h1 {title}
    div  ← WP HTML (dangerouslySetInnerHTML)
```
- `.page-hero`: width 100%, **height 350px**, `background-size: cover !important` (`page.scss:3-7`). `.content-container`: padding 50px 0 (`:9-11`). The column is 8/12 at ≥768 (≈ 640px at 1200), full width below.
- WP HTML styling = Bootstrap 4 reboot + global heading rules (§2.1) + **WPBakery `js_composer*.min.css` loaded live from the WP server** (`index.scss:3-5`; gone with WP). The app adds nothing for lists, blockquotes or images. `.contact-form` (grid, gap 20px, max-width 75%, inputs/textareas padding 10px, `page.scss:13-21`) styled a WP-embedded contact form that posted to `public/mail.php` (never worked, §3.3).
- Tables are styled only inside PDP tabs (§5.1). **In the rebuild, give Portable Text a `table` block** that uses the §5.1 rules (full width, 2px outer border, 1px cells, centered text) and supports the `feeding-guidelines` header pattern (two-column "Your Pet’s Weight" with Lbs./Kg. sub-header).
- **Reviews** (`/reviews`): same layout with slug `reviews`, plus the **Broadly** widget: `<script src="//embed.broadly.com/include.js" defer data-url="/5c1709a3a28c0a00153cf457/reviews">`, injected in JSX and also appended to `body` on mount (`page-reviews.js:12-18,65-69`). The double injection is a bug.
- Known WP slugs linked from the app: `faq`, `thank-you`, `reviews`, `home-page`.

---

## 10. Assets inventory

| File | Size / dims | Used by | In `apps/web/public`? |
|---|---|---|---|
| `src/assets/logo.png` | 424×126, white logo | `header.js:5`, `sidebar.js:18` | ✅ `brand/logo-white.png` (byte-identical) |
| `src/assets/section_bg.png` | 2048×790 | `.newsletter` bg (`home.scss:45`) | ✅ `brand/section-bg-badge.png` (identical) |
| `src/assets/separator.png` | 1985×144 | `.divider` (`app.scss:47`) | ✅ `brand/divider-badge.png` (identical) |
| `src/assets/slider-arrow-right.svg` | 12.85×21.92 white chevron | best-sellers arrows (`best-sellers-slider.scss:48,65`) | ✅ `brand/slider-arrow-right.svg` (identical) |
| `public/favicon.png` | 64×64 | `index.html:9`, manifest | ✅ `brand/favicon.png` (identical) |
| `src/assets/fonts/trueno/*.otf` (20 cuts) | | `style/fonts.css` (20 `@font-face`) | ✅ 6 weights converted to `fonts/trueno-{200,300,400,600,700,800}.woff2`; the rest intentionally dropped (DESIGN-TOKENS §2) |
| **`src/assets/dog_load.gif`** | 800×600, 16 frames, 296 KB, walking yellow dog | loading state in shop, subscriptions, subscription edit, auth-cb, checkout "Processing" | ❌ **copy** → `brand/dog-loading.gif` (consider converting to WebM/animated WebP; 296 KB) |
| **`src/assets/ty_img.png`** | 585×466, box with green check | thank-you page (`thankyou.js:8`) | ❌ **copy** → `brand/thank-you.png` |
| `src/assets/hero_index.png` | 2048×1016, door with DF2MD boxes, orange wall | **unused** (probably the old static hero) | ❌ optional copy → `brand/hero-door.png` (a good default hero slide) |
| `src/assets/slider-arrow-left.png` | 54×91 | **unused** (left arrow is the rotated SVG) | ❌ skip |
| `src/logo.svg` | CRA default React logo | unused | skip |
| `public/manifest.json` | name "Dog Food 2 My Door", short "Dog Food", theme `#5cb85c` | | recreate as `app/manifest.ts` |
| `public/mail.php`, `public/zipcode.php` | broken PHP mailers | contact / zip forms | do **not** copy |
| Inline SVG icons | `components/icons/{Instagram,Facebook,Info}.js` | footer, autoship info | port as React components (Info: 16×16, fill `#006DF0`) |
| Remote | Loading GIF `https://www.createwebsite.net/…/GD.gif` (`_shared/braintree-credit-card.js:128-129`) | Braintree loader | drop |

---

## 11. Gaps, oddities, and things NOT to replicate

**Security (act now):**
- **A hard-coded Snipcart secret API key** is used as an HTTP Basic auth header from the browser: `components/subscriptions/SubscriptionsList.js:39-40` and `:64-65` (live code), and `containers/subscriptions/edit.js:110-111` (commented). Treat the key as leaked. **Revoke it in the Snipcart dashboard** if the account still exists. The value is not reproduced here.
- `REACT_APP_SNIPCART_VALIDATOR_AUTH_TOKEN` is baked into the client bundle and sent as Basic auth on all validator calls (`firstAutoShipDiscounts.js:47`, `SnipcartEventListener.js:107,126`, `subscriptions/index.js:90`, `edit.js:55,93`). Anyone could read or modify any customer's subscriptions and discount state. In the rebuild, all of this must be server-side (Route Handlers / server actions with the Supabase session).
- Discount eligibility and the price are decided client-side and then "validated" through a crawlable URL containing base64 `{id, price}`, which a customer can forge. Stripe prices and coupons must be computed server-side.
- `public/mail.php:7`, `public/zipcode.php:19`: a hard-coded personal Gmail address receives form mail (PII). Header injection is possible via `From: $email`.
- Auth tokens are kept in `localStorage` (`lib/auth.js:65-67`). Supabase SSR cookies replace this.

**Bugs / dead code (don't port):**
- Every price renders red because of `.your-price span` (`price-variation.scss:18-20`).
- "Out of Stock" variants can still be added to the cart (`price-variation-select.js:195-203,323-336`).
- Autoship count input: `required` is inverted and there are no bounds (`:302-308`). The unit label is "Month" (singular) next to "Days" / "Weeks".
- The Snipcart item `id` is the product ID, not the variant ID, so different sizes of one product share an id and a discount key (`:110`, `firstAutoShipDiscounts.js:31`). Use the variant key in the rebuild.
- `Search.jsx` does a full page reload; the param is misnamed `starts_with`.
- "Clear Filter" button renders empty; category collapses are broken (§4.4).
- Home slider `initialSlide: 2` below 768px; `offset-6` overflow on mobile (§3.1).
- The shop's "no results" message appears only after a 7 s timeout under a still-spinning loader (§4.2).
- Subscription pagination is 0-based and Previous is never disabled (§7.3); the edit page spins forever when logged out (§1).
- `clearDateAndTime` does not clear (§6.2). Tax is 8.25% in `constant.js` but `0.08375` in checkout state (§6.2). The cart dialog hard-codes "Las Vegas NV" (`cart.js:119`).
- The "next business day" label is really +1 calendar day (`cartDomEvents.js:21-24`). It uses the deprecated `DOMNodeInserted` event.
- Broadly script injected twice (§9). `og:url` on product pages omits `/shop/` (`product.js:41-43`).
- Typos in customer-facing copy: "inconvinience", "recive", "How ofter", "Frist Name". Fix them in the rebuild.
- `.breadcrumbs` (plural, `product.scss:3-5`), `.home-notice`, `.main-nav` dropdown and `.order-btn` styles have no markup. `.hidden-md-down`, `.hidden-sm-down`, `.hidden-xs-down` and `.align-center-center` are undefined classes.
- The compiled `style/**/*.css` files next to the `.scss` are **stale artifacts** (e.g. `components/header.css` predates the `.main-nav`/`.header--top` rules, and `containers/home.css` has `.home-notice` bg `#002109`). `index.js:15` imports only `index.scss`. Ignore the `.css` files.
- `App.test.js` imports a nonexistent `./App`. `registerServiceWorker.js` is unused. `QtyCounter` uses `onTouchTap` (react-tap-event-plugin, removed in React 16.4+).
- The entire era-1 stack (§ intro) is unreachable: Braintree drop-in, Node orders, Auth0, local cart in `localStorage.products`, and the quick-order dialog.

**Ambiguities to resolve with the owner:**
1. **Mixed Autoship intervals in one cart.** Snipcart allowed a per-item schedule. Stripe Checkout (subscription mode) needs every recurring line to share one interval. Options: one schedule per order (recommended; pick it in the cart), or split into multiple Checkout sessions.
2. **Interval choices**: free N × day/week/month (Snipcart era) or Monthly/Weekly/Bi-weekly (legacy). Pick a fixed list.
3. **First-Autoship discount scope**: 20% on the first Autoship order's Autoship lines only (Snipcart era) or on the whole first order subtotal (legacy checkout: `subtotal × 0.2` when the customer has no subscriptions and no orders). Also: does the one-time part of a mixed cart get the discount? (Snipcart: no.)
4. **Delivery date**: the old site promised next-day delivery with no cutoff. Confirm whether to add a cutoff time, skip Sundays or holidays, and whether the optional date + 30-min time-slot request (08:00–18:00) returns, e.g. as a Stripe Checkout custom field or pre-checkout step stored in session metadata.
5. **Pickup**: legacy checkout had "Pick Up in Store" ("available for pick up in 1 hour or less") with the store address as shipping. Stripe equivalent: a pickup shipping rate at $0 with address collection skipped.
6. **Tax**: 8.25% flat (Henderson/LV NV). Use Stripe Tax or a fixed tax rate.
7. **Delivery zone**: the 8 zips are an allow-list; "Other" collects a lead. The cities offered are only Las Vegas and Henderson. Confirm the current list.
8. The pre-maintenance header nav, the desktop category mega-menu markup, the footer link columns, and the home sign-up CTA copy **are not in the source**. Rebuild them from the Sanity menu/category data using the §2.2 styles.
9. Product brand is not shown anywhere on cards or the PDP; the brand exists only as a filter. Decide whether to show it (Sanity has `brand`).
