import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  axes: ["opsz"], // Variable font
});

export const viewport: Viewport = {
  themeColor: "#1b1938",
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

        {/* Instant Vanilla JS Splash Screen */}
        <div suppressHydrationWarning dangerouslySetInnerHTML={{
          __html: `
          <div id="global-splash" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 9999; display: flex; align-items: center; justify-content: center; background-color: #0f0f11; transition: opacity 0.5s ease-in-out;">
            <h1 id="splash-text" style="font-family: monospace; font-size: 3rem; font-weight: 900; letter-spacing: 0.1em; color: #a5d8ce;">      </h1>
          </div>
          <script>
            (function() {
              if (sessionStorage.getItem("hasSeenSplash")) {
                var el = document.getElementById('global-splash');
                if(el) el.style.display = 'none';
                return;
              }
              var textEl = document.getElementById('splash-text');
              var splashEl = document.getElementById('global-splash');
              var target = "suedue";
              var chars = "abcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
              var iters = 0;
              var maxIters = 15;
              
              var interval = setInterval(function() {
                // If React destroyed our element (due to hydration), try to find the new one!
                if (!document.body.contains(textEl)) {
                  textEl = document.getElementById('splash-text');
                  splashEl = document.getElementById('global-splash');
                  if (!textEl) return;
                }

                var str = "";
                for (var i = 0; i < target.length; i++) {
                  if (i < iters / 3) {
                    str += target[i];
                  } else {
                    str += chars[Math.floor(Math.random() * chars.length)];
                  }
                }
                textEl.innerText = str;
                
                if (iters >= maxIters * 3) {
                  clearInterval(interval);
                  setTimeout(function() {
                    if(splashEl) splashEl.style.opacity = '0';
                    setTimeout(function() {
                      if(splashEl) splashEl.style.display = 'none';
                      sessionStorage.setItem("hasSeenSplash", "true");
                    }, 500);
                  }, 600);
                }
                iters++;
              }, 40);
            })();
          </script>
        `}} />

        {children}
      </body>
    </html>
  );
}
