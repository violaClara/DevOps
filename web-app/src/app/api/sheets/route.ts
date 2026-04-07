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
      range: "Sheet1!A:F",
    });

    const rows = response.data.values || [];
    const formattedData = rows.map((row, index) => ({
      rowIndex: index + 1, // Google Sheets rows are 1-indexed
      tanggal: row[0] || "",
      nama_pengirim: row[1] || "",
      nama_pt: row[2] || "",
      penerima: row[3] || "",
      total_harga: row[4] || "",
      link_storage: row[5] || ""
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
      item.tanggal || "",
      item.nama_pengirim || "",
      item.nama_pt || "",
      item.penerima || "",
      item.total_harga || "",
      item.link_storage || ""
    ]);

    const sheets = await getSheetsClient();
    if (!sheets) {
      return NextResponse.json({ success: true, mocked: true });
    }

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Sheet1!A:F",
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
    const { rowIndex, tanggal, nama_pengirim, nama_pt, penerima, total_harga, link_storage } = body;

    if (!rowIndex) {
      return NextResponse.json({ error: "rowIndex is required for updating" }, { status: 400 });
    }

    const sheets = await getSheetsClient();
    if (!sheets) {
      return NextResponse.json({ success: true, mocked: true });
    }

    const response = await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `Sheet1!A${rowIndex}:F${rowIndex}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [
          [tanggal || "", nama_pengirim || "", nama_pt || "", penerima || "", total_harga || "", link_storage || ""]
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
