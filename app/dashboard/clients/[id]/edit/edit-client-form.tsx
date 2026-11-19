
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Building2, Save, CheckCircle2 } from "lucide-react";
import { updateClientAction } from "../../actions";

type Props = {
  clientId: string;
  initialData: {
    companyName: string;
    contactPerson: string;
    phone: string;
  };
};

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

export default function EditClientForm({
  clientId,
  initialData,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formElement = event.currentTarget;

    setLoading(true);
    setError("");
    setSaved(false);

    try {
      const formData = new FormData(formElement);

      const result = await updateClientAction(clientId, formData);

      if (!result.success) {
        setError(result.message);
        return;
      }

      setSaved(true);
    } catch (err) {
      console.error("Edit Klien error:", err);
      setError("Terjadi kesalahan saat memperbarui data Klien.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
    >
      <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
        <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
          <Building2 size={22} />
        </div>

        <div>
          <h2 className="font-bold text-slate-800">
            Informasi Perusahaan
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Ubah informasi perusahaan Klien.
          </p>
        </div>
      </div>

      {/* NAMA PERUSAHAAN */}
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
          defaultValue={initialData.companyName}
          onChange={() => setSaved(false)}
          placeholder="Masukkan nama perusahaan"
          className={inputClass}
        />
      </div>

      {/* CONTACT PERSON */}
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
          maxLength={150}
          defaultValue={initialData.contactPerson}
          onChange={() => setSaved(false)}
          placeholder="Masukkan nama Contact Person"
          className={inputClass}
        />
      </div>

      {/* NOMOR TELEPON */}
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
          maxLength={50}
          defaultValue={initialData.phone}
          onChange={() => setSaved(false)}
          placeholder="Masukkan nomor telepon"
          className={inputClass}
        />
      </div>

      {/* ERROR */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* SUCCESS */}
      {saved && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700"
        >
          <CheckCircle2 size={19} />
          Data perusahaan berhasil diperbarui.
        </div>
      )}

      {/* BUTTONS */}
      <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-5">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save size={17} />
          {loading ? "Menyimpan..." : "Simpan Perubahan"}
        </button>

        <Link
          href="/dashboard/clients"
          className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          Kembali
        </Link>
      </div>
    </form>
  );
}
