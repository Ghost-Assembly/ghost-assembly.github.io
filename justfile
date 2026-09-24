set shell := ["bash", "-euo", "pipefail", "-c"]

port := "8000"
source_logo := "assets/logo-source.png"
out := "docs/assets"

# List available recipes
default:
    @just --list

# Install dependencies, dev tooling and the test browsers
setup:
    mise install
    npm ci
    npx playwright install chromium firefox
    @echo "ready"

# Format code in place
fmt:
    npx prettier --write .

# Static analysis; changes nothing
lint:
    npx prettier --check .
    actionlint
    zizmor .github/workflows/

# Run the browser suite (Chromium and Firefox)
test *args:
    npx playwright test {{ args }}

# Full local security scan
security:
    osv-scanner scan source --lockfile=package-lock.json
    gitleaks detect --no-banner --redact

# Nothing to build — docs/ is published as-is
build:
    @echo "docs/ is served as-is by GitHub Pages"

# Serve the site locally
run:
    @echo "http://localhost:{{ port }}"
    python3 -m http.server {{ port }} --directory docs

# Regenerate the images in docs/assets from the source logo. Offsets are the
# measured bounds of the emblem and of the whole logo in the 1254px source.
# Rebuild derived images (and the GitHub avatar) from the source logo
assets:
    magick {{ source_logo }} -crop 1130x1118+72+68 +repage -resize 720x \
        -quality 88 -define webp:alpha-quality=100 {{ out }}/logo.webp
    magick {{ source_logo }} -crop 830x830+215+64 +repage -resize 192x192 \
        -quality 90 -define webp:alpha-quality=100 {{ out }}/emblem.webp
    magick {{ source_logo }} -crop 830x830+215+64 +repage -resize 32x32 \
        -strip {{ out }}/favicon.png
    magick {{ source_logo }} -crop 830x830+215+64 +repage -resize 148x148 \
        -background '#03030a' -gravity center -extent 180x180 \
        -strip {{ out }}/apple-touch-icon.png
    magick {{ source_logo }} -crop 830x830+215+64 +repage -resize 448x448 \
        -background '#03030a' -gravity center -extent 512x512 \
        -strip assets/avatar.png
    magick {{ source_logo }} -crop 1130x1118+72+68 +repage -resize x560 \
        -background '#03030a' -gravity center -extent 1200x630 \
        -strip -quality 95 {{ out }}/og-image.png

# Remove installed dependencies and test output
[confirm("remove node_modules and test output?")]
clean:
    rm -rf node_modules test-results playwright-report

# Everything CI runs, in order
ci: lint test security build
