import { useState, useEffect, useCallback } from 'react';
import { getStorage, STORAGE_PREFIX, STORAGE_SYNC_EVENT } from '../utils/storage';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() =>
    getStorage().get<T>(key, initialValue)
  );

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      const current = getStorage().get<T>(key, initialValue);
      const nextValue =
        value instanceof Function ? value(current) : value;
      setStoredValue(nextValue);
      getStorage().set<T>(key, nextValue);
    },
    [key, initialValue]
  );

  useEffect(() => {
    const handleCustomSync = (e: Event) => {
      const customEvent = e as CustomEvent<{ key: string }>;
      if (customEvent.detail?.key === key || customEvent.detail?.key === '*') {
        setStoredValue(getStorage().get<T>(key, initialValue));
      }
    };

    const handleCrossTabStorage = (e: StorageEvent) => {
      if (!e.key || e.key === `${STORAGE_PREFIX}${key}`) {
        setStoredValue(getStorage().get<T>(key, initialValue));
      }
    };

    window.addEventListener(STORAGE_SYNC_EVENT, handleCustomSync);
    window.addEventListener('storage', handleCrossTabStorage);
    return () => {
      window.removeEventListener(STORAGE_SYNC_EVENT, handleCustomSync);
      window.removeEventListener('storage', handleCrossTabStorage);
    };
  }, [key, initialValue]);

  return [storedValue, setValue] as const;
}
