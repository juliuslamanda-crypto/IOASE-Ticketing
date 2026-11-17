
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, Play, Send } from "lucide-react";

type TicketStatus =
  | "assigned"
  | "in_progress"
  | "resolved"
  | "closed";

type Props = {
  ticketId: string;
  status: TicketStatus;
};

const nextStatus: Record<
  TicketStatus,
  { value: TicketStatus; label: string } | null
> = {
  assigned: {
    value: "in_progress",
    label: "Mulai Penanganan",
  },
  in_progress: {
    value: "resolved",
    label: "Tandai Selesai Ditangani",
  },
  resolved: {
    value: "closed",
    label: "Tutup Tiket",
  },
  closed: null,
};

export default function TicketHandlingPanel({
  ticketId,
  status,
}: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [description, setDescription] = useState("");
  const [loadingNote, setLoadingNote] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const canAddNote =
    status === "assigned" || status === "in_progress";

  const handleAddNote = async () => {
    const trimmedDescription = description.trim();

    if (!trimmedDescription) {
      setError("Catatan progres tidak boleh kosong.");
      return;
    }

    setLoadingNote(true);
    setError("");
    setMessage("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Sesi pengguna tidak ditemukan.");
      }

      const { error: insertError } = await supabase
        .from("ticket_updates")
        .insert({
          ticket_id: ticketId,
          author_user_id: user.id,
          progress_description: trimmedDescription,
        });

      if (insertError) throw insertError;

      setDescription("");
      setMessage("Catatan progres berhasil ditambahkan.");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal menambahkan catatan progres."
      );
    } finally {
      setLoadingNote(false);
    }
  };

  const handleStatusChange = async () => {
    const transition = nextStatus[status];

    if (!transition) return;

    const confirmed = window.confirm(
      `Apakah kamu yakin ingin mengubah status menjadi "${transition.label}"?`
    );

    if (!confirmed) return;

    setLoadingStatus(true);
    setError("");
    setMessage("");

    try {
      const { error: rpcError } = await supabase.rpc(
        "update_ticket_status",
        {
          p_ticket_id: ticketId,
          p_new_status: transition.value,
        }
      );

      if (rpcError) throw rpcError;

      setMessage("Status tiket berhasil diperbarui.");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal memperbarui status tiket."
      );
    } finally {
      setLoadingStatus(false);
    }
  };

  const transition = nextStatus[status];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-slate-800">
        Penanganan Tiket
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        Perbarui status dan catat perkembangan penanganan tiket.
      </p>

      {canAddNote && (
        <div className="mt-5">
          <label
            htmlFor="progress-description"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Catatan Perkembangan
          </label>

          <textarea
            id="progress-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Tuliskan perkembangan penanganan tiket..."
            className="w-full rounded-xl border border-slate-300 p-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

          <button
            type="button"
            onClick={handleAddNote}
            disabled={loadingNote || !description.trim()}
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send size={16} />
            {loadingNote ? "Menyimpan..." : "Tambah Catatan"}
          </button>
        </div>
      )}

      {transition && (
        <div className="mt-5 border-t border-slate-100 pt-5">
          <button
            type="button"
            onClick={handleStatusChange}
            disabled={loadingStatus || loadingNote}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === "assigned" ? (
              <Play size={17} />
            ) : (
              <CheckCircle2 size={17} />
            )}

            {loadingStatus
              ? "Memproses..."
              : transition.label}
          </button>
        </div>
      )}

      {status === "closed" && (
        <p className="mt-5 text-sm font-medium text-slate-500">
          Tiket ini sudah ditutup. Tidak ada tindakan lanjutan.
        </p>
      )}

      {message && (
        <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
          {message}
        </p>
      )}

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
    </section>
  );
}
