import React, { useEffect } from 'react';
import { adMobRewardedService } from '../game/adService';

interface BannerAdProps {
  position?: 'home-bottom' | 'puzzle-bottom';
  className?: string;
}

export const BannerAd: React.FC<BannerAdProps> = ({ position = 'home-bottom', className = '' }) => {
  const hasNativeBridge = adMobRewardedService.isNativeBridgePresent();

  useEffect(() => {
    if (hasNativeBridge) {
      adMobRewardedService.showBanner('BOTTOM');
    }

    return () => {
      if (hasNativeBridge) {
        adMobRewardedService.hideBanner();
      }
    };
  }, [hasNativeBridge]);

  // If native Android Google Mobile Ads bridge is not present (e.g. web browser preview),
  // do NOT render a broken ad or fake element. The native AdMob banner attaches cleanly in Android.
  if (!hasNativeBridge) {
    return null;
  }

  return (
    <div
      role="region"
      aria-label="Google AdMob Banner Area"
      id="admob-banner-container"
      className={`shrink-0 w-full min-h-[50px] flex items-center justify-center bg-slate-900/[0.02] border-t border-slate-200/50 select-none ${className}`}
    >
      {/* Native Android WebView / Capacitor Google Mobile Ads attaches Banner Ad here */}
    </div>
  );
};
