import { Menu } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

// Top bar: page title, a menu button (mobile only) and a permanent "demonstration" tag.
export default function Header({ title, onMenu }) {
  return (
    <header className="header">
      <button className="icon-btn menu-btn" onClick={onMenu} aria-label="Open menu"><Menu size={20} /></button>
      <h1>{title}</h1>
      <ThemeToggle />
      <span className="pill">Demonstration mode</span>
    </header>
  );
}
