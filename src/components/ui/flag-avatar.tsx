"use client";

import { useState } from 'react';
import Image from 'next/image';

interface FlagAvatarProps {
  query: string;
  alt: string;
  className?: string;
  isRound?: boolean;
}

export function FlagAvatar({ query, alt, className = "h-10 w-16", isRound = false }: FlagAvatarProps) {
  const [imgError, setImgError] = useState(false);

  // Handle empty or invalid query
  if (!query || imgError) {
    return (
      <div 
        className={`
          relative overflow-hidden 
          flex items-center justify-center 
          bg-secondary/50
          ${isRound ? 'rounded-full' : 'rounded-md'}
          ${className}
        `}
      >
        <span className="text-xs text-secondary-foreground/50">?</span>
      </div>
    );
  }

  // Normalize the country code and ensure it's a valid 2-letter code
  const code = query.toLowerCase().trim();
  if (code.length !== 2) {
    console.warn('Invalid country code:', code);
    return (
      <div 
        className={`
          relative overflow-hidden 
          flex items-center justify-center 
          bg-secondary/50
          ${isRound ? 'rounded-full' : 'rounded-md'}
          ${className}
        `}
      >
        <span className="text-xs text-secondary-foreground/50">?</span>
      </div>
    );
  }
  
  // Use specific dimensions for consistent display
  const flagUrl = `https://flagcdn.com/32x24/${code}.png`;
  
  return (
    <div 
      className={`
        relative overflow-hidden
        ${isRound ? 'rounded-full' : 'rounded-md'}
        ${className}
      `}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img 
        alt={alt} 
        src={flagUrl}
        className={`
          w-full h-full
          ${isRound ? 'object-cover' : 'object-contain'}
        `}
        onError={(e) => {
          console.warn('Flag failed to load:', code);
          setImgError(true);
        }}
      />
    </div>
  );
  
  return (
    <div 
      className={`
        relative overflow-hidden
        ${isRound ? 'rounded-full' : 'rounded-md'}
        ${className}
      `}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img 
        alt={alt} 
        src={flagUrl}
        className={`
          w-full h-full
          ${isRound ? 'object-cover' : 'object-contain'}
        `}
        onError={(e) => {
          console.warn('Flag failed to load:', code);
          setImgError(true);
          e.currentTarget.onerror = null;
        }}
      />
    </div>
  );
}