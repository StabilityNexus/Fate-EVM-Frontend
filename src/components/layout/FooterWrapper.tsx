"use client"

import Footer from "@/components/layout/Footer";
import { useTermsOfUseContext } from "@/context/TermsOfUseProvider";

interface FooterWrapperProps {
  className?: string;
}

export default function FooterWrapper({ className }: FooterWrapperProps) {
  const { openTerms } = useTermsOfUseContext();

  return <Footer className={className} onTermsClick={openTerms} />;
}
