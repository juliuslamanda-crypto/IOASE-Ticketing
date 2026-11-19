
import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ChangePasswordForm from "./change-password-form";

function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <p className="text-slate-500">
        Memeriksa akun...
      </p>
    </div>
  );
}

export default function ChangePasswordPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ChangePasswordContent />
    </Suspense>
  );
}

async function ChangePasswordContent() {
  await connection();

  const supabase = await createClient();

  // Memeriksa session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // Mengambil profil pengguna
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("full_name, is_active, must_change_password")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile || !profile.is_active) {
    redirect("/");
  }

  // Jika password sudah pernah diganti, arahkan ke Dashboard
  if (!profile.must_change_password) {
    redirect("/dashboard");
  }

  return (
    <ChangePasswordForm fullName={profile.full_name} />
  );
}
