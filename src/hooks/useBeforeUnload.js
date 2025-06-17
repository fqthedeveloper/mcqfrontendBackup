import { useEffect } from 'react';

export default function useBeforeUnload(handler) {
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      handler();
      const message = "You have unsaved changes. Are you sure you want to leave?";
      e.returnValue = message;
      return message;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [handler]);
}