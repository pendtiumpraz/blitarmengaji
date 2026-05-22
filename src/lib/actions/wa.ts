"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@/lib/db";
import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";

function slugify(s: string): string {
  const base = (s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);
  return (base || "item") + "-" + Date.now().toString(36).slice(-4);
}

function tiptap(text: string) {
  return {
    type: "doc",
    content: (text || "")
      .split("\n")
      .filter((l) => l.trim())
      .map((p) => ({ type: "paragraph", content: [{ type: "text", text: p }] })),
  };
}

async function currentUserId(): Promise<string | null> {
  const s = await auth();
  return s?.user?.id ?? null;
}

const kajianSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(3, "Judul minimal 3 karakter"),
  ustadz: z.string().trim().optional(),
  titikDakwahId: z.string().uuid().optional().or(z.literal("")),
  startAt: z.string().trim().min(1, "Waktu mulai wajib diisi"),
  kitab: z.string().trim().optional(),
  isOnline: z.boolean().optional(),
  streamUrl: z.string().trim().optional(),
});

/** Setujui draft KAJIAN → buat kajian + jadwal di titik terkait. */
export async function approveKajian(formData: FormData): Promise<void> {
  await requirePermission("kajian.create");
  const userId = await currentUserId();

  const parsed = kajianSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title"),
    ustadz: formData.get("ustadz") ?? "",
    titikDakwahId: formData.get("titikDakwahId") ?? "",
    startAt: formData.get("startAt"),
    kitab: formData.get("kitab") ?? "",
    isOnline: formData.get("isOnline") === "on" || formData.get("isOnline") === "true",
    streamUrl: formData.get("streamUrl") ?? "",
  });
  if (!parsed.success) {
    redirect("/admin/wa?err=" + encodeURIComponent(parsed.error.issues[0]?.message ?? "Data kajian tidak valid."));
  }
  const d = parsed.data;
  const titikId = d.titikDakwahId && d.titikDakwahId !== "" ? d.titikDakwahId : null;
  const start = new Date(d.startAt);
  if (Number.isNaN(start.getTime())) {
    redirect("/admin/wa?err=" + encodeURIComponent("Waktu mulai tidak valid."));
  }

  const [kaj] = await db
    .insert(schema.kajian)
    .values({
      title: d.title,
      slug: slugify(d.title),
      description: d.ustadz ? `Penceramah: ${d.ustadz}` : null,
      titikDakwahId: titikId,
      kitab: d.kitab || null,
      type: d.isOnline ? "online" : "offline",
      status: "published",
    })
    .returning({ id: schema.kajian.id });

  await db.insert(schema.kajianSchedules).values({
    kajianId: kaj.id,
    titikDakwahId: titikId,
    title: d.title,
    startAt: start,
    isOnline: !!d.isOnline,
    streamUrl: d.streamUrl || null,
    status: "scheduled",
  });

  await db
    .update(schema.waIngestQueue)
    .set({ status: "approved", reviewedBy: userId, reviewedAt: new Date(), titikDakwahId: titikId })
    .where(eq(schema.waIngestQueue.id, d.id));

  revalidatePath("/admin/wa");
  revalidatePath("/jadwal");
  revalidatePath("/kajian");
  redirect("/admin/wa?ok=" + encodeURIComponent("Kajian disetujui & jadwal dibuat."));
}

const faedahSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(3, "Judul minimal 3 karakter"),
  body: z.string().trim().min(1, "Isi faedah wajib diisi"),
});

/** Setujui draft FAEDAH → buat catatan (post). */
export async function approveFaedah(formData: FormData): Promise<void> {
  await requirePermission("blog.create");
  const userId = await currentUserId();

  const parsed = faedahSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    redirect("/admin/wa?err=" + encodeURIComponent(parsed.error.issues[0]?.message ?? "Data faedah tidak valid."));
  }
  const d = parsed.data;

  await db.insert(schema.posts).values({
    title: d.title,
    slug: slugify(d.title),
    type: "catatan",
    contentRich: tiptap(d.body),
    excerpt: d.body.slice(0, 180),
    authorUserId: userId,
    status: "published",
    publishedAt: new Date(),
  });

  await db
    .update(schema.waIngestQueue)
    .set({ status: "approved", reviewedBy: userId, reviewedAt: new Date() })
    .where(eq(schema.waIngestQueue.id, d.id));

  revalidatePath("/admin/wa");
  revalidatePath("/catatan");
  redirect("/admin/wa?ok=" + encodeURIComponent("Faedah disetujui & catatan dibuat."));
}

/** Tolak draft. */
export async function rejectIngest(formData: FormData): Promise<void> {
  await requirePermission("kajian.create");
  const userId = await currentUserId();
  const id = String(formData.get("id") || "");
  if (!id) {
    redirect("/admin/wa?err=" + encodeURIComponent("ID tidak valid."));
  }
  await db
    .update(schema.waIngestQueue)
    .set({ status: "rejected", reviewedBy: userId, reviewedAt: new Date() })
    .where(eq(schema.waIngestQueue.id, id));
  revalidatePath("/admin/wa");
  redirect("/admin/wa?ok=" + encodeURIComponent("Draft ditolak."));
}
