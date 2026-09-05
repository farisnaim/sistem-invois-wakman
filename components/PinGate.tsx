"use client";

import { useState, useEffect } from "react";

// Tentukan 6-digit PIN anda di sini
const CORRECT_PIN = "123456";

export default function PinGate({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [pin, setPin] = useState<string>("");
  const [error, setError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Semak status akses terdahulu dari LocalStorage
  useEffect(() => {
    const authStatus = localStorage.getItem("wm_app_auth");
    if (authStatus === "true") {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ""); // Hanya benarkan nombor
    if (value.length <= 6) {
      setPin(value);
      setError(false);

      // Semak automatik sebaik sahaja 6 digit dimasukkan
      if (value.length === 6) {
        if (value === CORRECT_PIN) {
          localStorage.setItem("wm_app_auth", "true");
          setIsAuthenticated(true);
        } else {
          setError(true);
          setTimeout(() => setPin(""), 400); // Reset pin jika salah
        }
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 text-xs font-semibold">
        Memuatkan...
      </div>
    );
  }

  // Jika belum disahkan, paparkan Pop-up PIN Modal
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-sm w-full p-8 shadow-2xl text-center border border-slate-100 space-y-6">
          {/* Ikon & Ucapan */}
          <div className="space-y-2">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto text-2xl shadow-inner">
              🔒
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Hai Assalamualaikum
              <br />
              Wak Man & Family
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Sila Masukkan 6 digit kata laluan di bawah
            </p>
          </div>

          {/* Kotak Input PIN */}
          <div className="relative max-w-[240px] mx-auto">
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={handlePinChange}
              autoFocus
              className="w-full text-center text-3xl font-black tracking-[0.6em] py-3.5 px-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-blue-600 focus:bg-white focus:outline-none transition-all text-slate-800"
            />
          </div>

          {/* Indikator Titik (Dot Display) */}
          <div className="flex justify-center gap-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                  i < pin.length
                    ? error
                      ? "bg-rose-500 scale-110"
                      : "bg-blue-600 scale-110"
                    : "bg-slate-200"
                }`}
              />
            ))}
          </div>

          {/* Mesej Ralat */}
          {error && (
            <p className="text-xs font-bold text-rose-500 animate-bounce">
              Kata laluan salah! Sila cuba lagi.
            </p>
          )}
        </div>
      </div>
    );
  }

  // Jika PIN betul, paparkan keseluruhan sistem
  return <>{children}</>;
}
