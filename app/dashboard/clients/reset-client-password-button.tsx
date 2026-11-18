
"use client";

import { useState } from "react";
import {
  KeyRound,
  ShieldCheck,
  Copy,
  X,
  Loader2,
} from "lucide-react";
import { resetClientPasswordAction } from "./actions";

type Props = {
  userId: string;
};

export default function ResetClientPasswordButton({
  userId,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  function closeModal() {
    if (loading) return;

    setIsOpen(false);
    setPassword("");
    setError("");
    setCopied(false);
  }

  async function handleReset() {
    setLoading(true);
    setError("");

    try {
      const result = await resetClientPasswordAction(userId);

      if (!result.success) {
        setError(result.message);
        return;
      }

      setPassword(result.temporaryPassword);
    } catch (err) {
      console.error("Reset password error:", err);
      setError("Gagal mereset password. Silakan coba kembali.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setError("");
    } catch {
      setError("Gagal menyalin password. Silakan salin secara manual.");
    }
  }

  return (
    <>
      {/* TOMBOL RESET PASSWORD */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-700 transition hover:border-blue-400 hover:bg-blue-50"
      >
        <KeyRound size={15} />
        Reset Password
      </button>

      {/* CUSTOM MODAL */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-modal-title"
            className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            {/* CLOSE BUTTON */}
            <button
              type="button"
              onClick={closeModal}
              disabled={loading}
              aria-label="Tutup popup"
              className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
            >
              <X size={19} />
            </button>

            <div className="p-7">
              {!password ? (
                <>
                  {/* KONFIRMASI RESET */}
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <KeyRound size={30} />
                  </div>

                  <div className="mt-5 text-center">
                    <h2
                      id="reset-modal-title"
                      className="text-xl font-bold text-slate-800"
                    >
                      Reset Password?
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Apakah kamu yakin ingin mereset password akun
                      Klien ini?
                    </p>
                  </div>

                  <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4">
                    <p className="text-sm leading-6 text-blue-800">
                      Password lama akan langsung tidak berlaku
                      dan diganti dengan password sementara yang baru.
                    </p>
                  </div>

                  {error && (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  <div className="mt-7 flex gap-3">
                    <button
                      type="button"
                      onClick={closeModal}
                      disabled={loading}
                      className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                      Batal
                    </button>

                    <button
                      type="button"
                      onClick={handleReset}
                      disabled={loading}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <Loader2
                            size={17}
                            className="animate-spin"
                          />
                          Memproses...
                        </>
                      ) : (
                        "Ya, Reset Password"
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* RESET BERHASIL */}
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <ShieldCheck size={32} />
                  </div>

                  <div className="mt-5 text-center">
                    <h2
                      id="reset-modal-title"
                      className="text-xl font-bold text-slate-800"
                    >
                      Password Berhasil Direset!
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Password sementara akun Klien berhasil dibuat.
                    </p>
                  </div>

                  <div className="mt-6">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Password Sementara Baru
                    </label>

                    <div className="mt-2 flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3">
                      <code className="min-w-0 flex-1 break-all text-sm font-semibold text-blue-800">
                        {password}
                      </code>

                      <button
                        type="button"
                        onClick={handleCopy}
                        className="shrink-0 rounded-lg bg-white p-2 text-blue-700 shadow-sm transition hover:bg-blue-100"
                        title="Salin password"
                      >
                        <Copy size={17} />
                      </button>
                    </div>

                    {copied && (
                      <p className="mt-2 text-xs font-medium text-blue-600">
                        Password berhasil disalin.
                      </p>
                    )}

                    {error && (
                      <p className="mt-2 text-xs text-red-600">
                        {error}
                      </p>
                    )}
                  </div>

                  <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4">
                    <p className="text-xs leading-5 text-blue-800">
                      Simpan password ini dan sampaikan kepada Klien
                      melalui kanal yang aman. Password hanya
                      ditampilkan pada popup ini.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={closeModal}
                    className="mt-6 w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    Selesai
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
