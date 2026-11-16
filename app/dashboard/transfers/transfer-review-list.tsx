
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRightLeft,
  CheckCircle2,
  XCircle,
  Clock3,
  LoaderCircle,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

export type HelpdeskOption = {
  id: string;
  fullName: string;
};

export type TransferRequestItem = {
  id: string;
  ticketNumber: string;
  subject: string;
  ticketStatus: string;
  currentHelpdeskId: string | null;
  currentHelpdeskName: string;
  requesterName: string;
  reason: string;
  requestedAt: string;
};

type Props = {
  requests: TransferRequestItem[];
  helpdesks: HelpdeskOption[];
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function TransferCard({
  request,
  helpdesks,
}: {
  request: TransferRequestItem;
  helpdesks: HelpdeskOption[];
}) {
  const router = useRouter();

  const [selectedHelpdesk, setSelectedHelpdesk] = useState("");
  const [reviewNote, setReviewNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Jangan menawarkan petugas yang sedang menangani tiket.
  const availableHelpdesks = helpdesks.filter(
    (item) => item.id !== request.currentHelpdeskId
  );

  const handleReview = async (
    decision: "approved" | "rejected"
  ) => {
    setErrorMessage("");
    setSuccessMessage("");

    if (decision === "approved" && !selectedHelpdesk) {
      setErrorMessage("Pilih Helpdesk baru terlebih dahulu.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const { error } = await supabase.rpc(
        "review_ticket_transfer",
        {
          p_transfer_request_id: request.id,
          p_decision: decision,
          p_new_helpdesk_id:
            decision === "approved" ? selectedHelpdesk : null,
          p_review_note:
            reviewNote.trim() ||
            (decision === "approved"
              ? "Transfer disetujui."
              : "Transfer ditolak."),
        }
      );

      if (error) {
        throw new Error(error.message);
      }

      setSuccessMessage(
        decision === "approved"
          ? "Transfer berhasil disetujui."
          : "Permintaan transfer berhasil ditolak."
      );

      // Memperbarui daftar permintaan Pending.
      router.refresh();
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Gagal memproses permintaan transfer."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* HEADER TIKET */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-blue-600">
            {request.ticketNumber}
          </p>

          <h3 className="mt-1 text-lg font-bold text-slate-800">
            {request.subject}
          </h3>

          <p className="mt-2 text-xs text-slate-400">
            Diajukan pada {formatDate(request.requestedAt)}
          </p>
        </div>

        <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
          <Clock3 size={13} className="mr-1 inline" />
          Pending
        </span>
      </div>

      <div className="my-5 border-t border-slate-100" />

      {/* INFORMASI TRANSFER */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <p className="text-xs text-slate-400">
            Diajukan oleh
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-700">
            {request.requesterName}
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-400">
            Petugas saat ini
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-700">
            {request.currentHelpdeskName}
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-xl bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase text-slate-400">
          Alasan Transfer
        </p>

        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
          {request.reason}
        </p>
      </div>

      {/* FORM KEPUTUSAN */}
      <div className="mt-6 space-y-5">
        <div>
          <label
            htmlFor={`helpdesk-${request.id}`}
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Pilih Helpdesk Pengganti
          </label>

          <select
            id={`helpdesk-${request.id}`}
            value={selectedHelpdesk}
            onChange={(event) =>
              setSelectedHelpdesk(event.target.value)
            }
            disabled={loading}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
          >
            <option value="">Pilih Helpdesk</option>

            {availableHelpdesks.map((helpdesk) => (
              <option key={helpdesk.id} value={helpdesk.id}>
                {helpdesk.fullName}
              </option>
            ))}
          </select>

          {availableHelpdesks.length === 0 && (
            <p className="mt-2 text-xs text-amber-600">
              Belum ada Helpdesk aktif lain yang tersedia.
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor={`review-${request.id}`}
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Catatan Keputusan
            <span className="ml-2 font-normal text-slate-400">
              (Opsional)
            </span>
          </label>

          <textarea
            id={`review-${request.id}`}
            value={reviewNote}
            onChange={(event) =>
              setReviewNote(event.target.value)
            }
            maxLength={1000}
            rows={3}
            disabled={loading}
            placeholder="Tambahkan catatan untuk keputusan transfer..."
            className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:opacity-60"
          />
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700"
          >
            {successMessage}
          </div>
        )}

        {/* TOMBOL KEPUTUSAN */}
        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={() => handleReview("rejected")}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-5 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {loading ? (
              <LoaderCircle size={17} className="animate-spin" />
            ) : (
              <XCircle size={17} />
            )}
            Tolak
          </button>

          <button
            type="button"
            disabled={loading || !selectedHelpdesk}
            onClick={() => handleReview("approved")}
            className="inline-flex items-center gap-2 rounded-xl bg-[#102C46] px-5 py-3 text-sm font-semibold text-white hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <LoaderCircle size={17} className="animate-spin" />
            ) : (
              <CheckCircle2 size={17} />
            )}
            Setujui Transfer
          </button>
        </div>
      </div>
    </article>
  );
}

export default function TransferReviewList({
  requests,
  helpdesks,
}: Props) {
  if (requests.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
        <CheckCircle2
          size={44}
          className="mx-auto text-emerald-500"
        />

        <h3 className="mt-4 font-bold text-slate-800">
          Tidak Ada Permintaan Pending
        </h3>

        <p className="mt-2 text-sm text-slate-500">
          Semua permintaan transfer sudah diproses.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {requests.map((request) => (
        <TransferCard
          key={request.id}
          request={request}
          helpdesks={helpdesks}
        />
      ))}
    </div>
  );
}
