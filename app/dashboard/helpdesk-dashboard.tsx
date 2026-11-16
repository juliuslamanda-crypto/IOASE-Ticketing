
import Link from "next/link";
import {
  LayoutDashboard,
  Ticket,
  Clock3,
  CheckCircle2,
  ClipboardList,
  ArrowRightLeft,
  LogOut,
  Settings,
  UserRound,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

type Props = {
  fullName: string;
  userId: string;
};

type TicketRow = {
  id: string;
  ticket_number: string;
  subject: string;
  status: string;
  client_id: string;
  product_id: string;
  created_at: string;
};

const statusConfig: Record<
  string,
  { label: string; style: string }
> = {
  assigned: {
    label: "Ditugaskan",
    style: "bg-purple-50 text-purple-700",
  },
  in_progress: {
    label: "Dalam Proses",
    style: "bg-amber-50 text-amber-700",
  },
  resolved: {
    label: "Selesai Ditangani",
    style: "bg-emerald-50 text-emerald-700",
  },
  closed: {
    label: "Ditutup",
    style: "bg-slate-100 text-slate-600",
  },
  new: {
    label: "Baru",
    style: "bg-blue-50 text-blue-700",
  },
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

async function signOutAction() {
  "use server";

  const supabase = await createClient();
  await supabase.auth.signOut();

  const { redirect } = await import("next/navigation");
  redirect("/");
}

export default async function HelpdeskDashboard({
  fullName,
  userId,
}: Props) {
  const supabase = await createClient();

  // Mengambil statistik tiket berdasarkan RLS.
  // Database hanya mengembalikan tiket yang ditugaskan
  // kepada Helpdesk yang sedang login.
  const [
    totalResult,
    assignedResult,
    progressResult,
    resolvedResult,
    closedResult,
    transferResult,
    ticketsResult,
  ] = await Promise.all([
    supabase
      .from("tickets")
      .select("id", { count: "exact", head: true }),

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
      .from("transfer_requests")
      .select("id", { count: "exact", head: true })
      .eq("requested_by_user_id", userId)
      .eq("status", "pending"),

    supabase
      .from("tickets")
      .select(
        "id, ticket_number, subject, status, client_id, product_id, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const queryError =
    totalResult.error ||
    assignedResult.error ||
    progressResult.error ||
    resolvedResult.error ||
    closedResult.error ||
    transferResult.error ||
    ticketsResult.error;

  const ticketRows = (ticketsResult.data ?? []) as TicketRow[];

  // Mengambil informasi perusahaan dan produk
  const clientIds = [
    ...new Set(ticketRows.map((ticket) => ticket.client_id)),
  ];

  const productIds = [
    ...new Set(ticketRows.map((ticket) => ticket.product_id)),
  ];

  const clientMap = new Map<string, string>();
  const productMap = new Map<string, string>();

  const [clientsResult, productsResult] = await Promise.all([
    clientIds.length > 0
      ? supabase
          .from("client_profiles")
          .select("id, company_name")
          .in("id", clientIds)
      : Promise.resolve({ data: [], error: null }),

    productIds.length > 0
      ? supabase
          .from("products")
          .select("id, product_name")
          .in("id", productIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  for (const client of clientsResult.data ?? []) {
    clientMap.set(client.id, client.company_name);
  }

  for (const product of productsResult.data ?? []) {
    productMap.set(product.id, product.product_name);
  }

  const metrics = [
    {
      label: "Tiket Saya",
      value: totalResult.count ?? 0,
      description: "Tiket yang ditugaskan kepada saya",
      icon: ClipboardList,
      iconStyle: "bg-blue-50 text-blue-600",
    },
    {
      label: "Ditugaskan",
      value: assignedResult.count ?? 0,
      description: "Menunggu penanganan",
      icon: Ticket,
      iconStyle: "bg-purple-50 text-purple-600",
    },
    {
      label: "Dalam Proses",
      value: progressResult.count ?? 0,
      description: "Sedang ditangani",
      icon: Clock3,
      iconStyle: "bg-amber-50 text-amber-600",
    },
    {
      label: "Selesai Ditangani",
      value: resolvedResult.count ?? 0,
      description: "Menunggu penutupan",
      icon: CheckCircle2,
      iconStyle: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Ditutup",
      value: closedResult.count ?? 0,
      description: "Tiket telah ditutup",
      icon: CheckCircle2,
      iconStyle: "bg-slate-100 text-slate-600",
    },
    {
      label: "Transfer Pending",
      value: transferResult.count ?? 0,
      description: "Pengajuan transfer saya",
      icon: ArrowRightLeft,
      iconStyle: "bg-orange-50 text-orange-600",
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
      label: "Tiket Saya",
      href: "/dashboard/tickets",
      icon: Ticket,
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
                      ? "bg-blue-600 text-white shadow-lg"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon size={19} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-9">
            <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
              Lainnya
            </p>

            <div className="flex cursor-not-allowed items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-500">
              <ArrowRightLeft size={19} />
              Riwayat Transfer
              <span className="ml-auto text-[9px]">Segera</span>
            </div>

            <div className="mt-1 flex cursor-not-allowed items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-500">
              <Settings size={19} />
              Pengaturan
              <span className="ml-auto text-[9px]">Segera</span>
            </div>
          </div>
        </div>

        {/* AKUN HELPDESK */}
        <div className="border-t border-white/10 p-4">
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-white/5 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold">
              {fullName
                .split(" ")
                .map((name: string) => name[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {fullName}
              </p>
              <p className="text-xs text-slate-400">Helpdesk</p>
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
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5 lg:px-9">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Dashboard Helpdesk
            </h2>

            <p className="text-xs text-slate-500">
              Ringkasan tugas dan penanganan tiket Anda.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-700">
                {fullName}
              </p>
              <p className="text-xs text-slate-400">Helpdesk</p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 font-bold text-blue-700">
              {fullName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="space-y-8 p-6 lg:p-9">
          {/* WELCOME */}
          <section>
            <p className="text-sm font-semibold text-blue-600">
              Area Penanganan
            </p>

            <h1 className="mt-2 text-2xl font-bold text-slate-800 lg:text-3xl">
              Selamat datang, {fullName}!
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Pantau tiket yang ditugaskan kepada Anda dan kelola proses
              penanganannya.
            </p>
          </section>

          {/* ERROR */}
          {queryError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Gagal mengambil data dashboard: {queryError.message}
            </div>
          )}

          {clientsResult.error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Gagal mengambil informasi Klien: {clientsResult.error.message}
            </div>
          )}

          {productsResult.error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Gagal mengambil informasi produk: {productsResult.error.message}
            </div>
          )}

          {/* STATISTIK */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold text-slate-800">
                Statistik Tiket Saya
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
                        className={`flex h-11 w-11 items-center justify-center rounded-xl ${metric.iconStyle}`}
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

          {/* TIKET TERBARU */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="font-bold text-slate-800">
                  Tiket Terbaru
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Tiket yang sedang menjadi tanggung jawab Anda.
                </p>
              </div>

              <Link
                href="/dashboard/tickets"
                className="rounded-lg bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
              >
                Lihat Semua Tiket
              </Link>
            </div>

            {ticketsResult.error ? (
              <div className="p-6 text-sm text-red-600">
                Gagal mengambil tiket.
              </div>
            ) : ticketRows.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <Ticket size={40} className="mx-auto text-slate-300" />

                <h3 className="mt-4 font-semibold text-slate-700">
                  Belum ada tiket
                </h3>

                <p className="mt-2 text-sm text-slate-400">
                  Tiket yang ditugaskan kepada Anda akan muncul di sini.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-6 py-4">Nomor Tiket</th>
                      <th className="px-6 py-4">Perihal</th>
                      <th className="px-6 py-4">Klien</th>
                      <th className="px-6 py-4">Produk</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Tanggal</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {ticketRows.map((ticket) => {
                      const status =
                        statusConfig[ticket.status] ?? {
                          label: ticket.status,
                          style: "bg-slate-100 text-slate-600",
                        };

                      return (
                        <tr key={ticket.id} className="hover:bg-slate-50">
                          <td className="whitespace-nowrap px-6 py-4 font-semibold text-blue-700">
                            <Link
                              href={`/dashboard/tickets/${ticket.id}`}
                              className="hover:underline"
                            >
                              {ticket.ticket_number}
                            </Link>
                          </td>

                          <td className="max-w-56 px-6 py-4">
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

                          <td className="whitespace-nowrap px-6 py-4">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${status.style}`}
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
