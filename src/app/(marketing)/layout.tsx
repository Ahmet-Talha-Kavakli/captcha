import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-clip bg-white text-veylify-950">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
