import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="theme-switch"
      aria-label="Переключить тему"
      title="Переключить тему"
    >
      <span className="theme-switch-track" />
      <span className={`theme-switch-thumb ${isDark ? 'is-dark' : ''}`}>
        {isDark ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
      </span>
    </button>
  );
}
