"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, FileText, CheckCircle, AlertCircle, Loader2, PencilLine } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

interface ExtractionResult {
  tanggal: string;
  nama_pengirim: string;
  nama_pt: string;
  penerima: string;
  total_harga: string;
  link_storage?: string;
}

interface BatchResult {
  filename: string;
  status: string;
  message?: string;
  data?: ExtractionResult;
}

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Upload, 2: Analysis, 3: Review
  
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [extractedData, setExtractedData] = useState<BatchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      const validTypes = ["application/pdf", "image/jpeg", "image/png"];
      const invalidFiles = selectedFiles.filter(f => !validTypes.includes(f.type));
      if (invalidFiles.length > 0) {
        setError("Only PDF, JPEG, or PNG files are supported.");
        return;
      }
      setFiles(selectedFiles);
      setError(null);
      setExtractedData([]);
      setSuccess(null);
      setStep(1);
    }
  };

  const handleProcess = async () => {
    if (files.length === 0) return;

    setStep(2); // AI Analysis
    setIsUploading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    files.forEach(file => {
      formData.append("file", file);
    });

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to process files.");
      
      const results = data.data;

      // Upload files to Supabase Storage in parallel
      await Promise.all(
        files.map(async (file) => {
          try {
            const fileName = `${Date.now()}_${file.name}`;
            
            const { data: uploadData, error: uploadError } = await supabase
              .storage
              .from('OCR-demo')
              .upload(fileName, file);

            if (uploadError) throw uploadError;

            // Get the public URL
            const { data: urlData } = supabase
              .storage
              .from('OCR-demo')
              .getPublicUrl(fileName);

            const downloadURL = urlData.publicUrl;
            
            // Re-attach details to the correct extractedData result
            const matchIndex = results.findIndex((r: any) => r.filename === file.name);
            if (matchIndex !== -1 && results[matchIndex].data) {
              results[matchIndex].data.link_storage = downloadURL;
            }
          } catch (uploadError) {
            console.error("Supabase upload failed for", file.name, uploadError);
          }
        })
      );

      setExtractedData(results);
      setStep(3); // Go to review data
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setStep(1); // Revert to upload
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveToSheets = async () => {
    if (extractedData.length === 0) return;

    const dataToSave = extractedData.filter(d => d.status === "success" && d.data).map(d => d.data);
    if (dataToSave.length === 0) {
      setError("No valid extracted data to save.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSave),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save to Google Sheets.");

      setSuccess(`Successfully saved ${dataToSave.length} records to Google Sheets!`);

      // Reset
      setTimeout(() => {
        setFiles([]);
        setExtractedData([]);
        setSuccess(null);
        setStep(1);
      }, 3000);

    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  const updateResultData = (index: number, field: keyof ExtractionResult, value: string) => {
    const updated = [...extractedData];
    if (updated[index] && updated[index].data) {
      updated[index].data![field] = value;
      setExtractedData(updated);
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-10">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-4 uppercase">
          Document OCR AI Process
        </h1>
        <p className="text-slate-600 text-xl font-medium max-w-2xl mx-auto">
          Upload your invoice (PDF or Image), extract data using Vision AI, and sync to Google Sheets magically.
        </p>
      </div>

      {/* Stepper Header */}
      <div className="flex items-center justify-center max-w-2xl mx-auto mb-10 relative">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -z-10 -translate-y-1/2"></div>
        <StepItem number={1} label="Upload" active={step >= 1} current={step === 1} />
        <StepDivider active={step >= 2} />
        <StepItem number={2} label="AI Analysis" active={step >= 2} current={step === 2} />
        <StepDivider active={step >= 3} />
        <StepItem number={3} label="Review Data" active={step >= 3} current={step === 3} />
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xl relative overflow-hidden min-h-[400px]">
        {/* Decorative background swish could go here */}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 flex flex-col items-center">
              
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`w-[300px] h-[300px] rounded-full border-4 ${files.length > 0 ? "border-red-700 bg-red-50" : "border-red-200 border-dashed hover:bg-slate-50"} flex flex-col items-center justify-center cursor-pointer transition-colors group p-6 overflow-hidden`}
              >
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf,.jpeg,.jpg,.png" multiple className="hidden" />
                
                {files.length > 0 ? (
                  <div className="text-center">
                    <FileText className="w-16 h-16 text-red-700 mx-auto mb-4" />
                    <p className="font-bold text-slate-800 text-lg">{files.length} file{files.length > 1 ? 's' : ''} selected</p>
                    <p className="text-xs text-slate-500 max-w-[200px] mt-2 truncate">{files.map(f => f.name).join(', ')}</p>
                  </div>
                ) : (
                  <div className="text-center flex flex-col items-center">
                    <UploadCloud className="w-12 h-12 text-slate-400 group-hover:text-red-600 transition-colors mb-4" />
                    <p className="font-bold text-slate-800 text-lg uppercase tracking-wide">Drag & Drop <br/><span className="text-sm font-medium lowercase text-slate-500">or</span><br/>Click to Upload</p>
                  </div>
                )}
              </div>
              <p className="text-slate-500 font-medium">Supported: Invoice PDF, JPEG, PNG</p>

              {error && <ErrorMessage msg={error} />}

              <button 
                onClick={handleProcess} 
                disabled={files.length === 0}
                className="w-full max-w-sm py-4 bg-red-700 hover:bg-red-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg tracking-wide shadow-md transition-all uppercase mt-4"
              >
                Process Document
              </button>

            </motion.div>
          )}

          {step === 2 && (
             <motion.div key="analysis" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-20 flex flex-col items-center justify-center space-y-8 absolute inset-0">
               <Loader2 className="w-20 h-20 text-red-600 animate-spin" />
               <div className="text-center">
                 <h2 className="text-2xl font-bold text-slate-800 mb-2">Running Vision AI Model...</h2>
                 <p className="text-slate-500">Extracting details from {files.length} document{files.length !== 1 ? 's' : ''}.</p>
               </div>
             </motion.div>
          )}

          {step === 3 && (
            <motion.div key="review" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
              
              {success && (
                <div className="flex items-center space-x-3 text-emerald-700 bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                  <CheckCircle className="w-6 h-6 flex-shrink-0" />
                  <p className="font-medium">{success}</p>
                </div>
              )}

              {error && <ErrorMessage msg={error} />}

              <div className="max-h-[60vh] overflow-y-auto space-y-6 pr-2">
                {extractedData.map((result, idx) => (
                  <div key={idx} className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-3">
                      <span className="font-bold text-slate-800 text-lg flex items-center gap-2">
                         <FileText className="w-5 h-5 text-slate-500"/>
                         {result.filename}
                      </span>
                      {result.status === "success" ? (
                         <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded text-sm font-bold flex items-center gap-1"><CheckCircle className="w-4 h-4"/> Success</span>
                      ) : (
                         <span className="bg-red-100 text-red-800 px-3 py-1 rounded text-sm font-bold flex items-center gap-1"><AlertCircle className="w-4 h-4"/> Error</span>
                      )}
                    </div>

                    {result.status === "success" && result.data ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <EditField label="Date (Tanggal)" value={result.data.tanggal} onChange={(v) => updateResultData(idx, "tanggal", v)} />
                        <EditField label="Total Amount (Total Harga)" value={result.data.total_harga} onChange={(v) => updateResultData(idx, "total_harga", v)} />
                        <EditField label="Sender (Nama Pengirim)" value={result.data.nama_pengirim} onChange={(v) => updateResultData(idx, "nama_pengirim", v)} />
                        <EditField label="Recipient (Penerima)" value={result.data.penerima} onChange={(v) => updateResultData(idx, "penerima", v)} />
                        <EditField label="Company (Nama PT)" value={result.data.nama_pt} onChange={(v) => updateResultData(idx, "nama_pt", v)} />
                      </div>
                    ) : (
                       <p className="text-red-500 italic">{result.message}</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                 <button onClick={() => setStep(1)} className="px-6 py-3 font-semibold text-slate-500 hover:text-slate-900 transition-colors">Start Over</button>
                 <button 
                  onClick={handleSaveToSheets}
                  disabled={isSaving || !!success}
                  className="px-8 py-3 bg-red-700 hover:bg-red-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-md transition-all flex items-center gap-2 uppercase tracking-wide"
                >
                  {isSaving && <Loader2 className="w-5 h-5 animate-spin" />}
                  {isSaving ? "Saving..." : "Confirm & Save to Sheets"}
                </button>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function StepItem({ number, label, active, current }: { number: number, label: string, active: boolean, current: boolean }) {
  return (
    <div className="flex flex-col items-center bg-[#f8f9fa] z-10 px-4">
       <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg mb-2 transition-all duration-300 shadow-sm ${active ? 'bg-red-700 text-white' : 'bg-white border-2 border-slate-200 text-slate-400'}`}>
         {number}
       </div>
       <span className={`font-semibold transition-colors duration-300 ${active ? 'text-red-800' : 'text-slate-400'} ${current ? 'text-lg' : 'text-base'}`}>{label}</span>
    </div>
  )
}

function StepDivider({ active }: { active: boolean }) {
  return (
    <div className="flex-1 h-0.5 relative max-w-[120px]">
       <div className={`absolute left-0 top-0 bottom-0 transition-all duration-500 ${active ? 'bg-red-700 w-full' : 'bg-transparent w-0'}`}></div>
    </div>
  )
}

function EditField({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col">
      <label className="text-xs font-semibold text-slate-600 mb-1 ml-1 uppercase">{label}</label>
      <div className="relative">
        <input 
          type="text" 
          className="w-full border border-slate-300 rounded-lg py-2.5 px-4 pr-10 text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all shadow-sm"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        />
        <PencilLine className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
      </div>
    </div>
  )
}

function ErrorMessage({ msg }: { msg: string }) {
  return (
    <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-4 rounded-xl border border-red-200 w-full max-w-sm mx-auto">
      <AlertCircle className="w-5 h-5 flex-shrink-0" />
      <p className="text-sm font-medium">{msg}</p>
    </div>
  )
}
