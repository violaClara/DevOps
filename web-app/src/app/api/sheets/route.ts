import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tanggal, nama_pengirim, nama_pt, penerima, total_harga } = body;

    const credentialsBase64 = process.env.GOOGLE_SERVICE_ACCOUNT_BASE64;
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    if (!credentialsBase64 || !spreadsheetId) {
       // Mock success if not configured yet (so UI can still be tested)
       console.warn("Google Sheets credentials not configured. Mocking success.");
       return NextResponse.json({ success: true, mocked: true });
    }

    const credentialsJson = JSON.parse(Buffer.from(credentialsBase64, 'base64').toString('utf-8'));

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: credentialsJson.client_email,
        private_key: credentialsJson.private_key,
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Sheet1!A:E", // Adjust sheet name and range as necessary
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [
          [tanggal, nama_pengirim, nama_pt, penerima, total_harga]
        ],
      },
    });

    return NextResponse.json({ success: true, data: response.data });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Sheets API Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to save to Google Sheets" },
      { status: 500 }
    );
  }
}
