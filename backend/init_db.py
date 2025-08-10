#!/usr/bin/env python3
"""
Script para inicializar la base de datos PostgreSQL
"""
import sys
import os

# Agregar el directorio raíz al path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import init_db
from app.config import settings

def main():
    """Función principal para inicializar la base de datos"""
    print("🚀 Inicializando base de datos PostgreSQL...")
    print(f"📊 URL de conexión: {settings.database_url}")
    
    try:
        init_db()
        print("✅ Base de datos inicializada correctamente")
        print("📋 Tablas creadas:")
        print("   - clientes")
        print("   - consumos") 
        print("   - facturas")
        print("   - saldos")
        print("👤 Cliente de prueba creado:")
        print("   - Email: juan.perez@email.com")
        print("   - Contraseña: password123")
        
    except Exception as e:
        print(f"❌ Error inicializando la base de datos: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
