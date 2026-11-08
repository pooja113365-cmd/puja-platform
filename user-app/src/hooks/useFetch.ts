import { useCallback, useEffect, useState } from 'react';
import api, { errorMessage } from '../services/api';

interface FetchState<T> { data: T | null; meta: { page: number; pages: number; total: number } | null; loading: boolean; error: string | null }

/** GET helper with loading / error / reload / cancellation. Pass url=null to skip. */
export default function useFetch<T = unknown>(url: string | null, params?: Record<string, unknown>) {
  const [state, setState] = useState<FetchState<T>>({ data: null, meta: null, loading: Boolean(url), error: null });
  const [tick, setTick] = useState(0);
  const key = JSON.stringify(params ?? {});

  useEffect(() => {
    if (!url) {
      setState({ data: null, meta: null, loading: false, error: null });
      return undefined;
    }
    const controller = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));
    api
      .get(url, { params: JSON.parse(key), signal: controller.signal })
      .then((res) => setState({ data: res.data.data as T, meta: res.data.meta ?? null, loading: false, error: null }))
      .catch((err) => {
        if (err?.code === 'ERR_CANCELED') return;
        setState({ data: null, meta: null, loading: false, error: errorMessage(err) });
      });
    return () => controller.abort();
  }, [url, key, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}

