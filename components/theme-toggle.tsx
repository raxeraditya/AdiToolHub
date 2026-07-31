'use client';

import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';

export function ThemeToggle() {
  const { theme, toggle, mounted } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="transition-transform duration-300 hover:scale-110"
    >
      {mounted && theme === 'dark' ? (
        <Sun className="h-5 w-5 animate-in fade-in zoom-in duration-200" />
      ) : (
        <Moon className="h-5 w-5 animate-in fade-in zoom-in duration-200" />
      )}
    </Button>
  );
}
