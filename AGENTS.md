# AGENTS.md

Guidance for coding agents working on the Ghost Assembly organization site,
<https://ghost-assembly.github.io/>. Read `README.md` for the human overview; this file
holds the rules that are not obvious from the code.

## What gets published

- GitHub Pages deploys from branch `main`, folder `/docs` (build type "legacy", not an
  Actions workflow). Merging to `main` publishes.
- **Everything in `docs/` is public, and nothing outside it is.** Keep tooling, tests,
  the design notes and the source logo out of `docs/`.
- `docs/.nojekyll` disables Jekyll. Do not remove it.
- The project docs at `/quickmusic/`, `/quickrem/`, `/quicktiler/` and `/quickts/` are
  published from those projects' own repositories. Never create `docs/quickrem/` (or any
  other project name) here — it would collide with them.

## Hard constraints

These are deliberate and the test suite enforces most of them.

- Hand-written HTML and CSS, no framework, no build step, no bundler.
- No JavaScript on the page. Theme follows `prefers-color-scheme`; navigation is anchors.
- No third-party requests from the page. Fonts and images are self-hosted in
  `docs/assets/`. A test fails on any request to another origin.
- WCAG 2.2 AA. axe runs in both color schemes with the `wcag2a`, `wcag2aa`,
  `wcag21aa`, `wcag22aa` and `best-practice` tags, and must report zero violations.
- No horizontal scroll at 360px wide.
- Motion only inside `@media (prefers-reduced-motion: no-preference)`. The hero halo is
  the page's one animation; a test checks it runs normally and never under reduced
  motion.

## Design rules

- Color tokens live on `:root` in `docs/style.css`, with a light override under
  `prefers-color-scheme: light`. Brand stops are sampled from the logo: cyan `#00a8fc`,
  blue `#2f5afc`, magenta `#d601fc`; paper `#03030a`.
- `.night` (top bar and hero) re-declares the dark tokens so it stays dark in both
  schemes — the logo's silver wordmark is illegible on a light background. Keep it that
  way.
- The gradient is decoration only (halo, button border, project rules). Never put text
  on it.
- Headings use Orbitron (self-hosted, OFL); body text uses the system font stack.
- Use logical properties (`margin-block-start`, `padding-inline-start`), not physical
  ones.

## Commands

The toolchain is pinned in `mise.toml`; commands live in the `justfile`.

```bash
just setup    # mise install, npm ci, Playwright's Chromium and Firefox
just run      # serve docs/ on http://localhost:8000
just test     # Playwright suite (Chromium and Firefox)
just lint     # prettier --check, actionlint, zizmor
just fmt      # prettier --write
just ci       # lint, test, security, build — exactly what CI runs
just assets   # regenerate docs/assets images and assets/avatar.png
```

Run `just ci` before claiming a change works. Tests target Chromium and Firefox only;
WebKit is not supported on the maintainer's Fedora base, so do not add it.

## Adding or changing a project

A project appears in three places, and all three must change together:

1. `docs/index.html` — an `<article class="project">` in the right group. Link Docs to
   `https://ghost-assembly.github.io/<slug>/` only if that project publishes a docs
   site; otherwise give it Source only.
2. `tests/site.spec.js` — the `projects` list at the top, so its links are checked.
3. The org profile README, `profile/README.md` in the separate
   [Ghost-Assembly/.github](https://github.com/Ghost-Assembly/.github) repository.

Take summaries from the project's own `README.md` and, for GNOME extensions, the
supported versions from `shell-version` in its `metadata.json`. Do not invent claims.

## Images

Every image in `docs/assets/` is derived from `assets/logo-source.png` by
`just assets`. Edit the recipe rather than individual images. The crop offsets in the
recipe are the measured bounds of the emblem and the whole logo in the 1254px source.
`assets/avatar.png` is the GitHub org avatar and is intentionally not published.

## Change workflow

- Branch from `main`, open a pull request, and squash-merge once the `ci` job (which
  runs `just ci`) passes.
- Conventional Commits, imperative subject, no trailing period.
- Third-party GitHub Actions are pinned by commit SHA with the version in a comment.
- `design/` holds the agreed design notes. Update them when the design changes.
