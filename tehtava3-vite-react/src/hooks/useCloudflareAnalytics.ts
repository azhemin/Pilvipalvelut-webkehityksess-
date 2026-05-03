import { useCallback } from 'react';
import { getConsentValue } from '../components/ConsentBanner';

function useCloudflareAnalytics() {
  const trackEvent = useCallback(
    (eventName: string, data?: Record<string, any>) => {
      if (!getConsentValue()) return; // Tarkistetaan käyttäjän suostumus
      if (!window._cfq) {
        window._cfq = [];
      }

      window._cfq.push([
        "trackEvent",
        {
          name: eventName,
          ...data,
          timestamp: new Date().toISOString(),
        },
      ]);
    },
    []
  );

  return { trackEvent };
}

export default useCloudflareAnalytics;
