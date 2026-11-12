"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import { authApi } from "@/lib/api";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function VerifyEmailPage() {
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your email address...");

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const queryToken = query.get("token") || query.get("access_token") || "";
    if (queryToken) {
      setToken(queryToken);
      return;
    }

    const hash = window.location.hash?.startsWith("#") ? window.location.hash.slice(1) : "";
    if (!hash) {
      setToken("");
      return;
    }

    const hashParams = new URLSearchParams(hash);
    setToken(hashParams.get("access_token") || "");
  }, []);

  useEffect(() => {
    async function verify() {
      if (!token) {
        setStatus("error");
        setMessage("Missing or invalid verification token.");
        return;
      }

      try {
        const response = await authApi.verifyEmail(token);
        setStatus("success");
        setMessage(response.data?.message || "Email address verified successfully. You can now access your account.");
      } catch (error: any) {
        setStatus("error");
        setMessage(error?.response?.data?.detail || "Verification failed. The token may be invalid or expired.");
      }
    }

    verify();
  }, [token]);

  return (
    <div className="flex min-h-dvh flex-col bg-surface-50">
      <Navbar />

      <main className="flex flex-1 items-center justify-center px-4 py-20">
        <div className="w-full max-w-md rounded-2xl border border-surface-200 bg-white p-8 text-center shadow-card-md sm:p-10">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl">
            {status === "loading" && (
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
                <Loader2 className="h-7 w-7 animate-spin motion-reduce:animate-none" />
              </div>
            )}
            {status === "success" && (
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success-50 text-success-700">
                <CheckCircle2 className="h-7 w-7" />
              </div>
            )}
            {status === "error" && (
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-50 text-danger-700">
                <AlertCircle className="h-7 w-7" />
              </div>
            )}
          </div>

          <h1 className="font-heading text-2xl font-bold tracking-tight text-surface-900">
            {status === "loading" && "Verifying token"}
            {status === "success" && "Account verified"}
            {status === "error" && "Verification failed"}
          </h1>

          <p
            className={`mt-3 text-sm leading-relaxed ${
              status === "success"
                ? "text-success-800"
                : status === "error"
                  ? "text-danger-800"
                  : "text-surface-600"
            }`}
          >
            {message}
          </p>

          <div className="mt-8 flex flex-col gap-3">
            <Link
              href="/login"
              className="btn-primary btn-md inline-flex items-center justify-center gap-2 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 active:scale-[0.99] motion-reduce:transform-none"
            >
              <span>Go to sign in</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            {status === "error" && (
              <Link
                href="/register"
                className="btn-secondary btn-md inline-flex items-center justify-center whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface-400 active:scale-[0.99] motion-reduce:transform-none"
              >
                <span>Back to registration</span>
              </Link>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
