
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

const roleNames: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  helpdesk: "Helpdesk",
  client: "Klien",
};

function DashboardLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="rounded-xl bg-white p-8 shadow-sm">
        <p className="text-slate-600">Memuat dashboard...</p>
      </div>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent />
    </Suspense>
  );
}

async function DashboardContent() {
  // Menunggu request agar pemeriksaan session
  // dilakukan pada saat request berlangsung.
  await connection();

  const supabase = await createClient();

  // Memeriksa session pengguna
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // Mengambil profil pengguna
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("full_name, role, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile || !profile.is_active) {
    await supabase.auth.signOut();
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="flex items-center justify-between border-b bg-white px-8 py-5">
        <div>
          <h1 className="text-xl font-bold text-[#102C46]">
            OASE
          </h1>
          <p className="text-xs tracking-widest text-slate-500">
            TICKETING SYSTEM
          </p>
        </div>

        <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
          {roleNames[profile.role] || profile.role}
        </span>
      </header>

      <section className="mx-auto max-w-7xl px-8 py-12">
        <div className="rounded-2xl bg-white p-8 shadow-sm">
          <p className="text-sm font-medium text-blue-600">
            Dashboard
          </p>

          <h2 className="mt-2 text-3xl font-bold text-slate-800">
            Selamat datang, {profile.full_name}!
          </h2>

          <p className="mt-3 text-slate-500">
            Selamat datang di aplikasi Ticketing PT Informatics OASE.
          </p>

          <div className="mt-8 rounded-xl border border-dashed border-slate-300 p-8 text-center">
            <h3 className="font-semibold text-slate-700">
              Dashboard sedang dikembangkan
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Fitur akan disesuaikan dengan hak akses akun Anda.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
