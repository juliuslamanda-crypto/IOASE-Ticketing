
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { registerClientAction } from "../actions";

type Product = {
  id: string;
  product_name: string;
};

type Props = {
  products: Product[];
};

type Result =
  | {
      success: true;
      companyName: string;
      email: string;
      initialPassword: string;
    }
  | {
      success: false;
      message: string;
    };

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

export default function CreateClientForm({ products }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData(event.currentTarget);
      const response = await registerClientAction(formData);

      setResult(response);

      if (response.success) {
        event.currentTarget.reset();
      }
    } catch {
      setResult({
        success: false,
        message: "Terjadi kesalahan saat menghubungi server.",
      });
    } finally {
      setLoading(false);
    }
  }

  // Hasil setelah akun Klien berhasil dibuat
  if (result?.success) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <span className="text-3xl">✓</span>
          </div>

          <h2 className="mt-5 text-xl font-bold text-slate-800">
            Klien Berhasil Didaftarkan
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Akun dan data perusahaan berhasil dibuat.
          </p>
        </div>

        <div className="mt-6 space-y-4 rounded-xl bg-slate-50 p-5">
          <div>
            <p className="text-xs text-slate-400">Perusahaan</p>
            <p className="mt-1 font-semibold text-slate-800">
              {result.companyName}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-400">Email Login</p>
            <p className="mt-1 font-semibold text-slate-800">
              {result.email}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500">
              Password Awal
            </p>

            <code className="mt-2 block break-all rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              {result.initialPassword}
            </code>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Salin dan sampaikan password ini kepada Klien melalui
              kanal yang aman. Password ini hanya ditampilkan pada
              halaman ini dan tidak dapat ditampilkan kembali.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/dashboard/clients"
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Kembali ke Data Klien
          </Link>

          <button
            type="button"
            onClick={() => setResult(null)}
            className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Tambah Klien Lain
          </button>
        </div>
      </section>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
    >
      {/* INFORMASI AKUN */}
      <section>
        <h2 className="font-bold text-slate-800">
          Informasi Akun Klien
        </h2>

        <p className="mt-1 text-xs text-slate-400">
          Informasi untuk login ke aplikasi Ticketing OASE.
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="fullName"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Nama Pengguna <span className="text-red-500">*</span>
            </label>

            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              maxLength={120}
              placeholder="Masukkan nama pengguna Klien"
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Email Login <span className="text-red-500">*</span>
            </label>

            <input
              id="email"
              name="email"
              type="email"
              required
              maxLength={254}
              placeholder="contoh@perusahaan.com"
              className={inputClass}
            />

            <p className="mt-2 text-xs text-slate-400">
              Email ini akan digunakan untuk masuk ke aplikasi.
            </p>
          </div>
        </div>
      </section>

      <div className="border-t border-slate-100" />

      {/* INFORMASI PERUSAHAAN */}
      <section>
        <h2 className="font-bold text-slate-800">
          Informasi Perusahaan
        </h2>

        <div className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="companyName"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Nama Perusahaan <span className="text-red-500">*</span>
            </label>

            <input
              id="companyName"
              name="companyName"
              type="text"
              required
              maxLength={150}
              placeholder="Contoh: PT Demo C"
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="contactPerson"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Contact Person
            </label>

            <input
              id="contactPerson"
              name="contactPerson"
              type="text"
              placeholder="Nama narahubung perusahaan"
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="phone"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Nomor Telepon
            </label>

            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="Contoh: 081234567890"
              className={inputClass}
            />
          </div>
        </div>
      </section>

      <div className="border-t border-slate-100" />

      {/* PRODUK */}
      <section>
        <h2 className="font-bold text-slate-800">
          Produk yang Digunakan
          <span className="ml-1 text-red-500">*</span>
        </h2>

        <p className="mt-1 text-xs text-slate-400">
          Pilih satu atau beberapa produk untuk perusahaan ini.
        </p>

        {products.length === 0 ? (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Belum ada produk aktif. Tambahkan produk terlebih dahulu.
          </p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {products.map((product) => (
              <label
                key={product.id}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-blue-400 hover:bg-blue-50/40"
              >
                <input
                  type="checkbox"
                  name="productIds"
                  value={product.id}
                  className="h-4 w-4 accent-blue-600"
                />

                <span className="text-sm font-semibold text-slate-700">
                  {product.product_name}
                </span>
              </label>
            ))}
          </div>
        )}
      </section>

      {/* ERROR */}
      {result && !result.success && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {result.message}
        </div>
      )}

      {/* SUBMIT */}
      <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-5">
        <button
          type="submit"
          disabled={loading || products.length === 0}
          className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Mendaftarkan Klien..." : "Daftarkan Klien"}
        </button>

        <Link
          href="/dashboard/clients"
          className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          Batal
        </Link>
      </div>
    </form>
  );
}
