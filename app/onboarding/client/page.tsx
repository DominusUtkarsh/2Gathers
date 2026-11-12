"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Building2, Globe, MessageSquare, ShieldCheck, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";

import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { clientProfileApi } from "@/lib/api";

type ClientProfile = {
  accountType: "INDIVIDUAL" | "COMPANY";
  displayName: string;
  companyName?: string | null;
  about: string;
  companySize: "SOLO" | "SMALL" | "MID" | "LARGE" | "ENTERPRISE";
  websiteUrl?: string | null;
  country: string;
  timezone: string;
  phone?: string | null;
  linkedinUrl?: string | null;
  preferredLanguages: string;
  budgetRange: "UNDER_1K" | "ONE_TO_FIVE_K" | "FIVE_TO_TEN_K" | "TEN_PLUS";
  hiringGoals: string;
  communicationPreference: "CHAT_EMAIL" | "VIDEO_CALLS" | "FLEXIBLE";
  responseExpectation: "WITHIN_24H" | "WITHIN_3_DAYS" | "FLEXIBLE";
};

const defaultValues: ClientProfile = {
  accountType: "INDIVIDUAL",
  displayName: "",
  companyName: "",
  about: "",
  companySize: "SMALL",
  websiteUrl: "",
  country: "",
  timezone: "Asia/Kolkata",
  phone: "",
  linkedinUrl: "",
  preferredLanguages: "English",
  budgetRange: "ONE_TO_FIVE_K",
  hiringGoals: "",
  communicationPreference: "CHAT_EMAIL",
  responseExpectation: "WITHIN_24H",
};

export default function ClientOnboardingPage() {
  const router = useRouter();
  const { user, login, token } = useAuth();
  const [status, setStatus] = useState("");
  const [isError, setIsError] = useState(false);
  const [form, setForm] = useState<ClientProfile>(defaultValues);
  const [countryOptions, setCountryOptions] = useState<string[]>([]);
  const [timezoneOptions, setTimezoneOptions] = useState<string[]>([]);

  useEffect(() => {
    const options = new Set<string>();
    const formatter = new Intl.DisplayNames(["en"], { type: "region" });
    for (let first = 65; first <= 90; first += 1) {
      for (let second = 65; second <= 90; second += 1) {
        const code = `${String.fromCharCode(first)}${String.fromCharCode(second)}`;
        const name = formatter.of(code);
        if (name && name !== code) {
          options.add(name);
        }
      }
    }
    setCountryOptions([...options].sort((a, b) => a.localeCompare(b)));

    if (typeof Intl.supportedValuesOf === "function") {
      setTimezoneOptions(Intl.supportedValuesOf("timeZone"));
    } else {
      setTimezoneOptions(["UTC", "Asia/Kolkata", "Europe/London", "America/New_York"]);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const isEditMode = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("edit") === "1";
    if (user.role !== "CLIENT") {
      router.replace("/dashboard");
      return;
    }
    if (user.hasClientProfile && !isEditMode) {
      router.replace("/dashboard");
    }
  }, [router, user]);

  const profileQuery = useQuery({
    queryKey: ["client-profile"],
    queryFn: async () => {
      const response = await clientProfileApi.me();
      return response.data?.profile as ClientProfile | null;
    },
    enabled: !!user && user.role === "CLIENT",
  });

  useEffect(() => {
    if (profileQuery.data) {
      setForm({
        ...defaultValues,
        ...profileQuery.data,
      });
    }
  }, [profileQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await clientProfileApi.save({
        accountType: form.accountType,
        displayName: form.displayName,
        companyName: form.companyName ?? undefined,
        about: form.about,
        companySize: form.companySize,
        websiteUrl: form.websiteUrl ?? undefined,
        country: form.country,
        timezone: form.timezone,
        phone: form.phone ?? undefined,
        linkedinUrl: form.linkedinUrl ?? undefined,
        preferredLanguages: form.preferredLanguages,
        budgetRange: form.budgetRange,
        hiringGoals: form.hiringGoals,
        communicationPreference: form.communicationPreference,
        responseExpectation: form.responseExpectation,
      });
    },
    onSuccess: () => {
      setIsError(false);
      setStatus("Client profile saved successfully");
      if (user && token) {
        login({
          user: {
            ...user,
            hasClientProfile: true,
          },
          token,
        });
      }
      router.push("/dashboard");
    },
    onError: (err: any) => {
      setIsError(true);
      setStatus(err?.response?.data?.detail || "Unable to save client profile");
    },
  });

  function onChange<K extends keyof ClientProfile>(key: K, value: ClientProfile[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function onSubmit() {
    if (!form.displayName.trim() || !form.country.trim() || !form.timezone.trim()) {
      setIsError(true);
      setStatus("Please complete all required profile fields");
      return;
    }
    if (form.accountType === "COMPANY" && !form.companyName?.trim()) {
      setIsError(true);
      setStatus("Company name is required for company accounts");
      return;
    }
    if (form.about.trim().length < 80) {
      setIsError(true);
      setStatus("About section must be at least 80 characters");
      return;
    }
    if (form.hiringGoals.trim().length < 40) {
      setIsError(true);
      setStatus("Hiring goals must be at least 40 characters");
      return;
    }

    if (form.phone?.trim() && !/^\+[1-9]\d{1,3}[\s-]?\d{6,14}$/.test(form.phone.trim())) {
      setIsError(true);
      setStatus("Phone number must start with country code like +91");
      return;
    }

    setIsError(false);
    saveMutation.mutate();
  }

  return (
    <DashboardLayout
      title="Client profile setup"
      subtitle="Establish your company identity and hiring criteria to receive high-relevance proposals."
    >
      <div className="mx-auto max-w-4xl space-y-8">
        <section className="rounded-2xl border border-surface-200 bg-white p-6 shadow-card-sm sm:p-8">
          <div className="mb-6 flex items-center justify-between border-b border-surface-100 pb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-heading text-lg font-bold text-surface-900">
                  Entity details
                </h2>
                <p className="text-xs text-surface-500">
                  Configure how your team or organization appears to talent.
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-surface-200 bg-surface-50 px-3 py-1 text-xs font-medium text-surface-600">
              <ShieldCheck className="h-3.5 w-3.5 text-primary-600" />
              Verified Client
            </span>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="label">Account structure *</span>
              <select
                className="input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                value={form.accountType}
                onChange={(event) => onChange("accountType", event.target.value as ClientProfile["accountType"])}
              >
                <option value="INDIVIDUAL">Individual client</option>
                <option value="COMPANY">Company / Studio</option>
              </select>
            </label>

            <label className="block">
              <span className="label">Display name *</span>
              <input
                className="input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                value={form.displayName}
                onChange={(event) => onChange("displayName", event.target.value)}
                placeholder="e.g. Kunal Sharma or Product Lead"
                required
              />
            </label>

            {form.accountType === "COMPANY" ? (
              <label className="block">
                <span className="label">Company name *</span>
                <input
                  className="input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                  value={form.companyName || ""}
                  onChange={(event) => onChange("companyName", event.target.value)}
                  placeholder="Acme Technologies Inc."
                />
              </label>
            ) : null}

            <label className="block">
              <span className="label">Company size *</span>
              <select
                className="input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                value={form.companySize}
                onChange={(event) => onChange("companySize", event.target.value as ClientProfile["companySize"])}
              >
                <option value="SOLO">Solo (1 person)</option>
                <option value="SMALL">2-10 team members</option>
                <option value="MID">11-50 team members</option>
                <option value="LARGE">51-200 team members</option>
                <option value="ENTERPRISE">200+ team members</option>
              </select>
            </label>

            <label className="block">
              <span className="label">Company website</span>
              <input
                className="input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                value={form.websiteUrl || ""}
                onChange={(event) => onChange("websiteUrl", event.target.value)}
                placeholder="https://example.com"
              />
            </label>

            <label className="block">
              <span className="label">LinkedIn profile</span>
              <input
                className="input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                value={form.linkedinUrl || ""}
                onChange={(event) => onChange("linkedinUrl", event.target.value)}
                placeholder="https://linkedin.com/company/..."
              />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-surface-200 bg-white p-6 shadow-card-sm sm:p-8">
          <div className="mb-6 flex items-center gap-3 border-b border-surface-100 pb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-surface-900">
                Location & communication
              </h2>
              <p className="text-xs text-surface-500">
                Ensure timezone alignment and response predictability for milestones.
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="label">Country *</span>
              <select
                className="input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                value={form.country}
                onChange={(event) => onChange("country", event.target.value)}
                required
              >
                <option value="">Select country</option>
                {countryOptions.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="label">Primary timezone *</span>
              <select
                className="input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                value={form.timezone}
                onChange={(event) => onChange("timezone", event.target.value)}
                required
              >
                <option value="">Select timezone</option>
                {timezoneOptions.map((timezone) => (
                  <option key={timezone} value={timezone}>
                    {timezone}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="label">Phone contact (with country code)</span>
              <input
                className="input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                value={form.phone || ""}
                onChange={(event) => onChange("phone", event.target.value)}
                placeholder="+91 9876543210"
              />
            </label>

            <label className="block">
              <span className="label">Preferred languages *</span>
              <input
                className="input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                value={form.preferredLanguages}
                onChange={(event) => onChange("preferredLanguages", event.target.value)}
                placeholder="English, Spanish"
                required
              />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-surface-200 bg-white p-6 shadow-card-sm sm:p-8">
          <div className="mb-6 flex items-center gap-3 border-b border-surface-100 pb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-surface-900">
                Hiring preferences & mission
              </h2>
              <p className="text-xs text-surface-500">
                Define typical project budgets and collaboration cadences.
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="label">Typical contract budget *</span>
              <select
                className="input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                value={form.budgetRange}
                onChange={(event) => onChange("budgetRange", event.target.value as ClientProfile["budgetRange"])}
              >
                <option value="UNDER_1K">Under $1,000</option>
                <option value="ONE_TO_FIVE_K">$1,000 - $5,000</option>
                <option value="FIVE_TO_TEN_K">$5,000 - $10,000</option>
                <option value="TEN_PLUS">$10,000+</option>
              </select>
            </label>

            <label className="block">
              <span className="label">Preferred collaboration mode *</span>
              <select
                className="input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                value={form.communicationPreference}
                onChange={(event) => onChange("communicationPreference", event.target.value as ClientProfile["communicationPreference"])}
              >
                <option value="CHAT_EMAIL">Async Chat + Email</option>
                <option value="VIDEO_CALLS">Live video reviews</option>
                <option value="FLEXIBLE">Flexible blend</option>
              </select>
            </label>

            <label className="block md:col-span-2">
              <span className="label">Review response commitment *</span>
              <select
                className="input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                value={form.responseExpectation}
                onChange={(event) => onChange("responseExpectation", event.target.value as ClientProfile["responseExpectation"])}
              >
                <option value="WITHIN_24H">Within 24 hours (Fast review)</option>
                <option value="WITHIN_3_DAYS">Within 3 business days</option>
                <option value="FLEXIBLE">Flexible schedule</option>
              </select>
            </label>

            <label className="block md:col-span-2">
              <div className="flex items-center justify-between">
                <span className="label">About your business * (minimum 80 characters)</span>
                <span className={`text-[11px] font-medium ${form.about.length >= 80 ? "text-success-700" : "text-surface-400"}`}>
                  {form.about.length} / 80
                </span>
              </div>
              <textarea
                className="input min-h-28 resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                value={form.about}
                onChange={(event) => onChange("about", event.target.value)}
                placeholder="Describe your organization, products, technical domain, and the caliber of freelancer engagement you require."
              />
            </label>

            <label className="block md:col-span-2">
              <div className="flex items-center justify-between">
                <span className="label">Primary hiring goals * (minimum 40 characters)</span>
                <span className={`text-[11px] font-medium ${form.hiringGoals.length >= 40 ? "text-success-700" : "text-surface-400"}`}>
                  {form.hiringGoals.length} / 40
                </span>
              </div>
              <textarea
                className="input min-h-24 resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                value={form.hiringGoals}
                onChange={(event) => onChange("hiringGoals", event.target.value)}
                placeholder="What critical outcomes, features, or deadlines are you targeting in the upcoming quarters?"
              />
            </label>
          </div>
        </section>

        {status ? (
          <div
            className={`flex items-center gap-2.5 rounded-xl border p-4 text-xs font-medium ${
              isError
                ? "border-danger-200 bg-danger-50 text-danger-700"
                : "border-success-200 bg-success-50 text-success-800"
            }`}
          >
            {isError ? <AlertCircle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
            <span>{status}</span>
          </div>
        ) : null}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onSubmit}
            className="btn-primary btn-md inline-flex items-center gap-2 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transform-none"
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent motion-reduce:animate-none" />
                Saving…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span>Save</span>
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
