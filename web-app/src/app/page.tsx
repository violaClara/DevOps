"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== "application/pdf") {
        setError("Please upload a PDF file.");
        return;
      }
      setFile(selectedFile);
      setError(null);
      setExtractedData(null);
      setSuccess(null);
    }
  };

  const handleProcess = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to process PDF.");
      }

      setExtractedData(data.data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveToSheets = async () => {
    if (!extractedData) return;

    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/sheets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(extractedData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save to Google Sheets.");
      }

      setSuccess("Successfully saved to Google Sheets!");
      
      // Reset form on complete success
      setTimeout(() => {
        setFile(null);
        setExtractedData(null);
        setSuccess(null);
      }, 3000);

    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      {/* Background blobs for modern aesthetics */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/20 blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full"
      >
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent mb-4">
            PDF Invoice OCR
          </h1>
          <p className="text-slate-400 text-lg">
            Upload your PDF invoice, extract data using Vision AI, and sync to Google Sheets magically.
          </p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <AnimatePresence mode="wait">
            {!extractedData ? (
              <motion.div
                key="upload"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-6"
              >
                {/* Drag Drop Area */}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300
                    ${file ? "border-blue-500 bg-blue-500/10" : "border-slate-700 hover:border-slate-500 hover:bg-slate-800/50"}
                  `}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf"
                    className="hidden"
                  />
                  
                  {file ? (
                    <motion.div 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="flex flex-col items-center space-y-3"
                    >
                      <FileText className="w-12 h-12 text-blue-400" />
                      <div>
                        <p className="font-semibold text-slate-200">{file.name}</p>
                        <p className="text-sm text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="flex flex-col items-center space-y-3">
                      <div className="p-4 bg-slate-800 rounded-full mb-2">
                        <UploadCloud className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="font-medium text-slate-300">Click to upload or drag and drop</p>
                      <p className="text-sm text-slate-500">PDF documents only</p>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="flex items-center space-x-2 text-rose-400 bg-rose-400/10 p-4 rounded-xl">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm">{error}</p>
                  </div>
                )}

                <button
                  onClick={handleProcess}
                  disabled={!file || isUploading}
                  className={`w-full py-4 rounded-xl font-semibold text-white transition-all shadow-lg
                    ${!file || isUploading 
                      ? "bg-slate-800 cursor-not-allowed text-slate-400" 
                      : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/25 tooltip-hover hover:scale-[1.02] active:scale-[0.98]"
                    }
                  `}
                >
                  {isUploading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Extracting with AI...</span>
                    </div>
                  ) : (
                    "Process Document"
                  )}
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-emerald-500/20 rounded-full">
                    <CheckCircle className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">Extraction Successful</h2>
                </div>

                <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800 space-y-4">
                  <DataRow label="Tanggal (Date)" value={extractedData.tanggal} />
                  <DataRow label="Pengirim (Sender)" value={extractedData.nama_pengirim} />
                  <DataRow label="Perusahaan (Company)" value={extractedData.nama_pt} />
                  <DataRow label="Penerima (Recipient)" value={extractedData.penerima} />
                  <DataRow label="Total Harga (Total)" value={extractedData.total_harga} />
                </div>

                {error && (
                  <div className="flex items-center space-x-2 text-rose-400 bg-rose-400/10 p-4 rounded-xl">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm">{error}</p>
                  </div>
                )}

                {success && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center space-x-2 text-emerald-400 bg-emerald-400/10 p-4 rounded-xl"
                  >
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm">{success}</p>
                  </motion.div>
                )}

                <div className="flex space-x-4 pt-4">
                  <button
                    onClick={() => {
                      setExtractedData(null);
                      setFile(null);
                    }}
                    className="flex-1 py-4 rounded-xl font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition-all active:scale-[0.98]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveToSheets}
                    disabled={isSaving || !!success}
                    className={`flex-1 py-4 rounded-xl font-semibold text-white transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]
                      ${isSaving || success 
                        ? "bg-emerald-600/50 cursor-not-allowed" 
                        : "bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98]"
                      }
                    `}
                  >
                    {isSaving ? (
                      <div className="flex items-center justify-center space-x-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Saving...</span>
                      </div>
                    ) : (
                      "Save to Sheets"
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

function DataRow({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 border-b border-slate-800/50 last:border-0">
      <span className="text-slate-400 text-sm mb-1 sm:mb-0">{label}</span>
      <span className="text-slate-100 font-medium text-right bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
        {value || "Not found"}
      </span>
    </div>
  );
}
