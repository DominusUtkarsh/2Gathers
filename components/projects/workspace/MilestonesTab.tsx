"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Coins,
  Layers,
  Lock,
  Plus,
  ShieldCheck,
  Trash2,
} from "lucide-react";

import { projectsApi } from "@/lib/api";
import { TOKEN_PRICE_INR } from "@/lib/tokenomics";
import { DeliverableStatusBadge, EscrowStatusBadge } from "./DeliverableStatusBadge";
import { MilestoneProgressBar } from "./MilestoneProgressBar";
import { getDeadlineMeta, type ProjectDetail } from "./types";

type MilestonesTabProps = {
  project: ProjectDetail;
  viewerRole: "CLIENT" | "FREELANCER" | "ADMIN";
  onRefresh: () => Promise<void>;
};

export function MilestonesTab({
  project,
  viewerRole,
  onRefresh,
}: MilestonesTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("100");
  const [dueDate, setDueDate] = useState("");
  const [fundEscrow, setFundEscrow] = useState(false);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleCreateMilestone(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim().length < 2) {
      setErrorMsg("Milestone title must be at least 2 characters.");
      return;
    }
    const tokenAmount = Number(amount || "0");
    if (!Number.isInteger(tokenAmount) || tokenAmount < 0) {
      setErrorMsg("Token amount must be a whole number (0 or greater).");
      return;
    }

    setErrorMsg("");
    setCreating(true);
    try {
      await projectsApi.milestones.create(project.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        amount: tokenAmount,
        dueDate: dueDate || null,
        fundEscrow,
      });
      setTitle("");
      setDescription("");
      setAmount("100");
      setDueDate("");
      setFundEscrow(false);
      setShowForm(false);
      await onRefresh();
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Unable to create milestone.";
      setErrorMsg(detail);
    } finally {
      setCreating(false);
    }
  }

  async function handleFundEscrow(milestoneId: number) {
    setErrorMsg("");
    setBusyId(milestoneId);
    try {
      await projectsApi.milestones.update(project.id, milestoneId, {
        action: "FUND_ESCROW",
      });
      await onRefresh();
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Unable to fund escrow.";
      setErrorMsg(detail);
    } finally {
      setBusyId(null);
    }
  }

  async function handleReleaseEscrow(milestoneId: number) {
    setErrorMsg("");
    setBusyId(milestoneId);
    try {
      await projectsApi.milestones.release(project.id, milestoneId);
      await onRefresh();
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Unable to release escrow.";
      setErrorMsg(detail);
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(milestoneId: number) {
    setErrorMsg("");
    setBusyId(milestoneId);
    try {
      await projectsApi.milestones.remove(project.id, milestoneId);
      await onRefresh();
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Unable to delete milestone.";
      setErrorMsg(detail);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Escrow Summary Strip */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-surface-200 bg-white p-4 shadow-card-sm">
          <p className="text-xs font-medium text-surface-500">
            Total milestone value
          </p>
          <p className="mt-1 font-heading text-xl font-bold tabular-nums text-surface-900">
            {project.escrowSummary.totalMilestoneAmount} TOK
          </p>
          <p className="mt-0.5 text-xs tabular-nums text-surface-500">
            ₹
            {(
              project.escrowSummary.totalMilestoneAmount * TOKEN_PRICE_INR
            ).toLocaleString()}
          </p>
        </div>

        <div className="rounded-xl border border-surface-200 bg-white p-4 shadow-card-sm">
          <p className="text-xs font-medium text-surface-500">
            Locked in escrow
          </p>
          <p className="mt-1 font-heading text-xl font-bold tabular-nums text-primary-700">
            {project.escrowSummary.fundedTokens} TOK
          </p>
          <p className="mt-0.5 text-xs text-surface-500">
            Held until deliverables are approved
          </p>
        </div>

        <div className="rounded-xl border border-surface-200 bg-white p-4 shadow-card-sm">
          <p className="text-xs font-medium text-surface-500">
            Released to freelancer
          </p>
          <p className="mt-1 font-heading text-xl font-bold tabular-nums text-success-700">
            {project.escrowSummary.releasedTokens} TOK
          </p>
          <p className="mt-0.5 text-xs tabular-nums text-surface-500">
            ₹
            {(
              project.escrowSummary.releasedTokens * TOKEN_PRICE_INR
            ).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Header + Client Add Milestone button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-base font-semibold text-surface-900">
            Contract milestones
          </h2>
          <p className="text-xs text-surface-500">
            Escrow releases when all deliverables assigned to a milestone are approved.
          </p>
        </div>

        {viewerRole === "CLIENT" && project.status !== "COMPLETED" && (
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 active:scale-[0.98] motion-reduce:transform-none"
          >
            <Plus className="h-4 w-4" />
            <span>{showForm ? "Cancel" : "Add milestone"}</span>
          </button>
        )}
      </div>

      {/* Client Create Milestone Form */}
      {viewerRole === "CLIENT" && showForm && (
        <form
          onSubmit={handleCreateMilestone}
          className="rounded-2xl border border-primary-200 bg-white p-5 shadow-card-sm"
        >
          <h3 className="font-heading text-base font-semibold text-surface-900">
            New project milestone
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="ms-title"
                className="mb-1 block text-xs font-medium text-surface-600"
              >
                Milestone title
              </label>
              <input
                id="ms-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Phase 1 — Design & API Architecture"
                className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="ms-amount"
                  className="mb-1 block text-xs font-medium text-surface-600"
                >
                  Amount (TOK)
                </label>
                <input
                  id="ms-amount"
                  type="number"
                  min={0}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm tabular-nums text-surface-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                />
                <p className="mt-1 text-[11px] tabular-nums text-surface-400">
                  ≈ ₹{(Number(amount || 0) * TOKEN_PRICE_INR).toLocaleString()}
                </p>
              </div>
              <div>
                <label
                  htmlFor="ms-due"
                  className="mb-1 block text-xs font-medium text-surface-600"
                >
                  Due date
                </label>
                <input
                  id="ms-due"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="ms-desc"
                className="mb-1 block text-xs font-medium text-surface-600"
              >
                Acceptance criteria
              </label>
              <textarea
                id="ms-desc"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what must be delivered and verified for this milestone..."
                className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-surface-700">
                <input
                  type="checkbox"
                  checked={fundEscrow}
                  onChange={(e) => setFundEscrow(e.target.checked)}
                  className="h-4 w-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                />
                <span>
                  Lock {Number(amount || 0)} TOK from my wallet into escrow right now
                </span>
              </label>
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2.5">
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transform-none"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{creating ? "Creating..." : "Create milestone"}</span>
            </button>
          </div>
        </form>
      )}

      {errorMsg && (
        <div className="rounded-lg border border-danger-200 bg-danger-50 px-3.5 py-2.5 text-xs font-medium text-danger-700">
          {errorMsg}
        </div>
      )}

      {/* Milestones List */}
      {project.milestones.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-surface-300 bg-white px-6 py-12 text-center">
          <Layers className="mx-auto h-8 w-8 text-surface-300" />
          <p className="mt-2 font-heading text-sm font-semibold text-surface-900">
            No milestones created yet
          </p>
          <p className="mt-1 text-xs text-surface-500">
            {viewerRole === "CLIENT"
              ? "Add milestones to establish structured checkpoints and escrow funding."
              : "Your client can add funded milestones at any point during the contract."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {project.milestones.map((m) => {
            const approvedCount = m.deliverables.filter(
              (d) => d.status === "APPROVED",
            ).length;
            const allApproved =
              m.deliverables.length === 0 ||
              approvedCount === m.deliverables.length;
            const deadline = getDeadlineMeta(
              m.dueDate,
              m.status === "RELEASED" || m.status === "COMPLETED",
            );
            const busy = busyId === m.id;

            return (
              <div
                key={m.id}
                className="rounded-2xl border border-surface-200 bg-white p-5 shadow-card-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-heading text-base font-semibold text-surface-900">
                        {m.title}
                      </h3>
                      <EscrowStatusBadge status={m.escrowStatus} />
                      {deadline.label && (
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${deadline.className}`}
                        >
                          {deadline.label}
                        </span>
                      )}
                    </div>
                    {m.description && (
                      <p className="text-sm text-surface-600">{m.description}</p>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="font-heading text-lg font-bold tabular-nums text-surface-900">
                      {m.amount} TOK
                    </p>
                    <p className="text-xs tabular-nums text-surface-500">
                      ₹{(m.amount * TOKEN_PRICE_INR).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <MilestoneProgressBar
                    approved={approvedCount}
                    total={m.deliverables.length}
                    released={m.status === "RELEASED"}
                  />
                </div>

                {m.deliverables.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {m.deliverables.map((d) => (
                      <div
                        key={d.id}
                        className="inline-flex items-center gap-2 rounded-lg border border-surface-200 bg-surface-50 px-2.5 py-1 text-xs"
                      >
                        <span className="font-medium text-surface-700">
                          {d.title}
                        </span>
                        <DeliverableStatusBadge status={d.status} />
                      </div>
                    ))}
                  </div>
                )}

                {viewerRole === "CLIENT" && m.escrowStatus !== "RELEASED" && (
                  <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-surface-100 pt-3">
                    {m.escrowStatus === "UNFUNDED" && m.amount > 0 && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleFundEscrow(m.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700 transition-colors hover:bg-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transform-none"
                      >
                        <Lock className="h-3.5 w-3.5" />
                        <span>Fund escrow ({m.amount} TOK)</span>
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={busy || !allApproved}
                      title={
                        allApproved
                          ? "Release milestone payment to freelancer wallet"
                          : "Approve all deliverables in this milestone first"
                      }
                      onClick={() => handleReleaseEscrow(m.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-success-600 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-success-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transform-none"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>
                        {m.escrowStatus === "FUNDED"
                          ? "Release escrow"
                          : "Fund & release"}
                      </span>
                    </button>

                    {m.escrowStatus === "UNFUNDED" && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleDelete(m.id)}
                        aria-label={`Delete milestone ${m.title}`}
                        className="rounded-lg border border-surface-200 p-1.5 text-surface-500 hover:border-danger-200 hover:bg-danger-50 hover:text-danger-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Escrow Transaction Ledger */}
      <section className="rounded-2xl border border-surface-200 bg-white p-5 shadow-card-sm">
        <div className="mb-3 flex items-center gap-2">
          <Coins className="h-4 w-4 text-primary-600" />
          <h3 className="font-heading text-sm font-semibold text-surface-900">
            Escrow transaction ledger
          </h3>
        </div>

        {project.escrowTransactions.length === 0 ? (
          <p className="text-xs text-surface-500">
            No escrow funding or release transactions recorded for this contract yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-surface-200 text-surface-500">
                  <th className="py-2 pr-4 font-medium">Event</th>
                  <th className="py-2 pr-4 font-medium">Amount</th>
                  <th className="py-2 pr-4 font-medium">Transaction hash</th>
                  <th className="py-2 font-medium text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {project.escrowTransactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="py-2.5 pr-4 font-medium text-surface-800">
                      {tx.type === "ESCROW_RELEASE"
                        ? "Escrow released"
                        : "Escrow funded"}
                    </td>
                    <td className="py-2.5 pr-4 tabular-nums font-semibold text-surface-900">
                      {tx.tokenAmount} TOK (₹{tx.totalInr.toLocaleString()})
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-[11px] text-surface-500">
                      {tx.txHash.slice(0, 18)}…
                    </td>
                    <td className="py-2.5 text-right tabular-nums text-surface-500">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
