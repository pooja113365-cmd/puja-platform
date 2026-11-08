import { useCallback, useState } from 'react';
import { errorMessage } from '../services/api';

/** Runs an async mutation, tracking busy/error state. Resolves true on success. */
export default function useAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const run = useCallback(async (fn) => {
    setBusy(true);
    setError('');
    try {
      await fn();
      return true;
    } catch (e) {
      setError(errorMessage(e));
      return false;
    } finally {
      setBusy(false);
    }
  }, []);
  return { run, busy, error, setError };
}

