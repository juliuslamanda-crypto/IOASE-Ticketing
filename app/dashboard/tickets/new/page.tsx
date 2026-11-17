import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CreateTicketForm from "./create-ticket-form";

function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <p className="text-slate-500">
        Memuat formulir pengaduan...
      </p>
    </div>
  );
}

export default function NewTicketPage() {
  return (
    <Suspense fallback={<Loading />}>
      <NewTicketContent />
    </Suspense>
  );
}

async function NewTicketContent() {
  await connection();

  const supabase = await createClient();

  // Memeriksa pengguna yang sedang login
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

  if (
    profileError ||
    !profile ||
    !profile.is_active
  ) {
    redirect("/");
  }

  // Hanya Klien yang boleh mengakses halaman ini
  if (profile.role !== "client") {
    redirect("/dashboard");
  }

  // Mengambil ID perusahaan Klien
  const { data: clientId, error: clientIdError } =
    await supabase.rpc("current_client_id");

  if (clientIdError || !clientId) {
    throw new Error(
      "Tidak dapat menemukan data perusahaan Klien."
    );
  }

  // Mengambil produk aktif milik Klien
  const { data: assignments, error: assignmentError } =
    await supabase
      .from("client_products")
      .select("product_id")
      .eq("client_id", clientId)
      .eq("is_active", true);

  if (assignmentError) {
    throw new Error(
      `Gagal mengambil produk Klien: ${assignmentError.message}`
    );
  }

  const productIds = [
    ...new Set(
      (assignments ?? []).map((item) => item.product_id)
    ),
  ];

  let products: { id: string; product_name: string }[] = [];

  if (productIds.length > 0) {
    const { data, error } = await supabase
      .from("products")
      .select("id, product_name")
      .in("id", productIds);

    if (error) {
      throw new Error(
        `Gagal mengambil daftar produk: ${error.message}`
      );
    }

    products = data ?? [];
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-9">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <p className="text-sm font-semibold text-blue-600">
            PORTAL KLIEN
          </p>

          <h1 className="mt-2 text-2xl font-bold text-slate-800">
            Buat Pengaduan
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Isi informasi pengaduan berikut agar tim Helpdesk dapat
            membantu menangani permasalahan Anda.
          </p>
        </div>

        <CreateTicketForm products={products} />
      </div>
    </main>
  );
}
