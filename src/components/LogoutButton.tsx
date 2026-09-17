"use client";

import React, { useState } from "react";
import { LogOut } from "lucide-react";

interface LogoutButtonProps {
  className?: string;
  iconSize?: number;
  showText?: boolean;
  text?: string;
  children?: React.ReactNode;
}

export default function LogoutButton({
  className = "",
  iconSize = 18,
  showText = true,
  text = "Logout",
  children,
}: LogoutButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;
    setLoading(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      window.location.href = "/login";
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className={className}
      title="Sign Out"
    >
      {children ? (
        children
      ) : (
        <>
          <LogOut size={iconSize} className={`shrink-0 ${loading ? "animate-spin" : ""}`} />
          {showText && <span>{loading ? "Signing out..." : text}</span>}
        </>
      )}
    </button>
  );
}
