import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { GitHubLoginButton } from "@/components/github-login-button";
import { SignOutButton } from "@/components/sign-out-button";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const userLabel = session?.user
    ? session.user.name || session.user.email
    : "Você não está logado";

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-white to-slate-200 p-6">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white/90 p-8 shadow-xl shadow-slate-200/80 backdrop-blur">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Better Auth Demo
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">Hello World</h1>
        <p className="mt-5 text-lg text-slate-700">
          {session ? `Logado como ${userLabel}` : "Você não está logado"}
        </p>

        <div className="mt-8 flex min-h-12 items-center justify-start">
          {!session ? (
            <GitHubLoginButton />
          ) : (
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
                Sessão ativa
              </span>
              <SignOutButton />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
