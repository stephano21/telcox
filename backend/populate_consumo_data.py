#!/usr/bin/env python3
"""
Script para poblar la base de datos con datos de consumo, saldo y facturación
para el módulo de TelcoX
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, init_db
from app.models import Cliente, Consumo, Saldo, Factura
from datetime import datetime, timedelta
import random

def populate_consumo_data():
    """Poblar la base de datos con datos de consumo"""
    db = SessionLocal()
    
    try:
        # Obtener el cliente de prueba
        cliente = db.query(Cliente).filter(Cliente.email == "test@telcox.com").first()
        if not cliente:
            print("❌ Cliente de prueba no encontrado. Ejecuta primero create_test_user.py")
            return
        
        print(f"✅ Cliente encontrado: {cliente.nombre}")
        
        # Crear saldo para el cliente
        saldo_existente = db.query(Saldo).filter(Saldo.cliente_id == cliente.id).first()
        if not saldo_existente:
            saldo = Saldo(
                id=f"saldo_{cliente.id}",
                cliente_id=cliente.id,
                saldo_actual=150.50,
                limite_credito=500.00,
                saldo_disponible=349.50,
                moneda="USD",
                fecha_ultima_actualizacion=datetime.now(),
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            db.add(saldo)
            print("✅ Saldo creado")
        else:
            print("✅ Saldo ya existe")
        
        # Crear consumos del último mes
        consumos_existentes = db.query(Consumo).filter(Consumo.cliente_id == cliente.id).count()
        if consumos_existentes == 0:
            # Generar consumos para los últimos 30 días
            servicios = ["datos", "minutos", "sms"]
            tipos_consumo = ["incluido", "adicional"]
            
            for i in range(30):
                fecha = datetime.now() - timedelta(days=i)
                
                # Consumo de datos
                consumo_datos = Consumo(
                    id=f"consumo_datos_{cliente.id}_{i}",
                    servicio="datos",
                    cantidad=round(random.uniform(0.1, 2.5), 2),
                    unidad="GB",
                    fecha=fecha.date(),
                    cliente_id=cliente.id,
                    tipo_consumo=random.choice(tipos_consumo),
                    costo_unitario=0.05,
                    costo_total=round(random.uniform(0.01, 0.25), 2),
                    created_at=datetime.now(),
                    updated_at=datetime.now()
                )
                db.add(consumo_datos)
                
                # Consumo de minutos
                consumo_minutos = Consumo(
                    id=f"consumo_min_{cliente.id}_{i}",
                    servicio="minutos",
                    cantidad=random.randint(5, 45),
                    unidad="min",
                    fecha=fecha.date(),
                    cliente_id=cliente.id,
                    tipo_consumo=random.choice(tipos_consumo),
                    costo_unitario=0.10,
                    costo_total=round(random.uniform(0.50, 4.50), 2),
                    created_at=datetime.now(),
                    updated_at=datetime.now()
                )
                db.add(consumo_minutos)
                
                # Consumo de SMS (solo algunos días)
                if random.random() < 0.3:  # 30% de probabilidad
                    consumo_sms = Consumo(
                        id=f"consumo_sms_{cliente.id}_{i}",
                        servicio="sms",
                        cantidad=random.randint(1, 5),
                        unidad="sms",
                        fecha=fecha.date(),
                        cliente_id=cliente.id,
                        tipo_consumo=random.choice(tipos_consumo),
                        costo_unitario=0.05,
                        costo_total=round(random.uniform(0.05, 0.25), 2),
                        created_at=datetime.now(),
                        updated_at=datetime.now()
                    )
                    db.add(consumo_sms)
            
            print("✅ Consumos creados para los últimos 30 días")
        else:
            print(f"✅ Ya existen {consumos_existentes} consumos")
        
        # Crear facturas
        facturas_existentes = db.query(Factura).filter(Factura.cliente_id == cliente.id).count()
        if facturas_existentes == 0:
            # Factura del mes actual
            factura_actual = Factura(
                id=f"factura_{cliente.id}_actual",
                numero_factura=f"FAC-{datetime.now().strftime('%Y%m')}-001",
                monto_total=89.99,
                monto_subtotal=75.99,
                impuestos=14.00,
                descuentos=0.00,
                fecha_emision=datetime.now().date(),
                fecha_vencimiento=(datetime.now() + timedelta(days=15)).date(),
                estado="pendiente",
                metodo_pago="tarjeta",
                fecha_pago=None,
                cliente_id=cliente.id,
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            db.add(factura_actual)
            
            # Factura del mes anterior (pagada)
            factura_anterior = Factura(
                id=f"factura_{cliente.id}_anterior",
                numero_factura=f"FAC-{(datetime.now() - timedelta(days=30)).strftime('%Y%m')}-001",
                monto_total=89.99,
                monto_subtotal=75.99,
                impuestos=14.00,
                descuentos=0.00,
                fecha_emision=(datetime.now() - timedelta(days=30)).date(),
                fecha_vencimiento=(datetime.now() - timedelta(days=15)).date(),
                estado="pagada",
                metodo_pago="tarjeta",
                fecha_pago=(datetime.now() - timedelta(days=20)).date(),
                cliente_id=cliente.id,
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            db.add(factura_anterior)
            
            print("✅ Facturas creadas")
        else:
            print(f"✅ Ya existen {facturas_existentes} facturas")
        
        db.commit()
        print("✅ Base de datos poblada exitosamente con datos de consumo")
        
        # Mostrar resumen
        total_consumos = db.query(Consumo).filter(Consumo.cliente_id == cliente.id).count()
        total_facturas = db.query(Factura).filter(Factura.cliente_id == cliente.id).count()
        saldo = db.query(Saldo).filter(Saldo.cliente_id == cliente.id).first()
        
        print(f"\n📊 Resumen de datos creados:")
        print(f"   Cliente: {cliente.nombre}")
        print(f"   Email: {cliente.email}")
        print(f"   Plan: {cliente.plan_actual}")
        print(f"   Consumos: {total_consumos}")
        print(f"   Facturas: {total_facturas}")
        if saldo:
            print(f"   Saldo actual: ${saldo.saldo_actual}")
        
    except Exception as e:
        print(f"❌ Error poblando datos de consumo: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    try:
        # Inicializar base de datos
        init_db()
        print("Base de datos inicializada")
        
        # Poblar datos de consumo
        populate_consumo_data()
        
    except Exception as e:
        print(f"Error en el script: {e}")
        sys.exit(1)
