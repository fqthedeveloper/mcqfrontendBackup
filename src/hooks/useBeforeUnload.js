// src/hooks/useBeforeUnload.js

import { useEffect } from 'react';

export default function useBeforeUnload(callback) {
  useEffect(() => {
    function handleBeforeUnload(e) {
      callback();
      // Optionally prevent default to show “Are you sure?” prompt:
      // e.preventDefault();
      // e.returnValue = '';
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [callback]);
}
