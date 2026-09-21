"use client";

import { useState } from "react";

interface UserAvatarProps {
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function getInitials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function UserAvatar({ name, size = "md", className = "" }: UserAvatarProps) {
  const [hasError, setHasError] = useState(false);
  const seed = encodeURIComponent(name?.trim() || "Felix");
  const avatarUrl = `https://api.dicebear.com/10.x/glyphs/svg?seed=${seed}`;

  const sizeClasses = {
    sm: "w-7 h-7 text-[10px]",
    md: "w-10 h-10 text-xs",
    lg: "w-12 h-12 text-sm",
    xl: "w-16 h-16 text-base",
  }[size];

  return (
    <div
      className={`relative aspect-square rounded-full overflow-hidden border border-primary/15 bg-primary/5 flex items-center justify-center shrink-0 select-none shadow-2xs ${sizeClasses} ${className}`}
      style={{
        borderRadius: "50%",
        clipPath: "circle(50% at 50% 50%)",
        WebkitClipPath: "circle(50% at 50% 50%)",
      }}
      title={name}
      aria-label={name}
    >
      {!hasError ? (
        <img
          src={avatarUrl}
          alt={name || "avatar"}
          className="w-full h-full object-cover rounded-full block"
          onError={() => setHasError(true)}
          loading="lazy"
        />
      ) : (
        <span className="font-mono font-bold text-ink-mute text-xs">
          {getInitials(name)}
        </span>
      )}
    </div>
  );
}
