/**
 * Small, clean StorageAdapter interface abstracting persistence.
 * Currently backed by window.localStorage (`LocalStorageAdapter`), designed so it can
 * be swapped later for a Supabase table adapter (`user_kv_store`) without touching UI/hooks.
 */

export const STORAGE_PREFIX = 'gate_track_v1_';
export const STORAGE_SYNC_EVENT = 'gate-track-storage-sync';

export interface StorageAdapter {
  get<T>(key: string, fallback: T): T;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
  exportAll(): Record<string, unknown>;
  importAll(snapshot: Record<string, unknown>): void;
  clearAll(): void;
}

class LocalStorageAdapter implements StorageAdapter {
  private fullKey(key: string): string {
    return `${STORAGE_PREFIX}${key}`;
  }

  get<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    try {
      const raw = window.localStorage.getItem(this.fullKey(key));
      if (raw === null) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  set<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    try {
      const serialized = JSON.stringify(value);
      window.localStorage.setItem(this.fullKey(key), serialized);
      window.dispatchEvent(
        new CustomEvent(STORAGE_SYNC_EVENT, { detail: { key } })
      );
    } catch (err) {
      console.error('Failed to persist to localStorage:', err);
    }
  }

  remove(key: string): void {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(this.fullKey(key));
    window.dispatchEvent(
      new CustomEvent(STORAGE_SYNC_EVENT, { detail: { key } })
    );
  }

  exportAll(): Record<string, unknown> {
    if (typeof window === 'undefined') return {};
    const snapshot: Record<string, unknown> = {
      _meta: {
        app: 'GATE-Track',
        version: 1,
        exportedAt: new Date().toISOString(),
      },
    };
    for (let i = 0; i < window.localStorage.length; i++) {
      const fullKey = window.localStorage.key(i);
      if (fullKey && fullKey.startsWith(STORAGE_PREFIX)) {
        const shortKey = fullKey.slice(STORAGE_PREFIX.length);
        try {
          const val = window.localStorage.getItem(fullKey);
          if (val !== null) {
            snapshot[shortKey] = JSON.parse(val);
          }
        } catch {
          // ignore malformed entry
        }
      }
    }
    return snapshot;
  }

  importAll(snapshot: Record<string, unknown>): void {
    if (typeof window === 'undefined') return;
    Object.entries(snapshot).forEach(([shortKey, value]) => {
      if (shortKey === '_meta') return;
      window.localStorage.setItem(
        this.fullKey(shortKey),
        JSON.stringify(value)
      );
    });
    window.dispatchEvent(
      new CustomEvent(STORAGE_SYNC_EVENT, { detail: { key: '*' } })
    );
  }

  clearAll(): void {
    if (typeof window === 'undefined') return;
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(STORAGE_PREFIX)) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => window.localStorage.removeItem(k));
    window.dispatchEvent(
      new CustomEvent(STORAGE_SYNC_EVENT, { detail: { key: '*' } })
    );
  }
}

let activeAdapter: StorageAdapter = new LocalStorageAdapter();

export function getStorage(): StorageAdapter {
  return activeAdapter;
}

export function setActiveStorageAdapter(adapter: StorageAdapter): void {
  activeAdapter = adapter;
}

export const STORAGE_KEYS = {
  SETTINGS: 'settings',
  SYLLABUS: 'syllabus_topics',
  PYQ_LOGS: 'pyq_logs',
  PYQ_MANUAL: 'pyq_manual_adjustments',
  MOCK_TESTS: 'mock_tests',
  ERROR_LOGS: 'error_logs',
  DAILY_LOGS: 'daily_logs',
  DAILY_TASKS: 'daily_tasks',
  WEEKLY_BLOCKS: 'weekly_custom_blocks',
  POMODORO_SESSIONS: 'pomodoro_sessions',
  RESOURCES: 'resources',
  STREAK_STATE: 'streak_state',
} as const;
