#!/usr/bin/env python3
"""
Script para poblar la base de datos con datos de prueba
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, init_db
from app.models import Cliente, Saldo, Plan, Consumo, Factura
from app.auth import get_password_hash
from datetime import datetime, timedelta
import random
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_test_data():
    """Crear datos de prueba completos"""
    db = SessionLocal()
    
    try:
        logger.info("Creando datos de prueba...")
        
        # Crear planes
        planes = [
            Plan(
                id="plan_basico",
                nombre="Plan Básico",
                descripcion="Plan básico con datos limitados, ideal para uso ocasional",
                precio_mensual=29.99,
                datos_incluidos=2.0,  # 2 GB
                minutos_incluidos=100,
                sms_incluidos=50,
                velocidad_maxima=10.0,
                activo=True
            ),
            Plan(
                id="plan_premium",
                nombre="Plan Premium",
                descripcion="Plan premium con datos generosos, perfecto para uso intensivo",
                precio_mensual=59.99,
                datos_incluidos=10.0,  # 10 GB
                minutos_incluidos=500,
                sms_incluidos=200,
                velocidad_maxima=50.0,
                activo=True
            ),
            Plan(
                id="plan_ilimitado",
                nombre="Plan Ilimitado",
                descripcion="Plan con datos ilimitados para usuarios exigentes",
                precio_mensual=89.99,
                datos_incluidos=0.0,  # Ilimitado
                minutos_incluidos=1000,
                sms_incluidos=500,
                velocidad_maxima=100.0,
                activo=True
            ),
            Plan(
                id="plan_familiar",
                nombre="Plan Familiar",
                descripcion="Plan compartido para toda la familia",
                precio_mensual=79.99,
                datos_incluidos=20.0,  # 20 GB
                minutos_incluidos=1000,
                sms_incluidos=500,
                velocidad_maxima=75.0,
                activo=True
            )
        ]
        
        for plan in planes:
            existing_plan = db.query(Plan).filter(Plan.id == plan.id).first()
            if not existing_plan:
                db.add(plan)
                logger.info(f"Plan creado: {plan.nombre}")
        
        # Crear clientes de prueba
        clientes_data = [
            {
                "id": "cliente_001",
                "nombre": "Juan Pérez",
                "email": "juan.perez@email.com",
                "telefono": "+1234567890",
                "plan_actual": "premium",
                "estado_cuenta": "activo"
            },
            {
                "id": "cliente_002",
                "nombre": "María García",
                "email": "maria.garcia@email.com",
                "telefono": "+1234567891",
                "plan_actual": "básico",
                "estado_cuenta": "activo"
            },
            {
                "id": "cliente_003",
                "nombre": "Carlos López",
                "email": "carlos.lopez@email.com",
                "telefono": "+1234567892",
                "plan_actual": "ilimitado",
                "estado_cuenta": "activo"
            },
            {
                "id": "cliente_004",
                "nombre": "Ana Rodríguez",
                "email": "ana.rodriguez@email.com",
                "telefono": "+1234567893",
                "plan_actual": "familiar",
                "estado_cuenta": "activo"
            }
        ]
        
        for cliente_data in clientes_data:
            existing_cliente = db.query(Cliente).filter(Cliente.id == cliente_data["id"]).first()
            if not existing_cliente:
                cliente = Cliente(
                    id=cliente_data["id"],
                    nombre=cliente_data["nombre"],
                    email=cliente_data["email"],
                    telefono=cliente_data["telefono"],
                    password_hash=get_password_hash("password123"),
                    plan_actual=cliente_data["plan_actual"],
                    estado_cuenta=cliente_data["estado_cuenta"]
                )
                db.add(cliente)
                logger.info(f"Cliente creado: {cliente.nombre}")
        
        db.flush()  # Para obtener los IDs de los clientes
        
        # Crear saldos para cada cliente
        for cliente_data in clientes_data:
            existing_saldo = db.query(Saldo).filter(Saldo.cliente_id == cliente_data["id"]).first()
            if not existing_saldo:
                saldo_actual = random.uniform(50, 300)
                limite_credito = random.uniform(200, 1000)
                
                saldo = Saldo(
                    id=f"saldo_{cliente_data['id']}",
                    cliente_id=cliente_data["id"],
                    saldo_actual=saldo_actual,
                    limite_credito=limite_credito,
                    saldo_disponible=saldo_actual + limite_credito,
                    fecha_ultima_actualizacion=datetime.now(),
                    moneda="USD"
                )
                db.add(saldo)
                logger.info(f"Saldo creado para: {cliente_data['nombre']}")
        
        # Crear consumos de prueba para cada cliente (últimos 60 días)
        servicios = ["datos", "minutos", "sms"]
        unidades = {"datos": "MB", "minutos": "minutos", "sms": "unidades"}
        
        for cliente_data in clientes_data:
            for i in range(60):
                fecha = datetime.now() - timedelta(days=i)
                
                # Crear 1-3 consumos por día por cliente
                num_consumos = random.randint(1, 3)
                for j in range(num_consumos):
                    servicio = random.choice(servicios)
                    
                    if servicio == "datos":
                        cantidad = random.uniform(50, 500)  # 50-500 MB
                        costo_unitario = random.uniform(0.01, 0.05)
                    elif servicio == "minutos":
                        cantidad = random.randint(1, 30)
                        costo_unitario = random.uniform(0.05, 0.15)
                    else:  # SMS
                        cantidad = random.randint(1, 5)
                        costo_unitario = random.uniform(0.02, 0.08)
                    
                    costo_total = cantidad * costo_unitario
                    
                    consumo = Consumo(
                        id=f"consumo_{cliente_data['id']}_{i}_{j}_{random.randint(1000, 9999)}",
                        servicio=servicio,
                        cantidad=cantidad,
                        unidad=unidades[servicio],
                        fecha=fecha,
                        cliente_id=cliente_data["id"],
                        tipo_consumo=random.choice(["normal", "roaming", "premium"]),
                        costo_unitario=costo_unitario,
                        costo_total=costo_total
                    )
                    db.add(consumo)
        
        logger.info("Consumos de prueba creados")
        
        # Crear facturas de prueba para cada cliente (últimos 12 meses)
        for cliente_data in clientes_data:
            for i in range(12):
                fecha_emision = datetime.now() - timedelta(days=30 * i)
                fecha_vencimiento = fecha_emision + timedelta(days=15)
                
                # Obtener precio del plan del cliente
                plan = db.query(Plan).filter(Plan.id == cliente_data["plan_actual"]).first()
                monto_subtotal = plan.precio_mensual if plan else 59.99
                
                impuestos = monto_subtotal * 0.08  # 8% de impuestos
                descuentos = random.uniform(0, 15)  # Descuentos aleatorios
                monto_total = monto_subtotal + impuestos - descuentos
                
                # Las facturas más recientes están pendientes
                estado = "pendiente" if i == 0 else "pagada"
                fecha_pago = fecha_emision + timedelta(days=random.randint(1, 10)) if estado == "pagada" else None
                
                factura = Factura(
                    id=f"factura_{cliente_data['id']}_{i}_{random.randint(1000, 9999)}",
                    cliente_id=cliente_data["id"],
                    numero_factura=f"FAC-{cliente_data['id']}-{fecha_emision.strftime('%Y%m')}-{random.randint(1000, 9999)}",
                    monto_total=monto_total,
                    monto_subtotal=monto_subtotal,
                    impuestos=impuestos,
                    descuentos=descuentos,
                    fecha_emision=fecha_emision,
                    fecha_vencimiento=fecha_vencimiento,
                    estado=estado,
                    metodo_pago="tarjeta" if estado == "pagada" else "",
                    fecha_pago=fecha_pago
                )
                db.add(factura)
        
        logger.info("Facturas de prueba creadas")
        
        db.commit()
        logger.info("✅ Base de datos poblada exitosamente con datos de prueba")
        
    except Exception as e:
        logger.error(f"❌ Error creando datos de prueba: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    try:
        # Inicializar base de datos
        init_db()
        logger.info("Base de datos inicializada")
        
        # Crear datos de prueba
        create_test_data()
        
    except Exception as e:
        logger.error(f"Error en el script: {e}")
        sys.exit(1)
