
import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeftRight,
  LayoutDashboard,
  Ticket,
  ClipboardCheck,
  Building2,
  Package,
  ChartNoAxesCombined,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import TransferReviewList, {
  type HelpdeskOption,
  type TransferRequestItem,
} from "./transfer-review-list";

async function signOutAction() {
  "use server";

  const supabase = await createClient();
  await supabase.auth.signOut();

  redirect("/");
}

function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <p className="text-slate-500">Memuat permintaan transfer...</p>
    </div>
  );
}

export default function TransfersPage() {
  return (
    <Suspense fallback={<Loading />}>
      <TransfersContent />
    </Suspense>
  );
}

async function TransfersContent() {
  await connection();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

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

  // Mengambil semua permintaan Pending.
  const {
    data: pendingRequests,
    error: requestError,
  } = await supabase
    .from("transfer_requests")
    .select(
      "id, ticket_id, requested_by_user_id, reason, status, requested_at"
    )
    .eq("status", "pending")
    .order("requested_at", { ascending: false });

  if (requestError) {
    throw new Error(
      `Gagal mengambil permintaan transfer: ${requestError.message}`
    );
  }

  const requests = pendingRequests ?? [];

  const ticketIds = [
    ...new Set(requests.map((item) => item.ticket_id)),
  ];

  // Mengambil tiket yang berkaitan dengan permintaan Pending.
  let tickets: {
    id: string;
    ticket_number: string;
    subject: string;
    status: string;
    current_helpdesk_id: string | null;
  }[] = [];

  if (ticketIds.length > 0) {
    const { data, error } = await supabase
      .from("tickets")
      .select(
        "id, ticket_number, subject, status, current_helpdesk_id"
      )
      .in("id", ticketIds);

    if (error) {
      throw new Error(`Gagal mengambil tiket: ${error.message}`);
    }

    tickets = data ?? [];
  }

  const ticketMap = new Map(
    tickets.map((ticket) => [ticket.id, ticket])
  );

  const userIds = [
    ...new Set([
      ...requests.map((item) => item.requested_by_user_id),
      ...tickets
        .map((ticket) => ticket.current_helpdesk_id)
        .filter((id): id is string => id !== null),
    ]),
  ];

  // Mengambil nama pengguna yang terlibat.
  let users: {
    id: string;
    full_name: string;
    role: string;
    is_active: boolean;
  }[] = [];

  if (userIds.length > 0) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, role, is_active")
      .in("id", userIds);

    if (error) {
      throw new Error(`Gagal mengambil profil pengguna: ${error.message}`);
    }

    users = data ?? [];
  }

  // Mengambil seluruh Helpdesk aktif untuk pilihan pengganti.
  const { data: helpdeskData, error: helpdeskError } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "helpdesk")
    .eq("is_active", true)
    .order("full_name");

  if (helpdeskError) {
    throw new Error(`Gagal mengambil daftar Helpdesk: ${helpdeskError.message}`);
  }

  const userMap = new Map(
    users.map((item) => [item.id, item.full_name])
  );

  const reviewItems: TransferRequestItem[] = requests.flatMap(
    (request) => {
      const ticket = ticketMap.get(request.ticket_id);

      // Lewati permintaan jika tiket tidak ditemukan.
      if (!ticket) return [];

      return [
        {
          id: request.id,
          ticketNumber: ticket.ticket_number,
          subject: ticket.subject,
          ticketStatus: ticket.status,
          currentHelpdeskId: ticket.current_helpdesk_id,
          currentHelpdeskName: ticket.current_helpdesk_id
            ? userMap.get(ticket.current_helpdesk_id) ?? "Tidak diketahui"
            : "Belum ditugaskan",
          requesterName:
            userMap.get(request.requested_by_user_id) ??
            "Pengguna tidak diketahui",
          reason: request.reason,
          requestedAt: request.requested_at,
        },
      ];
    }
  );

  const helpdesks: HelpdeskOption[] = (helpdeskData ?? []).map(
    (item) => ({
      id: item.id,
      fullName: item.full_name,
    })
  );

  return (
    <div className="min-h-screen bg-slate-100 lg:flex">
      
      {/* SIDEBAR */}
      <aside className="flex w-full flex-col bg-[#102C46] text-white lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shrink-0">
        <div className="border-b border-white/10 px-6 py-6">
          <h1 className="text-xl font-bold">OASE</h1>
          <p className="text-[10px] tracking-[0.2em] text-blue-200">
            TICKETING SYSTEM
          </p>
        </div>

        <div className="flex-1 px-4 py-6">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
            Menu Utama
          </p>

          <nav className="space-y-1">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <LayoutDashboard size={19} />
              Dashboard
            </Link>

            <Link
              href="/dashboard/tickets"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <Ticket size={19} />
              Daftar Tiket
            </Link>

            <Link
              href="/dashboard/clients"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <Building2 size={19} />
              Data Klien
            </Link>

            <Link
              href="/dashboard/transfers"
              className="flex items-center gap-3 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white"
            >
              <ArrowLeftRight size={19} />
              Persetujuan Transfer
            </Link>

            <div className="flex cursor-not-allowed items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-500">
              <Package size={19} />
              Produk
              <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[9px]">
                Segera
              </span>
            </div>

            <div className="flex cursor-not-allowed items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-500">
              <ChartNoAxesCombined size={19} />
              Laporan
              <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[9px]">
                Segera
              </span>
            </div>
          </nav>
        </div>

        {/* INFORMASI AKUN DAN LOGOUT */}
        <div className="border-t border-white/10 p-4">
          <div className="mb-3 rounded-xl bg-white/5 p-3">
            <p className="truncate text-sm font-semibold">
              {profile.full_name}
            </p>

            <p className="text-xs text-slate-400">
              {profile.role === "super_admin"
                ? "Super Admin"
                : "Admin"}
            </p>
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
        <header className="border-b border-slate-200 bg-white px-6 py-5 lg:px-9">
          <h1 className="text-lg font-bold text-slate-800">
            Persetujuan Transfer
          </h1>

          <p className="mt-1 text-xs text-slate-500">
            Tinjau dan proses permintaan perpindahan penanganan tiket.
          </p>
        </header>

        <section className="space-y-6 p-6 lg:p-9">
          <div>
            <p className="text-sm font-semibold text-blue-600">
              Manajemen Penugasan
            </p>

            <h2 className="mt-2 text-2xl font-bold text-slate-800">
              Permintaan Transfer Tiket
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Terdapat {reviewItems.length} permintaan yang menunggu keputusan.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
            <ClipboardCheck size={20} className="shrink-0" />

            <p>
              Pilih Helpdesk pengganti sebelum menyetujui transfer.
              Jika ditolak, tiket tetap ditangani oleh petugas saat ini.
            </p>
          </div>

          <TransferReviewList
            requests={reviewItems}
            helpdesks={helpdesks}
          />

          <footer className="pb-4 text-center text-xs text-slate-400">
            © 2026 PT Informatics OASE · Ticketing System
          </footer>
        </section>
      </main>
    </div>
  );
}
