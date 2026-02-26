"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Flame, LogIn, AlertCircle } from "lucide-react";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid credentials. In stub mode, use any email with password \"admin\".");
      setLoading(false);
    } else {
      router.push(callbackUrl);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-qyburn-700 mb-4">
            <Flame className="h-8 w-8 text-wildfire-400" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Qyburn
          </h1>
          <p className="text-sm text-silver-400 mt-2">
            IT Self-Service Admin Dashboard
          </p>
          <p className="text-xs text-qyburn-400 mt-1">SAGA Diagnostics</p>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="qy-card space-y-5">
          <div>
            <label className="block text-sm font-medium text-silver-300 mb-1.5">
              Email
            </label>
            <input
              type="email"
              required
              className="qy-input"
              placeholder="you@saga.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-silver-300 mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              className="qy-input"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 text-sm text-red-400 bg-red-900/20 border border-red-800/40 rounded-lg p-3">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="qy-btn-primary w-full"
            disabled={loading}
          >
            <LogIn className="h-4 w-4" />
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <p className="text-xs text-center text-silver-500">
            Stub mode: use any email with password &quot;admin&quot;
          </p>
        </form>
      </div>
    </div>
  );
}
