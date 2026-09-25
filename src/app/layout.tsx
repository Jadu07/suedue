import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SplashScreen from "@/components/SplashScreen";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  axes: ["opsz"], // Variable font
});

export const viewport: Viewport = {
  themeColor: "#0f0f11",
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "suedue - Bill Splitting",
  description: "Personal bill splitting and payment collection app",
  applicationName: "suedue",
  appleWebApp: {
    capable: true,
    title: "suedue",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/apple-touch-icon-precomposed.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased bg-[#0f0f11] text-gray-100`}>
        {/* Ultra-Fast Vanilla JS Splash Screen */}
        <div id="global-splash" suppressHydrationWarning style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f0f11', transition: 'opacity 0.5s ease-in-out' }}>
          <h1 id="splash-text" suppressHydrationWarning style={{ fontFamily: 'monospace', fontSize: '2.25rem', fontWeight: 900, letterSpacing: '0.1em', color: '#a5d8ce' }}>      </h1>
        </div>
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            if (sessionStorage.getItem("hasSeenSplash")) {
              var el = document.getElementById('global-splash');
              if(el) el.style.display = 'none';
              return;
            }
            // Add CSS for sm:text-6xl responsive scaling
            var style = document.createElement('style');
            style.innerHTML = '@media (min-width: 640px) { #splash-text { font-size: 3.75rem !important; } }';
            document.head.appendChild(style);

            var textEl = document.getElementById('splash-text');
            var splashEl = document.getElementById('global-splash');
            var target = "suedue";
            var chars = "abcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
            
            // Instantly fill with scrambled letters to avoid any empty frame
            var initialStr = "";
            for (var i = 0; i < target.length; i++) {
              initialStr += chars[Math.floor(Math.random() * chars.length)];
            }
            if (textEl) textEl.innerText = initialStr;

            var iters = 0;
            var maxIters = 15;
            var interval = setInterval(function() {
              if (!document.body.contains(textEl)) {
                textEl = document.getElementById('splash-text');
                splashEl = document.getElementById('global-splash');
                if (!textEl) return;
              }
              var str = "";
              for (var i = 0; i < target.length; i++) {
                if (i < iters / 3) str += target[i];
                else str += chars[Math.floor(Math.random() * chars.length)];
              }
              textEl.innerText = str;
              if (iters >= maxIters * 3) {
                clearInterval(interval);
                setTimeout(function() {
                  if (splashEl) splashEl.style.opacity = '0';
                  setTimeout(function() {
                    if (splashEl) splashEl.style.display = 'none';
                    sessionStorage.setItem("hasSeenSplash", "true");
                  }, 500);
                }, 600);
              }
              iters++;
            }, 40);
          })();
        `}} />
        {children}
      </body>
    </html>
  );
}
