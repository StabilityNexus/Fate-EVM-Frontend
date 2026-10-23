"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ModeToggle() {
    const { setTheme, resolvedTheme } = useTheme();

    return (
        <Button
            size="icon"
            aria-label="Toggle theme"
            // Same look as the settings button beside it; replaces the Button default hover, which matches the icon colour.
            className="h-9 w-12 rounded-full border-2 border-black bg-white text-black shadow-none hover:bg-neutral-100 dark:border-white dark:bg-black dark:text-white dark:hover:bg-neutral-900"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        >
            {resolvedTheme === "dark" ? (
                <Moon className="mode-toggle-icon" />
            ) : (
                <Sun className="mode-toggle-icon" />
            )}
        </Button>
    );
}