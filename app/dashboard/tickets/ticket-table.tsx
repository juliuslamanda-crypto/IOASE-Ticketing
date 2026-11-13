
"use client";

import { useMemo, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  Ticket,
} from "lucide-react";
import type { TicketListItem } from "./types";

type Props = {
  tickets: TicketListItem[];
};

const statuses: Record<string, { label: string; style: string }> = {
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

export default function TicketTable({ tickets }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("all");

  const products = useMemo(
    () => [...new Set(tickets.map((ticket) => ticket.product_name))],
    [tickets]
  );

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const keyword = search.toLowerCase();

      const matchesSearch =
        ticket.ticket_number.toLowerCase().includes(keyword) ||
        ticket.subject.toLowerCase().includes(keyword) ||
        ticket.client_name.toLowerCase().includes(keyword);

      const matchesStatus =
        statusFilter === "all" || ticket.status === statusFilter;

      const matchesProduct =
        productFilter === "all" ||
        ticket.product_name === productFilter;

      return matchesSearch && matchesStatus && matchesProduct;
    });
  }, [tickets, search, statusFilter, productFilter]);

  const formatDate = (date: string) =>
    new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Jakarta",
    }).format(new Date(date));

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

      {/* FILTER */}
      <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">

        <div>
          <h2 className="font-bold text-slate-800">
            Daftar Tiket
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Menampilkan {filteredTickets.length} dari {tickets.length} tiket
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">

          <div className="relative">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nomor tiket, perihal, klien..."
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 sm:w-72"
            />
          </div>

          <div className="relative">
            <SlidersHorizontal
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-8 text-sm outline-none focus:border-blue-500 sm:w-40"
            >
              <option value="all">Semua Status</option>
              {Object.entries(statuses).map(([value, item]) => (
                <option key={value} value={value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
          >
            <option value="all">Semua Produk</option>
            {products.map((product) => (
              <option key={product} value={product}>
                {product}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* TABLE */}
      {filteredTickets.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <Ticket size={42} className="mx-auto text-slate-300" />

          <h3 className="mt-4 font-semibold text-slate-700">
            Tiket tidak ditemukan
          </h3>

          <p className="mt-2 text-sm text-slate-400">
            Coba ubah kata kunci atau filter pencarian.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4">Nomor Tiket</th>
                <th className="px-5 py-4">Perihal</th>
                <th className="px-5 py-4">Klien</th>
                <th className="px-5 py-4">Produk</th>
                <th className="px-5 py-4">Helpdesk</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Tanggal</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredTickets.map((ticket) => {
                const status = statuses[ticket.status] ?? {
                  label: ticket.status,
                  style: "bg-slate-100 text-slate-600",
                };

                return (
                  <tr key={ticket.id} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-5 py-4 font-semibold text-blue-700">
                      {ticket.ticket_number}
                    </td>

                    <td className="max-w-52 px-5 py-4 font-medium text-slate-700">
                      <p className="truncate">{ticket.subject}</p>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                      {ticket.client_name}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                      {ticket.product_name}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                      {ticket.helpdesk_name ?? (
                        <span className="text-slate-400">
                          Belum ditugaskan
                        </span>
                      )}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${status.style}`}
                      >
                        {status.label}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">
                      {formatDate(ticket.created_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
