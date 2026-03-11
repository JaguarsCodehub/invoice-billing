import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background print:h-auto print:overflow-visible print:bg-white print:block">
      <div className="print:hidden shrink-0">
        <Sidebar />
      </div>
      <div className="flex flex-col flex-1 overflow-hidden print:overflow-visible print:block">
        <div className="print:hidden">
          <Header />
        </div>
        <main className="flex-1 overflow-auto bg-slate-50/50 p-6 print:overflow-visible print:bg-white print:p-0">
          {children}
        </main>
      </div>
    </div>
  );
}
