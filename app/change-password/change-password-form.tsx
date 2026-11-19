
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  LockKeyhole,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";
import { changePasswordAction } from "./actions";

type Props = {
  fullName: string;
};

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-12 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

export default function ChangePasswordForm({ fullName }: Props) {
  const router = useRouter();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");

    if (newPassword.length < 8) {
      setErrorMessage("Password baru minimal 8 karakter.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Konfirmasi password tidak cocok.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();

      formData.set("newPassword", newPassword);
      formData.set("confirmPassword", confirmPassword);

      const result = await changePasswordAction(formData);

      if (!result.success) {
        setErrorMessage(result.message);
        return;
      }

      // Membersihkan password dari state formulir
      setNewPassword("");
      setConfirmPassword("");

      // Mengarahkan pengguna ke Dashboard
      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      console.error("Change password error:", error);

      setErrorMessage(
        "Terjadi kesalahan saat mengganti password. Silakan coba lagi."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-md">
        {/* LOGO */}
        <div className="mb-7 flex items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#102C46] text-xl font-bold text-white">
            O
          </div>

          <div>
            <h1 className="text-xl font-bold text-[#102C46]">
              OASE
            </h1>
            <p className="text-[10px] tracking-[0.2em] text-slate-500">
              TICKETING SYSTEM
            </p>
          </div>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/60 sm:p-9">
          {/* ICON */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <ShieldCheck size={32} />
          </div>

          {/* HEADING */}
          <div className="mt-5 text-center">
            <p className="text-sm font-semibold text-blue-600">
              Keamanan Akun
            </p>

            <h2 className="mt-2 text-2xl font-bold text-slate-800">
              Ganti Password
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Halo, <span className="font-semibold text-slate-700">{fullName}</span>.
              Untuk melanjutkan, silakan buat password baru untuk akun Anda.
            </p>
          </div>

          {/* INFORMATION */}
          <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
            <div className="flex gap-3">
              <LockKeyhole
                size={19}
                className="mt-0.5 shrink-0 text-blue-600"
              />

              <p className="text-xs leading-5 text-blue-800">
                Anda diwajibkan mengganti password sementara sebelum
                dapat mengakses Dashboard Ticketing OASE.
              </p>
            </div>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {/* PASSWORD BARU */}
            <div>
              <label
                htmlFor="newPassword"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Password Baru
              </label>

              <div className="relative">
                <input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(event) =>
                    setNewPassword(event.target.value)
                  }
                  placeholder="Masukkan password baru"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={128}
                  required
                  className={inputClass}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={
                    showPassword ? "Sembunyikan password" : "Lihat password"
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600"
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>

              <p className="mt-2 text-xs text-slate-400">
                Password minimal 8 karakter.
              </p>
            </div>

            {/* KONFIRMASI PASSWORD */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Konfirmasi Password Baru
              </label>

              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  placeholder="Ulangi password baru"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={128}
                  required
                  className={inputClass}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  aria-label={
                    showConfirmPassword
                      ? "Sembunyikan password"
                      : "Lihat password"
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>
            </div>

            {/* ERROR */}
            {errorMessage && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                {errorMessage}
              </div>
            )}

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LockKeyhole size={18} />
              {loading ? "Menyimpan Password..." : "Simpan Password Baru"}
            </button>
          </form>
        </section>

        <p className="mt-6 text-center text-xs text-slate-400">
          PT Informatics OASE · Ticketing Portal
        </p>
      </div>
    </main>
  );
}
