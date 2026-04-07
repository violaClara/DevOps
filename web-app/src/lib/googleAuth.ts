import { google } from "googleapis";

export async function getGoogleClient() {
  const credentialsBase64 = process.env.GOOGLE_SERVICE_ACCOUNT_BASE64;
  
  if (!credentialsBase64) {
    console.warn("Google credentials not configured.");
    return null;
  }

  const credentialsJson = JSON.parse(Buffer.from(credentialsBase64, 'base64').toString('utf-8'));

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: credentialsJson.client_email,
      private_key: credentialsJson.private_key,
    },
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive.file",
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/drive.metadata"
    ],
  });

  return auth;
}

export async function getSheetsClient() {
    const auth = await getGoogleClient();
    if (!auth) return null;
    return google.sheets({ version: "v4", auth });
}

export async function getDriveClient() {
    const auth = await getGoogleClient();
    if (!auth) return null;
    return google.drive({ version: "v3", auth });
}
