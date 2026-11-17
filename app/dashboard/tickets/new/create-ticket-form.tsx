
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Send, CheckCircle2 } from "lucide-react";

type Product = {
  id: string;
  product_name: string;
};

type Props = {
  products: Product[];
};

export default function CreateTicketForm({ products }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [productId, setProductId] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ticketNumber, setTicketNumber] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");

    if (!productId) {
      setError("Silakan pilih produk terlebih dahulu.");
      return;
    }

    if (!subject.trim() || !description.trim()) {
      setError("Perihal dan deskripsi pengaduan wajib diisi.");
      return;
    }

    setLoading(true);

    try {
      // Data perusahaan, pembuat, nomor tiket, dan status awal
      // ditentukan oleh database melalui trigger.
      const { data, error: insertError } = await supabase
        .from("tickets")
        .insert({
          product_id: productId,
          subject: subject.trim(),
          description: description.trim(),
        })
        .select("id, ticket_number")
        .single();

      if (insertError) {
        throw insertError;
      }

      setTicketNumber(data.ticket_number);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat mengirim pengaduan."
      );
    } finally {
      setLoading(false);
    }
  };

  // Tampilan setelah pengaduan berhasil dibuat
  if (ticketNumber) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 size={34} />
        </div>

        <h2 className="mt-5 text-xl font-bold text-slate-800">
          Pengaduan Berhasil Dikirim
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Pengaduan Anda telah tercatat di sistem Ticketing OASE.
        </p>

        <div className="mt-6 rounded-xl bg-slate-50 p-5">
          <p className="text-xs font-semibold uppercase text-slate-400">
            Nomor Tiket
          </p>
          <p className="mt-2 text-xl font-bold text-blue-700">
            {ticketNumber}
          </p>
        </div>

        <p className="mt-4 text-sm text-slate-500">
          Status awal pengaduan:{" "}
          <span className="font-semibold text-blue-700">Baru</span>
        </p>

        <Link
          href="/dashboard"
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Kembali ke Dashboard
        </Link>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600"
      >
        <ArrowLeft size={17} />
        Kembali ke Dashboard
      </Link>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {/* PILIH PRODUK */}
        <div>
          <label
            htmlFor="product"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Produk <span className="text-red-500">*</span>
          </label>

          {products.length === 0 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              Belum ada produk aktif yang terdaftar untuk perusahaan
              Anda. Silakan hubungi Admin OASE.
            </div>
          ) : (
            <>
              <select
                id="product"
                value={productId}
                onChange={(event) => setProductId(event.target.value)}
                required
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Pilih produk</option>

                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.product_name}
                  </option>
                ))}
              </select>

              <p className="mt-2 text-xs text-slate-400">
                Pilihan produk hanya menampilkan produk yang terdaftar
                untuk perusahaan Anda.
              </p>
            </>
          )}
        </div>

        {/* PERIHAL */}
        <div>
          <label
            htmlFor="subject"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Perihal Pengaduan <span className="text-red-500">*</span>
          </label>

          <input
            id="subject"
            type="text"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="Contoh: Kendala saat login ke aplikasi"
            required
            maxLength={150}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {/* DESKRIPSI */}
        <div>
          <label
            htmlFor="description"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Deskripsi Masalah <span className="text-red-500">*</span>
          </label>

          <textarea
            id="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={6}
            placeholder="Jelaskan permasalahan yang Anda alami secara rinci..."
            required
            className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {/* ERROR */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* SUBMIT */}
        <div className="border-t border-slate-100 pt-5">
          <button
            type="submit"
            disabled={loading || products.length === 0}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            <Send size={17} />
            {loading ? "Mengirim Pengaduan..." : "Kirim Pengaduan"}
          </button>
        </div>
      </form>
    </section>
  );
}
