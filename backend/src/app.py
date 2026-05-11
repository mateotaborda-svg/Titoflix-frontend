from contextlib import asynccontextmanager                         # Utilidad para ciclo de vida de FastAPI

from fastapi import FastAPI                                     # Importa el framework FastAPI

from src.db.connection import Base, SessionLocal, engine        # Conexión y sesión de BD
from src.db.models import Cuenta, Perfil                        # Registra modelos y permite seed
from src.middlewares import app_error_handler                   # Importa el manejador global de errores
from src.routers import auth_router, product_router, user_router # Importa los routers de la API
from src.utils.errors import AppError                           # Importa la excepción base de la app
from src.utils.hash import hash_password                        # Utilidad para hash de contraseñas


API_PREFIX = "/api/v1"                                          # Define el prefijo de versión de la API
DEFAULT_EMAIL = "pati@titoflix.local"                           # Usuario default para pruebas
DEFAULT_PASSWORD = "12345678"                                   # Password default para pruebas
DEFAULT_PLAN = "premium"                                         # Plan default para cuenta semilla
DEFAULT_PROFILE_NAME = "Invitado"                               # Perfil default para la cuenta semilla


def ensure_default_user() -> None:
    """Crea un usuario/perfil de prueba si no existen."""
    db = SessionLocal()
    try:
        existing = db.query(Cuenta).filter(Cuenta.email == DEFAULT_EMAIL).first()
        if existing:
            return

        cuenta = Cuenta(
            email=DEFAULT_EMAIL,
            password_hash=hash_password(DEFAULT_PASSWORD),
            plan=DEFAULT_PLAN,
        )
        db.add(cuenta)
        db.flush()

        perfil = Perfil(cuenta_id=cuenta.id, nombre=DEFAULT_PROFILE_NAME)
        db.add(perfil)
        db.commit()
    finally:
        db.close()


@asynccontextmanager
def lifespan(_: FastAPI):
    """Inicializa tablas y usuario de prueba en el arranque."""
    Base.metadata.create_all(bind=engine)
    ensure_default_user()
    yield


app = FastAPI(title="Titoflix API", version="1.0.0", lifespan=lifespan) # Inicializa la aplicación FastAPI

app.add_exception_handler(AppError, app_error_handler)          # Registra el middleware de errores

app.include_router(auth_router.router, prefix=API_PREFIX)       # Incluye rutas de autenticación
app.include_router(user_router.router, prefix=API_PREFIX)       # Incluye rutas de usuarios y perfiles
app.include_router(product_router.router, prefix=API_PREFIX)    # Incluye rutas de catálogo y productos


@app.get("/health")                                             # Define endpoint de verificación de estado
def health():                                                   # Función de chequeo de salud
    return {
        "status": "ok",
        "default_user": {
            "email": DEFAULT_EMAIL,
            "password": DEFAULT_PASSWORD,
        },
    }                                                           # Retorna estado exitoso + credenciales de prueba
