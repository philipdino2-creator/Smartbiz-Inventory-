/**
 * SEO & Document Metadata Utility for BizFlow Public Marketing Pages
 * Compliant with applet-seo skill guidelines
 */

interface PageSeoConfig {
  title: string;
  description: string;
  canonicalPath: string;
  ogType?: string;
  schema?: Record<string, any>;
}

export const SEO_CONFIGS: Record<string, PageSeoConfig> = {
  '/': {
    title: 'BizFlow – All-in-One Small Business Management & Bookkeeping',
    description: 'Manage sales, track expenses, monitor real-time profitability and organize customer debts with BizFlow. The modern central workspace for growing businesses.',
    canonicalPath: '/',
    ogType: 'website',
  },
  '/features': {
    title: 'Features & Capabilities – BizFlow Business Management',
    description: 'Explore BizFlow features: sales recording, expense tracking, real-time profit visibility, customer debt reminders, POS thermal receipts, and team RBAC.',
    canonicalPath: '/features',
    ogType: 'website',
  },
  '/how-it-works': {
    title: 'How It Works – Simple 3-Step Setup | BizFlow',
    description: 'See how easily you can set up your BizFlow workspace, record daily business transactions, and track your cash flow and profits in minutes.',
    canonicalPath: '/how-it-works',
    ogType: 'website',
  },
  '/pricing': {
    title: 'Pricing & Plans – Transparent Business Access | BizFlow',
    description: 'Transparent pricing designed for growing businesses. Create your free account today to secure early access while commercial plans are being finalized.',
    canonicalPath: '/pricing',
    ogType: 'website',
  },
  '/faq': {
    title: 'Frequently Asked Questions – Help & Answers | BizFlow',
    description: 'Find answers about BizFlow features, mobile access, data protection, multi-user permissions, pricing, and account setup.',
    canonicalPath: '/faq',
    ogType: 'website',
  },
  '/login': {
    title: 'Sign In to Your Workspace – BizFlow',
    description: 'Sign in to access your BizFlow business workspace, record daily transactions, and review financial performance.',
    canonicalPath: '/login',
    ogType: 'website',
  },
  '/register': {
    title: 'Get Started with BizFlow – Create Business Account',
    description: 'Create your BizFlow account in seconds. Take full control of your business numbers, sales, expenses, and profitability.',
    canonicalPath: '/register',
    ogType: 'website',
  },
  '/forgot-password': {
    title: 'Reset Your Password – BizFlow Account Recovery',
    description: 'Recover access to your BizFlow business workspace with our secure password reset verification.',
    canonicalPath: '/forgot-password',
    ogType: 'website',
  },
};

export function updatePageSeo(pathname: string) {
  if (typeof document === 'undefined') return;

  const config = SEO_CONFIGS[pathname] || SEO_CONFIGS['/'];

  // Title
  document.title = config.title;

  // Meta description
  let metaDesc = document.querySelector('meta[name="description"]');
  if (!metaDesc) {
    metaDesc = document.createElement('meta');
    metaDesc.setAttribute('name', 'description');
    document.head.appendChild(metaDesc);
  }
  metaDesc.setAttribute('content', config.description);

  // Open Graph Title
  let ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) {
    ogTitle.setAttribute('content', config.title);
  }

  // Open Graph Description
  let ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) {
    ogDesc.setAttribute('content', config.description);
  }

  // Canonical URL
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  const origin = window.location.origin;
  canonical.setAttribute('href', `${origin}${config.canonicalPath}`);

  // Open Graph URL
  let ogUrl = document.querySelector('meta[property="og:url"]');
  if (!ogUrl) {
    ogUrl = document.createElement('meta');
    ogUrl.setAttribute('property', 'og:url');
    document.head.appendChild(ogUrl);
  }
  ogUrl.setAttribute('content', `${origin}${config.canonicalPath}`);
}
