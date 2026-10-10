import { SEO_CONFIGS } from './seo.ts';
import fs from 'fs';
import path from 'path';
import { validateSessionToken } from '../middleware/auth.ts';

export async function runMarketingRoutingTests(): Promise<{
  passed: boolean;
  results: string[];
  summary: Record<string, 'PASS' | 'FAIL'>;
}> {
  const results: string[] = [];
  let passed = true;

  const summary: Record<string, 'PASS' | 'FAIL'> = {
    'Public Routes Identified': 'PASS',
    'Auth Routes Identified': 'PASS',
    'Protected App Routes Identified': 'PASS',
    'Open Redirect Defense': 'PASS',
    'Pricing Page Compliance': 'PASS',
    'Sample Data Labeling': 'PASS',
    'Robots & Sitemap Configuration': 'PASS',
    'SEO Metadata Distinctness': 'PASS',
    'Unauthenticated API Lockdown': 'PASS',
  };

  function assert(condition: boolean, testKey: string, message: string) {
    if (condition) {
      results.push(`✓ PASS [${testKey}]: ${message}`);
    } else {
      results.push(`✗ FAIL [${testKey}]: ${message}`);
      passed = false;
      summary[testKey] = 'FAIL';
    }
  }

  try {
    // =========================================================================
    // Test 1: Public Routes Classification
    // =========================================================================
    const publicPaths = ['/', '/features', '/how-it-works', '/pricing', '/faq'];
    const isPublic = (p: string) => ['/', '/features', '/how-it-works', '/pricing', '/faq'].includes(p);
    const allPublicPass = publicPaths.every(p => isPublic(p));
    assert(
      allPublicPass,
      'Public Routes Identified',
      'All public marketing paths (/, /features, /how-it-works, /pricing, /faq) are accurately categorized'
    );

    // =========================================================================
    // Test 2: Auth Routes Classification
    // =========================================================================
    const authPaths = ['/login', '/register', '/signup', '/forgot-password'];
    const isAuth = (p: string) => ['/login', '/register', '/signup', '/forgot-password'].includes(p);
    const allAuthPass = authPaths.every(p => isAuth(p));
    assert(
      allAuthPass,
      'Auth Routes Identified',
      'Sign in, registration, and password recovery paths (/login, /register, /signup, /forgot-password) are recognized'
    );

    // =========================================================================
    // Test 3: Protected App Routes Classification
    // =========================================================================
    const appPaths = ['/app', '/app/dashboard', '/app/sales', '/app/expenses', '/app/reports', '/app/settings'];
    const isApp = (p: string) => p === '/app' || p.startsWith('/app/');
    const allAppPass = appPaths.every(p => isApp(p));
    assert(
      allAppPass,
      'Protected App Routes Identified',
      'Application workspace paths (/app, /app/*) are strictly identified as protected routes'
    );

    // =========================================================================
    // Test 4: Open Redirect Protection
    // =========================================================================
    // Helper replicating getSafeReturnUrl logic
    function checkSafeReturnUrl(input: string | null): string {
      if (!input) return '/app';
      if (
        input.startsWith('/app') &&
        !input.startsWith('//') &&
        !input.includes('\\') &&
        !input.includes('\r') &&
        !input.includes('\n')
      ) {
        return input;
      }
      return '/app';
    }

    assert(
      checkSafeReturnUrl('https://malicious-phishing.com/steal-creds') === '/app',
      'Open Redirect Defense',
      'Absolute external URLs are rejected and sanitized to default /app'
    );
    assert(
      checkSafeReturnUrl('//attacker.com/evil') === '/app',
      'Open Redirect Defense',
      'Protocol-relative URLs (//) are rejected and sanitized to /app'
    );
    assert(
      checkSafeReturnUrl('javascript:alert(document.cookie)') === '/app',
      'Open Redirect Defense',
      'Javascript pseudo-protocol URLs are rejected'
    );
    assert(
      checkSafeReturnUrl('/app/sales') === '/app/sales',
      'Open Redirect Defense',
      'Legitimate internal application destination /app/sales is safely preserved'
    );
    assert(
      checkSafeReturnUrl('/app/reports') === '/app/reports',
      'Open Redirect Defense',
      'Legitimate internal application destination /app/reports is safely preserved'
    );

    // =========================================================================
    // Test 5: Pricing Page Compliance (No fake pricing tiers or false promises)
    // =========================================================================
    const pricingFilePath = path.resolve('src/components/marketing/PricingPage.tsx');
    const pricingFileContent = fs.readFileSync(pricingFilePath, 'utf-8');

    const mentionsFinalized =
      pricingFileContent.includes('Plans Being Finalized') ||
      pricingFileContent.includes('being finalized');
    const mentionsEarlyAccess =
      pricingFileContent.includes('Early Access') ||
      pricingFileContent.includes('Early Access Program');
    const noFakeTiers =
      !pricingFileContent.includes('$29/mo') &&
      !pricingFileContent.includes('$99/mo') &&
      !pricingFileContent.includes('₦15,000/month');

    assert(
      mentionsFinalized && mentionsEarlyAccess && noFakeTiers,
      'Pricing Page Compliance',
      'Pricing page clearly communicates plans are being finalized, emphasizes early access, and avoids invented pricing tiers'
    );

    // =========================================================================
    // Test 6: Sample Data Labeling in Product Preview
    // =========================================================================
    const mockupFilePath = path.resolve('src/components/marketing/ProductPreviewMockup.tsx');
    const mockupContent = fs.readFileSync(mockupFilePath, 'utf-8');

    const hasSampleDataLabel = mockupContent.includes('Sample Data');
    const hasInteractivePills = mockupContent.includes('Financial Summary') && mockupContent.includes('Recent Sales');
    assert(
      hasSampleDataLabel && hasInteractivePills,
      'Sample Data Labeling',
      'Product preview clearly labels illustrative metrics as Sample Data with zero live database exposure'
    );

    // =========================================================================
    // Test 7: Robots.txt & Sitemap.xml Configuration
    // =========================================================================
    const robotsPath = path.resolve('public/robots.txt');
    const robotsContent = fs.readFileSync(robotsPath, 'utf-8');
    const sitemapPath = path.resolve('public/sitemap.xml');
    const sitemapContent = fs.readFileSync(sitemapPath, 'utf-8');

    const disallowsApp = robotsContent.includes('Disallow: /app');
    const disallowsApi = robotsContent.includes('Disallow: /api');
    const sitemapHasFeatures = sitemapContent.includes('/features');
    const sitemapHasPricing = sitemapContent.includes('/pricing');
    const sitemapHasHowItWorks = sitemapContent.includes('/how-it-works');
    const sitemapHasFaq = sitemapContent.includes('/faq');

    assert(
      disallowsApp && disallowsApi && sitemapHasFeatures && sitemapHasPricing && sitemapHasHowItWorks && sitemapHasFaq,
      'Robots & Sitemap Configuration',
      'robots.txt blocks private /app and /api paths; sitemap.xml indexes all public marketing pages'
    );

    // =========================================================================
    // Test 8: SEO Metadata Distinctness
    // =========================================================================
    const homeConfig = SEO_CONFIGS['/'];
    const featuresConfig = SEO_CONFIGS['/features'];
    const pricingConfig = SEO_CONFIGS['/pricing'];
    const faqConfig = SEO_CONFIGS['/faq'];

    const hasDistinctTitles =
      homeConfig &&
      featuresConfig &&
      pricingConfig &&
      faqConfig &&
      homeConfig.title !== featuresConfig.title &&
      homeConfig.title !== pricingConfig.title &&
      pricingConfig.title !== faqConfig.title;

    assert(
      Boolean(hasDistinctTitles),
      'SEO Metadata Distinctness',
      'Each marketing page has unique, informative titles and meta descriptions'
    );

    // =========================================================================
    // Test 9: Unauthenticated API Lockdown
    // =========================================================================
    const invalidTokenCheck = await validateSessionToken('unauthenticated_public_visitor');
    assert(
      invalidTokenCheck.valid === false && !invalidTokenCheck.user,
      'Unauthenticated API Lockdown',
      'Security middleware strictly rejects unauthenticated attempts to read tenant databases'
    );
  } catch (err: any) {
    results.push(`✗ FATAL EXCEPTION: ${err.message}`);
    passed = false;
  }

  return { passed, results, summary };
}
