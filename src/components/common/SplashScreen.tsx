import React from 'react';
import { BizFlowPreloader } from './BizFlowPreloader';

export interface SplashScreenProps {
  businessName?: string;
  status?: string;
  isExiting?: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  status = 'Initializing application...',
  isExiting = false,
}) => {
  return (
    <BizFlowPreloader
      size="md"
      fullScreen={true}
      status={status}
      showWordmark={true}
      isExiting={isExiting}
    />
  );
};

