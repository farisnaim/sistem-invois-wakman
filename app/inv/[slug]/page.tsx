"use client";

import { useEffect, useState, use } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

interface Customer {
  name: string;
  phone: string;
  address_1?: string;
  address_2?: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  title?: string;
  issue_date: string;
  due_date: string;
  subtotal: number;
  total_amount: number;
  deposit_paid: number;
  status: string;
  notes?: string;
  customers: Customer | null;
  invoice_items: InvoiceItem[];
}

export default function PublicInvoicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const rawSlug = resolvedParams.slug;

  // Ambil parameter ?token= daripada URL
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInvoice() {
      try {
        setLoading(true);
        setError(null);

        // 1. Semak jika token wujud dalam URL
        if (!token) {
          setError("Pautan invois tidak sah atau token keselamatan tiada.");
          return;
        }

        let { data, error: fetchError } = await supabase
          .from("invoices")
          .select(
            `
            id,
            invoice_number,
            title,
            issue_date,
            due_date,
            subtotal,
            total_amount,
            deposit_paid,
            status,
            notes,
            customers (
              name,
              phone,
              address_1,
              address_2
            ),
            invoice_items (
              id,
              description,
              quantity,
              unit_price,
              amount
            )
          `,
          )
          .eq("slug", rawSlug)
          .maybeSingle();

        if (!data && !fetchError) {
          const { data: fallbackData, error: fallbackError } = await supabase
            .from("invoices")
            .select(
              `
              id,
              invoice_number,
              title,
              issue_date,
              due_date,
              subtotal,
              total_amount,
              deposit_paid,
              status,
              notes,
              customers (
                name,
                phone,
                address_1,
                address_2
              ),
              invoice_items (
                id,
                description,
                quantity,
                unit_price,
                amount
              )
            `,
            )
            .ilike("invoice_number", rawSlug)
            .maybeSingle();

          data = fallbackData;
          fetchError = fallbackError;
        }

        if (fetchError) {
          throw new Error(`Ralat Supabase: ${fetchError.message}`);
        }

        if (!data) {
          setError(`Invois "${rawSlug}" tidak ditemui.`);
          return;
        }

        // 2. Semakan Keselamatan Token: Extract 8 aksara pertama daripada id
        const expectedToken = data.id.slice(0, 8);
        if (token !== expectedToken) {
          setError("Token keselamatan tidak sah untuk invois ini.");
          return;
        }

        setInvoice(data as unknown as Invoice);
      } catch (err: unknown) {
        const errorMsg = err as Error;
        setError(errorMsg.message || "Ralat berlaku semasa memuatkan invois.");
      } finally {
        setLoading(false);
      }
    }

    if (rawSlug) {
      fetchInvoice();
    }
  }, [rawSlug, token]);

  // Fungsi Cetak
  const handlePrint = () => {
    window.print();
  };

  // Fungsi Muat Turun PDF
  const handleSavePDF = () => {
    const originalTitle = document.title;
    document.title = invoice?.invoice_number
      ? `Invois-${invoice.invoice_number}`
      : "Invois";
    window.print();
    document.title = originalTitle;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-slate-500">
        <div className="flex items-center gap-2 font-medium text-sm">
          <span className="animate-spin text-lg">⏳</span> Sedang memuatkan
          invois...
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 text-center max-w-md w-full shadow-sm space-y-4">
          <div className="text-4xl">🔒</div>
          <h2 className="text-lg font-bold text-slate-900">Capaian Ditolak</h2>
          <p className="text-slate-600 text-xs leading-relaxed">
            {error ||
              "Anda tidak mempunyai kebenaran untuk melihat invois ini."}
          </p>
        </div>
      </div>
    );
  }

  const balanceDue = invoice.total_amount - (invoice.deposit_paid || 0);
  const isPaid = invoice.status === "paid" || balanceDue <= 0;

  return (
    <main className="min-h-screen bg-slate-100/70 p-4 sm:p-8 text-slate-800 flex flex-col items-center justify-start print:bg-white print:p-0">
      {/* BAR BUTANG TINDAKAN (TIDAK DICETAK) */}
      <div className="max-w-2xl w-full mb-4 flex justify-between items-center print:hidden">
        <span className="text-xs font-semibold text-slate-400">
          Paparan Pelanggan
        </span>

        {/* KUMPULAN BUTANG */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSavePDF}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-2 cursor-pointer"
          >
            📥 Simpan / Muat Turun PDF
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-2 cursor-pointer"
          >
            🖨️ Cetak
          </button>
        </div>
      </div>

      {/* DOKUMEN INVOIS */}
      <div className="bg-white max-w-2xl w-full p-6 sm:p-10 rounded-2xl shadow-sm border border-slate-200/80 space-y-6 print:shadow-none print:border-none print:p-0">
        {/* HEADER SYARIKAT */}
        <div className="border-b border-slate-100 pb-5 flex items-center gap-4">
          <img
            src="/favicon.svg"
            alt="Logo Syarikat"
            className="w-16 h-16 object-contain shrink-0"
          />

          <div className="space-y-0.5">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              KAMARUZAMAN ZAINUDDIN
            </h2>
            <p className="text-xs font-semibold text-slate-600">
              No. SSM: 202103208150 (CT0091538-M)
            </p>
            <p className="text-xs text-slate-500">
              Banting/Klang/Sepang, Selangor
            </p>
            <p className="text-xs text-slate-500 font-medium">
              Wak Man: 019-6456542 | Naim: 019-9147010
            </p>
          </div>
        </div>

        {/* TAJUK INVOIS & TARIKH */}
        <div className="flex justify-between items-start border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              INVOIS
            </h1>
            <p className="text-sm font-extrabold text-blue-600">
              {invoice.invoice_number}
            </p>
            <div className="pt-1">
              <span
                className={`inline-block px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  isPaid
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {isPaid ? "SUDAH DIBAYAR (PAID)" : "BELUM BAYAR (UNPAID)"}
              </span>
            </div>
          </div>

          <div className="text-right text-xs space-y-1 text-slate-600 pt-1">
            <p>
              <span className="font-semibold text-slate-700">
                Tarikh Issue:
              </span>{" "}
              {invoice.issue_date}
            </p>
            {invoice.due_date && (
              <p>
                <span className="font-semibold text-slate-700">
                  Tarikh Akhir (Due):
                </span>{" "}
                {invoice.due_date}
              </p>
            )}
          </div>
        </div>

        {/* PROGRAM / PERKARA */}
        {invoice.title && (
          <div className="text-xs space-y-0.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
              PERKARA / PROGRAM:
            </p>
            <p className="font-bold text-slate-800 text-sm">{invoice.title}</p>
          </div>
        )}

        {/* PELANGGAN */}
        <div className="text-xs space-y-1">
          <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
            KEPADA PELANGGAN:
          </p>
          <p className="font-bold text-slate-900 text-sm">
            {invoice.customers?.name || "Pelanggan Umum"}
          </p>
          {invoice.customers?.phone && (
            <p className="text-slate-600 font-medium">
              {invoice.customers.phone}
            </p>
          )}
          {invoice.customers?.address_1 && (
            <p className="text-slate-600">{invoice.customers.address_1}</p>
          )}
          {invoice.customers?.address_2 && (
            <p className="text-slate-600">{invoice.customers.address_2}</p>
          )}
        </div>

        {/* JADUAL ITEM */}
        <div className="overflow-x-auto pt-2">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-y border-slate-200 text-slate-500 uppercase font-bold tracking-wider text-[10px] bg-slate-50/50">
                <th className="py-2.5 px-3">DESKRIPSI ITEM</th>
                <th className="py-2.5 px-3 text-center">KUANTITI</th>
                <th className="py-2.5 px-3 text-right">HARGA UNIT (RM)</th>
                <th className="py-2.5 px-3 text-right">JUMLAH (RM)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {invoice.invoice_items && invoice.invoice_items.length > 0 ? (
                invoice.invoice_items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3 px-3 font-medium text-slate-800">
                      {item.description}
                    </td>
                    <td className="py-3 px-3 text-center">{item.quantity}</td>
                    <td className="py-3 px-3 text-right">
                      {Number(item.unit_price).toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900">
                      {Number(item.amount).toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-slate-400">
                    Tiada item direkodkan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* NOTA & RINGKASAN KEWANGAN */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 items-start">
          {/* BAHAGIAN NOTA DENGAN BACKGROUND SLATE NIPIS */}
          <div className="text-xs space-y-1 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80">
            <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
              NOTA:
            </p>
            <p className="text-slate-700 whitespace-pre-line leading-relaxed font-normal">
              {invoice.notes || "Terima kasih atas urus niaga anda."}
            </p>
          </div>

          <div className="space-y-2 text-xs border-t sm:border-t-0 pt-4 sm:pt-0">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-semibold">
                RM {Number(invoice.subtotal || invoice.total_amount).toFixed(2)}
              </span>
            </div>

            {Number(invoice.deposit_paid) > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Deposit Paid:</span>
                <span>- RM {Number(invoice.deposit_paid).toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between font-bold text-slate-900 text-sm pt-2 border-t border-slate-200">
              <span>Jumlah Invois:</span>
              <span>RM {Number(invoice.total_amount).toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center font-black text-slate-900 text-sm pt-1">
              <span>Baki Perlu Dibayar:</span>
              <span className="text-blue-600">
                RM {balanceDue > 0 ? balanceDue.toFixed(2) : "0.00"}
              </span>
            </div>
          </div>
        </div>

        {/* NOTA KAKI */}
        <div className="pt-6 border-t border-slate-100 text-center text-[11px] text-slate-400">
          Invois ini dijana secara komputer. Tidak memerlukan tandatangan.
          Terima kasih atas urus niaga anda.
        </div>
      </div>
    </main>
  );
}
