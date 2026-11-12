import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const links = {
  Platform: [
    { href: "/jobs", label: "Find Jobs" },
    { href: "/register", label: "Get Started" },
    { href: "/wallet", label: "Wallet" },
    { href: "/chatbot", label: "AI Assistant" },
  ],
  Company: [
    { href: "/about", label: "About" },
    { href: "/support", label: "Support" },
    { href: "/login", label: "Sign in" },
  ],
  Legal: [
    { href: "#", label: "Privacy Policy" },
    { href: "#", label: "Terms of Service" },
  ],
};

function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-surface-800 bg-surface-950 text-surface-400">
      {/* Subtle gradient accent at top */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/40 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-5">
          <div className="md:col-span-2">
            <div className="mb-5 flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-accent-600 shadow-lg shadow-primary-600/25">
                <span className="text-sm font-black text-white">2G</span>
              </div>
              <span className="text-lg font-bold text-white">2Gathers</span>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-surface-400">
              A verified marketplace connecting clients and freelancers through structured hiring, proposals, and milestone workflows.
            </p>
            <div className="mt-6">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-white/10 transition-colors duration-150 hover:bg-white/10 hover:ring-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
              >
                Start building
              </Link>
            </div>
          </div>

          {Object.entries(links).map(([groupName, items]) => (
            <div key={groupName}>
              <h4 className="mb-4 text-xs font-semibold text-surface-300">
                {groupName}
              </h4>
              <ul className="space-y-3 text-sm">
                {items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="transition-colors duration-150 hover:text-white focus-visible:outline-none focus-visible:underline"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-surface-800 pt-8 text-xs text-surface-500 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} 2Gathers. All rights reserved.</p>
          <p className="text-surface-500">
            Platform operational
          </p>
        </div>
      </div>
    </footer>
  );
}

export { Footer };
export default Footer;
