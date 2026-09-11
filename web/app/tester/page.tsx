"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function TesterPage() {
  const [status, setStatus] = useState<"loading" | "enabled" | "disabled">("loading");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const mode = localStorage.getItem("TESTER_MODE");
      
      setTimeout(() => {
        if (mode === "true") {
          setStatus("enabled");
        } else {
          localStorage.setItem("TESTER_MODE", "true");
          setStatus("enabled");
        }
      }, 0);
    }
  }, []);

  const disableTesterMode = () => {
    localStorage.removeItem("TESTER_MODE");
    setStatus("disabled");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 text-center flex-col gap-6 bg-[var(--background)] text-[var(--text-primary)]">
      <div className="max-w-md p-8 rounded-2xl border border-[var(--border)] shadow-xl bg-[var(--surface)]">
        <h1 className="text-3xl font-bold mb-4">Tester Rejimi</h1>
        
        {status === "loading" ? (
          <p>Yüklənir...</p>
        ) : status === "enabled" ? (
          <>
            <div className="bg-green-100 text-green-800 p-4 rounded-lg mb-6">
              <p className="font-semibold">Tester rejimi aktivləşdirildi! 🎉</p>
              <p className="text-sm mt-2 opacity-80">
                Siz artıq bütün səhifələrdə sağ alt küncdəki &quot;Test Report&quot; düyməsi ilə qarşılaşdığınız problemləri qeyd edə bilərsiniz.
              </p>
            </div>

            
            <div className="flex flex-col gap-3">
              <Link 
                href="/"
                className="w-full block bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors"
              >
                Əsas Səhifəyə Keç
              </Link>
              
              <button 
                onClick={disableTesterMode}
                className="text-sm text-red-500 hover:text-red-700 underline mt-4"
              >
                Rejimi ləğv et
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="bg-yellow-100 text-yellow-800 p-4 rounded-lg mb-6">
              <p className="font-semibold">Tester rejimi ləğv edildi.</p>
            </div>
            <Link 
              href="/"
              className="w-full block bg-[var(--border)] hover:bg-gray-300 dark:hover:bg-gray-600 font-medium py-3 rounded-xl transition-colors"
            >
              Əsas Səhifəyə Keç
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
