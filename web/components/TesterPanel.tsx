"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function TesterPanel() {
  const [isTesterMode, setIsTesterMode] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  
  const pathname = usePathname();

  useEffect(() => {
    // Check if tester mode is enabled in local storage
    if (typeof window !== "undefined") {
      const mode = localStorage.getItem("TESTER_MODE");
      setTimeout(() => {
        setIsTesterMode(mode === "true");
      }, 0);
    }
  }, []);

  if (!isTesterMode) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);
    
    try {
      // Gather context
      const attemptId = localStorage.getItem("current_attempt_id") || null; // fallback or current logic
      
      // Basic capture of localStorage state for context
      const storageDump = { ...localStorage };
      
      const payload = {
        route: pathname,
        description,
        device_id: localStorage.getItem("device_id"),
        attempt_id: attemptId,
        metadata: {
          userAgent: window.navigator.userAgent,
          screenWidth: window.innerWidth,
          screenHeight: window.innerHeight,
          storage: storageDump,
          // Could add JS errors or other state here
        }
      };

      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setFeedback("Report submitted successfully.");
        setDescription("");
        setTimeout(() => setIsOpen(false), 2000);
      } else {
        setFeedback("Failed to submit report.");
      }
    } catch (err) {
      console.error(err);
      setFeedback("An error occurred while submitting.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 bg-red-600 text-white rounded-full p-3 shadow-lg hover:bg-red-700 transition-colors"
        title="Problemi qeyd et"
      >
        🐞 Test Report
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-[var(--surface)] text-[var(--text-primary)] w-full max-w-md rounded-xl shadow-2xl overflow-hidden flex flex-col border border-[var(--border)]">
            <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
              <h3 className="font-bold text-lg">Problemi qeyd et</h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
              <p className="text-sm opacity-80">
                Aşkar etdiyiniz problemi ətraflı izah edin. Cari səhifə, istifadəçi məlumatları və arxa plan vəziyyəti avtomatik olaraq rapora əlavə ediləcək.
              </p>
              
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full h-32 p-3 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--text-primary)] resize-none outline-none focus:border-red-500 transition-colors"
                placeholder="Problem nədir? Nə işləmir?"
                required
              />
              
              {feedback && (
                <div className={`p-2 rounded text-sm ${feedback.includes("success") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                  {feedback}
                </div>
              )}
              
              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[var(--border)] hover:bg-[var(--background-hover)] transition-colors"
                >
                  Ləğv et
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !description.trim()}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? "Göndərilir..." : "Göndər"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
