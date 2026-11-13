import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import {
  LayoutDashboard,
  Ticket,
  Building2,
  Package,
  ChartNoAxesCombined,
  Settings,
  LogOut,
  Clock3,
  CircleAlert,
  CheckCircle2,
  ClipboardList,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

const roleNames: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  helpdesk: "Helpdesk",
  client: "Klien",
};

const statusConfig: Record<
  string,
  { label: string; className: string }
> = {
  new: {
    label: "Baru",
    className: "bg-blue-50 text-blue-700 ring-blue-200",
  },
  assigned: {
    label: "Ditugaskan",
    className: "bg-purple-50 text-purple-700 ring-purple-200",
  },
  in_progress: {
    label: "Dalam Proses",
    className: "bg-amber-50 text-amber-700 ring-amber-200",
  },
  resolved: {
    label: "Selesai Ditangani",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  closed: {
    label: "Ditutup",
    className: "bg-slate-100 text-slate-600 ring-slate-200",
  },
};

const formatDate = (value: string) => {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
};

async function signOutAction() {
  "use server";

  const supabase = await createClient();
  await supabase.auth.signOut();

  redirect("/");
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-100">
          <p className="text-slate-500">
            Memuat dashboard...
          </p>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}

async function DashboardContent() {
  await connection();

  const supabase = await createClient();
  // Memeriksa session pengguna
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/");
  }

  // Mengambil profil pengguna
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, role, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile || !profile.is_active) {
    await supabase.auth.signOut();
    redirect("/");
  }

  const isManagementRole =
    profile.role === "admin" || profile.role === "super_admin";

  // Dashboard khusus Admin dan Super Admin
  if (!isManagementRole) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-800">
            Dashboard {roleNames[profile.role] || profile.role}
          </h1>
          <p className="mt-3 text-sm text-slate-500">
            Dashboard untuk role ini sedang dalam tahap pengembangan.
          </p>
          <form action={signOutAction} className="mt-6">
            <button className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white">
              Logout
            </button>
          </form>
        </div>
      </main>
    );
  }

  // Mengambil ringkasan tiket dari database
  const [
    totalResult,
    newResult,
    assignedResult,
    progressResult,
    resolvedResult,
    closedResult,
    ticketsResult,
  ] = await Promise.all([
    supabase.from("tickets").select("id", { count: "exact", head: true }),

    supabase
      .from("tickets")
      .select("id", { count: "exact", head: true })
      .eq("status", "new"),

    supabase
      .from("tickets")
      .select("id", { count: "exact", head: true })
      .eq("status", "assigned"),

    supabase
      .from("tickets")
      .select("id", { count: "exact", head: true })
      .eq("status", "in_progress"),

    supabase
      .from("tickets")
      .select("id", { count: "exact", head: true })
      .eq("status", "resolved"),

    supabase
      .from("tickets")
      .select("id", { count: "exact", head: true })
      .eq("status", "closed"),

    supabase
      .from("tickets")
      .select(
        "id, ticket_number, subject, status, client_id, product_id, current_helpdesk_id, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const queryError =
    totalResult.error ||
    newResult.error ||
    assignedResult.error ||
    progressResult.error ||
    resolvedResult.error ||
    closedResult.error ||
    ticketsResult.error;

  const recentTickets = ticketsResult.data ?? [];

  // Mengambil ID unik dari tiket terbaru
  const clientIds = [
    ...new Set(recentTickets.map((ticket) => ticket.client_id)),
  ];

  const productIds = [
    ...new Set(recentTickets.map((ticket) => ticket.product_id)),
  ];

  const helpdeskIds = [
    ...new Set(
      recentTickets
        .map((ticket) => ticket.current_helpdesk_id)
        .filter((id): id is string => id !== null)
    ),
  ];

  // Mengambil informasi terkait secara terpisah
  // supaya tidak bergantung pada nama foreign key Supabase
  const clientMap = new Map<string, string>();
  const productMap = new Map<string, string>();
  const helpdeskMap = new Map<string, string>();

  if (clientIds.length > 0) {
    const { data } = await supabase
      .from("client_profiles")
      .select("id, company_name")
      .in("id", clientIds);

    for (const client of data ?? []) {
      clientMap.set(client.id, client.company_name);
    }
  }

  if (productIds.length > 0) {
    const { data } = await supabase
      .from("products")
      .select("id, product_name")
      .in("id", productIds);

    for (const product of data ?? []) {
      productMap.set(product.id, product.product_name);
    }
  }

  if (helpdeskIds.length > 0) {
    const { data } = await supabase
      .from("helpdesk_directory")
      .select("id, full_name")
      .in("id", helpdeskIds);

    for (const helpdesk of data ?? []) {
      helpdeskMap.set(helpdesk.id, helpdesk.full_name);
    }
  }

  const metrics = [
    {
      label: "Total Tiket",
      value: totalResult.count ?? 0,
      icon: ClipboardList,
      iconClass: "bg-blue-50 text-blue-600",
      description: "Seluruh tiket masuk",
    },
    {
      label: "Tiket Baru",
      value: newResult.count ?? 0,
      icon: CircleAlert,
      iconClass: "bg-sky-50 text-sky-600",
      description: "Menunggu penugasan",
    },
    {
      label: "Ditugaskan",
      value: assignedResult.count ?? 0,
      icon: Ticket,
      iconClass: "bg-purple-50 text-purple-600",
      description: "Menunggu penanganan",
    },
    {
      label: "Dalam Proses",
      value: progressResult.count ?? 0,
      icon: Clock3,
      iconClass: "bg-amber-50 text-amber-600",
      description: "Sedang ditangani",
    },
    {
      label: "Selesai Ditangani",
      value: resolvedResult.count ?? 0,
      icon: CheckCircle2,
      iconClass: "bg-emerald-50 text-emerald-600",
      description: "Menunggu penutupan",
    },
    {
      label: "Ditutup",
      value: closedResult.count ?? 0,
      icon: CheckCircle2,
      iconClass: "bg-slate-100 text-slate-600",
      description: "Tiket telah ditutup",
    },
  ];

  const navigation = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      active: true,
    },
    {
      label: "Daftar Tiket",
      href: "/dashboard/tickets",
      icon: Ticket,
      active: false,
    },
    {
      label: "Data Klien",
      href: "/dashboard/clients",
      icon: Building2,
      active: false,
    },
    {
      label: "Produk",
      href: "/dashboard/products",
      icon: Package,
      active: false,
    },
    {
      label: "Laporan",
      href: "/dashboard/reports",
      icon: ChartNoAxesCombined,
      active: false,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100 lg:flex">
      {/* SIDEBAR */}
      <aside className="flex w-full flex-col bg-[#102C46] text-white lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shrink-0">
        <div className="border-b border-white/10 px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-xl font-bold text-[#102C46]">
              O
            </div>

            <div>
              <h1 className="text-xl font-bold">OASE</h1>
              <p className="text-[10px] tracking-[0.2em] text-blue-200">
                TICKETING SYSTEM
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 px-4 py-6">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
            Menu Utama
          </p>

          <nav className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                    item.active
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-950/20"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon size={19} />
                  {item.label}
                  {item.label !== "Dashboard" &&
                    item.label !== "Daftar Tiket" && (
                      <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[9px] text-slate-300">
                        Segera
                      </span>
                    )}
                </Link>
              );
            })}
          </nav>

          <div className="mt-9">
            <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
              Pengaturan
            </p>

            <div className="flex cursor-not-allowed items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-500">
              <Settings size={19} />
              Pengaturan
              <span className="ml-auto text-[9px]">Segera</span>
            </div>
          </div>
        </div>

        {/* Informasi akun dan logout */}
        <div className="border-t border-white/10 p-4">
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-white/5 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold">
              {profile.full_name
                .split(" ")
                .map((name:string) => name[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {profile.full_name}
              </p>
              <p className="text-xs text-slate-400">
                {roleNames[profile.role]}
              </p>
            </div>
          </div>

          <form action={signOutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-red-500/10 hover:text-red-300"
            >
              <LogOut size={18} />
              Logout
            </button>
          </form>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="min-w-0 flex-1">
        {/* TOP HEADER */}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-5 lg:px-9">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Dashboard
            </h2>
            <p className="text-xs text-slate-500">
              Ringkasan aktivitas Ticketing OASE
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-700">
                {profile.full_name}
              </p>
              <p className="text-xs text-slate-400">
                {roleNames[profile.role]}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 font-bold text-blue-700">
              {profile.full_name.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="space-y-8 p-6 lg:p-9">
          {/* WELCOME */}
          <section>
            <p className="text-sm font-semibold text-blue-600">
              Ringkasan Operasional
            </p>

            <h1 className="mt-2 text-2xl font-bold text-slate-800 lg:text-3xl">
              Selamat datang, {profile.full_name}!
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Berikut ringkasan aktivitas pengaduan pelanggan OASE.
            </p>
          </section>

          {/* ERROR NOTICE */}
          {queryError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Gagal mengambil sebagian data dashboard:{" "}
              {queryError.message}
            </div>
          )}

          {/* METRIC CARDS */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold text-slate-800">
                Statistik Tiket
              </h2>

              <span className="text-xs text-slate-400">
                Data dari Supabase
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {metrics.map((metric) => {
                const Icon = metric.icon;

                return (
                  <div
                    key={metric.label}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-500">
                          {metric.label}
                        </p>

                        <p className="mt-3 text-3xl font-bold text-slate-800">
                          {metric.value}
                        </p>
                      </div>

                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-xl ${metric.iconClass}`}
                      >
                        <Icon size={21} />
                      </div>
                    </div>

                    <p className="mt-3 text-xs text-slate-400">
                      {metric.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* RECENT TICKETS */}
          <section
            id="recent-tickets"
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="font-bold text-slate-800">
                  Tiket Terbaru
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  Maksimal 8 tiket terakhir yang masuk
                </p>
              </div>

              <Link
                href="/dashboard/tickets"
                className="rounded-lg bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
              >
                Lihat Semua Tiket
              </Link>
            </div>

            {recentTickets.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <ClipboardList
                  size={40}
                  className="mx-auto text-slate-300"
                />

                <h3 className="mt-4 font-semibold text-slate-700">
                  Belum ada tiket
                </h3>

                <p className="mt-2 text-sm text-slate-400">
                  Tiket yang dibuat Klien akan muncul di sini.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-6 py-4 font-semibold">
                        Nomor Tiket
                      </th>
                      <th className="px-6 py-4 font-semibold">
                        Perihal
                      </th>
                      <th className="px-6 py-4 font-semibold">
                        Klien
                      </th>
                      <th className="px-6 py-4 font-semibold">
                        Produk
                      </th>
                      <th className="px-6 py-4 font-semibold">
                        Helpdesk
                      </th>
                      <th className="px-6 py-4 font-semibold">
                        Status
                      </th>
                      <th className="px-6 py-4 font-semibold">
                        Tanggal
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {recentTickets.map((ticket) => {
                      const status =
                        statusConfig[ticket.status] ??
                        statusConfig.new;

                      return (
                        <tr
                          key={ticket.id}
                          className="transition hover:bg-slate-50"
                        >
                          <td className="whitespace-nowrap px-6 py-4 font-semibold text-blue-700">
                            {ticket.ticket_number}
                          </td>

                          <td className="max-w-[200px] px-6 py-4">
                            <p className="truncate font-medium text-slate-700">
                              {ticket.subject}
                            </p>
                          </td>

                          <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                            {clientMap.get(ticket.client_id) ?? "-"}
                          </td>

                          <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                            {productMap.get(ticket.product_id) ?? "-"}
                          </td>

                          <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                            {ticket.current_helpdesk_id
                              ? helpdeskMap.get(
                                  ticket.current_helpdesk_id
                                ) ?? "-"
                              : "Belum ditugaskan"}
                          </td>

                          <td className="whitespace-nowrap px-6 py-4">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${status.className}`}
                            >
                              {status.label}
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-6 py-4 text-xs text-slate-500">
                            {formatDate(ticket.created_at)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <footer className="pb-3 text-center text-xs text-slate-400">
            © 2026 PT Informatics OASE · Ticketing System
          </footer>
        </div>
      </main>
    </div>
  );
}
