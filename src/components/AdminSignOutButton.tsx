"use client";

import { signOut } from "next-auth/react";

export default function AdminSignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/admin/login" })}
      className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
    >
      Sign out
    </button>
  );
}
