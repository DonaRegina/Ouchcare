import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { Toaster } from "@/components/ui/sonner";
import { OuchLogo } from "@/components/brand/ouch-logo";
import { Navbar } from "@/components/auth/navbar";
import { APP_NAME } from "@/lib/constants/mock-data";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OUCHCare | Post-Op Pet Clothing",
  description:
    "OUCHCare is a pet post-operative clothing store with custom measurements, role-based access, and recovery-focused guidance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "h-full antialiased font-sans",
        geistSans.variable,
        geistMono.variable,
        inter.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white shadow-lg"
        >
          Skip to content
        </a>
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            scriptProps={{ "data-cfasync": "false" }}
          >
            {/* Global header -- single navbar for the app */}
            <header className="border-b border-[#bff1f5] bg-white/90 text-foreground shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-slate-950/85">
              <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between">
                <Link
                  href="/"
                  className="inline-flex items-center gap-3 text-foreground"
                >
                  <OuchLogo
                    compact
                    className="shrink-0 items-start gap-0 [&>svg]:h-10"
                  />
                  <span className="text-xl font-semibold tracking-tight text-[#ff9f2f] dark:text-[#ffc157]">
                    {APP_NAME}
                  </span>
                </Link>

                {/* Navbar component handles Sign In / Logout and top-level links */}
                <Navbar />
              </div>
            </header>

            {children}
            <Toaster richColors />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
