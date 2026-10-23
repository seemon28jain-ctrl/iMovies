/**
 * useFetch.js - Generic data fetching hook
 * Fetches data from the given URL using the API utility and manages loading/error states
 */
import { useState, useEffect } from 'react';
import api from '../utils/api';

const useFetch = (url) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(url);
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    if (url) fetchData();
  }, [url]);

  // Expose refetch capability
  const refetch = () => {
    if (url) {
      setLoading(true);
      setError(null);
      api.get(url)
        .then(res => setData(res.data))
        .catch(err => setError(err.response?.data?.message || 'An error occurred'))
        .finally(() => setLoading(false));
    }
  };

  return { data, loading, error, refetch };
};

export default useFetch;
