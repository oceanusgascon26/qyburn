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
      <main className="ml-[260px] min-h-screen">
        <header className="sticky top-0 z-40 flex h-14 items-center border-b border-qy-border bg-qy-bg/80 backdrop-blur-sm px-6">
          <Breadcrumbs />
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
