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
            className={`mode-toggle-button ${resolvedTheme === "dark"
                    ? "mode-toggle-button-dark"
                    : "mode-toggle-button-light"
                }`}
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