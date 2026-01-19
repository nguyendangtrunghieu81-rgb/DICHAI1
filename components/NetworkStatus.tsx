import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

export const NetworkStatus: React.FC = () => {
  const [ping, setPing] = useState<number | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  useEffect(() => {
    if (!isOnline) {
      setPing(null);
      return;
    }

    const checkPing = async () => {
      const start = performance.now();
      try {
        // Fetching a tiny resource to measure round-trip time
        // Using a reliable CDN or public endpoint that allows CORS or a simple HEAD request
        await fetch('https://www.google.com/generate_204', { mode: 'no-cors', cache: 'no-store' });
        const end = performance.now();
        setPing(Math.round(end - start));
      } catch (e) {
        setPing(null); // Request failed
      }
    };

    const interval = setInterval(checkPing, 2000);
    checkPing(); // Initial check

    return () => clearInterval(interval);
  }, [isOnline]);

  const getPingColor = (ms: number) => {
    if (ms < 100) return 'text-green-500';
    if (ms < 300) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-slate-200 shadow-sm text-xs font-medium">
      {isOnline ? (
        <>
          <Wifi className={`w-3 h-3 ${ping !== null ? getPingColor(ping) : 'text-slate-400'}`} />
          <span className="text-slate-600">
            {ping !== null ? `${ping}ms` : 'Checking...'}
          </span>
        </>
      ) : (
        <>
          <WifiOff className="w-3 h-3 text-red-500" />
          <span className="text-red-500">Offline</span>
        </>
      )}
    </div>
  );
};