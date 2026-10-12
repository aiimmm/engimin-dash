"use client";

import { cn } from "@/lib/utils";
import { MoonStarIcon, Sun03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTheme } from "next-themes";
import { Switch } from "../ui/switch";

export const ThemeSwitch = () => {
  const { theme, setTheme } = useTheme();
  const isDarkMode = theme === "dark";

  const handleThemeChange = (isChecked) => {
    setTheme(isChecked ? "dark" : "light");
  };

  return (
    <div className="inline-flex items-center whitespace-nowrap rounded-xl text-sm font-medium px-2.5 py-2 w-full justify-between h-8">
      <div className="flex items-center gap-2">
        <div>
          <HugeiconsIcon strokeWidth={2} icon={Sun03Icon} className="size-4! dark:hidden" />
          <HugeiconsIcon
            strokeWidth={1.5}
            icon={MoonStarIcon}
            className="hidden size-4! dark:block"
          />
        </div>
        <p className={cn("leading-7 flex grow max-w-50 truncate translate-x-0 opacity-100")}>
          Dark Mode
        </p>
      </div>
      <Switch
        id="switch-theme"
        className="cursor-pointer"
        checked={isDarkMode}
        onCheckedChange={handleThemeChange}
        aria-checked={isDarkMode}
        aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
      />
    </div>
  );
};
