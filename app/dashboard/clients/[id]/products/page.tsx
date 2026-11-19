
import { Suspense } from "react";
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import ManageClientProductsForm from "./manage-client-products-form";

function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <p className="text-slate-500">Memuat produk Klien...</p>
    </div>
  );
}

export default function ManageClientProductsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<Loading />}>
      <ManageClientProductsContent params={params} />
    </Suspense>
  );
}

async function ManageClientProductsContent({
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
    .select("id, company_name")
    .eq("id", id)
    .maybeSingle();

  if (clientError) {
    throw new Error(
      `Gagal mengambil data perusahaan: ${clientError.message}`
    );
  }

  if (!client) notFound();

  // Mengambil seluruh produk aktif
  const { data: products, error: productError } = await supabase
    .from("products")
    .select("id, product_name, description")
    .eq("is_active", true)
    .order("product_name", { ascending: true });

  if (productError) {
    throw new Error(
      `Gagal mengambil daftar produk: ${productError.message}`
    );
  }

  // Mengambil semua penetapan produk, termasuk yang nonaktif
  const { data: assignments, error: assignmentError } =
    await supabase
      .from("client_products")
      .select("product_id, is_active")
      .eq("client_id", id);

  if (assignmentError) {
    throw new Error(
      `Gagal mengambil akses produk: ${assignmentError.message}`
    );
  }

 const availableProductIds = new Set(
  (products ?? []).map((product) => product.id)
);

const activeProductIds = (assignments ?? [])
  .filter(
    (item) =>
      item.is_active &&
      availableProductIds.has(item.product_id)
  )
  .map((item) => item.product_id);

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
            Kelola Produk Klien
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Atur produk yang dapat digunakan oleh perusahaan berikut.
          </p>
        </div>

        <ManageClientProductsForm
          clientId={client.id}
          companyName={client.company_name}
          products={products ?? []}
          initialSelectedIds={activeProductIds}
        />
      </div>
    </main>
  );
}
