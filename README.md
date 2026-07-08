# DigiGron — Static Website

Pure HTML5, CSS3 and vanilla JavaScript. No build step, no Node.js, no framework.

## Structure

```
digigron/
├── index.html          Homepage
├── about.html          About page
├── services.html       Services overview + detail rows
├── portfolio.html      Case studies
├── pricing.html        Plans + FAQ
├── reviews.html        Customer reviews (localStorage backed)
├── contact.html        Contact form (mailto:)
├── 404.html            GitHub Pages error page
├── sitemap.xml
├── robots.txt
├── favicon.ico
├── css/
│   ├── style.css       Design tokens + utilities
│   └── responsive.css  Mobile / tablet breakpoints
├── js/
│   ├── config.js       Brand config (edit in one place)
│   └── script.js       Nav, form, reviews, scroll reveal
├── images/
│   └── digigron-mark.png
└── assets/             Reserved for extra static files
```

## Local preview

Open `index.html` directly in a browser, or serve locally:

```bash
python3 -m http.server 8000
```

## Deploy to GitHub Pages

1. Push this folder to a GitHub repo.
2. In the repo **Settings → Pages**, pick the branch (usually `main`) and root folder (`/`).
3. GitHub serves it — no build command needed.

## Editing content

- Brand name, phone, email, address, navigation → `js/config.js`
- Global styles / color tokens → top of `css/style.css`
- Copy on each page → the matching `*.html` file
