# Titoflix Frontend (Next.js)

Panel frontend para operar el backend de Titoflix.

## Levantar entorno

1. Backend en `http://127.0.0.1:8000`.
2. Frontend:

```bash
cd frontend
npm install
npm run dev
```

Abrir `http://localhost:3000`.

## Login demo

Si el backend está con seed activo:

- Email: `pati@titoflix.local`
- Password: `12345678`

## Flujo para subir Películas y Series

El dashboard usa endpoints reales del backend (`/backend/api/v1/...` vía rewrite).

### 1) Crear Género
- Form: **Crear género**.
- Endpoint: `POST /productos/generos?nombre=<nombre>`.

### 2) Crear Contenido (Película o Serie)
- Form: **Crear película o serie**.
- Endpoint: `POST /productos/contenidos`.
- Campos clave:
  - `tipo`: `pelicula` o `serie`
  - `generos_ids`: lista de IDs de géneros
  - Para `pelicula` enviar `duracion_min`
  - Para `serie` enviar `duracion_min = null`

### 3) Si es Serie, cargar Temporadas
- Form: **Cargar temporada**.
- Endpoint: `POST /productos/temporadas`.
- Requiere `contenido_id` de una serie existente.

### 4) Cargar Episodios
- Form: **Cargar episodio**.
- Endpoint: `POST /productos/episodios`.
- Requiere `temporada_id` creado en el paso anterior.

## Notas

- El catálogo y los géneros se refrescan desde backend tras cada alta.
- El frontend muestra feedback de éxito/error en pantalla.
- Si cambiás backend host/puerto, podés usar `NEXT_PUBLIC_BACKEND_URL` en `frontend/next.config.ts`.
