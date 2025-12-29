"use client"

import Footer from "@/components/layout/Footer";
import { useKYAContext } from "@/context/KYAProvider";

interface FooterWrapperProps {
  className?: string;
}

export default function FooterWrapper({ className }: FooterWrapperProps) {
  const { openKYA } = useKYAContext();

  return <Footer className={className} onKYAClick={openKYA} />;
}
