"use client";

import { useEffect, useState } from 'react';

export default function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    if (typeof window !== 'undefined') {
      // Browser connectivity is an external value synchronized when the client mounts.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsOffline(!navigator.onLine);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      // Register PWA service worker
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch((err) => {
          console.error('Service worker registration failed:', err);
        });
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="bg-amber-600 text-white text-xs font-mono text-center py-2 px-4 border-b border-amber-700 flex items-center justify-center gap-2">
      <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
      <strong>OFFLINE MODE:</strong> You are currently offline. Viewing the cached broadsheet issue.
    </div>
  );
}
