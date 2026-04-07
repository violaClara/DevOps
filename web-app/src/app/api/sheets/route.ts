import { NextRequest, NextResponse } from "next/server";
import { getSheetsClient } from "@/lib/googleAuth";

export async function GET(req: NextRequest) {
  try {
    const sheets = await getSheetsClient();
    if (!sheets) {
      return NextResponse.json({ success: true, data: [] });
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Sheet1!A:L",
    });

    const rows = response.data.values || [];
    const formattedData = rows.slice(1).map((row, index) => ({
      rowIndex: index + 2, // Google Sheets rows are 1-indexed and we skipped the 1st row
      nomor_invoice: row[0] || "",
      tanggal: row[1] || "",
      tanggal_jatuh_tempo: row[2] || "",
      nama_pengirim: row[3] || "",
      nama_pt: row[4] || "",
      penerima: row[5] || "",
      mata_uang: row[6] || "",
      total_harga: row[7] || "",
      pajak: row[8] || "",
      deskripsi: row[9] || "",
      metode_pembayaran: row[10] || "",
      link_storage: row[11] || ""
    }));

    return NextResponse.json({ success: true, data: formattedData });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Sheets API GET Error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch from Google Sheets" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const dataList = Array.isArray(body) ? body : [body];

    const rowsToInsert = dataList.map((item: any) => [
      item.nomor_invoice || "",
      item.tanggal || "",
      item.tanggal_jatuh_tempo || "",
      item.nama_pengirim || "",
      item.nama_pt || "",
      item.penerima || "",
      item.mata_uang || "",
      item.total_harga || "",
      item.pajak || "",
      item.deskripsi || "",
      item.metode_pembayaran || "",
      item.link_storage || ""
    ]);

    const sheets = await getSheetsClient();
    if (!sheets) {
      return NextResponse.json({ success: true, mocked: true });
    }

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Sheet1!A:L",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: rowsToInsert,
      },
    });

    return NextResponse.json({ success: true, data: response.data });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Sheets API POST Error:", err);
    return NextResponse.json({ error: err.message || "Failed to save to Google Sheets" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { rowIndex, nomor_invoice, tanggal, tanggal_jatuh_tempo, nama_pengirim, nama_pt, penerima, mata_uang, total_harga, pajak, deskripsi, metode_pembayaran, link_storage } = body;

    if (!rowIndex) {
      return NextResponse.json({ error: "rowIndex is required for updating" }, { status: 400 });
    }

    const sheets = await getSheetsClient();
    if (!sheets) {
      return NextResponse.json({ success: true, mocked: true });
    }

    const response = await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `Sheet1!A${rowIndex}:L${rowIndex}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [
          [nomor_invoice || "", tanggal || "", tanggal_jatuh_tempo || "", nama_pengirim || "", nama_pt || "", penerima || "", mata_uang || "", total_harga || "", pajak || "", deskripsi || "", metode_pembayaran || "", link_storage || ""]
        ],
      },
    });

    return NextResponse.json({ success: true, data: response.data });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Sheets API PUT Error:", err);
    return NextResponse.json({ error: err.message || "Failed to update Google Sheets" }, { status: 500 });
  }
}
