import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Nav Dark */}
      <nav className="bg-primary text-on-primary px-lg py-xl flex items-center justify-between z-10 relative">
        <div className="font-black text-xl tracking-tight lowercase">suedue</div>
        <div className="flex gap-md">
          <Link href="/dashboard" className="btn-on-dark-pill">
            Go to Dashboard
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-primary relative overflow-hidden flex flex-col md:flex-row min-h-[80vh]">
        {/* Depth Medium: violet-sky atmospheric backdrop */}
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_70%_50%,var(--color-surface-violet-soft),var(--color-primary)_70%)] opacity-40"></div>

        <div className="relative z-10 flex-1 flex items-center px-lg md:px-huge py-huge">
          <div className="max-w-2xl">
            <h1 className="display-xxl text-on-primary mb-xl">
              Split bills. Send links. Get paid.
            </h1>
            <p className="body-lg text-on-primary/80 mb-xxl">
              The personal way to manage shared expenses. Send custom WhatsApp links, track payments automatically, and never ask twice.
            </p>
            <Link href="/dashboard" className="btn-on-dark-pill inline-block">
              Start Splitting
            </Link>
          </div>
        </div>

        {/* Half-Bleed Portrait Subject area */}
        <div className="relative z-10 flex-1 hidden md:block">
          {/* We'd place a twilight portrait image here. Using a placeholder container. */}
          <div className="w-full h-full bg-primary-deep/50 relative">
            <div className="absolute inset-0 bg-gradient-to-l from-transparent to-primary"></div>
          </div>
        </div>
      </section>

      {/* Body Section */}
      <section className="bg-canvas py-huge px-lg md:px-huge">
        <div className="max-w-4xl mx-auto space-y-xxl">
          <div className="text-center mb-huge">
            <h2 className="display-xl text-ink">How suedue Works</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-xl">
            {/* Feature row cards */}
            <div className="bg-canvas-soft rounded-lg p-xxl border border-hairline">
              <h3 className="display-lg mb-md">1. Create a Bill</h3>
              <p className="body-md text-ink-mute">
                Add friends and define their splits. Everything is calculated in exact paise for zero rounding errors.
              </p>
            </div>
            
            <div className="bg-canvas-soft rounded-lg p-xxl border border-hairline">
              <h3 className="display-lg mb-md">2. WhatsApp Links</h3>
              <p className="body-md text-ink-mute">
                Send personalized payment links directly to their WhatsApp using our OpenWA integration.
              </p>
            </div>

            <div className="bg-canvas-soft rounded-lg p-xxl border border-hairline">
              <h3 className="display-lg mb-md">3. Automatic Verification</h3>
              <p className="body-md text-ink-mute">
                FamPay payments are verified automatically within 15 minutes through our Python IMAP service.
              </p>
            </div>

            <div className="bg-canvas-soft rounded-lg p-xxl border border-hairline">
              <h3 className="display-lg mb-md">4. Manual Tracking</h3>
              <p className="body-md text-ink-mute">
                Mark cash or other payments manually. Full audit logs keep track of every transaction.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Closing Teal Band */}
      <section className="bg-surface-teal-deep text-on-primary py-huge px-lg md:px-huge text-center flex flex-col items-center justify-center">
        <h2 className="display-lg mb-xl">Ready to manage your dues?</h2>
        <Link href="/dashboard" className="btn-on-teal inline-block">
          Open Dashboard
        </Link>
      </section>
      
      {/* Footer */}
      <footer className="bg-canvas text-ink-mute caption py-huge px-xl border-t border-hairline flex flex-col items-center">
        <p>© 2026 suedue Personal App.</p>
      </footer>
    </div>
  );
}
