import { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Identity from './pages/Identity';
import Scans from './pages/Scans';
import Findings from './pages/Findings';
import Remediation from './pages/Remediation';
import Alerts from './pages/Alerts';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

// NAVIGATION: no router library. `page` (from context) is a string such as 'findings'.
// This map turns that string into the page component to show.
const PAGES = {
  dashboard: { title: 'Dashboard', component: Dashboard },
  identity: { title: 'My Identity', component: Identity },
  scans: { title: 'Scans', component: Scans },
  findings: { title: 'Findings', component: Findings },
  remediation: { title: 'Remediation', component: Remediation },
  alerts: { title: 'Alerts', component: Alerts },
  reports: { title: 'Reports', component: Reports },
  settings: { title: 'Settings', component: Settings },
};

function Layout() {
  const { page, setPage } = useApp();
  const [menuOpen, setMenuOpen] = useState(false); // mobile drawer
  const { title, component: Page } = PAGES[page];

  const go = (key) => { setPage(key); setMenuOpen(false); window.scrollTo(0, 0); };

  return (
    <div className="app">
      <Sidebar open={menuOpen} onNavigate={go} />
      {menuOpen && <div className="scrim" onClick={() => setMenuOpen(false)} />}
      <div className="main">
        <Header title={title} onMenu={() => setMenuOpen(true)} />
        <main className="content"><Page /></main>
      </div>
    </div>
  );
}

export default function App() {
  return <AppProvider><Layout /></AppProvider>;
}
