"use client";

import React, { useState, useEffect } from "react";
import { Edit2, Save, X, Loader2, Database, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SheetRow {
  rowIndex: number;
  tanggal: string;
  nama_pengirim: string;
  nama_pt: string;
  penerima: string;
  total_harga: string;
  link_storage?: string;
}

export default function ArchivePage() {
  const [data, setData] = useState<SheetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<SheetRow>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  useEffect(() => {
    fetchData();

    // Poll every 5 seconds for real-time updates from Google Sheets
    const interval = setInterval(() => {
      fetchData(true);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const fetchData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const res = await fetch("/api/sheets");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to fetch data");
      setData(json.data || []);
      if (!isBackground) setError(null);
    } catch (err: any) {
      if (!isBackground) setError(err.message);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const handleEditClick = (row: SheetRow) => {
    setEditingRow(row.rowIndex);
    setEditForm({ ...row });
  };

  const cancelEdit = () => {
    setEditingRow(null);
    setEditForm({});
  };

  const handleSave = async (rowIndex: number) => {
    setSaving(true);
    try {
      const res = await fetch("/api/sheets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update row");

      // Update local state
      setData(data.map(d => d.rowIndex === rowIndex ? { ...d, ...editForm } as SheetRow : d));
      setEditingRow(null);
    } catch (err: any) {
      alert("Error saving: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-800 flex items-center gap-3">
          <Database className="text-red-700" size={32} />
          Document Archive
        </h1>
        <p className="text-slate-500 mt-2">View and manage documents synced to your Google Sheets database.</p>
      </div>

      <div className="flex gap-6 items-start h-[70vh]">
        {/* Table Area */}
        <motion.div
          layout
          className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col ${selectedFile ? 'w-1/2' : 'w-full'}`}
          transition={{ type: "spring", bounce: 0, duration: 0.4 }}
        >
          {loading ? (
            <div className="p-12 flex justify-center items-center">
              <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-600">
              Error loading data: {error}
            </div>
          ) : data.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              No records found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
                    <th className="p-4 font-semibold">Row #</th>
                    <th className="p-4 font-semibold">Date</th>
                    <th className="p-4 font-semibold">Sender Name</th>
                    <th className="p-4 font-semibold">Company Name</th>
                    <th className="p-4 font-semibold">Recipient</th>
                    <th className="p-4 font-semibold">Total Price</th>
                    <th className="p-4 font-semibold">Link Storage</th>
                    <th className="p-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.map((row) => {
                    const isEditing = editingRow === row.rowIndex;
                    return (
                      <motion.tr
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        key={row.rowIndex}
                        className="hover:bg-slate-50 transition-colors group"
                      >
                        <td className="p-4 text-sm text-slate-500">#{row.rowIndex}</td>
                        <td className="p-4">
                          {isEditing ? (
                            <input
                              value={editForm.tanggal || ""}
                              onChange={e => setEditForm({ ...editForm, tanggal: e.target.value })}
                              className="border border-slate-300 rounded px-2 py-1 w-full text-sm"
                            />
                          ) : (
                            <span className="text-slate-800">{row.tanggal || "-"}</span>
                          )}
                        </td>
                        <td className="p-4">
                          {isEditing ? (
                            <input
                              value={editForm.nama_pengirim || ""}
                              onChange={e => setEditForm({ ...editForm, nama_pengirim: e.target.value })}
                              className="border border-slate-300 rounded px-2 py-1 w-full text-sm"
                            />
                          ) : (
                            <span className="text-slate-800">{row.nama_pengirim || "-"}</span>
                          )}
                        </td>
                        <td className="p-4">
                          {isEditing ? (
                            <input
                              value={editForm.nama_pt || ""}
                              onChange={e => setEditForm({ ...editForm, nama_pt: e.target.value })}
                              className="border border-slate-300 rounded px-2 py-1 w-full text-sm"
                            />
                          ) : (
                            <span className="text-slate-800">{row.nama_pt || "-"}</span>
                          )}
                        </td>
                        <td className="p-4">
                          {isEditing ? (
                            <input
                              value={editForm.penerima || ""}
                              onChange={e => setEditForm({ ...editForm, penerima: e.target.value })}
                              className="border border-slate-300 rounded px-2 py-1 w-full text-sm"
                            />
                          ) : (
                            <span className="text-slate-800">{row.penerima || "-"}</span>
                          )}
                        </td>
                        <td className="p-4">
                          {isEditing ? (
                            <input
                              value={editForm.total_harga || ""}
                              onChange={e => setEditForm({ ...editForm, total_harga: e.target.value })}
                              className="border border-slate-300 rounded px-2 py-1 w-full text-sm"
                            />
                          ) : (
                            <span className="text-slate-800 font-medium">{row.total_harga || "-"}</span>
                          )}
                        </td>
                        <td className="p-4">
                          {isEditing ? (
                            <input
                              value={editForm.link_storage || ""}
                              onChange={e => setEditForm({ ...editForm, link_storage: e.target.value })}
                              className="border border-slate-300 rounded px-2 py-1 w-full text-sm"
                              placeholder="https://..."
                            />
                          ) : (
                            row.link_storage ? (
                              <button
                                onClick={() => setSelectedFile(row.link_storage!)}
                                className="text-red-600 hover:text-red-800 flex items-center gap-1 text-sm truncate max-w-[150px] transition-colors bg-red-50 hover:bg-red-100 px-2 py-1 rounded"
                                title={row.link_storage}
                              >
                                <Eye className="w-3.5 h-3.5" /> View File
                              </button>
                            ) : (
                              <span className="text-slate-400 text-sm">-</span>
                            )
                          )}
                        </td>
                        <td className="p-4 text-right">
                          {isEditing ? (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleSave(row.rowIndex)}
                                disabled={saving}
                                className="p-1.5 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100 disabled:opacity-50"
                              >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="p-1.5 bg-slate-100 text-slate-600 rounded hover:bg-slate-200"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleEditClick(row)}
                              className="p-1.5 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Preview Panel */}
        <AnimatePresence>
          {selectedFile && (
            <motion.div
              initial={{ opacity: 0, width: 0, x: 20 }}
              animate={{ opacity: 1, width: '50%', x: 0 }}
              exit={{ opacity: 0, width: 0, x: 20 }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full shrink-0"
            >
              <div className="flex justify-between items-center px-4 py-3 border-b border-slate-200 bg-slate-50 shrink-0">
                <h3 className="font-semibold text-slate-700 text-sm flex items-center gap-2">
                  <Eye className="w-4 h-4 text-red-600" />
                  Document Preview
                </h3>
                <div className="flex gap-2">
                  <a href={selectedFile} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-slate-200 rounded text-slate-500 hover:text-red-600 transition-colors" title="Open in new tab">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-external-link"><path d="M15 3h6v6" /><path d="10 14L21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></svg>
                  </a>
                  <button onClick={() => setSelectedFile(null)} className="p-1.5 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800 transition-colors" title="Close preview">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex-1 w-full bg-slate-100 flex items-center justify-center p-2 relative">
                <iframe
                  src={selectedFile}
                  className="w-full h-full border-none rounded-xl bg-white shadow-inner absolute inset-0"
                  title="Document Preview"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
