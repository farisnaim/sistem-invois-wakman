"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface Invoice {
  id: string;
  status: string;
  total_amount: number;
  deposit_paid: number;
  created_at: string;
}

interface DashboardStats {
  totalInvoices: number;
  totalPaid: number;
  totalUnpaid: number;
  pendingAmount: number;
}

export default function DashboardPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalInvoices: 0,
    totalPaid: 0,
    totalUnpaid: 0,
    pendingAmount: 0,
  });
  const [loading, setLoading] = useState(true);

  // State untuk Filter Revenue
  const [selectedYear, setSelectedYear] = useState<string>(
    new Date().getFullYear().toString(),
  );
  const [selectedMonth, setSelectedMonth] = useState<string>("all");

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("invoices")
          .select("id, status, total_amount, deposit_paid, created_at");

        if (error) throw error;

        if (data) {
          setInvoices(data as Invoice[]);

          const totalInvoices = data.length;
          const totalPaid = data.filter((i) => i.status === "paid").length;
          const totalUnpaid = data.filter((i) => i.status !== "paid").length;

          // Kira jumlah baki belum dibayar
          const pendingAmount = data
            .filter((i) => i.status !== "paid")
            .reduce((acc, curr) => {
              const balance =
                Number(curr.total_amount) - Number(curr.deposit_paid || 0);
              return acc + (balance > 0 ? balance : 0);
            }, 0);

          setStats({
            totalInvoices,
            totalPaid,
            totalUnpaid,
            pendingAmount,
          });
        }
      } catch (err) {
        console.error("Ralat memuatkan statistik dashboard:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  // Senarai Tahun unik berdasarkan rekod invois untuk dropdown filter
  const availableYears = Array.from(
    new Set(
      invoices.map((inv) => new Date(inv.created_at).getFullYear().toString()),
    ),
  ).sort((a, b) => Number(b) - Number(a));

  if (!availableYears.includes(new Date().getFullYear().toString())) {
    availableYears.unshift(new Date().getFullYear().toString());
  }

  // Pengiraan Total Revenue mengikut status "paid" dan filter tarikh
  const filteredRevenue = invoices
    .filter((inv) => inv.status === "paid")
    .filter((inv) => {
      const date = new Date(inv.created_at);
      const yearMatches = date.getFullYear().toString() === selectedYear;
      const monthMatches =
        selectedMonth === "all" ||
        (date.getMonth() + 1).toString().padStart(2, "0") === selectedMonth;

      return yearMatches && monthMatches;
    })
    .reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);

  return (
    <main
      className="min-h-screen bg-cover bg-center bg-no-repeat p-4 sm:p-8 text-slate-800"
      style={{
        backgroundImage: "url('/dark_cook_bg.jpg')",
      }}
    >
      <div className="max-w-5xl mx-auto space-y-8">
        {/* HEADER DASHBOARD */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#EEDC82]/85 p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              KAMARUZAMAN ZAINUDDIN
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Sistem pengurusan Invois Wak Man & Family
            </p>
          </div>
          <img
            src="/favicon.svg"
            alt="Logo Syarikat"
            className="w-20 h-20 object-contain shrink-0"
          />
        </div>

        {/* HEADER TINDAKAN */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Dashboard Utama
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Sistem Pengurusan Invois — Kamaruzaman Zainuddin
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/invoices/new"
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-2"
            >
              <span>➕</span> Invois Baru
            </Link>
            <Link
              href="/customers/new"
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-2"
            >
              <span>👤</span> Pelanggan Baru
            </Link>
          </div>
        </div>

        {/* KAD TOTAL REVENUE PENUH */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-6 rounded-2xl shadow-lg border border-emerald-500/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 text-emerald-100 text-xs font-extrabold uppercase tracking-widest">
              <span>💰</span> Jumlah Pendapatan (Paid Invoices Only)
            </div>
            <div className="text-3xl sm:text-4xl font-black mt-2 tracking-tight">
              {loading ? "..." : `RM ${filteredRevenue.toFixed(2)}`}
            </div>
          </div>

          {/* FILTER TAHUN & BULAN */}
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-white/10 text-white font-semibold text-xs border border-white/20 rounded-xl px-3 py-2.5 focus:outline-none focus:bg-emerald-800 transition"
            >
              {availableYears.map((year) => (
                <option key={year} value={year} className="text-slate-900">
                  Tahun {year}
                </option>
              ))}
            </select>

            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-white/10 text-white font-semibold text-xs border border-white/20 rounded-xl px-3 py-2.5 focus:outline-none focus:bg-emerald-800 transition"
            >
              <option value="all" className="text-slate-900">
                Semua Bulan
              </option>
              <option value="01" className="text-slate-900">
                Januari
              </option>
              <option value="02" className="text-slate-900">
                Februari
              </option>
              <option value="03" className="text-slate-900">
                Mac
              </option>
              <option value="04" className="text-slate-900">
                April
              </option>
              <option value="05" className="text-slate-900">
                Mei
              </option>
              <option value="06" className="text-slate-900">
                Jun
              </option>
              <option value="07" className="text-slate-900">
                Julai
              </option>
              <option value="08" className="text-slate-900">
                Ogos
              </option>
              <option value="09" className="text-slate-900">
                September
              </option>
              <option value="10" className="text-slate-900">
                Oktober
              </option>
              <option value="11" className="text-slate-900">
                November
              </option>
              <option value="12" className="text-slate-900">
                Disember
              </option>
            </select>
          </div>
        </div>

        {/* KAD STATISTIK RINGKAS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Jumlah Invois
            </p>
            <p className="text-2xl font-black text-slate-800 mt-2">
              {loading ? "..." : stats.totalInvoices}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-green-500 uppercase tracking-wider">
              Invois Selesai (Paid)
            </p>
            <p className="text-2xl font-black text-green-600 mt-2">
              {loading ? "..." : stats.totalPaid}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-amber-500 uppercase tracking-wider">
              Belum Bayar (Unpaid)
            </p>
            <p className="text-2xl font-black text-amber-600 mt-2">
              {loading ? "..." : stats.totalUnpaid}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-red-400 uppercase tracking-wider">
              Jumlah Tunggakan
            </p>
            <p className="text-2xl font-black text-red-600 mt-2">
              {loading ? "..." : `RM ${stats.pendingAmount.toFixed(2)}`}
            </p>
          </div>
        </div>

        {/* MENU TINDAKAN / NAVIGASI PANTAS */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4">Menu</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/invoices"
              className="p-4 border border-slate-100 hover:border-blue-300 bg-slate-50 hover:bg-blue-50/50 rounded-xl transition group"
            >
              <div className="text-2xl mb-2">📄</div>
              <h3 className="font-bold text-slate-800 group-hover:text-blue-600 text-sm">
                Senarai Invois
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Lihat, cetak, kemas kini status & kemas kini maklumat invois.
              </p>
            </Link>

            <Link
              href="/customers"
              className="p-4 border border-slate-100 hover:border-blue-300 bg-slate-50 hover:bg-blue-50/50 rounded-xl transition group"
            >
              <div className="text-2xl mb-2">👥</div>
              <h3 className="font-bold text-slate-800 group-hover:text-blue-600 text-sm">
                Pengurusan Pelanggan
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Urus data pelanggan, nombor telefon dan alamat.
              </p>
            </Link>

            <Link
              href="/invoices/new"
              className="p-4 border border-slate-100 hover:border-blue-300 bg-slate-50 hover:bg-blue-50/50 rounded-xl transition group"
            >
              <div className="text-2xl mb-2">📝</div>
              <h3 className="font-bold text-slate-800 group-hover:text-blue-600 text-sm">
                Cipta Invois
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Bina invois baharu untuk pelanggan dengan pantas.
              </p>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
