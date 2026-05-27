import type { Metadata } from "next";
import { Cormorant_Garamond, Inter, JetBrains_Mono } from "next/font/google";
import "@/styles/globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sanctum",
  description: "A safety harness for the AI surfaces of regulated wealth.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${inter.variable} ${jetbrains.variable}`}
    >
      <body className="bg-bg text-ink font-sans min-h-screen relative">
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-rule bg-bg/90 backdrop-blur-sm">
          <div className="max-w-[1400px] mx-auto px-8 h-14 flex items-center justify-between">
            <a href="/traces" className="flex items-center gap-2 no-underline hover:no-underline">
              <span className="text-gold text-lg">&#9671;</span>
              <span className="font-serif text-ink text-lg tracking-wide">Sanctum</span>
            </a>
            <div className="flex items-center gap-8 text-xs tracking-[0.15em] uppercase text-ink-dim">
              <a href="/traces" className="text-ink-dim hover:text-ink no-underline transition-colors">Traces</a>
              <a href="/evals" className="text-ink-dim hover:text-ink no-underline transition-colors">Evals</a>
              <a href="/intake" className="text-ink-dim hover:text-ink no-underline transition-colors">Intake</a>
              <span className="text-ink-faint">v0.1.0</span>
            </div>
          </div>
        </nav>
        <main className="pt-14 relative z-10">
          {children}
        </main>
      </body>
    </html>
  );
}
