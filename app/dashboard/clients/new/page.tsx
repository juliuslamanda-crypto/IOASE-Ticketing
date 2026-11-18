
import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import CreateClientForm from "./create-client-form";

function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <p className="text-slate-500">Memuat formulir Klien...</p>
    </div>
  );
}

export default function NewClientPage() {
  return (
    <Suspense fallback={<Loading />}>
      <NewClientContent />
    </Suspense>
  );
}

async function NewClientContent() {
  await connection();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  // Memastikan hanya Admin dan Super Admin yang dapat mengakses
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile || !profile.is_active) {
    redirect("/");
  }

  if (!["admin", "super_admin"].includes(profile.role)) {
    redirect("/dashboard");
  }

  // Mengambil produk yang masih aktif
  const { data: products, error: productError } = await supabase
    .from("products")
    .select("id, product_name")
    .eq("is_active", true)
    .order("product_name", { ascending: true });

  if (productError) {
    throw new Error(
      `Gagal mengambil produk: ${productError.message}`
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-9">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/dashboard/clients"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600"
        >
          <ArrowLeft size={18} />
          Kembali ke Data Klien
        </Link>

        <div className="mb-6 mt-6">
          <p className="text-sm font-semibold text-blue-600">
            MANAJEMEN DATA
          </p>

          <h1 className="mt-2 text-2xl font-bold text-slate-800">
            Tambah Klien
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Daftarkan akun pengguna dan informasi perusahaan Klien.
          </p>
        </div>

        <CreateClientForm products={products ?? []} />
      </div>
    </main>
  );
}
