import { NextRequest, NextResponse } from "next/server";
import { profileUpdateSchema } from "@/schemas/profileUpdateSchema";
import { verifySessionCookie, adminDb as db, admin } from "@/firebase/firebase-admin-config";

export async function GET(req: NextRequest) {

    const session = req.cookies.get("session")?.value;
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const decoded = await verifySessionCookie(session);
  if (!decoded?.uid) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

  const uid = decoded.uid as string;
  const userRef = db.collection("users").doc(uid);
  const userDoc = await userRef.get();
  if (!userDoc.exists) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const userData = userDoc.data();
  return NextResponse.json({ user: { id: userDoc.id, ...userData } });
}

export async function PUT(req: NextRequest) {
  const session = req.cookies.get("session")?.value;
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const decoded = await verifySessionCookie(session);
  if (!decoded?.uid) return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  const uid = decoded.uid as string;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    const issues = parsed.error.errors.map((e) => ({ field: e.path.join("."), message: e.message }));
    return NextResponse.json({ error: "Invalid input", issues }, { status: 400 });
  }

  const update = parsed.data as Record<string, any>;

  try {
    const userRef = db.collection("users").doc(uid);
    await userRef.update({
      ...update,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const updatedDoc = await userRef.get();
    const data = updatedDoc.data() || {};
    const updatedAtIso = (data.updatedAt && typeof data.updatedAt.toDate === "function") ? data.updatedAt.toDate().toISOString() : (data.updatedAt ?? null);

    return NextResponse.json({ user: { id: updatedDoc.id, ...data, updatedAt: updatedAtIso } });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}