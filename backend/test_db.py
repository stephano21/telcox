#!/usr/bin/env python3
"""
Script de prueba para verificar la creación de tablas en PostgreSQL
"""
import sys
import os

# Agregar el directorio raíz al path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, Base
from app.models import Cliente, Consumo, Factura, Saldo

def test_create_tables():
    """Probar la creación de tablas"""
    try:
        print("🚀 Probando creación de tablas...")
        
        # Crear todas las tablas
        Base.metadata.create_all(bind=engine)
        print("✅ Tablas creadas correctamente")
        
        # Verificar que las tablas existen
        from sqlalchemy import inspect
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        print(f"📋 Tablas creadas: {tables}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creando tablas: {e}")
        return False

if __name__ == "__main__":
    test_create_tables()
