import React, { useEffect } from 'react';
import { useRouter } from '../../context/RouterContext';
import { updatePageSeo } from '../../utils/seo';
import { MarketingNavbar } from './MarketingNavbar';
import { MarketingFooter } from './MarketingFooter';
import { HomePage } from './HomePage';
import { FeaturesPage } from './FeaturesPage';
import { HowItWorksPage } from './HowItWorksPage';
import { PricingPage } from './PricingPage';
import { FaqPage } from './FaqPage';

export const MarketingLayout: React.FC = () => {
  const { path } = useRouter();

  // Sync SEO title, metadata, canonical URLs & OpenGraph cards on every route change
  useEffect(() => {
    updatePageSeo(path);
  }, [path]);

  const renderContent = () => {
    switch (path) {
      case '/features':
        return <FeaturesPage />;
      case '/how-it-works':
        return <HowItWorksPage />;
      case '/pricing':
        return <PricingPage />;
      case '/faq':
        return <FaqPage />;
      case '/':
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-purple-100 dark:selection:bg-purple-900 selection:text-purple-900 dark:selection:text-purple-100 transition-colors duration-200">
      {/* Public SaaS Navigation Header */}
      <MarketingNavbar />

      {/* Main Marketing Page Content */}
      <main className="flex-1">
        {renderContent()}
      </main>

      {/* Public Footer */}
      <MarketingFooter />
    </div>
  );
};
