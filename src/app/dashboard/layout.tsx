import { Sidebar } from "@/components/layout/Sidebar";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="lg:ml-[260px] min-h-screen">
        <header className="sticky top-0 z-40 flex h-14 items-center border-b border-qy-border bg-qy-bg/80 backdrop-blur-sm px-6 pl-14 lg:pl-6">
          <Breadcrumbs />
        </header>
        <div className="p-4 lg:p-6">{children}</div>
      </main>
    </div>
  );
}
