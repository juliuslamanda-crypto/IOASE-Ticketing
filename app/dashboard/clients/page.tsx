import ResetClientPasswordButton from "./reset-client-password-button";
import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  ArrowLeft,
  Building2,
  Package,
  Users,
  Plus,
} from "lucide-react";

function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <p className="text-slate-500">Memuat data Klien...</p>
    </div>
  );
}

export default function ClientsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ClientsContent />
    </Suspense>
  );
}

async function ClientsContent() {
  await connection();

  const supabase = await createClient();

  // Memeriksa session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  // Memeriksa role pengguna
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, role, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile || !profile.is_active) {
    redirect("/");
  }

  // Hanya Admin dan Super Admin yang boleh mengakses halaman ini
  if (!["admin", "super_admin"].includes(profile.role)) {
    redirect("/dashboard");
  }

  // Mengambil seluruh perusahaan Klien
  const { data: clients, error: clientError } = await supabase
    .from("client_profiles")
    .select("id, user_id, company_name, contact_person, phone")
    .order("company_name", { ascending: true });

  if (clientError) {
    throw new Error(
      `Gagal mengambil data Klien: ${clientError.message}`
    );
  }

  const clientList = clients ?? [];

  const clientIds = clientList.map((client) => client.id);

  const productMap = new Map<string, string>();

  const clientProductMap = new Map<string, string[]>();

  // Mengambil produk yang aktif untuk masing-masing Klien
  if (clientIds.length > 0) {
    const { data: clientProducts, error: assignmentError } =
      await supabase
        .from("client_products")
        .select("client_id, product_id, is_active")
        .in("client_id", clientIds)
        .eq("is_active", true);

    if (assignmentError) {
      throw new Error(
        `Gagal mengambil penugasan produk: ${assignmentError.message}`
      );
    }

    const assignments = clientProducts ?? [];

    const productIds = [
      ...new Set(assignments.map((item) => item.product_id)),
    ];

    if (productIds.length > 0) {
      const { data: products, error: productError } = await supabase
        .from("products")
        .select("id, product_name")
        .in("id", productIds);

      if (productError) {
        throw new Error(
          `Gagal mengambil data produk: ${productError.message}`
        );
      }

      for (const product of products ?? []) {
        productMap.set(product.id, product.product_name);
      }
    }

    for (const assignment of assignments) {
      const productName = productMap.get(assignment.product_id);

      if (!productName) continue;

      const existing =
        clientProductMap.get(assignment.client_id) ?? [];

      existing.push(productName);

      clientProductMap.set(assignment.client_id, existing);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100">
      {/* HEADER */}
      <header className="border-b border-slate-200 bg-white px-6 py-5 lg:px-10">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600"
        >
          <ArrowLeft size={17} />
          Kembali ke Dashboard
        </Link>
<div className="mt-4">
  <p className="text-xs font-semibold text-blue-600">
    MANAJEMEN DATA
  </p>

  <h1 className="mt-1 text-2xl font-bold text-slate-800">
    Data Klien
  </h1>

  <p className="mt-1 text-sm text-slate-500">
    Kelola dan pantau perusahaan yang terdaftar sebagai Klien OASE.
  </p>

  <Link
    href="/dashboard/clients/new"
    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
  >
    <Plus size={18} />
    Tambah Klien
  </Link>
</div>
      </header>

      <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-9">
        {/* SUMMARY */}
        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  Total Perusahaan Klien
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-800">
                  {clientList.length}
                </p>
              </div>

              <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                <Building2 size={23} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  Produk Terdaftar
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-800">
                  {productMap.size}
                </p>
              </div>

              <div className="rounded-xl bg-purple-50 p-3 text-purple-600">
                <Package size={23} />
              </div>
            </div>
          </div>
        </section>

        {/* CLIENT TABLE */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5">
            <div className="flex items-center gap-3">
              <Users className="text-blue-600" size={21} />

              <div>
                <h2 className="font-bold text-slate-800">
                  Daftar Perusahaan Klien
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Menampilkan {clientList.length} perusahaan terdaftar
                </p>
              </div>
            </div>
          </div>

          {clientList.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Building2
                size={42}
                className="mx-auto text-slate-300"
              />

              <h3 className="mt-4 font-semibold text-slate-700">
                Belum ada perusahaan Klien
              </h3>

              <p className="mt-2 text-sm text-slate-400">
                Data perusahaan yang didaftarkan akan muncul di sini.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-4 font-semibold">
                      Perusahaan
                    </th>
                    <th className="px-6 py-4 font-semibold">
                      Contact Person
                    </th>
                    <th className="px-6 py-4 font-semibold">
                      Telepon
                    </th>
                    <th className="px-6 py-4 font-semibold">
                      Produk Terdaftar
                    </th>
                     <th className="px-6 py-4 font-semibold">
                      Aksi Akun
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {clientList.map((client) => {
                    const assignedProducts =
                      clientProductMap.get(client.id) ?? [];

                    return (
                      <tr
                        key={client.id}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="px-6 py-5">
                          <p className="font-semibold text-slate-800">
                            {client.company_name}
                          </p>
                        </td>

                        <td className="px-6 py-5 text-slate-600">
                          {client.contact_person ?? "-"}
                        </td>

                        <td className="px-6 py-5 text-slate-600">
                          {client.phone ?? "-"}
                        </td>

                        {/* KOLOM PRODUK */}
<td className="px-6 py-5">
  {assignedProducts.length === 0 ? (
    <span className="text-xs text-slate-400">
      Belum ada produk
    </span>
  ) : (
    <div className="flex flex-wrap gap-2">
      {assignedProducts.map((name) => (
        <span
          key={name}
          className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
        >
          {name}
        </span>
      ))}
    </div>
  )}
</td>

{/* KOLOM AKSI AKUN */}
<td className="px-6 py-5">
  <ResetClientPasswordButton userId={client.user_id} />
</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer className="pb-5 text-center text-xs text-slate-400">
          © 2026 PT Informatics OASE · Ticketing System
        </footer>
      </div>
    </main>
  );
}