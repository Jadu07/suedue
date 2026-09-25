"use client";

import { useState, useEffect } from "react";

const TARGET_WORD = "suedue";
const CHARACTERS = "abcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";

export default function SplashScreen() {
  const [show, setShow] = useState(true);
  const [text, setText] = useState("      ");
  const [isFading, setIsFading] = useState(false);
  
  useEffect(() => {
    // Only run once on mount
    const hasSeenSplash = sessionStorage.getItem("hasSeenSplash");
    if (hasSeenSplash) {
      setShow(false);
      return;
    }
    
    let iterations = 0;
    const maxIterations = 15;
    
    // Seed initial random string right away
    let initialStr = "";
    for(let i=0; i<TARGET_WORD.length; i++) {
        initialStr += CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
    }
    setText(initialStr);
    
    const interval = setInterval(() => {
      setText(TARGET_WORD.split("").map((letter, index) => {
        if (index < iterations / 3) {
          return TARGET_WORD[index];
        }
        return CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
      }).join(""));
      
      if (iterations >= maxIterations * 3) {
        clearInterval(interval);
        setTimeout(() => {
          setIsFading(true);
          setTimeout(() => {
            setShow(false);
            sessionStorage.setItem("hasSeenSplash", "true");
          }, 500); // Wait for fade out
        }, 600); // Show full word for a bit
      }
      
      iterations++;
    }, 40);
    
    return () => clearInterval(interval);
  }, []);

  if (!show) return null;

  return (
    <div id="global-splash" suppressHydrationWarning className={`fixed inset-0 z-[9999] flex items-center justify-center bg-[#0f0f11] transition-opacity duration-500 ease-in-out ${isFading ? 'opacity-0' : 'opacity-100'}`}>
      <div className="flex flex-col items-center justify-center">
        <h1 suppressHydrationWarning className="font-mono text-4xl sm:text-6xl font-black tracking-widest text-[#a5d8ce]">
          {text}
        </h1>
      </div>
    </div>
  );
}
