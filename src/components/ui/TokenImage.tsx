"use client";

import React from "react";

interface TokenImageProps {
  src: string;
  alt: string;
  symbol: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
};

const TokenImage: React.FC<TokenImageProps> = ({ src, alt, symbol, size = "md" }) => {
  const [hasError, setHasError] = React.useState(false);
  const fallbackInitials = symbol.substring(0, 2).toUpperCase();

  if (!src || hasError) {
    return (
      <div className={`${sizeClasses[size]} flex-shrink-0 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-white font-semibold flex items-center justify-center`}>
        {fallbackInitials}
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} flex-shrink-0 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden`}>
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        onError={() => setHasError(true)}
      />
    </div>
  );
};

export default TokenImage;
