// src/context/DbContext.jsx
// The ONLY module that bridges React ↔ localStorage via localDb.js.
// Every hook reads from this context; no component touches storage directly.
// Cross-tab sync: storage event listener + db.subscribe() for same-tab writes.
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db, subscribe } from '../mocks/localDb';

const DbCtx = createContext(null);
export const useDb = () => useContext(DbCtx);

const KEY = 'ata.db.v1';

export function DbProvider({ children }) {
  const [booted, setBooted] = useState(false);
  const [tick, setTick] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(Date.now());
  const [sessionUser, setSessionUser] = useState(null);

  // Hydrate seed + restore session on mount
  useEffect(() => {
    let cancelled = false;
    db.getBootstrap().then(() => {
      if (cancelled) return;
      // Restore session from localDb after seed hydration
      const sess = db.readSessionSync();
      if (sess?.userId) {
        setSessionUser(sess);
      }
      setBooted(true);
    }).catch(() => { if (!cancelled) setBooted(true); });
    return () => { cancelled = true; };
  }, []);

  // Same-tab writes: subscribe to localDb.notify()
  useEffect(() => {
    const unsub = subscribe(() => { setTick((t) => t + 1); setLastUpdated(Date.now()); });
    return unsub;
  }, []);

  // Cross-tab live sync: listen for storage events from other tabs/windows
  useEffect(() => {
    const handler = (e) => {
      if (e.key === KEY && e.newValue) {
        setTick((t) => t + 1);
        setLastUpdated(Date.now());
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const setSession = useCallback((user) => {
    setSessionUser(user);
    db.setSessionSync(user);
    setTick((t) => t + 1);
    setLastUpdated(Date.now());
  }, []);

  const clearSession = useCallback(() => {
    setSessionUser(null);
    db.clearSessionSync();
    setTick((t) => t + 1);
    setLastUpdated(Date.now());
  }, []);

  if (!booted) {
    return (
      <div className="h-screen flex items-center justify-center bg-canvas">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-full border-2 border-brand border-t-transparent animate-spin mx-auto" />
          <p className="text-sm text-ink-muted">Loading academy data...</p>
        </div>
      </div>
    );
  }

  return (
    <DbCtx.Provider value={{ db, tick, lastUpdated, session: sessionUser, setSession, clearSession }}>
      {children}
    </DbCtx.Provider>
  );
}