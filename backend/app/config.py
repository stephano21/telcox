import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Configuración de la aplicación
    app_name: str = "Telcox Consumo API"
    app_version: str = "1.0.0"
    debug: bool = False

    # Configuración del servidor
    host: str = "0.0.0.0"
    port: int = 8000

    # Configuración de base de datos
    database_url: str = "postgresql://telcox_user:telcox_password@postgres:5432/telcox_db"

    # Configuración de JWT
    secret_key: str = "telcox_secret_key_2024_change_in_production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440  # 24 horas

    # Configuración de CORS
    allowed_origins: list = ["http://localhost:5173", "http://localhost:3000"]

    class Config:
        env_file = ".env"
        case_sensitive = False

# Instancia global de configuración
settings = Settings()
