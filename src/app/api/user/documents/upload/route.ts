import { NextRequest, NextResponse } from "next/server";
import { verifySessionCookie, adminDb as db, adminStorage as storage, admin } from "@/firebase/firebase-admin-config";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = req.cookies.get("session")?.value;
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const decoded = await verifySessionCookie(session);
  if (!decoded?.uid) return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  const uid = decoded.uid as string;

  let form: FormData;
  try {
    form = await req.formData();
  } catch (err) {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = form.get("file") as any;
  const documentType = (form.get("documentType") as string) || "other";

  if (!file || typeof file.arrayBuffer !== "function") {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const originalName = file.name || "upload";
  const safeName = encodeURIComponent(originalName.replace(/\s+/g, "_"));
  const destPath = `user-documents/${uid}/${documentType}/${Date.now()}_${safeName}`;

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const bucket = storage.bucket();

    const userRef = db.collection("users").doc(uid);
    const userSnap = await userRef.get();
    const existing = userSnap.exists ? (userSnap.data()?.documents?.[documentType] as string[] | undefined) : undefined;
    if (existing && Array.isArray(existing)) {
      for (const existingUrl of existing) {
        try {
          const gsMatch = existingUrl.match(/\/b\/(.*?)\/o\/(.*)\?/);
          if (gsMatch) {
            const path = decodeURIComponent(gsMatch[2]);
            await bucket.file(path).delete().catch(() => null);
          }
        } catch (e) {
        }
      }
    }

    const gfile = bucket.file(destPath);
    await gfile.save(buffer, { contentType: file.type });

    const [url] = await gfile.getSignedUrl({ action: "read", expires: Date.now() + 1000 * 60 * 60 * 24 * 365 });

    await userRef.update({ [`documents.${documentType}`]: [url] });

    return NextResponse.json({ url }, { status: 201 });
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
