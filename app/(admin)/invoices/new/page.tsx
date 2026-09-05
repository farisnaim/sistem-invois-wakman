"use client";

import { useState } from "react";

interface InvoiceItemInput {
  isPackage: boolean; // Flag untuk mod pakej/per person
  description: string;
  quantity: number; // Bilangan Pax
  unit_price: number; // Harga Per Pax / Harga Unit
  amount: number;
}

export default function NewInvoicePage() {
  const [items, setItems] = useState<InvoiceItemInput[]>([
    {
      isPackage: true,
      description: "Pakej Nasi + Ayam Panggang + Sayur Campur + Air Sirap",
      quantity: 50, // 50 Pax
      unit_price: 12.0, // RM 12 / pax
      amount: 600.0,
    },
  ]);

  const handleItemChange = (
    index: number,
    field: keyof InvoiceItemInput,
    value: any,
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
      {
        isPackage: false,
        description: "",
        quantity: 1,
        unit_price: 0,
        amount: 0,
      },
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-slate-800">
          Item / Senarai Pakej
        </h2>
        <button
          type="button"
          onClick={addItemRow}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition"
        >
          + Tambah Item
        </button>
      </div>

      <div className="space-y-4">
        {items.map((item, index) => (
          <div
            key={index}
            className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3"
          >
            {/* TOGGLE MOD: ITEM BIASA / PAKEJ PER PERSON */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                Item #{index + 1}
              </span>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                <input
                  type="checkbox"
                  checked={item.isPackage}
                  onChange={(e) =>
                    handleItemChange(index, "isPackage", e.target.checked)
                  }
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                Kira mengikut Pakej / Per Person (Pax)
              </label>
            </div>

            <div className="flex flex-col md:flex-row gap-3 items-start">
              {/* PETAK PENERANGAN MENU */}
              <div className="flex-1 w-full">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {item.isPackage
                    ? "Senarai Menu / Lauk Pakej"
                    : "Penerangan Item"}
                </label>
                {item.isPackage ? (
                  <textarea
                    rows={2}
                    placeholder="Contoh: Nasi Putih, Ayam Panggang, Sayur Campur, Air Sirap"
                    value={item.description}
                    onChange={(e) =>
                      handleItemChange(index, "description", e.target.value)
                    }
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                ) : (
                  <input
                    type="text"
                    placeholder="Contoh: Ayam Panggang Seekor"
                    value={item.description}
                    onChange={(e) =>
                      handleItemChange(index, "description", e.target.value)
                    }
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                )}
              </div>

              {/* KUANTITI / BILANGAN PAX */}
              <div className="w-full md:w-32">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {item.isPackage ? "Bilangan Pax" : "Kuantiti"}
                </label>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) =>
                    handleItemChange(index, "quantity", e.target.value)
                  }
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-800 outline-none"
                />
              </div>

              {/* HARGA UNIT / HARGA PER PAX */}
              <div className="w-full md:w-36">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {item.isPackage ? "Harga / Pax (RM)" : "Harga Unit (RM)"}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={item.unit_price}
                  onChange={(e) =>
                    handleItemChange(index, "unit_price", e.target.value)
                  }
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-800 outline-none"
                />
              </div>

              {/* JUMLAH KIRAAN */}
              <div className="w-full md:w-32 text-right pt-2 md:pt-6">
                <span className="block text-[10px] text-slate-400 font-bold uppercase">
                  Jumlah
                </span>
                <span className="text-base font-black text-slate-900">
                  RM {item.amount.toFixed(2)}
                </span>
              </div>

              {/* BUTANG PADAM */}
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItemRow(index)}
                  className="pt-2 md:pt-6 text-xs font-bold text-rose-500 hover:underline shrink-0"
                >
                  Padam
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
