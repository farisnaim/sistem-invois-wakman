"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function NewCustomerPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg("Sila masukkan nama pelanggan.");
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.from("customers").insert([
        {
          name: name.trim(),
          phone: phone.trim() || null,
          address_1: address1.trim() || null,
          address_2: address2.trim() || null,
        },
      ]);

      if (error) {
        throw new Error(error.message || "Gagal menambah pelanggan.");
      }

      // Berjaya simpan, kembalikan pengguna ke halaman senarai pelanggan
      router.push("/customers");
      router.refresh();
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || "Ralat tidak dijangka berlaku.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8 text-slate-800">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* NAVIGASI KEMBALI */}
        <div className="flex items-center justify-between">
          <Link
            href="/customers"
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition flex items-center gap-1"
          >
            <span>←</span> Kembali ke Senarai Pelanggan
          </Link>
        </div>

        {/* KAD BORANG */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="border-b border-slate-100 pb-4 mb-6">
            <h1 className="text-xl font-bold text-slate-900">
              Tambah Pelanggan Baharu
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Isi maklumat pelanggan di bawah untuk disimpan ke dalam sistem.
            </p>
          </div>

          {/* MESEJ RALAT */}
          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <span>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* NAMA PELANGGAN */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Nama Pelanggan / Syarikat{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Ahmad Albab / ABC Trading"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
            </div>

            {/* NOMBOR TELEFON */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Nombor Telefon
              </label>
              <input
                type="text"
                placeholder="Contoh: 0123456789"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
            </div>

            {/* ALAMAT BARIS 1 */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Alamat Baris 1
              </label>
              <input
                type="text"
                placeholder="Contoh: No. 12, Jalan Bunga Raya"
                value={address1}
                onChange={(e) => setAddress1(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
            </div>

            {/* ALAMAT BARIS 2 */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Alamat Baris 2
              </label>
              <input
                type="text"
                placeholder="Contoh: Taman Merdeka, 42700 Banting, Selangor"
                value={address2}
                onChange={(e) => setAddress2(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
            </div>

            {/* BUTANG Aksi */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <Link
                href="/customers"
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Batal
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-bold rounded-xl shadow transition cursor-pointer flex items-center gap-2"
              >
                {submitting ? "Menyimpan..." : "Simpan Pelanggan"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
