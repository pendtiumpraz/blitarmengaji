import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { OrnDivider } from "@/components/ui/orn-divider";
import { listBusinessPartners, listMediaPartners } from "@/lib/queries/lapak";
import { PartnerTabs } from "./tabs";

export const dynamic = "force-dynamic";

export const metadata = { title: "Partner" };

export default async function PartnerPage() {
  const [media, usaha] = await Promise.all([listMediaPartners(), listBusinessPartners()]);

  return (
    <>
      {/* HERO RINGKAS */}
      <section className="relative overflow-hidden bg-brand-600 text-cream">
        <div className="pat-girih-light absolute inset-0" />
        <Container className="relative z-10 py-14 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-gold-light/85">
            Ukhuwah &amp; Sinergi
          </p>
          <h1 className="display mx-auto mt-3 max-w-[18ch] text-4xl leading-[1.08] text-[#FBF4E2] md:text-5xl">
            Partner &amp; Media
          </h1>
          <p className="mx-auto mt-5 max-w-[54ch] text-[16px] leading-relaxed text-cream/80">
            Media partner penyiaran dakwah dan usaha jamaah yang bersinergi menyebarkan kebaikan di
            Blitar Raya.
          </p>
        </Container>
      </section>

      <OrnDivider className="mt-14" />

      <Container className="py-12">
        <SectionHeading
          eyebrow="Direktori"
          title="Mitra Dakwah Kami"
          subtitle="Telusuri media partner dan partner usaha terverifikasi yang turut menghidupkan majelis ilmu."
          className="mb-9"
        />
        <PartnerTabs media={media} usaha={usaha} />
      </Container>
    </>
  );
}
