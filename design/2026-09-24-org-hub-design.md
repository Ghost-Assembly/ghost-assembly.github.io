# Ghost Assembly org hub — ghost-assembly.github.io

## Context

`Ghost-Assembly` is a GitHub org with four public projects: `awsdiag` (Rust CLI) and three
GNOME Shell extensions (QuickRem, QuickTiler, QuickTS). Each extension already publishes a
hand-written docs page at `ghost-assembly.github.io/<project>/` from its repo's `docs/`
folder. The org root site repo `ghost-assembly.github.io` is empty (initial commit, MIT
LICENSE, README). The user wants a website for Ghost Assembly using the supplied logo.

Agreed with the user (brainstorming):

- **Purpose:** org project hub — present the org, link each project's docs and source.
- **Look:** neon, dark-first, derived from the logo (black, cyan→blue→magenta). Light variant
  exists for light-scheme readers; hero panel stays dark in both.
- **Approach:** hand-written static HTML + CSS, no framework, no build step, no JS needed
  for any content (matches the project docs sites).
- **Tagline:** "Small, sharp tools for the Linux desktop and the cloud."
- Assumption: `quickcu` (no commits) is omitted until it ships.

Repo: `/var/home/napalm/git/ghost-assembly/ghost-assembly.github.io` (remote
`git@github.com:Ghost-Assembly/ghost-assembly.github.io.git`, branch `main`).
Logo source: `/var/home/napalm/.claude/uploads/6df413c6-8f90-46f4-ad61-495a663155d4/0de9fe98-image.png`
(1254×1254 RGBA, transparent background, 904 KB).

## Design

### Page (single `docs/index.html`)

1. **Skip link + header** — small emblem + "Ghost Assembly" wordmark; nav: Projects, GitHub.
2. **Hero** — full logo (emblem + wordmark image) on an always-dark panel with a soft
   cyan→magenta radial glow; tagline; buttons **Browse projects** (`#projects`) and
   **GitHub** (`https://github.com/Ghost-Assembly`). Optional slow glow pulse on the
   emblem, disabled under `prefers-reduced-motion`.
3. **Projects** (`id="projects"`), two groups:
    - _GNOME Shell extensions_
        - QuickRem — "Remmina connections in the GNOME Quick Settings panel." — tags `GNOME 49–50`
        - QuickTiler — "Keyboard-driven zone tiling for GNOME Shell." — tags `GNOME 49–50`
        - QuickTS — "Tailscale in the GNOME Quick Settings menu." — tags `GNOME 50`
        - Links: **Docs** `https://ghost-assembly.github.io/<name>/`, **Source** `https://github.com/Ghost-Assembly/<name>`
    - _Command-line tools_
        - awsdiag — "Fast, compact AWS diagnostic data acquisition, built to be driven by an AI agent." — tags `Rust`, `CLI`
        - Links: **Source** only (no docs site)
    - Summaries and shell versions come from each repo's `README.md` / `metadata.json`
      (`shell-version`); re-read them at implementation time rather than trusting this list.
4. **Footer** — GitHub org link, "Projects are individually licensed — see each repository.", year.

Also in `<head>`: title "Ghost Assembly", meta description, `theme-color`, Open Graph +
Twitter card tags pointing at `og-image.png`, favicon and apple-touch-icon links.

### Visual system (`docs/style.css`)

- CSS custom properties on `:root` (dark default): near-black paper (`#03030a`, the hood interior), raised
  surface, ink, soft ink, line, and three brand stops sampled from the logo (cyan, blue,
  magenta). `@media (prefers-color-scheme: light)` redefines the tokens for the page
  body; `.hero` pins its own dark tokens so the logo's white wordmark stays legible.
- Gradient used only for decoration: hero glow, card top border / hover glow, heading
  underline. Body text always plain ink on flat background (WCAG AA contrast).
- Cards in a responsive grid (`repeat(auto-fill, minmax(18rem, 1fr))`), 16px side gutter on
  phones, no horizontal scroll at 360px. Visible `:focus-visible` outlines.
- Headings in **Orbitron** (SIL OFL 1.1), self-hosted woff2 (latin subset) in
  `docs/assets/fonts/` with its `OFL.txt`; `font-display: swap`. Body uses `system-ui`
  stack like the docs sites. No external requests from the page.

### Assets (`docs/assets/`, generated once with `magick`, commands recorded in a comment in the justfile `assets` recipe)

- `logo.webp` — full logo resized to ~720px wide (hero), plus `logo.png` only if needed
  for OG.
- `emblem.webp` — circular emblem cropped from the top of the logo (header, ~96px).
- `favicon.png` (32×32) and `apple-touch-icon.png` (180×180, emblem on black).
- `og-image.png` — 1200×630, logo centred on the near-black background.
- The original PNG kept as `assets/logo-source.png` at the repo root (outside `docs/`,
  so it is not published) so derivatives can be regenerated.
- `assets/avatar.png` — 512×512 emblem on black, for the GitHub org avatar (not published).

### Repository layout

```
ghost-assembly.github.io/
├── docs/                  # published by GitHub Pages (main, /docs) — same model as the project repos
│   ├── .nojekyll
│   ├── index.html
│   ├── style.css
│   └── assets/…
├── design/2026-09-24-org-hub-design.md   # this design, kept outside docs/ so it isn't published
├── tests/site.spec.js     # Playwright + axe
├── playwright.config.js   # Chromium + Firefox only (no WebKit on this Fedora base)
├── package.json / package-lock.json   # devDeps: @playwright/test, @axe-core/playwright, prettier
├── .prettierrc.json / .prettierignore  # copy style from quickrem (4-space, etc.)
├── .gitignore             # node_modules, test-results, playwright-report
├── mise.toml              # node lts, just, gitleaks, actionlint, zizmor (pattern: quickrem/mise.toml)
├── justfile               # setup, fmt, lint, test, security, build(no-op note), run, clean, ci, assets
├── .github/workflows/ci.yml       # checkout + jdx/mise-action + `just ci`; actions pinned by SHA; job name `ci`
├── .github/dependabot.yml         # npm + github-actions (copy from quickrem/.github/dependabot.yml)
└── README.md              # what it is, `just setup`, `just run`, how Pages is configured
```

Pattern sources to copy/adapt: `quickrem/justfile`, `quickrem/mise.toml`,
`quickrem/.prettierrc.json`, `quickrem/.github/workflows/ci.yml`,
`quickrem/.github/dependabot.yml`, `awsdiag/playwright.config.mjs`,
`quickrem/docs/style.css` (skip link, reduced-motion, text-size-adjust idioms).

## Implementation steps

1. Branch `feat/org-hub` off `main` in the site repo.
2. Save this design to `design/2026-09-24-org-hub-design.md`.
3. Tooling: `mise.toml`, `package.json`, `.prettierrc.json`, `.prettierignore`,
   `.gitignore`, `justfile`; `just setup` (mise install, npm ci, `npx playwright install chromium firefox`).
4. Write the Playwright suite first (TDD) — it fails until the page exists.
5. Generate assets with `magick` (and `cwebp` if needed); download Orbitron woff2 + OFL.
6. Write `docs/index.html`, `docs/style.css`, `docs/.nojekyll`.
7. CI workflow + dependabot; resolve action SHAs with `gh api repos/<o>/<r>/commits/<tag>`.
8. README update.
9. Commit (Conventional Commits), push, open PR.
10. After merge, with user confirmation: enable Pages via
    `gh api -X POST repos/Ghost-Assembly/ghost-assembly.github.io/pages -f source[branch]=main -f source[path]=/docs`.

## Verification

- `just lint` — prettier check, actionlint, zizmor all clean.
- `just test` — Playwright (Chromium + Firefox), against `python3 -m http.server` via
  `webServer` in the config:
    - page loads with no console errors and no failed requests (all CSS/font/image 200);
    - axe: zero violations, run in both `colorScheme: 'dark'` and `'light'`;
    - at 360×800 `document.documentElement.scrollWidth <= clientWidth`;
    - four project cards present; each Docs/Source href matches the expected URL; awsdiag has no Docs link;
    - reduced-motion: emblem has no running animation.
- `just security` — gitleaks clean.
- Visual check: Playwright screenshots (dark, light, 360px mobile) reviewed by eye and
  shared with the user.
- After Pages is enabled: `xh -h https://ghost-assembly.github.io/` returns 200, and the
  existing `/quickrem/`, `/quicktiler/`, `/quickts/` docs still resolve.
