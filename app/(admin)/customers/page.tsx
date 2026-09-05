"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  address_1: string | null;
  address_2: string | null;
  created_at: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Ambil senarai pelanggan
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (err) {
      console.error("Ralat memuatkan senarai pelanggan:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Fungsi padam pelanggan
  const handleDelete = async (id: string, name: string) => {
    const confirmDelete = window.confirm(
      `Adakah anda pasti ingin memadam pelanggan "${name}"?`,
    );
    if (!confirmDelete) return;

    setDeletingId(id);
    try {
      const { error } = await supabase.from("customers").delete().eq("id", id);
      if (error) throw error;

      // Kemaskini senarai setempat
      setCustomers((prev) => prev.filter((c) => c.id !== id));
    } catch (err: unknown) {
      const error = err as Error;
      alert(`Gagal memadam pelanggan: ${error.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  // Tapisan carian mengikut nama atau nombor telefon
  const filteredCustomers = customers.filter((customer) => {
    const query = searchQuery.toLowerCase();
    const matchName = customer.name.toLowerCase().includes(query);
    const matchPhone = customer.phone?.toLowerCase().includes(query) || false;
    return matchName || matchPhone;
  });

  // Format nombor telefon untuk pautan WhatsApp
  const formatWhatsapp = (phone: string | null) => {
    if (!phone) return null;
    let cleanPhone = phone.replace(/[^0-9]/g, "");
    if (cleanPhone.startsWith("0")) {
      cleanPhone = "60" + cleanPhone.slice(1);
    }
    return `https://wa.me/${cleanPhone}`;
  };

  return (
    <main
      className="min-h-screen bg-cover bg-center bg-no-repeat p-4 sm:p-8 text-slate-800"
      style={{
        backgroundImage: "url('/dark_cook_bg.jpg')",
      }}
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* NAVIGASI & HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
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
                Pelanggan
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Pengurusan Pelanggan
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Urus maklumat perhubungan, alamat, dan cipta invois khas untuk
              pelanggan.
            </p>
          </div>

          <Link
            href="/customers/new"
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-2 cursor-pointer"
          >
            <span>➕</span> Tambah Pelanggan Baharu
          </Link>
        </div>

        {/* KAD STATISTIK RINGKAS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Jumlah Pelanggan
            </p>
            <p className="text-2xl font-black text-slate-800 mt-1">
              {loading ? "..." : customers.length}
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-blue-500 uppercase tracking-wider">
              Pelanggan Didaftar
            </p>
            <p className="text-2xl font-black text-blue-600 mt-1">
              {loading ? "..." : customers.length}
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Status Sistem
            </p>
            <p className="text-xs font-bold text-green-600 mt-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Terhubung ke Supabase
            </p>
          </div>
        </div>

        {/* RUANGAN CARIAN */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <span className="text-slate-400 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Cari mengikut nama atau nombor telefon..."
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

        {/* JADUAL SENARAI PELANGGAN */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs font-medium">
              Memuatkan senarai pelanggan...
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="text-3xl">👥</div>
              <h3 className="text-sm font-bold text-slate-800">
                {searchQuery
                  ? "Tiada Pelanggan Ditemui"
                  : "Tiada Rekod Pelanggan"}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {searchQuery
                  ? "Cuba cari dengan kata kunci lain."
                  : "Sistem belum mempunyai sebarang pelanggan. Klik butang di bawah untuk menambah pelanggan pertama."}
              </p>
              {!searchQuery && (
                <Link
                  href="/customers/new"
                  className="inline-block mt-2 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow transition"
                >
                  ➕ Tambah Pelanggan
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-xs text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-6 font-semibold">
                      Nama / Syarikat
                    </th>
                    <th className="py-3.5 px-6 font-semibold">No. Telefon</th>
                    <th className="py-3.5 px-6 font-semibold">Alamat</th>
                    <th className="py-3.5 px-6 text-right font-semibold">
                      Tindakan
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCustomers.map((customer) => {
                    const waLink = formatWhatsapp(customer.phone);
                    return (
                      <tr
                        key={customer.id}
                        className="hover:bg-slate-50/80 transition"
                      >
                        {/* NAMA */}
                        <td className="py-4 px-6 font-bold text-slate-900">
                          {customer.name}
                        </td>

                        {/* TELEFON & WHATSAPP */}
                        <td className="py-4 px-6 text-xs text-slate-600">
                          {customer.phone ? (
                            <div className="flex items-center gap-2">
                              <span>{customer.phone}</span>
                              {waLink && (
                                <a
                                  href={waLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Hantar WhatsApp"
                                  className="text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 px-2 py-0.5 rounded-full text-[10px] font-bold transition"
                                >
                                  💬 WA
                                </a>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-300 italic">-</span>
                          )}
                        </td>

                        {/* ALAMAT */}
                        <td className="py-4 px-6 text-xs text-slate-600 max-w-xs">
                          {customer.address_1 || customer.address_2 ? (
                            <div className="space-y-0.5">
                              {customer.address_1 && (
                                <p>{customer.address_1}</p>
                              )}
                              {customer.address_2 && (
                                <p className="text-slate-400">
                                  {customer.address_2}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-300 italic">-</span>
                          )}
                        </td>

                        {/* BUTANG TINDAKAN */}
                        <td className="py-4 px-6 text-right space-x-2">
                          <Link
                            href={`/invoices/new?customer_id=${customer.id}`}
                            className="inline-block px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg transition"
                          >
                            ➕ Invois
                          </Link>
                          <button
                            onClick={() =>
                              handleDelete(customer.id, customer.name)
                            }
                            disabled={deletingId === customer.id}
                            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 disabled:bg-slate-100 text-red-600 text-xs font-bold rounded-lg transition cursor-pointer"
                          >
                            {deletingId === customer.id ? "..." : "Padam"}
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
