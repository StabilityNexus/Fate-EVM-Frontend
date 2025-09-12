"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
  showText?: boolean;
}

export function Loading({
  size = 'md',
  className,
  text = 'Loading...',
  showText = false
}: LoadingProps) {

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  };

  return (
    <div className={cn(
      'flex flex-col items-center justify-center gap-3',
      className
    )}>
      <div className={cn(
        'relative',
        sizeClasses[size]
      )}>
        <div className={cn(
          'loader',
          sizeClasses[size]
        )} />
      </div>

      {showText && (
        <p className={cn(
          'text-center font-medium text-muted-foreground',
          textSizes[size]
        )}>
          {text}
        </p>
      )}
    </div>
  );
}
