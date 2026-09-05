"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface Customer {
  name: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  slug?: string | null;
  title?: string;
  issue_date: string;
  total_amount: number;
  deposit_paid: number;
  status: string;
  customers: Customer | null;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Ambil senarai invois
  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("invoices")
        .select(
          `
          id,
          invoice_number,
          slug,
          title,
          issue_date,
          total_amount,
          deposit_paid,
          status,
          customers ( name )
        `,
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Format data pelanggan
      const formattedData = (data || []).map((item) => {
        const rawCustomer = Array.isArray(item.customers)
          ? item.customers[0]
          : item.customers;
        return {
          ...item,
          customers: rawCustomer || null,
        };
      });

      setInvoices(formattedData);
    } catch (err) {
      console.error("Ralat memuatkan senarai invois:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  // Padam invois
  const handleDelete = async (id: string, invoiceNumber: string) => {
    const confirmDelete = window.confirm(
      `Adakah anda pasti ingin memadam invois "${invoiceNumber}"?`,
    );
    if (!confirmDelete) return;

    setDeletingId(id);
    try {
      const { error } = await supabase.from("invoices").delete().eq("id", id);
      if (error) throw error;

      setInvoices((prev) => prev.filter((i) => i.id !== id));
    } catch (err: unknown) {
      const error = err as Error;
      alert(`Gagal memadam invois: ${error.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  // Tukar status bayaran (paid <-> unpaid)
  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "paid" ? "unpaid" : "paid";
    setUpdatingId(id);

    try {
      const { error } = await supabase
        .from("invoices")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;

      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === id ? { ...inv, status: newStatus } : inv,
        ),
      );
    } catch (err: unknown) {
      const error = err as Error;
      alert(`Gagal mengemaskini status bayaran: ${error.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  // Salin pautan selamat untuk pelanggan
  const handleCopyLink = (targetSlug: string, invoiceId: string) => {
    const token = invoiceId.slice(0, 8);
    const fullUrl = `${window.location.origin}/inv/${targetSlug}?token=${token}`;

    navigator.clipboard.writeText(fullUrl);
    setCopiedId(invoiceId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Carian
  const filteredInvoices = invoices.filter((inv) => {
    const query = searchQuery.toLowerCase();
    const matchNumber = inv.invoice_number.toLowerCase().includes(query);
    const matchCustomer =
      inv.customers?.name?.toLowerCase().includes(query) || false;
    const matchTitle = inv.title?.toLowerCase().includes(query) || false;

    return matchNumber || matchCustomer || matchTitle;
  });

  // Pengiraan Statistik Ringkas
  const totalInvoices = invoices.length;
  const totalPaid = invoices.filter((i) => i.status === "paid").length;
  const totalUnpaid = invoices.filter((i) => i.status !== "paid").length;
  const pendingAmount = invoices
    .filter((i) => i.status !== "paid")
    .reduce((acc, curr) => {
      const balance =
        Number(curr.total_amount) - Number(curr.deposit_paid || 0);
      return acc + (balance > 0 ? balance : 0);
    }, 0);

  return (
    <main
      className="min-h-screen bg-cover bg-center bg-no-repeat p-4 sm:p-8 text-slate-800"
      style={{
        backgroundImage: "url('/dark_cook_bg.jpg')",
      }}
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* HEADER & NAVIGASI */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                href="/"
                className="text-xs font-semibold text-slate-400 hover:text-slate-700 transition"
              >
                Dashboard
              </Link>
              <span className="text-xs text-slate-300">/</span>
              <span className="text-xs font-semibold text-blue-600">
                Invois
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Pengurusan Invois
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Urus senarai invois, semak status bayaran, dan cipta invois
              baharu.
            </p>
          </div>

          <Link
            href="/invoices/new"
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-2 cursor-pointer"
          >
            <span>➕</span> Cipta Invois Baharu
          </Link>
        </div>

        {/* KAD STATISTIK */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Jumlah Invois
            </p>
            <p className="text-2xl font-black text-slate-800 mt-1">
              {loading ? "..." : totalInvoices}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider">
              Selesai (Paid)
            </p>
            <p className="text-2xl font-black text-emerald-600 mt-1">
              {loading ? "..." : totalPaid}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <p className="text-xs font-bold text-amber-500 uppercase tracking-wider">
              Belum Bayar (Unpaid)
            </p>
            <p className="text-2xl font-black text-amber-600 mt-1">
              {loading ? "..." : totalUnpaid}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <p className="text-xs font-bold text-rose-400 uppercase tracking-wider">
              Jumlah Tunggakan
            </p>
            <p className="text-2xl font-black text-rose-600 mt-1">
              {loading ? "..." : `RM ${pendingAmount.toFixed(2)}`}
            </p>
          </div>
        </div>

        {/* BAR CARIAN */}
        <div className="bg-white p-3.5 px-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
          <span className="text-slate-400 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Cari mengikut no. invois, nama pelanggan, atau tajuk..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-sm focus:outline-none placeholder-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs text-slate-400 hover:text-slate-600 font-medium px-2 py-1"
            >
              Kosongkan
            </button>
          )}
        </div>

        {/* JADUAL SENARAI INVOIS */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs font-medium">
              Memuatkan senarai invois...
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="text-3xl">📄</div>
              <h3 className="text-sm font-bold text-slate-800">
                {searchQuery ? "Tiada Invois Ditemui" : "Tiada Rekod Invois"}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {searchQuery
                  ? "Cuba semak carian anda dengan kata kunci yang lain."
                  : "Sistem belum mempunyai sebarang rekod invois. Sila cipta invois baharu."}
              </p>
              {!searchQuery && (
                <Link
                  href="/invoices/new"
                  className="inline-block mt-2 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-sm transition"
                >
                  ➕ Cipta Invois Baharu
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-6 font-semibold">No. Invois</th>
                    <th className="py-3.5 px-6 font-semibold">
                      Pelanggan / Program
                    </th>
                    <th className="py-3.5 px-6 font-semibold">Tarikh</th>
                    <th className="py-3.5 px-6 text-right font-semibold">
                      Baki Dibayar
                    </th>
                    <th className="py-3.5 px-6 text-center font-semibold">
                      Status
                    </th>
                    <th className="py-3.5 px-6 text-right font-semibold">
                      Tindakan
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInvoices.map((inv) => {
                    const balanceDue =
                      Number(inv.total_amount) - Number(inv.deposit_paid || 0);

                    // Penjanaan Slug Pautan & Token keselamatan
                    const targetSlug =
                      inv.slug || inv.invoice_number.toLowerCase();
                    const token = inv.id.slice(0, 8);

                    return (
                      <tr
                        key={inv.id}
                        className="hover:bg-slate-50/80 transition group"
                      >
                        {/* NO INVOIS */}
                        <td className="py-4 px-6 font-bold text-slate-900 group-hover:text-blue-600 transition">
                          {inv.invoice_number}
                        </td>

                        {/* PELANGGAN & TAJUK */}
                        <td className="py-4 px-6">
                          <p className="font-bold text-slate-800">
                            {inv.customers?.name || "Pelanggan Umum"}
                          </p>
                          {inv.title && (
                            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">
                              {inv.title}
                            </p>
                          )}
                        </td>

                        {/* TARIKH */}
                        <td className="py-4 px-6 text-xs font-medium text-slate-500">
                          {inv.issue_date}
                        </td>

                        {/* BAKI DIBAYAR */}
                        <td className="py-4 px-6 text-right font-bold text-slate-900">
                          RM {balanceDue.toFixed(2)}
                        </td>

                        {/* STATUS */}
                        <td className="py-4 px-6 text-center">
                          <span
                            className={`inline-block px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                              inv.status === "paid"
                                ? "bg-emerald-100/80 text-emerald-700"
                                : "bg-amber-100/80 text-amber-700"
                            }`}
                          >
                            {inv.status === "paid" ? "Paid" : "Unpaid"}
                          </span>
                        </td>

                        {/* BUTANG TINDAKAN */}
                        <td className="py-4 px-6 text-right space-x-2">
                          {/* SALIN PAUTAN */}
                          <button
                            onClick={() => handleCopyLink(targetSlug, inv.id)}
                            title="Salin Pautan Awam untuk Pelanggan"
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg transition cursor-pointer"
                          >
                            {copiedId === inv.id ? "✅ Disalin" : "🔗 Salin"}
                          </button>

                          {/* TUKAR STATUS */}
                          <button
                            onClick={() =>
                              handleToggleStatus(inv.id, inv.status)
                            }
                            disabled={updatingId === inv.id}
                            title="Tukar Status Bayaran"
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                              inv.status === "paid"
                                ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
                                : "bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {updatingId === inv.id ? "..." : "💵 Status"}
                          </button>

                          {/* LIHAT (TERMASUK TOKEN KESELAMATAN) */}
                          <Link
                            href={`/inv/${targetSlug}?token=${token}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
                          >
                            👁️ Lihat
                          </Link>

                          {/* PADAM */}
                          <button
                            onClick={() =>
                              handleDelete(inv.id, inv.invoice_number)
                            }
                            disabled={deletingId === inv.id}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 disabled:bg-slate-100 text-rose-600 text-xs font-semibold rounded-lg transition cursor-pointer"
                          >
                            {deletingId === inv.id ? "..." : "Padam"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
