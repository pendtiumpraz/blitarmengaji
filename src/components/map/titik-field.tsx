"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { MapPin, Plus, X } from "lucide-react";
import { toastSuccess, toastError } from "@/lib/swal";

const QuickMap = dynamic(() => import("./titik-quick-map").then((m) => m.TitikQuickMap), {
  ssr: false,
  loading: () => <div className="h-48 animate-pulse rounded-sm border border-line bg-brand-50" />,
});

type Opt = { id: string; name: string };

/**
 * Pilih lokasi = dropdown titik dakwah + "Titik baru" (mini-peta) yang membuat
 * titik baru via /api/titik/quick lalu otomatis terpilih. Titik baru langsung muncul di /peta.
 * <select name> ikut ter-submit pada form induk (tanpa nested form — pembuatan via fetch).
 */
export function TitikField({
  name = "titikDakwahId",
  options,
  defaultValue = "",
  required,
  label = "Titik Dakwah / Lokasi",
}: {
  name?: string;
  options: Opt[];
  defaultValue?: string;
  required?: boolean;
  label?: string;
}) {
  const [opts, setOpts] = useState<Opt[]>(options);
  const [value, setValue] = useState(defaultValue);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (newName.trim().length < 2) return toastError("Nama titik minimal 2 karakter.");
    if (!coords) return toastError("Klik lokasi di peta dulu.");
    setSaving(true);
    try {
      const res = await fetch("/api/titik/quick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), latitude: coords[0], longitude: coords[1] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menambah titik.");
      setOpts((o) => [...o, { id: data.id, name: data.name }]);
      setValue(data.id);
      setAdding(false);
      setNewName("");
      setCoords(null);
      toastSuccess("Titik baru ditambahkan & muncul di peta.");
    } catch (e) {
      toastError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <span className="mb-1 block text-xs font-bold text-muted">{label}</span>
      <div className="flex gap-2">
        <select
          name={name}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          required={required}
          className="h-10 w-full rounded-sm border border-line bg-cream px-3 text-sm text-ink focus:border-brand-600 focus:outline-none"
        >
          <option value="">— pilih titik / lokasi —</option>
          {opts.map((o) => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setAdding((a) => !a)}
          className="inline-flex shrink-0 items-center gap-1 rounded-sm border border-line px-3 text-xs font-bold text-brand-700 hover:bg-brand-50"
        >
          {adding ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {adding ? "Tutup" : "Titik baru"}
        </button>
      </div>

      {adding ? (
        <div className="mt-2 space-y-2 rounded-sm border border-dashed border-line bg-surface p-3">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nama lokasi (mis. Rumah Pak Budi, Garum)"
            className="h-10 w-full rounded-sm border border-line bg-cream px-3 text-sm focus:border-brand-600 focus:outline-none"
          />
          <QuickMap onPick={(la, ln) => setCoords([la, ln])} />
          <p className="flex items-center gap-1 text-[11px] text-muted">
            <MapPin className="h-3.5 w-3.5" />
            {coords ? `${coords[0].toFixed(5)}, ${coords[1].toFixed(5)} — klik peta untuk ubah` : "Klik di peta untuk menandai lokasi."}
          </p>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="rounded-sm bg-brand-600 px-4 py-2 text-xs font-bold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {saving ? "Menyimpan…" : "Simpan titik baru"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
