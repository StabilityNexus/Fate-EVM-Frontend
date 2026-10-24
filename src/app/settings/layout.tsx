import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage RPC endpoints, export or import your local data, and clear the local cache.",
  alternates: {
    canonical: "/settings",
  },
};

export default function SettingsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
