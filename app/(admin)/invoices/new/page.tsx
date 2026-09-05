"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface Customer {
  id: string;
  name: string;
  phone: string;
  address_1?: string;
  address_2?: string;
}

interface InvoiceItemInput {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export default function NewInvoicePage() {
  const router = useRouter();

  // State Utama Invois
  const [invoiceNumber, setInvoiceNumber] =
    useState<string>("INV-WM-Loading...");
  const [title, setTitle] = useState<string>("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [selectedCustomerObj, setSelectedCustomerObj] =
    useState<Customer | null>(null);
  const [searchCustomer, setSearchCustomer] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // State Modal Tambah Pelanggan Baharu
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState<boolean>(false);
  const [newCustomerName, setNewCustomerName] = useState<string>("");
  const [newCustomerPhone, setNewCustomerPhone] = useState<string>("");
  const [newCustomerAddress1, setNewCustomerAddress1] = useState<string>("");
  const [newCustomerAddress2, setNewCustomerAddress2] = useState<string>("");
  const [savingCustomer, setSavingCustomer] = useState<boolean>(false);

  // Tarikh & Tempoh
  const [issueDate, setIssueDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [termDays, setTermDays] = useState<number>(14);
  const [dueDate, setDueDate] = useState<string>("");

  // Kewangan & Nota
  const [deposit, setDeposit] = useState<number>(0);
  const [notes, setNotes] = useState<string>(
    "Sedap bagitahu kawan, Tak sedap bagitahu kami.🤙 Terima kasih atas urus niaga anda. Bayaran boleh dibuat memalui QR atau Bank Transfer",
  );

  // Item Invois
  const [items, setItems] = useState<InvoiceItemInput[]>([
    {
      description: "Nasi Ambeng",
      quantity: 10,
      unit_price: 12.0,
      amount: 120.0,
    },
  ]);

  // Status & Modal Penjanaan Invois
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdInvoiceUrl, setCreatedInvoiceUrl] = useState<string | null>(
    null,
  );
  const [createdInvoiceSlug, setCreatedInvoiceSlug] = useState<string | null>(
    null,
  );
  const [createdInvoiceToken, setCreatedInvoiceToken] = useState<string | null>(
    null,
  );
  const [copied, setCopied] = useState<boolean>(false);

  // Tutup dropdown apabila klik di luar kawasan
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Tarik No. Invois Terkini
  useEffect(() => {
    async function fetchNextInvoiceNumber() {
      const { data, error } = await supabase
        .from("invoices")
        .select("invoice_number")
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) {
        setInvoiceNumber("INV-WM-100001");
        return;
      }

      if (data && data.length > 0 && data[0].invoice_number) {
        const lastNumberStr = data[0].invoice_number.replace("INV-WM-", "");
        const lastNumber = parseInt(lastNumberStr, 10);
        setInvoiceNumber(
          !isNaN(lastNumber) ? `INV-WM-${lastNumber + 1}` : "INV-WM-100001",
        );
      } else {
        setInvoiceNumber("INV-WM-100001");
      }
    }
    fetchNextInvoiceNumber();
  }, []);

  // Auto-Kira Tarikh Akhir
  useEffect(() => {
    if (!issueDate) return;
    const date = new Date(issueDate);
    date.setDate(date.getDate() + Number(termDays));
    setDueDate(date.toISOString().split("T")[0]);
  }, [issueDate, termDays]);

  // Tarik Data Pelanggan
  const fetchCustomers = async () => {
    const { data, error } = await supabase
      .from("customers")
      .select("id, name, phone, address_1, address_2")
      .order("name");

    if (!error && data) {
      setCustomers(data);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Simpan Pelanggan Baharu
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim()) {
      alert("Sila masukkan nama pelanggan.");
      return;
    }

    setSavingCustomer(true);
    try {
      const { data, error } = await supabase
        .from("customers")
        .insert([
          {
            name: newCustomerName.trim(),
            phone: newCustomerPhone.trim() || null,
            address_1: newCustomerAddress1.trim() || null,
            address_2: newCustomerAddress2.trim() || null,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        await fetchCustomers();
        setSelectedCustomerId(data.id);
        setSelectedCustomerObj(data);
        setSearchCustomer(`${data.name} (${data.phone || "Tiada No"})`);

        // Reset borang modal
        setNewCustomerName("");
        setNewCustomerPhone("");
        setNewCustomerAddress1("");
        setNewCustomerAddress2("");
        setIsAddCustomerOpen(false);
      }
    } catch (err: unknown) {
      const error = err as Error;
      alert("Gagal menambah pelanggan: " + error.message);
    } finally {
      setSavingCustomer(false);
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchCustomer.toLowerCase()) ||
      (c.phone && c.phone.includes(searchCustomer)),
  );

  const handleItemChange = (
    index: number,
    field: keyof InvoiceItemInput,
    value: string | number,
  ) => {
    const updatedItems = [...items];
    const item = { ...updatedItems[index], [field]: value };
    if (field === "quantity" || field === "unit_price") {
      const q = field === "quantity" ? Number(value) : item.quantity;
      const p = field === "unit_price" ? Number(value) : item.unit_price;
      item.amount = q * p;
    }
    updatedItems[index] = item;
    setItems(updatedItems);
  };

  const addItemRow = () => {
    setItems([
      ...items,
      { description: "", quantity: 1, unit_price: 0, amount: 0 },
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const totalAmount = subtotal;
  const balanceDue = totalAmount - deposit;

  // Hantar Invois & Simpan Slug
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      setErrorMsg("Sila pilih pelanggan terlebih dahulu.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. Penjanaan Slug daripada Nombor Invois (ditukar ke huruf kecil)
      const slug = invoiceNumber.toLowerCase().trim();

      // 2. Simpan Rekod Invois ke Supabase
      const { data: invoiceData, error: invoiceError } = await supabase
        .from("invoices")
        .insert([
          {
            invoice_number: invoiceNumber,
            slug: slug,
            title: title,
            customer_id: selectedCustomerId,
            issue_date: issueDate,
            due_date: dueDate,
            subtotal: subtotal,
            total_amount: totalAmount,
            deposit_paid: deposit,
            status: balanceDue <= 0 ? "paid" : "unpaid",
            notes: notes,
          },
        ])
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // 3. Simpan Setiap Item Invois
      const itemsToInsert = items.map((item) => ({
        invoice_id: invoiceData.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        amount: item.amount,
      }));

      const { error: itemsError } = await supabase
        .from("invoice_items")
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      // 4. Bina Pautan Menggunakan Slug & Token Keselamatan (8 Aksara Pertama ID)
      const finalSlug = invoiceData.slug || slug;
      const token = invoiceData.id.slice(0, 8);
      const generatedLink = `${window.location.origin}/inv/${finalSlug}?token=${token}`;

      setCreatedInvoiceSlug(finalSlug);
      setCreatedInvoiceToken(token);
      setCreatedInvoiceUrl(generatedLink);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || "Gagal menyimpan invois.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendWhatsApp = () => {
    if (!createdInvoiceUrl) return;
    let rawPhone = selectedCustomerObj?.phone || "";
    rawPhone = rawPhone.replace(/\D/g, "");
    if (rawPhone.startsWith("0")) rawPhone = "60" + rawPhone.slice(1);

    const customerName = selectedCustomerObj?.name || "Pelanggan";
    const programTitle = title ? `\n📌 *Program/Tujuan:* ${title}` : "";

    const message = `Salam ${customerName},\n\nTerima kasih atas pesanan anda. Ini adalah invois bagi rujukan dan bayaran anda:${programTitle}\n\n🗒️ *No. Invois:* ${invoiceNumber}\n💰 *Jumlah:* RM ${totalAmount.toFixed(
      2,
    )}\n⏳ *Baki Perlu Dibayar:* RM ${balanceDue.toFixed(
      2,
    )}\n\nBoleh lihat butiran lanjut di pautan ini:\n${createdInvoiceUrl}\n\nTerima kasih! \n\nJika mahu membuat pembayaran melalui bank Transfer, saya sertakan detail bank di bawah:\n\nBank Islam Berhad\nKamaruzaman Bin Zainuddin\n12074010022447`;

    window.open(
      `https://wa.me/${rawPhone}?text=${encodeURIComponent(message)}`,
      "_blank",
    );
  };

  return (
    <main
      className="min-h-screen bg-cover bg-center bg-no-repeat p-4 sm:p-8 text-slate-800"
      style={{
        backgroundImage: "url('/dark_cook_bg.jpg')",
      }}
    >
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">
          Invois Baharu 👇
        </h1>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* TAJUK INVOIS */}
          <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-100">
            <label className="block text-sm font-bold text-slate-800 mb-1">
              Tajuk / Program / Majlis
            </label>
            <input
              type="text"
              placeholder="e.g. Katering Majlis Perkahwinan / Jamuan Hari Raya"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                No. Invois (Auto)
              </label>
              <input
                type="text"
                value={invoiceNumber}
                readOnly
                className="w-full p-2.5 border border-slate-200 bg-slate-100 text-slate-800 font-bold rounded-lg outline-none cursor-not-allowed"
              />
            </div>

            {/* Carian & Pilihan Pelanggan */}
            <div className="relative" ref={dropdownRef}>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-semibold text-slate-700">
                  Pelanggan
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddCustomerOpen(true)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 underline"
                >
                  + Tambah Pelanggan Baharu
                </button>
              </div>
              <input
                type="text"
                placeholder="Taip nama atau no. telefon..."
                value={searchCustomer}
                onFocus={() => setIsDropdownOpen(true)}
                onChange={(e) => {
                  setSearchCustomer(e.target.value);
                  setSelectedCustomerId("");
                  setSelectedCustomerObj(null);
                  setIsDropdownOpen(true);
                }}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
              />
              {isDropdownOpen && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                  {filteredCustomers.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-500">
                      Tiada pelanggan ditemui.
                    </div>
                  ) : (
                    filteredCustomers.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          setSelectedCustomerId(c.id);
                          setSelectedCustomerObj(c);
                          setSearchCustomer(
                            `${c.name} (${c.phone || "Tiada No"})`,
                          );
                          setIsDropdownOpen(false);
                        }}
                        className="p-2.5 hover:bg-blue-50 cursor-pointer text-sm border-b border-slate-100"
                      >
                        <p className="font-semibold text-slate-800">{c.name}</p>
                        <p className="text-xs text-slate-500">
                          {c.phone || "Tiada No. Telefon"}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Tarikh Invois
              </label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                required
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Tempoh
                </label>
                <select
                  value={termDays}
                  onChange={(e) => setTermDays(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
                >
                  <option value={7}>7 Hari</option>
                  <option value={14}>14 Hari</option>
                  <option value={30}>30 Hari</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Tarikh Akhir
                </label>
                <input
                  type="date"
                  value={dueDate}
                  readOnly
                  className="w-full p-2.5 border border-slate-200 bg-slate-100 text-slate-600 rounded-lg outline-none cursor-not-allowed font-medium text-sm"
                />
              </div>
            </div>
          </div>

          <hr className="my-6 border-slate-200" />

          {/* ITEM SECTION */}
          <div>
            <h2 className="text-lg font-bold text-slate-800 mb-3">
              Item / Barangan
            </h2>
            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="flex flex-col md:flex-row gap-3 items-end bg-slate-50 p-3 rounded-lg border border-slate-200"
                >
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      Item
                    </label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) =>
                        handleItemChange(index, "description", e.target.value)
                      }
                      required
                      className="w-full p-2 border border-slate-300 rounded text-sm outline-none"
                    />
                  </div>
                  <div className="w-full md:w-24">
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      Kuantiti
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(index, "quantity", e.target.value)
                      }
                      required
                      className="w-full p-2 border border-slate-300 rounded text-sm outline-none"
                    />
                  </div>
                  <div className="w-full md:w-32">
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      Harga Se Unit (RM)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) =>
                        handleItemChange(index, "unit_price", e.target.value)
                      }
                      required
                      className="w-full p-2 border border-slate-300 rounded text-sm outline-none"
                    />
                  </div>
                  <div className="w-full md:w-28 text-right py-2 font-bold text-slate-700">
                    RM {item.amount.toFixed(2)}
                  </div>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItemRow(index)}
                      className="p-2 text-red-500 text-sm font-semibold hover:underline"
                    >
                      Padam
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addItemRow}
              className="mt-3 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-semibold rounded-lg transition"
            >
              + Tambah Item
            </button>
          </div>

          <hr className="my-6 border-slate-200" />

          {/* DEPOSIT & NOTA */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-6">
            <div className="w-full md:w-1/2">
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Nota / Terma Bayaran
              </label>
              <textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm outline-none"
              />
            </div>
            <div className="w-full md:w-1/2 bg-slate-50 p-4 rounded-xl border border-slate-200 text-right space-y-3">
              <div className="flex justify-between text-slate-600 text-sm">
                <span>Subtotal:</span>
                <span>RM {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600 font-medium">
                  Deposit / Pendahuluan:
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={deposit}
                  onChange={(e) => setDeposit(Number(e.target.value))}
                  className="w-32 p-1.5 text-right border border-slate-300 rounded font-semibold"
                />
              </div>
              <div className="flex justify-between text-slate-900 font-bold text-base pt-2 border-t border-slate-300">
                <span>Jumlah Invois:</span>
                <span>RM {totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-blue-600 font-extrabold text-lg pt-1">
                <span>Baki Perlu Dibayar:</span>
                <span>RM {balanceDue.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition disabled:bg-slate-400 cursor-pointer"
          >
            {loading ? "Sedang Menyimpan..." : "Simpan Invois & Dapatkan Link"}
          </button>
        </form>
      </div>

      {/* MODAL POPUP: TAMBAH PELANGGAN BAHARU */}
      {isAddCustomerOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-slate-100">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                Tambah Pelanggan Baharu
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Isi maklumat pelanggan di bawah untuk disimpan ke dalam sistem.
              </p>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Pelanggan / Syarikat{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ahmad Albab / ABC Trading"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nombor Telefon
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 0123456789"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Alamat Baris 1
                </label>
                <input
                  type="text"
                  placeholder="Contoh: No. 12, Jalan Bunga Raya"
                  value={newCustomerAddress1}
                  onChange={(e) => setNewCustomerAddress1(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Alamat Baris 2
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Taman Merdeka, 42700 Banting, Selangor"
                  value={newCustomerAddress2}
                  onChange={(e) => setNewCustomerAddress2(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddCustomerOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingCustomer}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-2"
                >
                  {savingCustomer ? "Menyimpan..." : "Simpan Pelanggan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL POPUP: KEJAYAAN INVOIS */}
      {createdInvoiceUrl && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-center border border-slate-100">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
              ✓
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              Invois Berjaya Dicipta!
            </h3>
            <button
              onClick={handleSendWhatsApp}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>📲</span> Hantar ke WhatsApp
            </button>
            <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between border border-slate-200">
              <span className="text-xs text-slate-600 truncate mr-2">
                {createdInvoiceUrl}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(createdInvoiceUrl);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded transition"
              >
                {copied ? "Tersalin!" : "Salin Link"}
              </button>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  if (createdInvoiceSlug) {
                    router.push(
                      `/inv/${createdInvoiceSlug}?token=${createdInvoiceToken}`,
                    );
                  }
                }}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition"
              >
                Lihat Invois
              </button>
              <button
                onClick={() => setCreatedInvoiceUrl(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
