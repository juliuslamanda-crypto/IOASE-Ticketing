
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightLeft, LoaderCircle } from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type Props = {
  ticketId: string;
  hasPendingRequest: boolean;
};

export default function RequestTransferForm({
  ticketId,
  hasPendingRequest,
}: Props) {
  const router = useRouter();

  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    const trimmedReason = reason.trim();

    if (!trimmedReason) {
      setErrorMessage("Alasan transfer wajib diisi.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const { data, error } = await supabase.rpc(
        "request_ticket_transfer",
        {
          p_ticket_id: ticketId,
          p_reason: trimmedReason,
        }
      );

      if (error) {
        throw new Error(error.message);
      }

      setSuccessMessage(
        `Permintaan transfer berhasil diajukan. ID: ${data}`
      );

      setReason("");

      router.refresh();
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Gagal mengajukan transfer tiket."
      );
    } finally {
      setLoading(false);
    }
  };

  if (hasPendingRequest) {
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-amber-100 p-3 text-amber-700">
            <ArrowRightLeft size={21} />
          </div>

          <div>
            <h2 className="font-bold text-amber-900">
              Permintaan Transfer Sedang Diproses
            </h2>

            <p className="mt-1 text-sm text-amber-700">
              Permintaan transfer tiket ini sudah dikirim kepada Admin.
              Petugas saat ini tetap bertanggung jawab sampai keputusan diberikan.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
          <ArrowRightLeft size={21} />
        </div>

        <div>
          <h2 className="font-bold text-slate-800">
            Ajukan Transfer Tiket
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Ajukan perpindahan penanganan kepada Admin.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <label
            htmlFor="transfer-reason"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Alasan Transfer
          </label>

          <textarea
            id="transfer-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            disabled={loading}
            required
            minLength={5}
            maxLength={1000}
            rows={4}
            placeholder="Jelaskan alasan mengapa tiket perlu dialihkan ke Helpdesk lain..."
            className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:opacity-60"
          />

          <p className="mt-1 text-right text-xs text-slate-400">
            {reason.length}/1000 karakter
          </p>
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

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || reason.trim().length < 5}
            className="inline-flex items-center gap-2 rounded-xl bg-[#102C46] px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <LoaderCircle size={17} className="animate-spin" />
                Mengirim...
              </>
            ) : (
              <>
                <ArrowRightLeft size={17} />
                Ajukan Transfer
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
