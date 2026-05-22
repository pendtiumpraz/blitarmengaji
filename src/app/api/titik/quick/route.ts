import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { auth } from "@/lib/auth";
import { can } from "@/lib/rbac";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function slugify(s: string): string {
  const base = (s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);
  return (base || "titik") + "-" + Date.now().toString(36).slice(-4);
}

/** Quick-create titik dakwah dari form lokasi (event/kajian). Langsung aktif & muncul di /peta. */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Harus login." }, { status: 401 });

  const allowed = (await can("*")) || (await can("titik.create")) || (await can("titik.manage_own"));
  if (!allowed) return Response.json({ error: "Akses ditolak." }, { status: 403 });

  let body: { name?: string; latitude?: number; longitude?: number; address?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Body tidak valid." }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  const lat = Number(body.latitude);
  const lng = Number(body.longitude);
  if (name.length < 2) return Response.json({ error: "Nama titik minimal 2 karakter." }, { status: 400 });
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return Response.json({ error: "Lokasi peta wajib dipilih." }, { status: 400 });

  const [row] = await db
    .insert(schema.titikDakwah)
    .values({
      name,
      slug: slugify(name),
      address: body.address?.trim() || null,
      latitude: String(lat),
      longitude: String(lng),
      gmapsUrl: `https://www.google.com/maps?q=${lat},${lng}`,
      status: "active",
      ownerUserId: session.user.id,
    })
    .returning({ id: schema.titikDakwah.id, name: schema.titikDakwah.name });

  revalidatePath("/peta");
  return Response.json({ id: row.id, name: row.name });
}
