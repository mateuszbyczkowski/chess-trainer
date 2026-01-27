import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

export function GuestWarningBanner() {
  const { user, login } = useAuth();
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem('guestWarningDismissed') === 'true';
  });

  if (!user?.isGuest || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    localStorage.setItem('guestWarningDismissed', 'true');
    setDismissed(true);
  };

  return (
    <div className="bg-yellow-50 border-b border-yellow-200">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-yellow-600 text-xl">⚠️</span>
            <div>
              <p className="text-sm font-medium text-yellow-800">
                You're playing as a guest
              </p>
              <p className="text-xs text-yellow-700">
                Your progress is saved in your browser only. To save permanently across devices,{' '}
                <button
                  onClick={() => login('lichess')}
                  className="underline hover:text-yellow-900 font-medium"
                >
                  log in with Lichess
                </button>
                {' '}or{' '}
                <button
                  onClick={() => login('google')}
                  className="underline hover:text-yellow-900 font-medium"
                >
                  Google
                </button>
                .
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-yellow-600 hover:text-yellow-800 text-xl px-2"
            aria-label="Dismiss warning"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
