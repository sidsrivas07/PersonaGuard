// APP STATE: Centralized store synced with the FastAPI SQLite backend.
// Updates persist to the database and reflect across Dashboard, Findings, Remediation, and Scans.

import { createContext, useContext, useEffect, useState } from 'react';
import {
  computeExposureScore, TREND_HISTORY, initialFindings, initialRemediation, initialAlerts,
  initialScans, initialProfile, initialSettings,
} from '../data/mockData';
import { startScan } from '../services/scanService';

const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

function usePersistentState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      if (!saved) return initialValue;
      const parsed = JSON.parse(saved);
      // Validate schema consistency for findings to ensure maskedValue exists
      if (key === 'pg_findings' && Array.isArray(parsed)) {
        if (parsed.length !== initialValue.length || !parsed[0]?.maskedValue) {
          return initialValue;
        }
      }
      return parsed;
    } catch { return initialValue; }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage may be blocked */ }
  }, [key, value]);
  return [value, setValue];
}

export function AppProvider({ children }) {
  const [page, setPage] = useState('dashboard');

  const [findings, setFindings] = usePersistentState('pg_findings', initialFindings);
  const [remediation, setRemediation] = usePersistentState('pg_remediation', initialRemediation);
  const [alerts, setAlerts] = usePersistentState('pg_alerts', initialAlerts);
  const [scans, setScans] = usePersistentState('pg_scans', initialScans);
  const [profile, setProfileState] = usePersistentState('pg_profile', initialProfile);
  const [settings, setSettings] = usePersistentState('pg_settings', initialSettings);
  const [backendScore, setBackendScore] = useState(null);

  // Load live data from the SQLite backend on startup
  useEffect(() => {
    async function fetchBackendData() {
      try {
        const [dashRes, profRes, findRes, remRes, scanRes, alertRes] = await Promise.allSettled([
          fetch('/api/dashboard').then((r) => r.json()),
          fetch('/api/profile').then((r) => r.json()),
          fetch('/api/findings').then((r) => r.json()),
          fetch('/api/remediation').then((r) => r.json()),
          fetch('/api/scans').then((r) => r.json()),
          fetch('/api/alerts').then((r) => r.json()),
        ]);

        if (dashRes.status === 'fulfilled' && dashRes.value.exposureScore !== undefined) {
          setBackendScore(dashRes.value.exposureScore);
        }
        if (profRes.status === 'fulfilled' && profRes.value.fullName) {
          setProfileState(profRes.value);
        }
        if (findRes.status === 'fulfilled' && Array.isArray(findRes.value)) {
          setFindings(findRes.value);
        }
        if (remRes.status === 'fulfilled' && Array.isArray(remRes.value)) {
          setRemediation(remRes.value);
        }
        if (scanRes.status === 'fulfilled' && Array.isArray(scanRes.value)) {
          setScans(scanRes.value);
        }
        if (alertRes.status === 'fulfilled' && Array.isArray(alertRes.value)) {
          setAlerts(alertRes.value);
        }
      } catch (err) {
        console.warn('Backend connection offline, using cached local data:', err);
      }
    }

    fetchBackendData();
  }, []);

  // Theme configuration (system / light / dark)
  const [theme, setTheme] = usePersistentState('pg_theme', 'system');
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      document.documentElement.dataset.theme = theme === 'system' ? (media.matches ? 'dark' : 'light') : theme;
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme]);

  // Reference photo kept in browser memory during audit session
  const [referencePhoto, setReferencePhoto] = useState(null);
  const [scanState, setScanState] = useState({ status: 'ready', progress: 0, currentSource: '', error: '' });

  // Dynamic calculations: exposureScore is strictly derived from open findings
  const openFindings = findings.filter((f) => f.status !== 'Resolved');
  const exposureScore = computeExposureScore(findings);
  const severityCounts = ['Critical', 'High', 'Medium', 'Low'].map((name) => ({
    name, value: openFindings.filter((f) => f.severity === name).length,
  }));
  const trendData = TREND_HISTORY.map((p, i) => (i === TREND_HISTORY.length - 1 ? { ...p, score: exposureScore } : p));
  const unreadAlerts = alerts.filter((a) => !a.read).length;

  // Sync profile update to backend
  const setProfile = async (newProfile) => {
    setProfileState(newProfile);
    try {
      await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProfile),
      });
    } catch (err) {
      console.warn('Profile save offline fallback:', err);
    }
  };

  // Sync finding status change to backend
  const setFindingStatus = async (id, status) => {
    setFindings((list) => list.map((f) => (f.id === id ? { ...f, status } : f)));
    try {
      const res = await fetch(`/api/findings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.exposureScore !== undefined) setBackendScore(data.exposureScore);
      }
    } catch (err) {
      console.warn('Finding status patch failed:', err);
    }
  };

  // Sync remediation action toggle to backend
  const toggleRemediation = async (id) => {
    const action = remediation.find((a) => a.id === id);
    if (!action) return;
    const completing = action.status !== 'Completed';

    // Optimistic UI update
    setRemediation((list) => list.map((a) => (a.id === id ? { ...a, status: completing ? 'Completed' : 'Pending' } : a)));
    setFindings((list) => list.map((f) => (action.findingIds?.includes(f.id) ? { ...f, status: completing ? 'Resolved' : 'Open' } : f)));

    try {
      const res = await fetch(`/api/remediation/${id}/toggle`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.exposureScore !== undefined) setBackendScore(data.exposureScore);
      }
    } catch (err) {
      console.warn('Remediation toggle API call failed:', err);
    }
  };

  // Mark alert as read
  const markAlertRead = async (id, read = true) => {
    setAlerts((list) => list.map((a) => (a.id === id ? { ...a, read } : a)));
    try {
      await fetch(`/api/alerts/${id}/read`, { method: 'PATCH' });
    } catch (err) {
      console.warn('Alert read sync failed:', err);
    }
  };

  const markAllAlertsRead = () => setAlerts((list) => list.map((a) => ({ ...a, read: true })));
  const addAlert = (alert) => setAlerts((list) => [{ id: Date.now(), read: false, ...alert }, ...list]);

  // Run scan and persist to backend
  const runScan = async ({ simulateFailure = false } = {}) => {
    if (scanState.status === 'scanning') return;
    setScanState({ status: 'scanning', progress: 0, currentSource: 'Starting...', error: '' });
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');

    try {
      const result = await startScan(profile, {
        simulateFailure,
        onProgress: (progress, currentSource) => setScanState((s) => ({ ...s, progress, currentSource })),
      });

      // Save scan record in backend
      const scanRes = await fetch('/api/scans/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ simulateFailure: false }),
      });
      const savedScan = scanRes.ok ? await scanRes.json() : { id: `Scan ${scans.length + 1}`, ...result };

      setScans((list) => [savedScan, ...list]);
      addAlert({
        type: 'scan-complete',
        title: 'Scan completed',
        message: `Processed ${result.sources} sources and evaluated ${result.findings} items.`,
        time: now,
      });
      setScanState({ status: 'completed', progress: 100, currentSource: '', error: '' });
    } catch (err) {
      const failRes = await fetch('/api/scans/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ simulateFailure: true }),
      });
      const failedScan = failRes.ok ? await failRes.json() : {
        id: `Scan ${scans.length + 1}`,
        date: now,
        status: 'Failed',
        findings: 0,
        sources: err.sourcesProcessed || 0,
        error: err.message,
      };

      setScans((list) => [failedScan, ...list]);
      setScanState({ status: 'failed', progress: 0, currentSource: '', error: err.message });
    }
  };

  const resetDemo = () => {
    setFindings(initialFindings);
    setRemediation(initialRemediation);
    setAlerts(initialAlerts);
    setScans(initialScans);
    setProfile(initialProfile);
    setSettings(initialSettings);
    setReferencePhoto(null);
    setBackendScore(null);
    setScanState({ status: 'ready', progress: 0, currentSource: '', error: '' });
  };

  const value = {
    page, setPage, findings, remediation, alerts, scans, profile, settings, referencePhoto, scanState,
    exposureScore, openFindings, severityCounts, trendData, unreadAlerts,
    setFindingStatus, toggleRemediation, markAlertRead, markAllAlertsRead,
    runScan, setProfile, setSettings, setReferencePhoto, resetDemo,
    setScanState, theme, setTheme,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
