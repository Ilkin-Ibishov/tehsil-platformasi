"use client";

import { useEffect, useState } from "react";
import type { AppConfigItem } from "@/lib/admin/types";

export default function AdminConfigPage() {
  const [configs, setConfigs] = useState<AppConfigItem[]>([]);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/config");
      const json = await res.json();
      if (json.ok) {
        setConfigs(json.data.configs);
        setAvailableModels(json.data.availableModels);
      }
    } catch (err) {
      console.error("Konfiqurasiya yüklənə bilmədi:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleSave = async (key: string, value: string) => {
    try {
      setSavingKey(key);
      setStatusMessage(null);
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      const json = await res.json();
      if (json.ok) {
        setStatusMessage(`"${key}" parametri uğurla yadda saxlanıldı.`);
        setConfigs((prev) =>
          prev.map((c) => (c.key === key ? { ...c, value, updatedAt: new Date().toISOString() } : c))
        );
      } else {
        setStatusMessage(`Xəta: ${json.error}`);
      }
    } catch (err) {
      console.error(err);
      setStatusMessage("Şəbəkə xətası baş verdi.");
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-12 max-w-4xl">
      {/* Başlıq */}
      <div className="bg-[var(--sur)] p-6 rounded-2xl border border-[var(--bor)] flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <span>⚙️ Runtime Konfiqurasiya və Model İdarəetməsi</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[var(--accsoft)] text-[var(--acc)] font-mono">
              public.app_config
            </span>
          </h2>
          <p className="text-sm text-[var(--t2)] mt-1">
            Redeploy etmədən aktiv LLM modellərini və kaskad qatlarını idarə edin (ADR-023).
          </p>
        </div>
        <button
          onClick={fetchConfigs}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-[var(--bg)] border border-[var(--bor)] hover:border-[var(--acc)] text-xs font-medium transition-all"
        >
          {loading ? "Yenilənir..." : "🔄 Yenilə"}
        </button>
      </div>

      {statusMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
          {statusMessage}
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-sm text-[var(--t3)]">Konfiqurasiya parametrləri yüklənir...</div>
      ) : (
        <div className="flex flex-col gap-4">
          {configs.map((config) => {
            const isModelKey = config.key.includes("model");
            const isBoolKey = config.key.includes("enabled") || config.key.includes("strict");

            return (
              <div
                key={config.key}
                className="p-5 rounded-2xl bg-[var(--sur)] border border-[var(--bor)] flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-[var(--t1)]">{config.key}</span>
                    <span className="text-[10px] text-[var(--t3)] font-mono">
                      (Yeniləndi: {new Date(config.updatedAt).toLocaleDateString()})
                    </span>
                  </div>
                  <p className="text-xs text-[var(--t2)] mt-1 leading-relaxed">{config.description}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {isModelKey ? (
                    <select
                      value={config.value}
                      onChange={(e) => handleSave(config.key, e.target.value)}
                      disabled={savingKey === config.key}
                      className="px-3 py-2 rounded-xl bg-[var(--bg)] border border-[var(--bor)] text-xs font-mono text-[var(--t1)] focus:outline-none focus:border-[var(--acc)]"
                    >
                      {config.key === "active_transcribe_model" && (
                        <option value="">(Defolt: active_model-i işlət)</option>
                      )}
                      {availableModels.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  ) : isBoolKey ? (
                    <select
                      value={config.value}
                      onChange={(e) => handleSave(config.key, e.target.value)}
                      disabled={savingKey === config.key}
                      className="px-3 py-2 rounded-xl bg-[var(--bg)] border border-[var(--bor)] text-xs font-mono text-[var(--t1)] focus:outline-none focus:border-[var(--acc)]"
                    >
                      <option value="1">Aktiv (1)</option>
                      <option value="0">Sönük (0)</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      defaultValue={config.value}
                      onBlur={(e) => {
                        if (e.target.value !== config.value) {
                          handleSave(config.key, e.target.value);
                        }
                      }}
                      className="px-3 py-2 rounded-xl bg-[var(--bg)] border border-[var(--bor)] text-xs font-mono text-[var(--t1)] focus:outline-none focus:border-[var(--acc)] w-48"
                    />
                  )}

                  {savingKey === config.key && (
                    <span className="text-xs text-sky-400 animate-pulse font-mono">Saxlanılır...</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
