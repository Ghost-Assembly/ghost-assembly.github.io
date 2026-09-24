import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const org = 'https://github.com/Ghost-Assembly';
const pages = 'https://ghost-assembly.github.io';

// Every project on the page, and the links its card must carry. A project with
// no docs site has `docs: null`, and its card must not grow a Docs link.
const projects = [
    { name: 'QuickRem', slug: 'quickrem', docs: true },
    { name: 'QuickTiler', slug: 'quicktiler', docs: true },
    { name: 'QuickTS', slug: 'quickts', docs: true },
    { name: 'awsdiag', slug: 'awsdiag', docs: false },
];

test('loads every asset from its own origin, without errors', async ({
    page,
    baseURL,
}) => {
    const problems = [];
    page.on('console', msg => {
        if (msg.type() === 'error') problems.push(`console: ${msg.text()}`);
    });
    page.on('pageerror', err => problems.push(`pageerror: ${err.message}`));
    page.on('requestfailed', req => problems.push(`failed: ${req.url()}`));
    page.on('request', req => {
        if (!req.url().startsWith(baseURL)) problems.push(`external: ${req.url()}`);
    });
    page.on('response', res => {
        if (res.status() >= 400) problems.push(`${res.status()}: ${res.url()}`);
    });

    await page.goto('/', { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);

    expect(problems).toEqual([]);
    await expect(page).toHaveTitle('Ghost Assembly');
});

test('images and social metadata resolve', async ({ page, request }) => {
    await page.goto('/');

    const broken = await page
        .locator('img')
        .evaluateAll(imgs => imgs.filter(i => !i.naturalWidth).map(i => i.src));
    expect(broken).toEqual([]);

    // Absolute URLs point at production; check the same path locally.
    const og = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(og).toMatch(new RegExp(`^${pages}/`));
    const res = await request.get(new URL(og).pathname);
    expect(res.status()).toBe(200);

    for (const rel of ['icon', 'apple-touch-icon']) {
        const href = await page.locator(`link[rel="${rel}"]`).getAttribute('href');
        expect((await request.get(href)).status(), rel).toBe(200);
    }
});

test('lists each project with the right links', async ({ page }) => {
    await page.goto('/');
    const cards = page.locator('#projects article');
    await expect(cards).toHaveCount(projects.length);

    for (const p of projects) {
        const card = cards.filter({ has: page.getByRole('heading', { name: p.name }) });
        await expect(card).toHaveCount(1);
        await expect(card.getByRole('link', { name: /source/i })).toHaveAttribute(
            'href',
            `${org}/${p.slug}`,
        );
        const docs = card.getByRole('link', { name: /docs/i });
        if (p.docs) {
            await expect(docs).toHaveAttribute('href', `${pages}/${p.slug}/`);
        } else {
            await expect(docs).toHaveCount(0);
        }
    }
});

test('in-page links land on real targets', async ({ page }) => {
    await page.goto('/');
    const targets = await page
        .locator('a[href^="#"]')
        .evaluateAll(as => as.map(a => a.getAttribute('href')));
    expect(targets.length).toBeGreaterThan(0);
    for (const t of targets) {
        await expect(page.locator(t), t).toHaveCount(1);
    }
});

for (const colorScheme of ['dark', 'light']) {
    test.describe(`${colorScheme} scheme`, () => {
        test.use({ colorScheme });

        test('has no accessibility violations', async ({ page }) => {
            await page.goto('/');
            await page.evaluate(() => document.fonts.ready);
            const { violations } = await new AxeBuilder({ page })
                .withTags([
                    'wcag2a',
                    'wcag2aa',
                    'wcag21aa',
                    'wcag22aa',
                    'best-practice',
                ])
                .analyze();
            expect(violations.map(v => `${v.id}: ${v.help}`)).toEqual([]);
        });

        test('fits a 360px phone without sideways scrolling', async ({ page }) => {
            await page.setViewportSize({ width: 360, height: 800 });
            await page.goto('/');
            const overflow = await page.evaluate(
                () =>
                    document.documentElement.scrollWidth -
                    document.documentElement.clientWidth,
            );
            expect(overflow).toBeLessThanOrEqual(0);
        });
    });
}

test('the halo breathes when motion is allowed', async ({ page }) => {
    await page.goto('/');
    const animations = await page.evaluate(() => document.getAnimations().length);
    expect(animations).toBeGreaterThan(0);
});

test.describe('reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });

    test('nothing animates', async ({ page }) => {
        await page.goto('/');
        const animations = await page.evaluate(() => document.getAnimations().length);
        expect(animations).toBe(0);
    });
});
