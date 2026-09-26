# ghost-assembly.github.io

[![ci](https://github.com/Ghost-Assembly/ghost-assembly.github.io/actions/workflows/ci.yml/badge.svg)](https://github.com/Ghost-Assembly/ghost-assembly.github.io/actions/workflows/ci.yml)

The Ghost Assembly organization site: **<https://ghost-assembly.com/>**.

One hand-written page listing the org's projects, with links to each one's docs and
source. No framework, no build step and no JavaScript on the page — `docs/` is what
GitHub Pages serves, as-is.

Each project publishes its own docs from its own repository's `docs/` folder, at
`https://ghost-assembly.com/<project>/`. This repository only owns the root.

## Develop

Needs [mise](https://mise.jdx.dev/) and Python 3 (for the local server).

```bash
just setup   # toolchain, npm packages, Chromium and Firefox for the tests
just run     # serve docs/ on http://localhost:8000
just ci      # everything CI runs: lint, test, security, build
```

`just --list` shows the rest.

## Adding a project

A project appears in three places, and all three must change together:

1. An `<article class="project">` in the right group in `docs/index.html`. A project
   with no docs site gets a Source link only.
2. An entry in the `projects` list at the top of `tests/site.spec.js`, so the suite
   checks its links.
3. The org profile README, `profile/README.md` in the separate
   [Ghost-Assembly/.github](https://github.com/Ghost-Assembly/.github) repository.

## Images

Everything in `docs/assets/` except the font is derived from
`assets/logo-source.png`. After changing the source, run `just assets` to
regenerate them. The same recipe writes `assets/avatar.png` (512×512 emblem on
black), the GitHub organization avatar — it is not published with the site.

The heading font is [Orbitron](https://github.com/theleagueof/orbitron), self-hosted
under the SIL Open Font License (`docs/assets/fonts/OFL.txt`).

## Publishing

GitHub Pages is set to deploy from the `main` branch, `/docs` folder. Merging to
`main` publishes.
