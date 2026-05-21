import { PublicHeader } from "@/components/site/public-header";
import { Footer } from "@/components/site/footer";
import { BottomNav } from "@/components/site/bottom-nav";
import { ApkBanner } from "@/components/site/apk-banner";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicHeader />
      <main className="flex-1 pb-16 lg:pb-0">{children}</main>
      <Footer />
      <BottomNav />
      <ApkBanner />
    </>
  );
}
