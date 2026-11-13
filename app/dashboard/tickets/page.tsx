
import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Ticket, LogOut } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import TicketTable from "./ticket-table";
import type { TicketListItem } from "./types";

async function signOutAction() {
  "use server";

  const supabase = await createClient();
  await supabase.auth.signOut();

  redirect("/");
}

function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100">
      <p className="text-slate-500">Memuat daftar tiket...</p>
    </main>
  );
}

export default function TicketsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <TicketsContent />
    </Suspense>
  );
}

async function TicketsContent() {
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

  // Mengambil data tiket
  const { data: ticketData, error: ticketError } = await supabase
    .from("tickets")
    .select(
      "id, ticket_number, subject, status, client_id, product_id, current_helpdesk_id, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (ticketError) {
    return (
      <main className="min-h-screen bg-slate-100 p-8">
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
          Gagal mengambil daftar tiket: {ticketError.message}
        </div>
      </main>
    );
  }

  type TicketRow = {
    id: string;
    ticket_number: string;
    subject: string;
    status: string;
    client_id: string;
    product_id: string;
    current_helpdesk_id: string | null;
    created_at: string;
  };

  const rawTickets = (ticketData ?? []) as TicketRow[];

  const clientIds = [
    ...new Set(rawTickets.map((ticket: TicketRow) => ticket.client_id)),
  ];

  const productIds = [
    ...new Set(rawTickets.map((ticket: TicketRow) => ticket.product_id)),
  ];

  const helpdeskIds = [
    ...new Set(
      rawTickets
        .map((ticket: TicketRow) => ticket.current_helpdesk_id)
        .filter((id): id is string => id !== null)
    ),
  ];

  // Mengambil data perusahaan
  const clientMap = new Map<string, string>();

  if (clientIds.length > 0) {
    const { data } = await supabase
      .from("client_profiles")
      .select("id, company_name")
      .in("id", clientIds);

    for (const client of data ?? []) {
      clientMap.set(client.id, client.company_name);
    }
  }

  // Mengambil data produk
  const productMap = new Map<string, string>();

  if (productIds.length > 0) {
    const { data } = await supabase
      .from("products")
      .select("id, product_name")
      .in("id", productIds);

    for (const product of data ?? []) {
      productMap.set(product.id, product.product_name);
    }
  }

  // Mengambil nama Helpdesk
  const helpdeskMap = new Map<string, string>();

  if (helpdeskIds.length > 0) {
    const { data } = await supabase
      .from("helpdesk_directory")
      .select("id, full_name")
      .in("id", helpdeskIds);

    for (const helpdesk of data ?? []) {
      helpdeskMap.set(helpdesk.id, helpdesk.full_name);
    }
  }

  const tickets: TicketListItem[] = rawTickets.map(
    (ticket: TicketRow) => ({
      id: ticket.id,
      ticket_number: ticket.ticket_number,
      subject: ticket.subject,
      status: ticket.status,
      client_name: clientMap.get(ticket.client_id) ?? "-",
      product_name: productMap.get(ticket.product_id) ?? "-",
      helpdesk_name: ticket.current_helpdesk_id
        ? helpdeskMap.get(ticket.current_helpdesk_id) ?? null
        : null,
      created_at: ticket.created_at,
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

        <nav className="flex-1 space-y-2 px-4 py-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-300 hover:bg-white/10"
          >
            <LayoutDashboard size={19} />
            Dashboard
          </Link>

          <Link
            href="/dashboard/tickets"
            className="flex items-center gap-3 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white"
          >
            <Ticket size={19} />
            Daftar Tiket
          </Link>
        </nav>

        <div className="border-t border-white/10 p-4">
          <p className="truncate px-3 text-sm font-semibold">
            {profile.full_name}
          </p>
          <p className="px-3 text-xs text-slate-400">
            {profile.role === "super_admin" ? "Super Admin" : "Admin"}
          </p>

          <form action={signOutAction}>
            <button className="mt-4 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-300 hover:bg-red-500/10 hover:text-red-300">
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
            Daftar Tiket
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Kelola dan pantau seluruh pengaduan pelanggan OASE.
          </p>
        </header>

        <section className="space-y-6 p-6 lg:p-9">
          <div>
            <p className="text-sm font-semibold text-blue-600">
              Manajemen Pengaduan
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-800">
              Semua Tiket
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Daftar seluruh tiket dari perusahaan Klien.
            </p>
          </div>

          <TicketTable tickets={tickets} />

          <footer className="pt-3 text-center text-xs text-slate-400">
            © 2026 PT Informatics OASE · Ticketing System
          </footer>
        </section>
      </main>
    </div>
  );
}
