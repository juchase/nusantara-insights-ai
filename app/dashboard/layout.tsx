import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex bg-[#faf8ff] min-h-screen">
      <Sidebar />

      <div className="flex-1 ml-64">
        <Topbar />

        <main className="pt-24 p-8 max-w-7xl mx-auto">{children}</main>
      </div>
    </div>
  );
}
