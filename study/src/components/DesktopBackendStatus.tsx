/**
 * Desktop Backend Status Component
 * Shows backend connection status in the app
 */

import { useEffect, useState } from 'react';

interface BackendStatus {
  status: 'connected' | 'disconnected' | 'error';
  message?: string;
  url?: string;
}

export function DesktopBackendStatus() {
  const [status, setStatus] = useState<BackendStatus | null>(null);

  useEffect(() => {
    // Check if running in Electron
    if (!(window as any).ipc) {
      return; // Not in Electron, skip
    }

    // Get initial status
    (window as any).ipc.getBackendStatus().then((data: any) => {
      setStatus({
        status: data.status,
        url: data.url,
      });
    });

    // Listen for status updates from main process
    (window as any).ipc.onBackendStatus((data: any) => {
      setStatus(data);
    });

    return () => {
      (window as any).ipc.removeBackendStatusListener();
    };
  }, []);

  if (!status) {
    return null;
  }

  const statusColors = {
    connected: 'bg-green-500',
    disconnected: 'bg-red-500',
    error: 'bg-red-600',
  };

  const statusText = {
    connected: 'Backend Connected',
    disconnected: 'Backend Disconnected',
    error: 'Backend Error',
  };

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className={`fixed bottom-4 right-4 px-4 py-2 rounded-lg text-white text-sm ${statusColors[status.status]}`}>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${status.status === 'connected' ? 'bg-white' : 'bg-yellow-300'}`}></div>
        {statusText[status.status]}
        {status.message && <span className="text-xs ml-2">{status.message}</span>}
      </div>
    </div>
  );
}

export default DesktopBackendStatus;
