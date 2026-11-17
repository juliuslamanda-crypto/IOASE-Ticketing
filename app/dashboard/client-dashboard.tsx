
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  LayoutDashboard,
  Ticket,
  Clock3,
  CheckCircle2,
  CircleAlert,
  LogOut,
} from "lucide-react";

type ClientDashboardProps = {
  fullName: string;
  signOutAction: () => Promise<void>;
};

const statusConfig: Record<
  string,
  { label: string; className: string }
> = {
  new: {
    label: "Baru",
    className: "bg-blue-50 text-blue-700",
  },
  assigned: {
    label: "Ditugaskan",
    className: "bg-purple-50 text-purple-700",
  },
  in_progress: {
    label: "Dalam Proses",
    className: "bg-amber-50 text-amber-700",
  },
  resolved: {
    label: "Selesai Ditangani",
    className: "bg-emerald-50 text-emerald-700",
  },
  closed: {
    label: "Ditutup",
    className: "bg-slate-100 text-slate-600",
  },
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

export default async function ClientDashboard({
  fullName,
  signOutAction,
}: ClientDashboardProps) {
  const supabase = await createClient();

  // Data tiket dibatasi oleh RLS sesuai perusahaan Klien.
  // Tidak perlu mengambil tiket perusahaan lain.
  const [
    totalResult,
    newResult,
    assignedResult,
    progressResult,
    resolvedResult,
    closedResult,
    ticketsResult,
  ] = await Promise.all([
    supabase
      .from("tickets")
      .select("id", { count: "exact", head: true }),

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
        "id, ticket_number, subject, status, product_id, current_helpdesk_id, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const queryError =
    totalResult.error ||
    newResult.error ||
    assignedResult.error ||
    progressResult.error ||
    resolvedResult.error ||
    closedResult.error ||
    ticketsResult.error;

  const tickets = ticketsResult.data ?? [];

  // Mengambil nama produk dari tiket milik Klien.
  const productIds = [
    ...new Set(tickets.map((ticket) => ticket.product_id)),
  ];

  const helpdeskIds = [
    ...new Set(
      tickets
        .map((ticket) => ticket.current_helpdesk_id)
        .filter((id): id is string => id !== null)
    ),
  ];

  const productMap = new Map<string, string>();
  const helpdeskMap = new Map<string, string>();

  let relatedDataError: string | null = null;

  if (productIds.length > 0) {
    const { data, error } = await supabase
      .from("products")
      .select("id, product_name")
      .in("id", productIds);

    if (error) {
      relatedDataError = error.message;
    } else {
      for (const product of data ?? []) {
        productMap.set(product.id, product.product_name);
      }
    }
  }

  if (helpdeskIds.length > 0) {
    const { data, error } = await supabase
      .from("helpdesk_directory")
      .select("id, full_name")
      .in("id", helpdeskIds);

    if (error) {
      relatedDataError = relatedDataError ?? error.message;
    } else {
      for (const helpdesk of data ?? []) {
        helpdeskMap.set(helpdesk.id, helpdesk.full_name);
      }
    }
  }

  const metrics = [
    {
      label: "Total Tiket",
      value: totalResult.count ?? 0,
      description: "Seluruh pengaduan perusahaan",
      icon: Ticket,
      iconClass: "bg-blue-50 text-blue-600",
    },
    {
      label: "Tiket Baru",
      value: newResult.count ?? 0,
      description: "Menunggu penugasan",
      icon: CircleAlert,
      iconClass: "bg-sky-50 text-sky-600",
    },
    {
      label: "Ditugaskan",
      value: assignedResult.count ?? 0,
      description: "Menunggu penanganan",
      icon: Ticket,
      iconClass: "bg-purple-50 text-purple-600",
    },
    {
      label: "Dalam Proses",
      value: progressResult.count ?? 0,
      description: "Sedang ditangani Helpdesk",
      icon: Clock3,
      iconClass: "bg-amber-50 text-amber-600",
    },
    {
      label: "Selesai Ditangani",
      value: resolvedResult.count ?? 0,
      description: "Menunggu penutupan",
      icon: CheckCircle2,
      iconClass: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Ditutup",
      value: closedResult.count ?? 0,
      description: "Pengaduan telah ditutup",
      icon: CheckCircle2,
      iconClass: "bg-slate-100 text-slate-600",
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

          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white"
          >
            <LayoutDashboard size={19} />
            Dashboard
          </Link>

          <div className="mt-2 flex cursor-not-allowed items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-400">
            <Ticket size={19} />
            Tiket Saya
            <span className="ml-auto text-[9px]">Segera</span>
          </div>

          <div className="mt-2 flex cursor-not-allowed items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-400">
            <CircleAlert size={19} />
            Buat Pengaduan
            <span className="ml-auto text-[9px]">Segera</span>
          </div>
        </div>

        {/* AKUN DAN LOGOUT */}
        <div className="border-t border-white/10 p-4">
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-white/5 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold">
              {fullName
                .split(" ")
                .map((name) => name[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {fullName}
              </p>
              <p className="text-xs text-slate-400">Klien</p>
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
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-5 lg:px-9">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Dashboard Klien
            </h2>
            <p className="text-xs text-slate-500">
              Informasi pengaduan perusahaan Anda
            </p>
          </div>

          <div className="text-right">
            <p className="text-sm font-semibold text-slate-700">
              {fullName}
            </p>
            <p className="text-xs text-slate-400">Klien</p>
          </div>
        </header>

        <div className="space-y-8 p-6 lg:p-9">
          {/* WELCOME */}
          <section>
            <p className="text-sm font-semibold text-blue-600">
              Portal Klien
            </p>

            <h1 className="mt-2 text-2xl font-bold text-slate-800 lg:text-3xl">
              Selamat datang, {fullName}!
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Pantau status dan perkembangan pengaduan perusahaan Anda
              melalui dashboard ini.
            </p>
          </section>

          {/* ERROR NOTICE */}
          {(queryError || relatedDataError) && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Gagal mengambil sebagian data:{" "}
              {queryError?.message ?? relatedDataError}
            </div>
          )}

          {/* METRICS */}
          <section>
            <div className="mb-4">
              <h2 className="font-bold text-slate-800">
                Ringkasan Pengaduan
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Statistik tiket perusahaan Anda
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {metrics.map((metric) => {
                const Icon = metric.icon;

                return (
                  <div
                    key={metric.label}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
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

          {/* TICKET LIST */}
          <section
            id="my-tickets"
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="border-b border-slate-100 px-6 py-5">
              <h2 className="font-bold text-slate-800">
                Riwayat Pengaduan
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Maksimal 10 pengaduan terbaru perusahaan Anda
              </p>
            </div>

            {tickets.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <Ticket
                  size={40}
                  className="mx-auto text-slate-300"
                />
                <h3 className="mt-4 font-semibold text-slate-700">
                  Belum ada pengaduan
                </h3>
                <p className="mt-2 text-sm text-slate-400">
                  Pengaduan yang diajukan perusahaan Anda akan muncul
                  di sini.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-6 py-4 font-semibold">
                        Nomor Tiket
                      </th>
                      <th className="px-6 py-4 font-semibold">
                        Perihal
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
                    {tickets.map((ticket) => {
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

                          <td className="max-w-[220px] px-6 py-4">
                            <p className="truncate font-medium text-slate-700">
                              {ticket.subject}
                            </p>
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
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}
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
