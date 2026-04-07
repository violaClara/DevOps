"use client";

import React, { useState, useEffect } from "react";
import { FolderOpen, Search, Loader2, FileImage, FileText, ExternalLink, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

interface StorageFile {
  id: string;
  name: string;
  webViewLink: string;
  createdTime: string;
  contentType: string;
  size: number;
}

export default function DocumentsExtractedPage() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.toLowerCase());
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  // Fetch from Supabase
  useEffect(() => {
    const fetchStorageFiles = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .storage
          .from('OCR-demo')
          .list();
          
        if (error) throw error;

        if (!data || data.length === 0) {
            setFiles([]);
            setLoading(false);
            return;
        }

        let fetchedFiles = data.map((item) => {
            const { data: urlData } = supabase
                .storage
                .from('OCR-demo')
                .getPublicUrl(item.name);

            // Reconstruct the original name if we prefixed it with timestamp_
            let originalName = item.name;
            const parts = item.name.split('_');
            if (parts.length > 1 && !isNaN(Number(parts[0]))) {
                originalName = parts.slice(1).join('_');
            }

            // Estimate content type loosely by extension since list() doesn't always strictly bubble it natively without metadata requests
            const isImage = item.name.endsWith('.png') || item.name.endsWith('.jpg') || item.name.endsWith('.jpeg');
            const contentType = isImage ? 'image/jpeg' : 'application/pdf';

            return {
              id: item.id || item.name,
              name: originalName,
              webViewLink: urlData.publicUrl,
              createdTime: item.created_at,
              contentType: contentType,
              size: item.metadata?.size || 0
            } as StorageFile;
        });
        
        // Sort newest first
        fetchedFiles.sort((a, b) => new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime());
        
        // Filter purely client side
        if (debouncedQuery) {
          fetchedFiles = fetchedFiles.filter(f => f.name.toLowerCase().includes(debouncedQuery));
        }

        setFiles(fetchedFiles);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Failed to reach Supabase Storage");
      } finally {
        setLoading(false);
      }
    };

    fetchStorageFiles();
  }, [debouncedQuery]);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800 flex items-center gap-3">
            <FolderOpen className="text-red-700" size={32} />
            Documents Extracted
          </h1>
          <p className="text-slate-500 mt-2">
            View raw documents synced securely inside Supabase.
          </p>
        </div>

        <div className="relative w-full md:w-96">
          <input 
            type="text"
            placeholder="Search filenames..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-xl py-3 pl-12 pr-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500 shadow-sm transition-all"
          />
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
          {loading && (
             <Loader2 className="w-5 h-5 text-red-500 animate-spin absolute right-4 top-3.5" />
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 min-h-[500px]">
        {error ? (
          <div className="text-center p-12 text-red-600 bg-red-50 rounded-xl">
             <p className="font-semibold text-lg mb-2">Notice</p>
             <p className="text-sm">{error}</p>
          </div>
        ) : !loading && files.length === 0 ? (
           <div className="text-center p-20 text-slate-400 flex flex-col items-center">
              <FolderOpen className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-xl font-medium text-slate-600">No documents found</p>
              <p className="mt-2 text-sm">Upload invoices on the dashboard or try a different search term.</p>
           </div>
        ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {files.map((file) => (
                 <motion.a 
                  key={file.id} 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  href={file.webViewLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-5 hover:shadow-lg hover:border-red-300 transition-all group flex items-start justify-between h-auto"
                 >
                    <div className="flex items-start gap-4">
                         <div className="w-12 h-12 flex-shrink-0 bg-white rounded shadow-sm border border-slate-200 flex items-center justify-center">
                            {file.contentType.includes('image') ? <FileImage className="text-blue-600 w-6 h-6"/> : <FileText className="text-red-600 w-6 h-6"/>}
                         </div>
                         <div className="flex flex-col overflow-hidden max-w-[150px] md:max-w-[180px]">
                           <h3 className="font-bold text-slate-800 text-sm truncate" title={file.name}>{file.name}</h3>
                           <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                             <Calendar className="w-3 h-3" />
                             {new Date(file.createdTime).toLocaleDateString()}
                           </p>
                           <p className="text-xs text-slate-400 mt-1">
                             {(file.size / 1024).toFixed(1)} KB
                           </p>
                         </div>
                    </div>
                    <ExternalLink className="w-5 h-5 text-slate-300 group-hover:text-red-600 transition-colors shrink-0" />
                 </motion.a>
              ))}
           </div>
        )}
      </div>
    </div>
  );
}
