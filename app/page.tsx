
"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";


export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const router = useRouter();

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const supabase = createClient();

      // Login menggunakan Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        throw new Error("Email atau password tidak sesuai.");
      }

      if (!data.user) {
        throw new Error("Data pengguna tidak ditemukan.");
      }

      // Mengambil profil pengguna
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, role, is_active")
        .eq("id", data.user.id)
        .maybeSingle();

      if (profileError || !profile) {
        await supabase.auth.signOut();
        throw new Error("Profil akun belum terdaftar. Hubungi Admin.");
      }

      if (!profile.is_active) {
        await supabase.auth.signOut();
        throw new Error("Akun tidak aktif. Silakan hubungi Admin.");
      }

      const roleNames: Record<string, string> = {
        super_admin: "Super Admin",
        admin: "Admin",
        helpdesk: "Helpdesk",
        client: "Klien",
      };

      // Mengarahkan pengguna ke dashboard
router.replace("/dashboard");
router.refresh();
return;
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan. Silakan coba lagi."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 lg:grid lg:grid-cols-2">

      {/* Sisi kiri */}
      <section className="relative hidden overflow-hidden bg-[#102C46] px-14 py-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-blue-400/10 blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-xl font-bold text-[#102C46]">
              O
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-wide">OASE</h1>
              <p className="text-xs tracking-[0.25em] text-blue-200">
                TICKETING SYSTEM
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-lg">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">
            Customer Support Portal
          </p>

          <h2 className="text-5xl font-bold leading-tight">
            We are here to help you.
          </h2>

          <p className="mt-6 max-w-md leading-8 text-slate-300">
            Platform terintegrasi untuk mengelola pengaduan,
            memantau proses penanganan, dan meningkatkan
            kualitas layanan PT Informatics OASE.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <span className="rounded-full border border-white/20 px-5 py-2 text-sm">
              12DCO
            </span>
            <span className="rounded-full border border-white/20 px-5 py-2 text-sm">
              HRmatics
            </span>
          </div>
        </div>

        <div className="relative z-10 text-sm text-slate-400">
          © 2026 PT Informatics OASE. All rights reserved.
        </div>
      </section>

      {/* Sisi kanan: Form Login */}
      <section className="flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">

          <div className="mb-9 lg:hidden">
            <h1 className="text-3xl font-bold text-[#102C46]">
              OASE
            </h1>
            <p className="text-xs tracking-[0.25em] text-slate-500">
              TICKETING SYSTEM
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60 sm:p-10">

            <div className="mb-8">
              <p className="text-sm font-semibold text-blue-600">
                Welcome Back
              </p>

              <h2 className="mt-2 text-3xl font-bold text-slate-800">
                Sign In
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Masukkan email dan password untuk mengakses
                aplikasi Ticketing OASE.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Email
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Masukkan email"
                  autoComplete="username"
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Password
                </label>

                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password"
                    autoComplete="current-password"
                    required
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-20 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-blue-600 hover:text-blue-800"
                  >
                    {showPassword ? "Sembunyikan" : "Lihat"}
                  </button>
                </div>
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
                  <p className="mt-1 text-xs">
                    Sesi login tersimpan. Dashboard akan dibuka pada tahap berikutnya.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#102C46] py-3.5 font-semibold text-white shadow-lg shadow-blue-950/15 transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Memproses..." : "Sign In"}
              </button>
            </form>

            <p className="mt-8 text-center text-xs leading-5 text-slate-400">
              Akses aplikasi hanya diberikan kepada pengguna
              yang telah didaftarkan oleh Admin.
            </p>
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            PT Informatics OASE · Ticketing Portal
          </p>
        </div>
      </section>
    </main>
  );
}
