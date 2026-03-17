"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/admin",
    });

    if (!result || result.error) {
      setError("Invalid credentials.");
      setLoading(false);
      return;
    }

    window.location.href = result.url ?? "/admin";
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-slate-900">
      <div className="w-full max-w-md space-y-6 rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Admin Access
          </p>
          <h1 className="text-2xl font-semibold">Sign in</h1>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              type="email"
              required
              className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              type="password"
              required
              className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">
          Back to student view
        </Link>
      </div>
    </div>
  );
}
