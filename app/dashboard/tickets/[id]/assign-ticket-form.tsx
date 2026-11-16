
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { UserRound, ClipboardCheck, LoaderCircle } from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type HelpdeskOption = {
  id: string;
  full_name: string;
};

type AssignTicketFormProps = {
  ticketId: string;
  helpdesks: HelpdeskOption[];
};

export default function AssignTicketForm({
  ticketId,
  helpdesks,
}: AssignTicketFormProps) {
  const router = useRouter();

  const [helpdeskId, setHelpdeskId] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleAssign = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (!helpdeskId) {
      setErrorMessage("Silakan pilih petugas Helpdesk terlebih dahulu.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const { error } = await supabase.rpc("assign_ticket", {
        p_ticket_id: ticketId,
        p_helpdesk_id: helpdeskId,
        p_assignment_note: note.trim() || null,
      });

      if (error) {
        throw new Error(error.message);
      }

      setSuccessMessage("Tiket berhasil ditugaskan kepada Helpdesk.");

      setHelpdeskId("");
      setNote("");

      // Memuat ulang data tiket dari Supabase
      router.refresh();
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat menugaskan tiket."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
          <ClipboardCheck size={21} />
        </div>

        <div>
          <h2 className="font-bold text-slate-800">
            Penugasan Helpdesk
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Pilih petugas yang akan menangani pengaduan ini.
          </p>
        </div>
      </div>

      {helpdesks.length === 0 ? (
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          Belum ada akun Helpdesk aktif yang tersedia untuk penugasan.
        </div>
      ) : (
        <form onSubmit={handleAssign} className="mt-6 space-y-5">

          {/* PILIH HELPDESK */}
          <div>
            <label
              htmlFor="helpdesk"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Petugas Helpdesk
            </label>

            <div className="relative">
              <UserRound
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <select
                id="helpdesk"
                value={helpdeskId}
                onChange={(event) => setHelpdeskId(event.target.value)}
                disabled={loading}
                required
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:opacity-60"
              >
                <option value="">Pilih Helpdesk</option>

                {helpdesks.map((helpdesk) => (
                  <option key={helpdesk.id} value={helpdesk.id}>
                    {helpdesk.full_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* CATATAN PENUGASAN */}
          <div>
            <label
              htmlFor="assignment-note"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Catatan Penugasan
              <span className="ml-2 font-normal text-slate-400">
                (Opsional)
              </span>
            </label>

            <textarea
              id="assignment-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              disabled={loading}
              rows={3}
              maxLength={1000}
              placeholder="Tambahkan catatan untuk petugas Helpdesk..."
              className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:opacity-60"
            />

            <p className="mt-1 text-right text-xs text-slate-400">
              {note.length}/1000 karakter
            </p>
          </div>

          {/* NOTIFIKASI */}
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

          {/* TOMBOL ASSIGN */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || helpdesks.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#102C46] px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <LoaderCircle size={17} className="animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <ClipboardCheck size={17} />
                  Assign Tiket
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
