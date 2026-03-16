import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import AdminCourseManager from "@/components/AdminCourseManager";
import AdminSignOutButton from "@/components/AdminSignOutButton";
import { authOptions } from "@/lib/auth";

export default async function AdminCoursesPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Admin Panel
            </p>
            <h1 className="text-2xl font-semibold">Manage Courses</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-400"
            >
              Back to Admin
            </Link>
            <Link
              href="/"
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-400"
            >
              Student View
            </Link>
            <AdminSignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-6 py-10">
        <AdminCourseManager />
      </main>
    </div>
  );
}
