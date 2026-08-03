"use client";

import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme, mounted } = useTheme();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn("gap-2", className)}
      onClick={toggleTheme}
      aria-label={theme === "light" ? "Koyu temaya geç" : "Açık temaya geç"}
      disabled={!mounted}
    >
      {theme === "light" ?
        <>
          <Moon className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">Koyu tema</span>
        </>
      : <>
          <Sun className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">Açık tema</span>
        </>
      }
    </Button>
  );
}
