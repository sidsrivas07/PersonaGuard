// APP STATE: one shared "store" so every page sees the same data.
// If you mark a remediation action complete on the Remediation page, the Dashboard score and the Findings
// page update too, because they all read from here.
import { createContext, useContext, useEffect, useState } from 'react';
import {
  BASE_SCORE, TREND_HISTORY, initialFindings, initialRemediation, initialAlerts,
  initialScans, initialProfile, initialSettings,
} from '../data/mockData';
import { startScan } from '../services/scanService';

const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

// Like useState, but also saves to the browser's localStorage so demo changes survive a refresh.
function usePersistentState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : initialValue;
    } catch { return initialValue; }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage may be blocked */ }
  }, [key, value]);
  return [value, setValue];
}

export function AppProvider({ children }) {
  // Navigation: just a string. App.jsx shows the page that matches it.
  const [page, setPage] = useState('dashboard');

  const [findings, setFindings] = usePersistentState('pg_findings', initialFindings);
  const [remediation, setRemediation] = usePersistentState('pg_remediation', initialRemediation);
  const [alerts, setAlerts] = usePersistentState('pg_alerts', initialAlerts);
  const [scans, setScans] = usePersistentState('pg_scans', initialScans);
  const [profile, setProfile] = usePersistentState('pg_profile', initialProfile);
  const [settings, setSettings] = usePersistentState('pg_settings', initialSettings);

  // THEME: 'system' (follow the laptop/phone setting), 'light' or 'dark'. Saved in localStorage.
  // We apply it by setting data-theme on <html>; index.css has different colour tokens for each value.
  const [theme, setTheme] = usePersistentState('pg_theme', 'system');
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      document.documentElement.dataset.theme = theme === 'system' ? (media.matches ? 'dark' : 'light') : theme;
    };
    apply();
    media.addEventListener('change', apply); // follows the device if it switches (e.g. at sunset)
    return () => media.removeEventListener('change', apply);
  }, [theme]);

  // The reference photo is kept ONLY in memory (never saved, never uploaded). It vanishes on refresh.
  const [referencePhoto, setReferencePhoto] = useState(null);

  // Scan progress is temporary, so it is not persisted. status: ready | scanning | completed | failed
  const [scanState, setScanState] = useState({ status: 'ready', progress: 0, currentSource: '', error: '' });

  // ---- Derived values (calculated from state, never stored twice) ----
  const completedImpact = remediation.filter((a) => a.status === 'Completed').reduce((sum, a) => sum + a.impact, 0);
  const exposureScore = Math.max(0, BASE_SCORE - completedImpact);
  const openFindings = findings.filter((f) => f.status !== 'Resolved');
  const severityCounts = ['Critical', 'High', 'Medium', 'Low'].map((name) => ({
    name, value: openFindings.filter((f) => f.severity === name).length,
  }));
  const trendData = TREND_HISTORY.map((p, i) => (i === TREND_HISTORY.length - 1 ? { ...p, score: exposureScore } : p));
  const unreadAlerts = alerts.filter((a) => !a.read).length;

  // ---- Actions ----
  const setFindingStatus = (id, status) =>
    setFindings((list) => list.map((f) => (f.id === id ? { ...f, status } : f)));

  const toggleRemediation = (id) => {
    const action = remediation.find((a) => a.id === id);
    const completing = action.status !== 'Completed';
    setRemediation((list) => list.map((a) => (a.id === id ? { ...a, status: completing ? 'Completed' : 'Pending' } : a)));
    // Demo only: marks linked findings as resolved. Nothing is changed on any real account.
    setFindings((list) => list.map((f) => (action.findingIds.includes(f.id) ? { ...f, status: completing ? 'Resolved' : 'Open' } : f)));
  };

  const markAlertRead = (id, read = true) => setAlerts((list) => list.map((a) => (a.id === id ? { ...a, read } : a)));
  const markAllAlertsRead = () => setAlerts((list) => list.map((a) => ({ ...a, read: true })));
  const addAlert = (alert) => setAlerts((list) => [{ id: Date.now(), read: false, ...alert }, ...list]);

  const runScan = async ({ simulateFailure = false } = {}) => {
    if (scanState.status === 'scanning') return;
    setScanState({ status: 'scanning', progress: 0, currentSource: 'Starting...', error: '' });
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    try {
      // startScan lives in services/scanService.js. This is the line a real API call will replace.
      const result = await startScan(profile, {
        simulateFailure,
        onProgress: (progress, currentSource) => setScanState((s) => ({ ...s, progress, currentSource })),
      });
      setScans((list) => [{ id: `Scan ${list.length + 1}`, ...result }, ...list]);
      addAlert({ type: 'scan-complete', title: 'Scan completed (simulated)', message: `Processed ${result.sources} sources and listed ${result.findings} items.`, time: now });
      setScanState({ status: 'completed', progress: 100, currentSource: '', error: '' });
    } catch (err) {
      setScans((list) => [{ id: `Scan ${list.length + 1}`, date: now, status: 'Failed', findings: 0, sources: err.sourcesProcessed || 0, error: err.message }, ...list]);
      setScanState({ status: 'failed', progress: 0, currentSource: '', error: err.message });
    }
  };

  const resetDemo = () => {
    setFindings(initialFindings); setRemediation(initialRemediation); setAlerts(initialAlerts);
    setScans(initialScans); setProfile(initialProfile); setSettings(initialSettings);
    setReferencePhoto(null);
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
