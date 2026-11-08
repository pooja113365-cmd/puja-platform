import { useCallback, useEffect, useState } from 'react';
import api, { errorMessage } from '../services/api';

/** GET helper with loading / error / reload and request cancellation. `url` null skips the request. */
export default function useFetch(url, params) {
  const [state, setState] = useState({ data: null, meta: null, loading: Boolean(url), error: null });
  const [tick, setTick] = useState(0);
  const key = JSON.stringify(params || {});

  useEffect(() => {
    if (!url) {
      setState({ data: null, meta: null, loading: false, error: null });
      return undefined;
    }
    const controller = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));
    api
      .get(url, { params: JSON.parse(key), signal: controller.signal })
      .then((res) => setState({ data: res.data.data, meta: res.data.meta || null, loading: false, error: null }))
      .catch((err) => {
        if (err.code === 'ERR_CANCELED') return;
        setState({ data: null, meta: null, loading: false, error: errorMessage(err) });
      });
    return () => controller.abort();
  }, [url, key, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}

