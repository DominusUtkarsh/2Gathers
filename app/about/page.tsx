import { DashboardLayout } from "@/components/DashboardLayout";
import { mockTeam } from "@/lib/db";
import { Target, Users, Rocket } from "lucide-react";

const visionItems = [
  { icon: Target, label: "Mission", value: "Make freelance work easier to discover, apply to, and manage." },
  { icon: Users, label: "Team", value: "Design, product, and engineering focused on clarity and scale." },
  { icon: Rocket, label: "Future", value: "A foundation that can evolve into real blockchain payments later." },
];

export default function AboutPage() {
  return (
    <DashboardLayout
      title="About 2Gathers"
      subtitle="A focused freelancing marketplace designed for stronger job matching, safer token flows, and a clearer path to decentralized verification."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-surface-200 bg-white p-7 shadow-card-sm lg:col-span-2">
          <p className="text-xs font-semibold text-primary-700">Platform vision</p>
          <h2 className="mt-1.5 font-heading text-2xl font-bold text-surface-900">
            A sharper way to match talent and work
          </h2>
          <p className="mt-3.5 max-w-3xl text-sm leading-relaxed text-surface-600">
            2Gathers is built to feel serious, simple, and trustworthy. We reduce friction between clients and freelancers by pairing
            transparent project discovery with a token economy that rewards progress and keeps client-freelancer commitments accountable.
          </p>

          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {visionItems.map((item) => (
              <div key={item.label} className="rounded-xl border border-surface-200 bg-surface-50/70 p-4">
                <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
                  <item.icon className="h-4 w-4" />
                </div>
                <p className="text-xs font-semibold text-surface-800">{item.label}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-surface-600">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-surface-200 bg-white p-7 shadow-card-sm">
          <p className="text-xs font-semibold text-primary-700">Core team</p>
          <div className="mt-4 space-y-3">
            {mockTeam.map((member) => {
              const initials = member.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
              return (
                <div key={member.name} className="rounded-xl border border-surface-200 bg-surface-50/60 p-4 transition-colors duration-150 hover:bg-white hover:border-surface-300">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary-700 text-xs font-bold text-white shadow-sm">
                      {initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-surface-900">{member.name}</p>
                      <p className="text-xs text-primary-700 font-medium">{member.role}</p>
                    </div>
                  </div>
                  <p className="mt-2.5 text-xs leading-relaxed text-surface-600">{member.bio}</p>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
