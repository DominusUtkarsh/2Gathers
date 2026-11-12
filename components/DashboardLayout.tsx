"use client";

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export function DashboardLayout({
  title,
  subtitle,
  sidebar,
  children,
}: {
  title: string;
  subtitle?: string;
  sidebar?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-surface-50 text-surface-900">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl px-4 pb-8 pt-24 md:pb-12 md:pt-28">
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative mb-8 overflow-hidden rounded-2xl border border-surface-200/80 bg-white p-6 shadow-card-sm md:p-8 motion-reduce:transform-none"
        >
          {/* Accent on left border */}
          <div className="absolute left-0 top-0 h-full w-1 rounded-l-2xl bg-primary-600" />

          <div className="pl-4">
            <p className="text-xs font-medium text-surface-500">
              2Gathers
            </p>
            <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight md:text-4xl text-surface-900">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-2.5 max-w-3xl text-sm leading-relaxed text-surface-600 md:text-base">
                {subtitle}
              </p>
            ) : null}
          </div>
        </motion.section>

        {sidebar ? (
          <div className="grid gap-6 lg:grid-cols-[260px_1fr] lg:items-start">
            <motion.aside
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="card-surface p-4 lg:sticky lg:top-28"
            >
              {sidebar}
            </motion.aside>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.15 }}
            >
              {children}
            </motion.div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            {children}
          </motion.div>
        )}
      </main>
      <Footer />
    </div>
  );
}
