/**
 * Lighthouse CI (D1 quality harness): the rich design fixtures, published mode, rendered by the
 * test-mode server at /dev-site/<kit>-rich (outside the studio layout, like a client site).
 * Run: npm run lhci -w apps/builder  (needs `next build` with BUILDER_TEST_MODE=1 first).
 *
 * Budgets (DESIGN_UPGRADE_PLAN D1): performance >= 0.95, accessibility = 1, best-practices >= 0.95,
 * SEO = 1, CLS < 0.02, LCP < 2.0 s (D4). One SEO audit is skipped (so it does not count toward the score): `is-crawlable`,
 * because this harness route is noindex on purpose (a test page on localhost). Published client sites
 * keep their own indexing checks (Phase 3/4 tests).
 */
const KITS = ['food-truck', 'restaurant', 'landlord', 'real-estate', 'tree-lawn', 'nonprofit', 'training-school', 'trucking', 'oilfield', 'service']
const PORT = Number(process.env.LHCI_PORT || 3200)
// LHCI_ONLY=food-truck,restaurant limits the run to some kits.
const ONLY = process.env.LHCI_ONLY ? process.env.LHCI_ONLY.split(',') : null

const BUDGETS = {
  'categories:performance': ['error', { minScore: 0.95 }],
  'categories:accessibility': ['error', { minScore: 1 }],
  'categories:best-practices': ['error', { minScore: 0.95 }],
  'categories:seo': ['error', { minScore: 1 }],
  'cumulative-layout-shift': ['error', { maxNumericValue: 0.02 }],
  'largest-contentful-paint': ['error', { maxNumericValue: 2000 }],
}

module.exports = {
  ci: {
    collect: {
      startServerCommand: `BUILDER_TEST_MODE=1 OPERATOR_EMAIL=ops@yakini.example npx next start -p ${PORT}`,
      startServerReadyPattern: 'Ready',
      url: KITS.filter((k) => !ONLY || ONLY.includes(k)).map((k) => `http://localhost:${PORT}/dev-site/${k}-rich`),
      numberOfRuns: Number(process.env.LHCI_RUNS || 3),
      settings: { chromeFlags: '--no-sandbox --headless=new', skipAudits: ['is-crawlable'], ...(process.env.CHROME_PATH ? { chromePath: process.env.CHROME_PATH } : {}) },
    },
    assert: {
      // D4 and D4-1: every kit meets every budget, including LCP < 2.0 s on the throttled phone run.
      // No per-kit exceptions.
      assertions: BUDGETS,
    },
    upload: { target: 'filesystem', outputDir: process.env.LHCI_OUT || './lhci-report' },
  },
}
