
import { Suspense, type ReactNode } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <p className="text-slate-500">
        Memeriksa akses pengguna...
      </p>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Suspense fallback={<Loading />}>
      <DashboardAccessGuard>
        {children}
      </DashboardAccessGuard>
    </Suspense>
  );
}

async function DashboardAccessGuard({
  children,
}: {
  children: ReactNode;
}) {
  await connection();

  const supabase = await createClient();

  // Memeriksa session pengguna
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // Memeriksa status akun dan kewajiban mengganti password
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("is_active, must_change_password")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile || !profile.is_active) {
    redirect("/");
  }

  // Memblokir akses Dashboard sebelum password diganti
  if (profile.must_change_password) {
    redirect("/change-password");
  }

  return <>{children}</>;
}
