
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Package,
  UserRound,
  Calendar,
  ClipboardList,
  Clock,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

const statusConfig: Record<
  string,
  { label: string; style: string }
> = {
  new: {
    label: "Baru",
    style: "bg-blue-50 text-blue-700",
  },
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
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <p className="text-slate-500">Memuat detail tiket...</p>
    </div>
  );
}

export default function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<Loading />}>
      <TicketDetailContent params={params} />
    </Suspense>
  );
}

async function TicketDetailContent({
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

  // Memeriksa profil dan role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, role, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (
    profileError ||
    !profile ||
    !profile.is_active ||
    !["admin", "super_admin"].includes(profile.role)
  ) {
    redirect("/dashboard");
  }

  // Mengambil tiket berdasarkan ID
  const { data: ticket, error: ticketError } = await supabase
    .from("tickets")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (ticketError) {
    throw new Error(`Gagal mengambil tiket: ${ticketError.message}`);
  }

  if (!ticket) notFound();

  // Mengambil data tambahan dan seluruh riwayat
  const [
    clientResult,
    productResult,
    assignmentResult,
    updateResult,
    statusResult,
    transferResult,
    profilesResult,
  ] = await Promise.all([
    supabase
      .from("client_profiles")
      .select("company_name, contact_person, phone")
      .eq("id", ticket.client_id)
      .maybeSingle(),

    supabase
      .from("products")
      .select("product_name")
      .eq("id", ticket.product_id)
      .maybeSingle(),

    supabase
      .from("ticket_assignments")
      .select("*")
      .eq("ticket_id", id)
      .order("assigned_at", { ascending: true }),

    supabase
      .from("ticket_updates")
      .select("*")
      .eq("ticket_id", id)
      .order("created_at", { ascending: false }),

    supabase
      .from("ticket_status_history")
      .select("*")
      .eq("ticket_id", id)
      .order("changed_at", { ascending: true }),

    supabase
      .from("transfer_requests")
      .select("*")
      .eq("ticket_id", id)
      .order("requested_at", { ascending: false }),

    supabase
      .from("profiles")
      .select("id, full_name, role"),
  ]);

  const allErrors = [
    clientResult.error,
    productResult.error,
    assignmentResult.error,
    updateResult.error,
    statusResult.error,
    transferResult.error,
    profilesResult.error,
  ];

  const dataError = allErrors.find((error) => error !== null);

  if (dataError) {
    throw new Error(`Gagal mengambil data detail: ${dataError.message}`);
  }

  const client = clientResult.data;
  const product = productResult.data;
  const assignments = assignmentResult.data ?? [];
  const updates = updateResult.data ?? [];
  const statusHistory = statusResult.data ?? [];
  const transfers = transferResult.data ?? [];
  const profiles = profilesResult.data ?? [];

  const profileMap = new Map(
    profiles.map((item) => [item.id, item])
  );

  const currentHelpdesk = ticket.current_helpdesk_id
    ? profileMap.get(ticket.current_helpdesk_id)?.full_name
    : null;

  const status =
    statusConfig[ticket.status] ?? {
      label: ticket.status,
      style: "bg-slate-100 text-slate-600",
    };

  return (
    <main className="min-h-screen bg-slate-100">
      {/* HEADER */}
      <header className="border-b border-slate-200 bg-white px-6 py-5 lg:px-10">
        <Link
          href="/dashboard/tickets"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600"
        >
          <ArrowLeft size={17} />
          Kembali ke Daftar Tiket
        </Link>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-blue-600">
              DETAIL PENGADUAN
            </p>

            <h1 className="mt-1 text-2xl font-bold text-slate-800">
              {ticket.ticket_number}
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Dibuat pada {formatDate(ticket.created_at)}
            </p>
          </div>

          <span
            className={`rounded-full px-4 py-2 text-sm font-semibold ${status.style}`}
          >
            {status.label}
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-9">
        {/* INFORMASI UTAMA */}
        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <h2 className="text-lg font-bold text-slate-800">
              Informasi Pengaduan
            </h2>

            <div className="mt-6">
              <p className="text-xs font-semibold uppercase text-slate-400">
                Perihal
              </p>

              <h3 className="mt-2 text-xl font-bold text-slate-800">
                {ticket.subject}
              </h3>
            </div>

            <div className="mt-6">
              <p className="text-xs font-semibold uppercase text-slate-400">
                Deskripsi Masalah
              </p>

              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                {ticket.description}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                  <Building2 size={20} />
                </div>

                <div>
                  <p className="text-xs text-slate-400">Perusahaan Klien</p>
                  <p className="font-semibold text-slate-800">
                    {client?.company_name ?? "-"}
                  </p>
                </div>
              </div>

              <div className="mt-4 border-t border-slate-100 pt-4 text-sm">
                <p className="text-slate-400">Contact Person</p>
                <p className="mt-1 font-medium text-slate-700">
                  {client?.contact_person ?? "-"}
                </p>
              </div>

              <div className="mt-3 text-sm">
                <p className="text-slate-400">Telepon</p>
                <p className="mt-1 font-medium text-slate-700">
                  {client?.phone ?? "-"}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-purple-50 p-3 text-purple-600">
                  <Package size={20} />
                </div>

                <div>
                  <p className="text-xs text-slate-400">Produk</p>
                  <p className="font-semibold text-slate-800">
                    {product?.product_name ?? "-"}
                  </p>
                </div>
              </div>

              <div className="mt-5 border-t border-slate-100 pt-4">
                <p className="text-xs text-slate-400">
                  Helpdesk Saat Ini
                </p>

                <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <UserRound size={17} className="text-blue-600" />
                  {currentHelpdesk ?? "Belum ditugaskan"}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* RIWAYAT PENUGASAN */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <ClipboardList className="text-blue-600" size={21} />
            <h2 className="font-bold text-slate-800">
              Riwayat Penugasan
            </h2>
          </div>

          {assignments.length === 0 ? (
            <p className="mt-5 text-sm text-slate-400">
              Tiket belum memiliki riwayat penugasan.
            </p>
          ) : (
            <div className="mt-6 space-y-5">
              {assignments.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 border-l-2 border-blue-200 pl-5"
                >
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800">
                      {item.from_helpdesk_id
                        ? profileMap.get(item.from_helpdesk_id)?.full_name
                        : "Penugasan Awal"}
                      {item.from_helpdesk_id && " → "}
                      {profileMap.get(item.to_helpdesk_id)?.full_name}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Ditugaskan oleh:{" "}
                      {profileMap.get(item.assigned_by_user_id)?.full_name ?? "-"}
                    </p>

                    {item.assignment_note && (
                      <p className="mt-2 text-sm text-slate-600">
                        {item.assignment_note}
                      </p>
                    )}

                    <p className="mt-2 text-xs text-slate-400">
                      {formatDate(item.assigned_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* RIWAYAT TRANSFER */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-bold text-slate-800">
            Riwayat Transfer
          </h2>

          {transfers.length === 0 ? (
            <p className="mt-4 text-sm text-slate-400">
              Belum ada permintaan transfer.
            </p>
          ) : (
            <div className="mt-5 space-y-4">
              {transfers.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-100 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-700">
                      Pengaju:{" "}
                      {profileMap.get(item.requested_by_user_id)?.full_name ?? "-"}
                    </p>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {item.status}
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-slate-600">
                    Alasan: {item.reason}
                  </p>

                  <p className="mt-2 text-sm text-slate-600">
                    Diproses oleh:{" "}
                    {item.reviewed_by_user_id
                      ? profileMap.get(item.reviewed_by_user_id)?.full_name
                      : "Belum diproses"}
                  </p>

                  <p className="mt-2 text-xs text-slate-400">
                    {formatDate(item.requested_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* PERKEMBANGAN */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <Clock className="text-blue-600" size={21} />
            <h2 className="font-bold text-slate-800">
              Perkembangan Penanganan
            </h2>
          </div>

          {updates.length === 0 ? (
            <p className="mt-5 text-sm text-slate-400">
              Belum ada pembaruan penanganan.
            </p>
          ) : (
            <div className="mt-5 space-y-4">
              {updates.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl bg-slate-50 p-4"
                >
                  <p className="text-sm leading-6 text-slate-700">
                    {item.progress_description}
                  </p>

                  <p className="mt-3 text-xs text-slate-400">
                    {profileMap.get(item.author_user_id)?.full_name ?? "-"}
                    {" · "}
                    {formatDate(item.created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* RIWAYAT STATUS */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-bold text-slate-800">
            Riwayat Status Tiket
          </h2>

          <div className="mt-5 space-y-4">
            {statusHistory.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-4"
              >
                <div className="mt-1 h-3 w-3 shrink-0 rounded-full bg-blue-600 ring-4 ring-blue-50" />

                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {item.previous_status
                      ? `${statusConfig[item.previous_status]?.label ?? item.previous_status} → `
                      : ""}
                    {statusConfig[item.new_status]?.label ?? item.new_status}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Oleh:{" "}
                    {profileMap.get(item.changed_by_user_id)?.full_name ?? "-"}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    {formatDate(item.changed_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <footer className="pb-5 text-center text-xs text-slate-400">
          © 2026 PT Informatics OASE · Ticketing System
        </footer>
      </div>
    </main>
  );
}
