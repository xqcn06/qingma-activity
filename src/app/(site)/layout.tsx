import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BottomTab from "@/components/layout/BottomTab";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="min-h-screen pb-16 lg:pb-0">{children}</main>
      <Footer />
      <BottomTab />
    </>
  );
}
