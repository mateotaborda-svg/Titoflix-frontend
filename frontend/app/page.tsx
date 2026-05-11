"use client";

import { FormEvent, useMemo, useState } from "react";

type Screen = "login" | "profile" | "home";

type Contenido = {
  id: number;
  titulo: string;
  tipo: "pelicula" | "serie";
  anio: number;
  descripcion?: string | null;
  clasificacion_edad: string;
};

const API_BASE = "/backend/api/v1";

export default function Home() {
  const [screen, setScreen] = useState<Screen>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [contenidos, setContenidos] = useState<Contenido[]>([]);

  const stats = useMemo(() => {
    const peliculas = contenidos.filter((item) => item.tipo === "pelicula").length;
    return { peliculas, series: contenidos.length - peliculas };
  }, [contenidos]);

  const onLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error("No pudimos iniciar sesión. Revisá tu email/contraseña.");
      }

      const data = (await response.json()) as { access_token: string };
      setToken(data.access_token);
      setScreen("profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  const enterAsGuest = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/productos/contenidos`);
      if (!response.ok) {
        throw new Error("No se pudo cargar el catálogo desde el backend.");
      }
      const data = (await response.json()) as Contenido[];
      setContenidos(data);
      setScreen("home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado cargando catálogo");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken("");
    setContenidos([]);
    setEmail("");
    setPassword("");
    setError("");
    setScreen("login");
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {screen === "login" && (
        <section className="mx-auto flex min-h-screen max-w-6xl items-center justify-center p-6">
          <form className="w-full max-w-md rounded-2xl border border-white/10 bg-black/70 p-8" onSubmit={onLogin}>
            <h1 className="mb-2 text-4xl font-black tracking-tight text-red-600">TITOFLIX</h1>
            <p className="mb-6 text-sm text-zinc-300">Iniciá sesión para conectar con el backend real.</p>
            <label className="mb-3 block text-sm">Email</label>
            <input className="mb-4 w-full rounded-md bg-zinc-900 p-3" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            <label className="mb-3 block text-sm">Contraseña</label>
            <input className="mb-6 w-full rounded-md bg-zinc-900 p-3" type="password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />
            <button className="w-full rounded-md bg-red-600 p-3 font-semibold" disabled={loading} type="submit">
              {loading ? "Entrando..." : "Entrar"}
            </button>
            {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
          </form>
        </section>
      )}

      {screen === "profile" && (
        <section className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center p-6 text-center">
          <h2 className="mb-8 text-4xl font-bold">¿Quién está mirando?</h2>
          <button className="rounded-xl border border-white/20 bg-zinc-900 px-8 py-5 text-lg hover:bg-zinc-800" onClick={enterAsGuest}>
            Entrar como invitado
          </button>
          <p className="mt-4 text-sm text-zinc-400">Token de sesión activo: {token ? "Sí" : "No"}</p>
          {error && <p className="mt-6 text-sm text-red-400">{error}</p>}
        </section>
      )}

      {screen === "home" && (
        <>
          <header className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-black/80 px-6 py-4 backdrop-blur">
            <h2 className="text-2xl font-extrabold text-red-600">TITOFLIX</h2>
            <button className="rounded bg-red-700 px-4 py-2 text-sm" onClick={logout}>Salir</button>
          </header>
          <main className="mx-auto w-full max-w-6xl p-6">
            <h3 className="text-3xl font-bold">Catálogo conectado al backend</h3>
            <p className="mt-2 text-zinc-400">Total: {contenidos.length} · Películas: {stats.peliculas} · Series: {stats.series}</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {contenidos.map((item) => (
                <article key={item.id} className="rounded-xl border border-white/10 bg-zinc-900 p-4">
                  <p className="text-xs uppercase tracking-wide text-red-400">{item.tipo} · {item.anio}</p>
                  <h4 className="mt-1 text-xl font-semibold">{item.titulo}</h4>
                  <p className="mt-2 text-sm text-zinc-300">{item.descripcion || "Sin descripción disponible."}</p>
                  <p className="mt-3 text-xs text-zinc-500">Clasificación: {item.clasificacion_edad}</p>
                </article>
              ))}
            </div>
            {contenidos.length === 0 && <p className="mt-8 text-zinc-400">No hay contenidos para mostrar por ahora.</p>}
          </main>
        </>
      )}
    </div>
  );
}
