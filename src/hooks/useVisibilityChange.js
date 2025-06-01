import { useEffect } from 'react';

export default function useVisibilityChange(onVisible, onHidden) {
  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === 'visible') {
        onVisible();
      } else {
        onHidden();
      }
    }

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [onVisible, onHidden]);
}
