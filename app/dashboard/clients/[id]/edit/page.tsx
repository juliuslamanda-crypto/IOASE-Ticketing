
import { Suspense } from "react";
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import EditClientForm from "./edit-client-form";

function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <p className="text-slate-500">Memuat data Klien...</p>
    </div>
  );
}

export default function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<Loading />}>
      <EditClientContent params={params} />
    </Suspense>
  );
}

async function EditClientContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();

  const { id } = await params;
  const supabase = await createClient();

  // Memeriksa session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  // Memeriksa role pengguna
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile || !profile.is_active) {
    redirect("/");
  }

  // Hanya Admin dan Super Admin yang boleh mengakses
  if (!["admin", "super_admin"].includes(profile.role)) {
    redirect("/dashboard");
  }

  // Mengambil data perusahaan
  const { data: client, error: clientError } = await supabase
    .from("client_profiles")
    .select("id, company_name, contact_person, phone")
    .eq("id", id)
    .maybeSingle();

  if (clientError) {
    throw new Error(
      `Gagal mengambil data Klien: ${clientError.message}`
    );
  }

  if (!client) notFound();

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
            Edit Informasi Klien
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Perbarui informasi perusahaan yang terdaftar di Ticketing OASE.
          </p>
        </div>

        <EditClientForm
          clientId={client.id}
          initialData={{
            companyName: client.company_name,
            contactPerson: client.contact_person ?? "",
            phone: client.phone ?? "",
          }}
        />
      </div>
    </main>
  );
}
