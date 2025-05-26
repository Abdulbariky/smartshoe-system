import { useEffect, useState } from 'react';

export function useRealTimeData<T>(
  fetchFunction: () => Promise<T>,
  interval: number = 30000 // 30 seconds default
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      const result = await fetchFunction();
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, interval);
    return () => clearInterval(timer);
  }, [interval]);

  return { data, loading, error, refetch: fetchData };
}