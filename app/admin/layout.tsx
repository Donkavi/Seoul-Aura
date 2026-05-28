import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Sidebar from "@/components/admin/Sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!(session?.user as any)?.isAdmin) {
    redirect("/");
  }

  return (
    <div className="flex bg-ink-50 min-h-screen">
      <Sidebar />
      <div className="flex-1 overflow-x-hidden">{children}</div>
    </div>
  );
}
