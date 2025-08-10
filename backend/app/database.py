from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import settings
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Crear engine de base de datos
engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    pool_recycle=300,
    echo=settings.debug
)

# Crear sesión local
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para los modelos
Base = declarative_base()

def get_db():
    """Dependencia para obtener sesión de base de datos"""
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"Error en sesión de BD: {e}")
        db.rollback()
        raise
    finally:
        db.close()

def init_db():
    """Inicializar base de datos y crear tablas"""
    try:
        # Importar todos los modelos para que SQLAlchemy los reconozca
        from . import models
        
        # Crear todas las tablas
        Base.metadata.create_all(bind=engine)
        logger.info("Base de datos inicializada correctamente")
        
    except Exception as e:
        logger.error(f"Error inicializando BD: {e}")
        raise

def create_initial_data():
    """Crear datos iniciales de prueba"""
    from .auth import get_password_hash
    from .models import Cliente, Saldo, Plan, Consumo, Factura
    from datetime import datetime, timedelta
    import random
    
    db = SessionLocal()
    try:
        # Verificar si ya existen clientes
        existing_cliente = db.query(Cliente).first()
        if existing_cliente:
            logger.info("Datos iniciales ya existen, saltando creación")
            return
        
        # Crear planes de prueba
        planes = [
            Plan(
                id="plan_basico",
                nombre="Plan Básico",
                descripcion="Plan básico con datos limitados",
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
                descripcion="Plan premium con datos ilimitados",
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
                descripcion="Plan con datos ilimitados",
                precio_mensual=89.99,
                datos_incluidos=0.0,  # Ilimitado
                minutos_incluidos=1000,
                sms_incluidos=500,
                velocidad_maxima=100.0,
                activo=True
            )
        ]
        
        for plan in planes:
            db.add(plan)
        
        # Crear cliente de prueba
        cliente_prueba = Cliente(
            id="cliente_001",
            nombre="Juan Pérez",
            email="juan.perez@email.com",
            telefono="+1234567890",
            password_hash=get_password_hash("password123"),
            plan_actual="premium",
            estado_cuenta="activo",
            created_at=datetime.now()
        )
        
        db.add(cliente_prueba)
        db.flush()  # Para obtener el ID del cliente
        
        # Crear saldo inicial
        saldo_inicial = Saldo(
            id="saldo_001",
            cliente_id=cliente_prueba.id,
            saldo_actual=150.0,
            limite_credito=500.0,
            saldo_disponible=650.0,
            fecha_ultima_actualizacion=datetime.now(),
            moneda="USD"
        )
        
        db.add(saldo_inicial)
        
        # Crear consumos de prueba (últimos 30 días)
        servicios = ["datos", "minutos", "sms"]
        unidades = {"datos": "MB", "minutos": "minutos", "sms": "unidades"}
        
        for i in range(30):
            fecha = datetime.now() - timedelta(days=i)
            for servicio in servicios:
                if random.random() < 0.7:  # 70% de probabilidad de tener consumo
                    cantidad = random.uniform(10, 100) if servicio == "datos" else random.randint(1, 10)
                    costo_unitario = random.uniform(0.01, 0.1) if servicio == "datos" else random.uniform(0.05, 0.2)
                    costo_total = cantidad * costo_unitario
                    
                    consumo = Consumo(
                        id=f"consumo_{i}_{servicio}_{random.randint(1000, 9999)}",
                        servicio=servicio,
                        cantidad=cantidad,
                        unidad=unidades[servicio],
                        fecha=fecha,
                        cliente_id=cliente_prueba.id,
                        tipo_consumo="normal",
                        costo_unitario=costo_unitario,
                        costo_total=costo_total
                    )
                    db.add(consumo)
        
        # Crear facturas de prueba
        for i in range(6):  # Últimos 6 meses
            fecha_emision = datetime.now() - timedelta(days=30 * i)
            fecha_vencimiento = fecha_emision + timedelta(days=15)
            
            # Calcular monto basado en el plan
            monto_subtotal = 59.99  # Plan premium
            impuestos = monto_subtotal * 0.08  # 8% de impuestos
            descuentos = random.uniform(0, 10)  # Descuentos aleatorios
            monto_total = monto_subtotal + impuestos - descuentos
            
            estado = "pagada" if i > 0 else "pendiente"
            fecha_pago = fecha_emision + timedelta(days=random.randint(1, 10)) if estado == "pagada" else None
            
            factura = Factura(
                id=f"factura_{i}_{random.randint(1000, 9999)}",
                cliente_id=cliente_prueba.id,
                numero_factura=f"FAC-{fecha_emision.strftime('%Y%m')}-{random.randint(1000, 9999)}",
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
        
        db.commit()
        logger.info("Datos iniciales creados correctamente")
        
    except Exception as e:
        logger.error(f"Error creando datos iniciales: {e}")
        db.rollback()
        raise
    finally:
        db.close()

def init_initial_data():
    """Inicializar datos iniciales después de que las tablas estén creadas"""
    try:
        create_initial_data()
    except Exception as e:
        logger.error(f"Error creando datos iniciales: {e}")
        # No lanzar excepción aquí, solo loggear el error
