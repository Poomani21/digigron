# Migrate `amplify-shine-web-main` → Static HTML/CSS/JS

Goal: Replace the current TanStack Start / React / Tailwind app with a plain static site that deploys to GitHub Pages by drag-and-drop, while keeping the exact visual design, copy, layout, and interactions.

## Source inventory (from your uploaded ZIP)

React routes to convert (in `src/routes/`):
- `index.tsx` → `index.html`
- `about.tsx` → `about.html`
- `services.tsx` → `services.html`
- `portfolio.tsx` → `portfolio.html`
- `pricing.tsx` → `pricing.html`
- `reviews.tsx` → `reviews.html`
- `contact.tsx` → `contact.html`
- `__root.tsx` → shared `<head>` metadata + shell wired into each page
- `sitemap[.]xml.ts` → static `sitemap.xml`

Shared components (`src/components/site/`): `SiteHeader`, `SiteFooter`, `SiteLayout` → inlined header/footer partials copy-pasted into each page (kept identical markup).

Assets:
- `src/assets/digigron-mark.png.asset.json` → download CDN binary → `images/digigron-mark.png`
- `public/favicon.ico`, `public/robots.txt` → project root
- All Tailwind utility styles + design tokens in `src/styles.css` → compiled once into a single static `css/style.css`

## Target structure (per your spec)

```
digigron/
├── index.html
├── about.html
├── services.html
├── portfolio.html
├── pricing.html
├── reviews.html
├── contact.html
├── 404.html
├── sitemap.xml
├── robots.txt
├── favicon.ico
├── README.md
├── css/
│   ├── style.css        (compiled Tailwind + design tokens, all utilities used across pages)
│   └── responsive.css   (media-query overrides split out for clarity)
├── js/
│   ├── config.js        (brand name, nav links, contact info, pricing data, testimonials)
│   └── script.js        (mobile menu toggle, smooth scroll, form handling, animations, active-nav)
├── images/
│   └── digigron-mark.png
└── assets/              (reserved for future static files)
```

No `fonts/` folder unless the source uses a self-hosted font (it currently relies on system stack via Tailwind defaults — I'll keep it that way to match the current look).

## Conversion approach

1. **Delete all React/Node scaffolding**: `package.json`, `bun.lock`, `bunfig.toml`, `vite.config.ts`, `tsconfig.json`, `eslint.config.js`, `components.json`, `.prettier*`, `.lovable/`, `src/`, `public/`.
2. **Generate `css/style.css`** by translating every Tailwind class actually used in the 7 routes + header/footer into hand-written CSS rules, plus the design tokens (colors, radii, dark mode variables) from `src/styles.css`. `css/responsive.css` holds the `@media` breakpoints (sm/md/lg → 640/768/1024px, matching Tailwind's defaults so nothing shifts visually).
3. **Build each HTML page** with semantic markup that mirrors the current JSX one-for-one (same tags, same class names, same order, same text). Header/footer are pasted verbatim into every page; the active nav link is marked with an `aria-current="page"` attribute.
4. **`js/config.js`** exposes a single `window.SITE_CONFIG` object (brand, nav, phone/email, social links) so future rebrands are one-file edits — matches the intent of the current `SiteLayout`/`SiteHeader` props.
5. **`js/script.js`** implements: mobile nav toggle, dropdown/accordion behavior (pricing FAQ, services details), form submit handler for contact page (client-side validation + `mailto:` fallback since GitHub Pages has no backend), reveal-on-scroll animations using `IntersectionObserver`, active-link highlight, and any hover/keyboard interactions the React version had.
6. **404.html** styled to match, with a "Go home" link — reuses the existing 404 markup from `__root.tsx`.
7. **`<head>` metadata**: each page carries its own title/description/OG/Twitter tags derived from that route's `head()` export, so social sharing still works.
8. **Relative paths only** (`./css/…`, `./images/…`, `about.html`) so `file://` and GitHub Pages both work.

## Technical notes

- The contact form has no backend today (it was a client-side React form). I'll wire it to `mailto:` with the address from `config.js`; if you'd rather use Formspree/Getform, tell me and I'll swap the endpoint.
- Tailwind's utility CSS will be hand-compiled (not shipped as the full Tailwind file) so the final CSS stays small and readable — no build step needed.
- Dark-mode variables from `styles.css` are preserved; I'll keep whatever the current default is (the source ships light + `.dark` overrides but no toggle UI, so behavior stays identical).
- Sitemap is regenerated as a static `sitemap.xml` (was dynamic in TanStack).

## Deliverable

I'll rewrite the current project workspace so its root matches the tree above. You can then `git push` it to any GitHub Pages repo — no build, no Node, no npm.

## One clarifying question before I build

The contact form: OK to use `mailto:` (opens the user's email client) as the no-backend option, or do you want me to wire it to a free form service like Formspree (you'd paste a form ID later)?
