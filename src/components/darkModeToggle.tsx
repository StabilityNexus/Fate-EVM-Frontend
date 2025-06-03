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
            style={{
                borderRadius: "50px",
                width: "3rem",
                backgroundColor: resolvedTheme === "dark" ? "#230402" : "white",
                border: resolvedTheme === "dark" ? "2px solid white" : "2px solid black",
            }}
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        >
            {resolvedTheme === "dark" ? (
                <Moon
                    className="h-[1.2rem] w-[1.5rem] transition-transform rotate-0 scale-100"
                    style={{ color: "white" }}
                />
            ) : (
                <Sun
                    className="h-[1.2rem] w-[1.5rem] transition-transform rotate-0 scale-100"
                />
            )}
        </Button>
    );
}
