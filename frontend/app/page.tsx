"use client";

import { FormEvent, useMemo, useState } from "react";

type Screen = "login" | "dashboard";

type ApiError = { detail?: string };

type AuthToken = { access_token: string; token_type: string };

type Genero = { id: number; nombre: string };

type Contenido = {
  id: number;
  titulo: string;
  tipo: "pelicula" | "serie";
  anio: number;
  descripcion?: string | null;
  duracion_min?: number | null;
  clasificacion_edad: "ATP" | "+13" | "+16" | "+18";
  generos: Genero[];
  promedio_calificaciones?: number | null;
};

type Temporada = { id: number; contenido_id: number; numero: number; anio: number };
type Episodio = { id: number; temporada_id: number; numero: number; titulo: string; duracion_min: number };

const API_BASE = "/backend/api/v1";

const defaultContenido = {
  titulo: "",
  tipo: "pelicula" as "pelicula" | "serie",
  anio: new Date().getFullYear(),
  descripcion: "",
  duracion_min: "",
  clasificacion_edad: "ATP" as "ATP" | "+13" | "+16" | "+18",
  generos_ids: "",
};

async function parseError(response: Response) {
  let detail = "Error inesperado";
  try {
    const data = (await response.json()) as ApiError;
    detail = data?.detail ?? detail;
  } catch {
    detail = response.statusText || detail;
  }
  return detail;
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("login");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [flash, setFlash] = useState<{ type: "ok" | "error"; msg: string } | null>(null);

  const [email, setEmail] = useState("pati@titoflix.local");
  const [password, setPassword] = useState("12345678");

  const [generos, setGeneros] = useState<Genero[]>([]);
  const [contenidos, setContenidos] = useState<Contenido[]>([]);

  const [nuevoGenero, setNuevoGenero] = useState("");
  const [contenidoForm, setContenidoForm] = useState(defaultContenido);

  const [temporadaForm, setTemporadaForm] = useState({ contenido_id: "", numero: 1, anio: new Date().getFullYear() });
  const [episodioForm, setEpisodioForm] = useState({ temporada_id: "", numero: 1, titulo: "", duracion_min: 45 });
  const [temporadas, setTemporadas] = useState<Temporada[]>([]);
  const [episodios, setEpisodios] = useState<Episodio[]>([]);

  const stats = useMemo(() => {
    const peliculas = contenidos.filter((c) => c.tipo === "pelicula").length;
    return { total: contenidos.length, peliculas, series: contenidos.length - peliculas };
  }, [contenidos]);

  const setError = (msg: string) => setFlash({ type: "error", msg });
  const setOk = (msg: string) => setFlash({ type: "ok", msg });

  const request = async <T,>(url: string, init?: RequestInit): Promise<T> => {
    const response = await fetch(`${API_BASE}${url}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers ?? {}),
      },
    });
    if (!response.ok) throw new Error(await parseError(response));
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  };

  const loadDashboard = async () => {
    const [dataGeneros, dataContenidos] = await Promise.all([
      request<Genero[]>("/productos/generos"),
      request<Contenido[]>("/productos/contenidos"),
    ]);
    setGeneros(dataGeneros);
    setContenidos(dataContenidos);
  };

  const onLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setFlash(null);
    try {
      const auth = await request<AuthToken>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setToken(auth.access_token);
      await loadDashboard();
      setScreen("dashboard");
      setOk("Login correcto. Panel conectado al backend.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "No se pudo iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  const createGenero = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!nuevoGenero.trim()) return;
    try {
      await request<Genero>(`/productos/generos?nombre=${encodeURIComponent(nuevoGenero.trim())}`, { method: "POST" });
      await loadDashboard();
      setNuevoGenero("");
      setOk("Género creado.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error creando género");
    }
  };

  const createContenido = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const generos_ids = contenidoForm.generos_ids
        .split(",")
        .map((v) => Number(v.trim()))
        .filter((n) => Number.isFinite(n) && n > 0);

      await request<Contenido>("/productos/contenidos", {
        method: "POST",
        body: JSON.stringify({
          titulo: contenidoForm.titulo,
          tipo: contenidoForm.tipo,
          anio: contenidoForm.anio,
          descripcion: contenidoForm.descripcion || null,
          duracion_min: contenidoForm.tipo === "pelicula" ? Number(contenidoForm.duracion_min) : null,
          clasificacion_edad: contenidoForm.clasificacion_edad,
          generos_ids,
        }),
      });
      await loadDashboard();
      setContenidoForm(defaultContenido);
      setOk("Contenido creado.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error creando contenido");
    }
  };

  const createTemporada = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const temporada = await request<Temporada>("/productos/temporadas", {
        method: "POST",
        body: JSON.stringify({
          contenido_id: Number(temporadaForm.contenido_id),
          numero: temporadaForm.numero,
          anio: temporadaForm.anio,
        }),
      });
      setTemporadas((prev) => [temporada, ...prev]);
      setOk("Temporada creada.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error creando temporada");
    }
  };

  const createEpisodio = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const episodio = await request<Episodio>("/productos/episodios", {
        method: "POST",
        body: JSON.stringify({
          temporada_id: Number(episodioForm.temporada_id),
          numero: episodioForm.numero,
          titulo: episodioForm.titulo,
          duracion_min: episodioForm.duracion_min,
        }),
      });
      setEpisodios((prev) => [episodio, ...prev]);
      setOk("Episodio creado.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error creando episodio");
    }
  };

  if (screen === "login") {
    return (
      <main className="min-h-screen bg-neutral-950 text-white grid place-items-center p-6">
        <form onSubmit={onLogin} className="w-full max-w-md rounded-2xl border border-white/10 bg-black/70 p-8 space-y-4">
          <h1 className="text-4xl font-black text-red-600 tracking-tight">TITOFLIX CMS</h1>
          <p className="text-zinc-300 text-sm">Panel de administración y catálogo conectado al backend.</p>
          <input className="w-full rounded bg-zinc-900 p-3" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="w-full rounded bg-zinc-900 p-3" placeholder="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button disabled={loading} className="w-full rounded bg-red-600 py-3 font-semibold">{loading ? "Entrando..." : "Entrar"}</button>
          {flash && <p className="text-sm text-red-300">{flash.msg}</p>}
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-black/85 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-red-600">TITOFLIX · Production Dashboard</h1>
          <p className="text-xs text-zinc-400">Total {stats.total} · Películas {stats.peliculas} · Series {stats.series}</p>
        </div>
        <button onClick={() => { setScreen("login"); setToken(""); }} className="rounded bg-red-700 px-4 py-2">Salir</button>
      </header>

      <section className="mx-auto max-w-7xl p-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <form onSubmit={createGenero} className="rounded-xl border border-white/10 bg-zinc-900/50 p-4 space-y-3">
            <h2 className="font-bold">1) Crear género</h2>
            <input className="w-full rounded bg-zinc-950 p-2" placeholder="Drama" value={nuevoGenero} onChange={(e) => setNuevoGenero(e.target.value)} />
            <button type="submit" className="rounded bg-red-600 px-3 py-2">Guardar género</button>
          </form>

          <form onSubmit={createContenido} className="rounded-xl border border-white/10 bg-zinc-900/50 p-4 space-y-3">
            <h2 className="font-bold">2) Crear película o serie</h2>
            <input className="w-full rounded bg-zinc-950 p-2" placeholder="Título" value={contenidoForm.titulo} onChange={(e) => setContenidoForm({ ...contenidoForm, titulo: e.target.value })} required />
            <div className="grid grid-cols-2 gap-2">
              <select className="rounded bg-zinc-950 p-2" value={contenidoForm.tipo} onChange={(e) => setContenidoForm({ ...contenidoForm, tipo: e.target.value as "pelicula" | "serie" })}>
                <option value="pelicula">Película</option><option value="serie">Serie</option>
              </select>
              <input className="rounded bg-zinc-950 p-2" type="number" value={contenidoForm.anio} onChange={(e) => setContenidoForm({ ...contenidoForm, anio: Number(e.target.value) })} />
            </div>
            <input className="w-full rounded bg-zinc-950 p-2" placeholder="IDs géneros (ej: 1,2)" value={contenidoForm.generos_ids} onChange={(e) => setContenidoForm({ ...contenidoForm, generos_ids: e.target.value })} required />
            {contenidoForm.tipo === "pelicula" && <input className="w-full rounded bg-zinc-950 p-2" type="number" placeholder="Duración min" value={contenidoForm.duracion_min} onChange={(e) => setContenidoForm({ ...contenidoForm, duracion_min: e.target.value })} required />}
            <textarea className="w-full rounded bg-zinc-950 p-2" placeholder="Descripción" value={contenidoForm.descripcion} onChange={(e) => setContenidoForm({ ...contenidoForm, descripcion: e.target.value })} />
            <button type="submit" className="rounded bg-red-600 px-3 py-2">Guardar contenido</button>
          </form>

          <form onSubmit={createTemporada} className="rounded-xl border border-white/10 bg-zinc-900/50 p-4 space-y-3">
            <h2 className="font-bold">3) Cargar temporada (series)</h2>
            <input className="w-full rounded bg-zinc-950 p-2" type="number" placeholder="contenido_id" value={temporadaForm.contenido_id} onChange={(e) => setTemporadaForm({ ...temporadaForm, contenido_id: e.target.value })} required />
            <div className="grid grid-cols-2 gap-2">
              <input className="rounded bg-zinc-950 p-2" type="number" placeholder="número" value={temporadaForm.numero} onChange={(e) => setTemporadaForm({ ...temporadaForm, numero: Number(e.target.value) })} />
              <input className="rounded bg-zinc-950 p-2" type="number" placeholder="año" value={temporadaForm.anio} onChange={(e) => setTemporadaForm({ ...temporadaForm, anio: Number(e.target.value) })} />
            </div>
            <button type="submit" className="rounded bg-red-600 px-3 py-2">Guardar temporada</button>
          </form>

          <form onSubmit={createEpisodio} className="rounded-xl border border-white/10 bg-zinc-900/50 p-4 space-y-3">
            <h2 className="font-bold">4) Cargar episodio</h2>
            <input className="w-full rounded bg-zinc-950 p-2" type="number" placeholder="temporada_id" value={episodioForm.temporada_id} onChange={(e) => setEpisodioForm({ ...episodioForm, temporada_id: e.target.value })} required />
            <input className="w-full rounded bg-zinc-950 p-2" type="text" placeholder="Título episodio" value={episodioForm.titulo} onChange={(e) => setEpisodioForm({ ...episodioForm, titulo: e.target.value })} required />
            <div className="grid grid-cols-2 gap-2">
              <input className="rounded bg-zinc-950 p-2" type="number" placeholder="número" value={episodioForm.numero} onChange={(e) => setEpisodioForm({ ...episodioForm, numero: Number(e.target.value) })} />
              <input className="rounded bg-zinc-950 p-2" type="number" placeholder="duración" value={episodioForm.duracion_min} onChange={(e) => setEpisodioForm({ ...episodioForm, duracion_min: Number(e.target.value) })} />
            </div>
            <button type="submit" className="rounded bg-red-600 px-3 py-2">Guardar episodio</button>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {flash && <div className={`rounded p-3 text-sm ${flash.type === "ok" ? "bg-emerald-900/40 text-emerald-200" : "bg-red-900/40 text-red-200"}`}>{flash.msg}</div>}

          <article className="rounded-xl border border-white/10 bg-zinc-900/30 p-4">
            <h3 className="font-bold mb-3">Géneros ({generos.length})</h3>
            <div className="flex flex-wrap gap-2">{generos.map((g) => <span key={g.id} className="rounded-full bg-zinc-800 px-3 py-1 text-xs">#{g.id} {g.nombre}</span>)}</div>
          </article>

          <article className="rounded-xl border border-white/10 bg-zinc-900/30 p-4">
            <h3 className="font-bold mb-3">Catálogo</h3>
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {contenidos.map((c) => (
                <div key={c.id} className="rounded-lg border border-white/10 bg-zinc-900 p-3">
                  <p className="text-xs text-red-400 uppercase">{c.tipo} · {c.anio}</p>
                  <p className="font-semibold">#{c.id} {c.titulo}</p>
                  <p className="text-xs text-zinc-300 mt-1">{c.descripcion || "Sin descripción"}</p>
                  <p className="text-xs text-zinc-500 mt-2">{c.generos.map((g) => g.nombre).join(", ") || "Sin géneros"}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-xl border border-white/10 bg-zinc-900/30 p-4">
            <h3 className="font-bold">Últimas temporadas/episodios creados en esta sesión</h3>
            <p className="mt-2 text-sm text-zinc-400">Temporadas: {temporadas.length} · Episodios: {episodios.length}</p>
          </article>
        </div>
      </section>
    </main>
  );
}
