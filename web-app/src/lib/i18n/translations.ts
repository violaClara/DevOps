export const translations = {
  id: {
    // Navigation
    nav_home: "Beranda",
    nav_documents: "Dokumen",
    nav_archive: "Arsip",

    // Home / Upload Page
    upload_title: "Verifikasi Dokumen OCR",
    upload_desc: "Ekstrak struktur data dari invoice dengan akurasi 99%.",
    step1_title: "Pilih Dokumen",
    step1_desc: "Terima file PDF, PNG, JPG.",
    step1_btn: "Unggah Dokumen",
    step1_or: "atau seret dan lepas file ke sini",
    step2_title: "Ekstraksi AI",
    step2_desc: "Dokumen sedang diproses...",
    step3_title: "Validasi Hasil",
    step3_btn: "Simpan ke Database",
    alert_success: "File berhasil diproses. Silakan validasi data Anda.",

    // Labels
    nomor_invoice: "Nomor Invoice",
    tanggal: "Tanggal",
    tanggal_jatuh_tempo: "Jatuh Tempo",
    nama_pengirim: "Nama Pengirim",
    nama_pt: "Nama PT",
    penerima: "Penerima",
    mata_uang: "Mata Uang",
    total_harga: "Total Harga",
    pajak: "Pajak",
    deskripsi: "Deskripsi",
    metode_pembayaran: "Metode Pembayaran",

    // Archive Page
    archive_title: "Arsip Dokumen",
    archive_desc: "Lihat dan kelola dokumen yang disinkronkan ke database Google Sheets Anda.",
    row_num: "Baris #",
    storage: "Penyimpanan",
    actions: "Aksi",
    view: "Lihat",
    search_placeholder: "Cari dokumen...",
    no_results: "Tidak ada dokumen yang sesuai.",
  },
  en: {
    // Navigation
    nav_home: "Home",
    nav_documents: "Documents",
    nav_archive: "Archive",

    // Home / Upload Page
    upload_title: "OCR Document Verification",
    upload_desc: "Extract data structures from invoices with 99% accuracy.",
    step1_title: "Choose Document",
    step1_desc: "Accepts PDF, PNG, JPG files.",
    step1_btn: "Upload Document",
    step1_or: "or drag and drop file here",
    step2_title: "AI Extraction",
    step2_desc: "Processing document...",
    step3_title: "Validate Output",
    step3_btn: "Save to Database",
    alert_success: "File successfully processed. Please validate your data.",

    // Labels
    nomor_invoice: "Invoice #",
    tanggal: "Date",
    tanggal_jatuh_tempo: "Due Date",
    nama_pengirim: "Sender Name",
    nama_pt: "Company Name",
    penerima: "Recipient",
    mata_uang: "Currency",
    total_harga: "Total Price",
    pajak: "Tax",
    deskripsi: "Line Items",
    metode_pembayaran: "Pay Method",

    // Archive Page
    archive_title: "Document Archive",
    archive_desc: "View and manage documents synced to your Google Sheets database.",
    row_num: "Row #",
    storage: "Storage",
    actions: "Actions",
    view: "View",
    search_placeholder: "Search documents...",
    no_results: "No documents found matching your search.",
  }
};

export type Language = 'id' | 'en';
export type TranslationKey = keyof typeof translations.id;
