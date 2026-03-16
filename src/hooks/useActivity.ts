import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
export function useActivity(userId) {
  const pathname = usePathname();
  useEffect(() => {
    if (!userId) return;

    const sendHeartbeat = async () => {
      try {
        await fetch('/api/users/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, path: pathname })
        });
      } catch (error) {
        console.error("Heartbeat failed", error);
      }
    };
    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 30000);
    return () => clearInterval(interval);
  }, [userId, pathname]);
}