'use client';

import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch — only render after mount
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const isDark = theme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label="Toggle theme"
      className="cursor-pointer rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
    >
      {isDark ? (
        <Sun className="size-5 text-yellow-400" />
      ) : (
        <Moon className="size-5 text-gray-700" />
      )}
    </button>
  );
};

export default ThemeToggle;
