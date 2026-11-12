import { Suspense } from "react";
import { AuthPanel } from "@/components/AuthPanel";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-50" />}>
      <AuthPanel initialMode="login" />
    </Suspense>
  );
}