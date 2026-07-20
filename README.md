# yakuma-website

Final React/Vite static site for Yakuma.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run lint
npm run sitemap
npm run robots
npm run build
npm run verify
npm run preview
```

The `PortfolioWebsite/` folder is a local reference project only and is ignored by this repository.

`npm run build` runs the sitemap and robots generators automatically through `prebuild`; the standalone commands are useful when reviewing route changes. The build also copies the German localized not-found page to `dist/404.html` through `postbuild` so static hosts have a default fallback document. Every static route is mirrored from `route.html` to `route/index.html` during `postbuild`, which keeps direct clean URL requests working on hosts that do not resolve extensionless HTML files automatically. `public/CNAME` is set to the configured production hostname, `public/.nojekyll` keeps GitHub-Pages-style hosts from applying Jekyll processing to the static output, and `public/_headers` provides conservative security and caching headers for hosts that support that file.

Pending legal document slots are rendered for route completeness but marked `noindex` until the real scoped documents are provided.

## Public URL aliases

The public, language-neutral Hoshi aliases are generated as part of the static-site build. They use an immediate HTML meta refresh to their English canonical pages because GitHub Pages does not support server-side redirects:

- `/games` → `/en/games/hoshi`
- `/games/hoshi`, `/games/hoshi/download`
- `/games/hoshi/legal/imprint`, `/games/hoshi/legal/privacy-policy`, `/games/hoshi/legal/terms-of-service`

The alias list lives in `src/routes/localizedPaths.js`; adding an entry automatically produces both the static HTML file and its clean-URL `index.html` counterpart. Alias pages are `noindex, follow`, canonicalize to their English target, and are deliberately excluded from the sitemap. The fixed locale fallback is English (`en`). Query strings and fragments are retained when JavaScript is available; a pure GitHub Pages meta refresh cannot interpolate them for JavaScript-disabled requests.

## External Links

Store badges and public social profiles do not use fake URLs. Add real targets in:

- `src/config/storeLinks.js`
- `src/config/socialLinks.js`
- `src/config/mediaLinks.js`
