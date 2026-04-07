"use client";

import React, { useState, useEffect } from "react";
import { Edit2, Save, X, Loader2, Database, Eye, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface SheetRow {
  rowIndex: number;
  nomor_invoice: string;
  tanggal: string;
  tanggal_jatuh_tempo: string;
  nama_pengirim: string;
  nama_pt: string;
  penerima: string;
  mata_uang: string;
  total_harga: string;
  pajak: string;
  deskripsi: string;
  metode_pembayaran: string;
  link_storage?: string;
}

export default function ArchivePage() {
  const { t } = useLanguage();
  const [data, setData] = useState<SheetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<SheetRow>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = data.filter((row) => {
    const query = searchQuery.toLowerCase();
    return (
      row.nomor_invoice.toLowerCase().includes(query) ||
      row.nama_pengirim.toLowerCase().includes(query) ||
      row.nama_pt.toLowerCase().includes(query) ||
      row.penerima.toLowerCase().includes(query) ||
      row.deskripsi.toLowerCase().includes(query) ||
      row.metode_pembayaran.toLowerCase().includes(query)
    );
  });

  useEffect(() => {
    fetchData();

    // Poll every 10 seconds for real-time updates from Google Sheets
    const interval = setInterval(() => {
      fetchData(true);
    }, 10000);

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
          {t('archive_title')}
        </h1>
        <p className="text-slate-500 mt-2">{t('archive_desc')}</p>
      </div>

      <div className="mb-6 relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-slate-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm transition-all shadow-sm"
          placeholder={t('search_placeholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
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
          ) : filteredData.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              {searchQuery ? t('no_results') : "No records found."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs text-left align-top">
                    <th className="p-2 font-semibold whitespace-nowrap">{t('row_num')}</th>
                    <th className="p-2 font-semibold">{t('nomor_invoice')}</th>
                    <th className="p-2 font-semibold whitespace-nowrap">{t('tanggal')}</th>
                    <th className="p-2 font-semibold whitespace-nowrap">{t('tanggal_jatuh_tempo')}</th>
                    <th className="p-2 font-semibold">{t('nama_pengirim')}</th>
                    <th className="p-2 font-semibold hidden lg:table-cell">{t('nama_pt')}</th>
                    <th className="p-2 font-semibold">{t('penerima')}</th>
                    <th className="p-2 font-semibold whitespace-nowrap">{t('mata_uang')}</th>
                    <th className="p-2 font-semibold whitespace-nowrap">{t('total_harga')}</th>
                    <th className="p-2 font-semibold whitespace-nowrap">{t('pajak')}</th>
                    <th className="p-2 font-semibold max-w-[200px]">{t('deskripsi')}</th>
                    <th className="p-2 font-semibold">{t('metode_pembayaran')}</th>
                    <th className="p-2 font-semibold">{t('storage')}</th>
                    <th className="p-2 font-semibold text-right bg-slate-50 sticky right-0 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] z-10 whitespace-nowrap">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredData.map((row) => {
                    const isEditing = editingRow === row.rowIndex;
                    return (
                      <motion.tr
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        key={row.rowIndex}
                        className="hover:bg-slate-50 transition-colors group"
                      >
                        <td className="p-2 text-xs text-slate-500 align-top">#{row.rowIndex}</td>
                        <td className="p-2 align-top">
                          {isEditing ? (
                            <input value={editForm.nomor_invoice || ""} onChange={e => setEditForm({ ...editForm, nomor_invoice: e.target.value })} className="border border-slate-300 rounded px-1 w-full text-xs" />
                          ) : (<span className="text-slate-800 break-words text-xs">{row.nomor_invoice || "-"}</span>)}
                        </td>
                        <td className="p-2 whitespace-nowrap align-top">
                          {isEditing ? (
                            <input value={editForm.tanggal || ""} onChange={e => setEditForm({ ...editForm, tanggal: e.target.value })} className="border border-slate-300 rounded px-1 w-[80px] text-xs" />
                          ) : (<span className="text-slate-800 text-xs">{row.tanggal || "-"}</span>)}
                        </td>
                        <td className="p-2 whitespace-nowrap align-top">
                          {isEditing ? (
                            <input value={editForm.tanggal_jatuh_tempo || ""} onChange={e => setEditForm({ ...editForm, tanggal_jatuh_tempo: e.target.value })} className="border border-slate-300 rounded px-1 w-[80px] text-xs" />
                          ) : (<span className="text-slate-800 text-xs">{row.tanggal_jatuh_tempo || "-"}</span>)}
                        </td>
                        <td className="p-2 max-w-[140px] align-top">
                          {isEditing ? (
                            <textarea value={editForm.nama_pengirim || ""} onChange={e => setEditForm({ ...editForm, nama_pengirim: e.target.value })} className="border border-slate-300 rounded px-1 w-full text-xs h-[40px]" />
                          ) : (<div className="text-slate-800 break-words line-clamp-3 text-xs" title={row.nama_pengirim}>{row.nama_pengirim || "-"}</div>)}
                        </td>
                        <td className="p-2 hidden lg:table-cell max-w-[140px] align-top">
                          {isEditing ? (
                            <textarea value={editForm.nama_pt || ""} onChange={e => setEditForm({ ...editForm, nama_pt: e.target.value })} className="border border-slate-300 rounded px-1 w-full text-xs h-[40px]" />
                          ) : (<div className="text-slate-800 break-words line-clamp-3 text-xs" title={row.nama_pt}>{row.nama_pt || "-"}</div>)}
                        </td>
                        <td className="p-2 max-w-[140px] align-top">
                          {isEditing ? (
                            <textarea value={editForm.penerima || ""} onChange={e => setEditForm({ ...editForm, penerima: e.target.value })} className="border border-slate-300 rounded px-1 w-full text-xs h-[40px]" />
                          ) : (<div className="text-slate-800 break-words line-clamp-3 text-xs" title={row.penerima}>{row.penerima || "-"}</div>)}
                        </td>
                        <td className="p-2 whitespace-nowrap align-top">
                          {isEditing ? (
                            <input value={editForm.mata_uang || ""} onChange={e => setEditForm({ ...editForm, mata_uang: e.target.value })} className="border border-slate-300 rounded px-1 w-[60px] text-xs" />
                          ) : (<span className="text-slate-800 text-xs">{row.mata_uang || "-"}</span>)}
                        </td>
                        <td className="p-2 whitespace-nowrap align-top">
                          {isEditing ? (
                            <input value={editForm.total_harga || ""} onChange={e => setEditForm({ ...editForm, total_harga: e.target.value })} className="border border-slate-300 rounded px-1 w-[80px] text-xs" />
                          ) : (<span className="text-slate-800 font-medium text-xs">{row.total_harga || "-"}</span>)}
                        </td>
                        <td className="p-2 whitespace-nowrap align-top">
                          {isEditing ? (
                            <input value={editForm.pajak || ""} onChange={e => setEditForm({ ...editForm, pajak: e.target.value })} className="border border-slate-300 rounded px-1 w-[60px] text-xs" />
                          ) : (<span className="text-slate-800 text-xs">{row.pajak || "-"}</span>)}
                        </td>
                        <td className="p-2 max-w-[200px] align-top">
                          {isEditing ? (
                            <textarea value={editForm.deskripsi || ""} onChange={e => setEditForm({ ...editForm, deskripsi: e.target.value })} className="border border-slate-300 rounded px-1 w-full text-xs min-h-[60px]" />
                          ) : (<div className="text-slate-800 text-[11px] whitespace-pre-wrap leading-tight line-clamp-4 overflow-y-auto max-h-[80px]" title={row.deskripsi}>{row.deskripsi || "-"}</div>)}
                        </td>
                        <td className="p-2 max-w-[100px] align-top">
                          {isEditing ? (
                            <input value={editForm.metode_pembayaran || ""} onChange={e => setEditForm({ ...editForm, metode_pembayaran: e.target.value })} className="border border-slate-300 rounded px-1 w-[80px] text-xs" />
                          ) : (<div className="text-slate-800 break-words line-clamp-2 text-xs" title={row.metode_pembayaran}>{row.metode_pembayaran || "-"}</div>)}
                        </td>
                        <td className="p-2 whitespace-nowrap align-top">
                          {isEditing ? (
                            <input
                              value={editForm.link_storage || ""}
                              onChange={e => setEditForm({ ...editForm, link_storage: e.target.value })}
                              className="border border-slate-300 rounded px-1 w-[100px] text-xs"
                              placeholder="https://..."
                            />
                          ) : (
                            row.link_storage ? (
                              <button
                                onClick={() => setSelectedFile(row.link_storage!)}
                                className="text-red-600 hover:text-red-800 flex items-center gap-1 text-[11px] truncate max-w-[70px] transition-colors bg-red-50 hover:bg-red-100 px-1.5 py-0.5 rounded cursor-pointer"
                                title={row.link_storage}
                              >
                                <Eye className="w-3 h-3" /> {t('view')}
                              </button>
                            ) : (
                              <span className="text-slate-400 text-xs">-</span>
                            )
                          )}
                        </td>
                        <td className="p-2 text-right bg-white sticky right-0 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] group-hover:bg-slate-50 transition-colors z-10 whitespace-nowrap align-top">
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
