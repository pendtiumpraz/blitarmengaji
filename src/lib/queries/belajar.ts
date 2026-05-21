import { db, schema } from "@/lib/db";
import { and, asc, count, desc, eq, isNull } from "drizzle-orm";

/**
 * Query READ untuk domain Belajar & Acara (kelas online + event/webinar).
 * Selalu filter `isNull(...deletedAt)` (soft delete — lihat AGENTS.md §4).
 * Hanya konten ber-status 'published' yang ditampilkan ke publik.
 */

export type CourseListItem = {
  id: string;
  title: string;
  slug: string;
  level: string | null;
  coverImage: string | null;
  ustadzName: string | null;
  lessonCount: number;
  createdAt: Date;
};

/** Daftar kelas online yang sudah dipublikasi (terbaru dulu) + jumlah pelajaran & nama ustadz. */
export async function listCourses(): Promise<CourseListItem[]> {
  const rows = await db
    .select({
      id: schema.courses.id,
      title: schema.courses.title,
      slug: schema.courses.slug,
      level: schema.courses.level,
      coverImage: schema.courses.coverImage,
      ustadzName: schema.ustadzProfiles.name,
      createdAt: schema.courses.createdAt,
    })
    .from(schema.courses)
    .leftJoin(schema.ustadzProfiles, eq(schema.ustadzProfiles.id, schema.courses.ustadzId))
    .where(and(eq(schema.courses.status, "published"), isNull(schema.courses.deletedAt)))
    .orderBy(desc(schema.courses.createdAt));

  if (rows.length === 0) return [];

  // Hitung jumlah pelajaran aktif per kursus (via modul -> lesson).
  const lessonCounts = await db
    .select({
      courseId: schema.courseModules.courseId,
      total: count(schema.courseLessons.id),
    })
    .from(schema.courseModules)
    .innerJoin(
      schema.courseLessons,
      and(
        eq(schema.courseLessons.moduleId, schema.courseModules.id),
        isNull(schema.courseLessons.deletedAt),
      ),
    )
    .where(isNull(schema.courseModules.deletedAt))
    .groupBy(schema.courseModules.courseId);

  const countMap = new Map(lessonCounts.map((r) => [r.courseId, Number(r.total)]));

  return rows.map((r) => ({
    ...r,
    lessonCount: countMap.get(r.id) ?? 0,
  }));
}

export type AdminCourseListItem = {
  id: string;
  title: string;
  slug: string;
  level: string | null;
  coverImage: string | null;
  status: "draft" | "published";
  ustadzName: string | null;
  createdAt: Date;
};

/** Daftar SEMUA kelas (semua status) untuk panel admin — terbaru dulu. Hanya yang belum dihapus. */
export async function listCoursesAdmin(): Promise<AdminCourseListItem[]> {
  const rows = await db
    .select({
      id: schema.courses.id,
      title: schema.courses.title,
      slug: schema.courses.slug,
      level: schema.courses.level,
      coverImage: schema.courses.coverImage,
      status: schema.courses.status,
      ustadzName: schema.ustadzProfiles.name,
      createdAt: schema.courses.createdAt,
    })
    .from(schema.courses)
    .leftJoin(schema.ustadzProfiles, eq(schema.ustadzProfiles.id, schema.courses.ustadzId))
    .where(isNull(schema.courses.deletedAt))
    .orderBy(desc(schema.courses.createdAt));

  return rows;
}

/** Daftar SEMUA kelas (semua status) untuk admin, dengan pagination. Terbaru dulu. */
export async function listCoursesPaged(
  page: number,
  pageSize: number,
): Promise<AdminCourseListItem[]> {
  const safePage = Math.max(1, Math.floor(page) || 1);
  const safeSize = Math.max(1, Math.floor(pageSize) || 1);

  const rows = await db
    .select({
      id: schema.courses.id,
      title: schema.courses.title,
      slug: schema.courses.slug,
      level: schema.courses.level,
      coverImage: schema.courses.coverImage,
      status: schema.courses.status,
      ustadzName: schema.ustadzProfiles.name,
      createdAt: schema.courses.createdAt,
    })
    .from(schema.courses)
    .leftJoin(schema.ustadzProfiles, eq(schema.ustadzProfiles.id, schema.courses.ustadzId))
    .where(isNull(schema.courses.deletedAt))
    .orderBy(desc(schema.courses.createdAt))
    .limit(safeSize)
    .offset((safePage - 1) * safeSize);

  return rows;
}

/** Jumlah total kelas aktif (untuk pagination admin). */
export async function countCourses(): Promise<number> {
  const rows = await db
    .select({ total: count() })
    .from(schema.courses)
    .where(isNull(schema.courses.deletedAt));
  return Number(rows[0]?.total ?? 0);
}

export type CourseEditItem = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  level: string | null;
  coverImage: string | null;
  status: "draft" | "published";
};

/** Ambil satu kelas by id (aktif) untuk form edit admin. Null bila tidak ada. */
export async function getCourseById(id: string): Promise<CourseEditItem | null> {
  const rows = await db
    .select({
      id: schema.courses.id,
      title: schema.courses.title,
      slug: schema.courses.slug,
      description: schema.courses.description,
      level: schema.courses.level,
      coverImage: schema.courses.coverImage,
      status: schema.courses.status,
    })
    .from(schema.courses)
    .where(and(eq(schema.courses.id, id), isNull(schema.courses.deletedAt)))
    .limit(1);

  return rows[0] ?? null;
}

export type CourseLesson = {
  id: string;
  title: string;
  kind: "video" | "text" | "pdf";
  videoUrl: string | null;
  content: string | null;
  duration: number | null;
  order: number;
};

export type CourseModule = {
  id: string;
  title: string;
  order: number;
  lessons: CourseLesson[];
};

export type CourseDetail = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  level: string | null;
  coverImage: string | null;
  ustadzName: string | null;
  createdAt: Date;
  modules: CourseModule[];
};

/** Detail satu kursus by slug (published & aktif) + modul + pelajaran terurut. Null bila tidak ada. */
export async function getCourseBySlug(slug: string): Promise<CourseDetail | null> {
  const courseRows = await db
    .select({
      id: schema.courses.id,
      title: schema.courses.title,
      slug: schema.courses.slug,
      description: schema.courses.description,
      level: schema.courses.level,
      coverImage: schema.courses.coverImage,
      ustadzName: schema.ustadzProfiles.name,
      createdAt: schema.courses.createdAt,
    })
    .from(schema.courses)
    .leftJoin(schema.ustadzProfiles, eq(schema.ustadzProfiles.id, schema.courses.ustadzId))
    .where(
      and(
        eq(schema.courses.slug, slug),
        eq(schema.courses.status, "published"),
        isNull(schema.courses.deletedAt),
      ),
    )
    .limit(1);

  const course = courseRows[0];
  if (!course) return null;

  const moduleRows = await db
    .select({
      id: schema.courseModules.id,
      title: schema.courseModules.title,
      order: schema.courseModules.order,
    })
    .from(schema.courseModules)
    .where(
      and(eq(schema.courseModules.courseId, course.id), isNull(schema.courseModules.deletedAt)),
    )
    .orderBy(asc(schema.courseModules.order));

  const moduleIds = moduleRows.map((m) => m.id);

  const lessonRows = moduleIds.length
    ? await db
        .select({
          id: schema.courseLessons.id,
          moduleId: schema.courseLessons.moduleId,
          title: schema.courseLessons.title,
          kind: schema.courseLessons.kind,
          videoUrl: schema.courseLessons.videoUrl,
          content: schema.courseLessons.content,
          duration: schema.courseLessons.duration,
          order: schema.courseLessons.order,
        })
        .from(schema.courseLessons)
        .where(isNull(schema.courseLessons.deletedAt))
        .orderBy(asc(schema.courseLessons.order))
    : [];

  const modules: CourseModule[] = moduleRows.map((m) => ({
    id: m.id,
    title: m.title,
    order: m.order,
    lessons: lessonRows
      .filter((l) => l.moduleId === m.id)
      .map((l) => ({
        id: l.id,
        title: l.title,
        kind: l.kind,
        videoUrl: l.videoUrl,
        content: l.content,
        duration: l.duration,
        order: l.order,
      })),
  }));

  return { ...course, modules };
}

export type EventListItem = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  kind: "webinar" | "offline" | "hybrid";
  coverImage: string | null;
  startAt: Date | null;
  endAt: Date | null;
  location: string | null;
  onlineUrl: string | null;
  capacity: number | null;
  needsRegistration: boolean;
  organizerName: string | null;
  registeredCount: number;
};

/** Daftar event/webinar yang sudah dipublikasi (terdekat dulu) + nama penyelenggara & jumlah pendaftar. */
export async function listEvents(): Promise<EventListItem[]> {
  const rows = await db
    .select({
      id: schema.events.id,
      title: schema.events.title,
      slug: schema.events.slug,
      description: schema.events.description,
      kind: schema.events.kind,
      coverImage: schema.events.coverImage,
      startAt: schema.events.startAt,
      endAt: schema.events.endAt,
      location: schema.events.location,
      onlineUrl: schema.events.onlineUrl,
      capacity: schema.events.capacity,
      needsRegistration: schema.events.needsRegistration,
      organizerType: schema.events.organizerType,
      organizerName: schema.businessPartners.name,
    })
    .from(schema.events)
    .leftJoin(
      schema.businessPartners,
      eq(schema.businessPartners.id, schema.events.organizerId),
    )
    .where(and(eq(schema.events.status, "published"), isNull(schema.events.deletedAt)))
    .orderBy(asc(schema.events.startAt));

  if (rows.length === 0) return [];

  // Hitung pendaftar aktif per event.
  const regCounts = await db
    .select({
      eventId: schema.eventRegistrations.eventId,
      total: count(schema.eventRegistrations.id),
    })
    .from(schema.eventRegistrations)
    .where(isNull(schema.eventRegistrations.deletedAt))
    .groupBy(schema.eventRegistrations.eventId);

  const countMap = new Map(regCounts.map((r) => [r.eventId, Number(r.total)]));

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    description: r.description,
    kind: r.kind,
    coverImage: r.coverImage,
    startAt: r.startAt,
    endAt: r.endAt,
    location: r.location,
    onlineUrl: r.onlineUrl,
    capacity: r.capacity,
    needsRegistration: r.needsRegistration,
    organizerName: r.organizerType === "internal" ? "Blitar Mengaji" : r.organizerName,
    registeredCount: countMap.get(r.id) ?? 0,
  }));
}
