
import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, Ticket } from "lucide-react";

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

function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <p className="text-slate-500">Memuat daftar tiket...</p>
    </div>
  );
}

export default function MyTicketsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <MyTicketsContent />
    </Suspense>
  );
}

async function MyTicketsContent() {
  await connection();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile || !profile.is_active) {
    redirect("/");
  }

  if (profile.role !== "client") {
    redirect("/dashboard");
  }

  // Mengambil perusahaan Klien yang sedang login
  const { data: clientId, error: clientError } =
    await supabase.rpc("current_client_id");

  if (clientError || !clientId) {
    throw new Error("Data perusahaan Klien tidak ditemukan.");
  }

  // Mengambil tiket hanya milik perusahaan tersebut
  const { data: tickets, error: ticketError } = await supabase
    .from("tickets")
    .select(
      "id, ticket_number, subject, status, product_id, current_helpdesk_id, created_at"
    )
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (ticketError) {
    throw new Error(
      `Gagal mengambil daftar tiket: ${ticketError.message}`
    );
  }

  const ticketList = tickets ?? [];

  const productIds = [
    ...new Set(ticketList.map((ticket) => ticket.product_id)),
  ];

  const helpdeskIds = [
    ...new Set(
      ticketList
        .map((ticket) => ticket.current_helpdesk_id)
        .filter((id): id is string => id !== null)
    ),
  ];

  const productMap = new Map<string, string>();
  const helpdeskMap = new Map<string, string>();

  if (productIds.length > 0) {
    const { data, error } = await supabase
      .from("products")
      .select("id, product_name")
      .in("id", productIds);

    if (error) {
      throw new Error(`Gagal mengambil produk: ${error.message}`);
    }

    for (const product of data ?? []) {
      productMap.set(product.id, product.product_name);
    }
  }

  if (helpdeskIds.length > 0) {
    const { data, error } = await supabase
      .from("helpdesk_directory")
      .select("id, full_name")
      .in("id", helpdeskIds);

    if (error) {
      throw new Error(`Gagal mengambil Helpdesk: ${error.message}`);
    }

    for (const helpdesk of data ?? []) {
      helpdeskMap.set(helpdesk.id, helpdesk.full_name);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-9">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600"
        >
          <ArrowLeft size={18} />
          Kembali ke Dashboard
        </Link>

        <div className="mb-6 mt-6">
          <p className="text-sm font-semibold text-blue-600">
            PORTAL KLIEN
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-800">
            Tiket Saya
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Daftar seluruh pengaduan yang diajukan oleh perusahaan Anda.
          </p>
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="font-bold text-slate-800">
              Riwayat Pengaduan
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Total {ticketList.length} tiket
            </p>
          </div>

          {ticketList.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Ticket
                size={42}
                className="mx-auto text-slate-300"
              />
              <h3 className="mt-4 font-semibold text-slate-700">
                Belum ada pengaduan
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                Pengaduan perusahaan Anda akan muncul di halaman ini.
              </p>
              <Link
                href="/dashboard/tickets/new"
                className="mt-5 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Buat Pengaduan
              </Link>
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
                  {ticketList.map((ticket) => {
                    const status =
                      statusConfig[ticket.status] ??
                      statusConfig.new;

                    return (
                      <tr
                        key={ticket.id}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="whitespace-nowrap px-6 py-4 font-semibold">
                          <Link
                            href={`/dashboard/my-tickets/${ticket.id}`}
                            className="text-blue-700 hover:text-blue-900 hover:underline"
                          >
                            {ticket.ticket_number}
                          </Link>
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
                            ? helpdeskMap.get(ticket.current_helpdesk_id) ?? "-"
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
      </div>
    </main>
  );
}
