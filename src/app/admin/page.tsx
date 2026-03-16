import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import AdminSignOutButton from "@/components/AdminSignOutButton";
import AdminUploadForm from "@/components/AdminUploadForm";
import { authOptions } from "@/lib/auth";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Admin Panel
            </p>
            <h1 className="text-2xl font-semibold">Data Import</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-400"
            >
              Back to Student View
            </Link>
            <Link
              href="/admin/courses"
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-400"
            >
              Manage Courses
            </Link>
            <AdminSignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-6 py-10">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Upload Excel</h2>
          <p className="mt-2 text-sm text-slate-600">
            Upload the latest Excel file to replace the database contents. This
            is useful when the program data changes.
          </p>
          <div className="mt-6">
            <AdminUploadForm />
          </div>
        </div>
      </main>
    </div>
  );
}
