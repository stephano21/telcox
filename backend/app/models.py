from sqlalchemy import Column, String, Float, DateTime, Text, Integer, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class Cliente(Base):
    __tablename__ = "clientes"
    
    id = Column(String(50), primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False, index=True)
    telefono = Column(String(20), nullable=False)
    password_hash = Column(Text, nullable=False)
    plan_actual = Column(String(50), default="básico")  # básico, premium, ilimitado
    estado_cuenta = Column(String(20), default="activo")  # activo, suspendido, cancelado
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relaciones
    consumos = relationship("Consumo", back_populates="cliente")
    facturas = relationship("Factura", back_populates="cliente")
    saldo = relationship("Saldo", back_populates="cliente", uselist=False)

class Consumo(Base):
    __tablename__ = "consumos"
    
    id = Column(String(50), primary_key=True, index=True)
    servicio = Column(String(50), nullable=False)  # datos, minutos, sms
    cantidad = Column(Float, nullable=False)
    unidad = Column(String(20), nullable=False)  # MB, GB, minutos, unidades
    fecha = Column(DateTime, nullable=False)
    cliente_id = Column(String(50), ForeignKey("clientes.id"), nullable=False, index=True)
    tipo_consumo = Column(String(20), default="normal")  # normal, roaming, premium
    costo_unitario = Column(Float, default=0.0)
    costo_total = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relaciones
    cliente = relationship("Cliente", back_populates="consumos")

class Factura(Base):
    __tablename__ = "facturas"
    
    id = Column(String(50), primary_key=True, index=True)
    cliente_id = Column(String(50), ForeignKey("clientes.id"), nullable=False, index=True)
    numero_factura = Column(String(50), unique=True, nullable=False)
    monto_total = Column(Float, nullable=False)
    monto_subtotal = Column(Float, default=0.0)
    impuestos = Column(Float, default=0.0)
    descuentos = Column(Float, default=0.0)
    fecha_emision = Column(DateTime, nullable=False)
    fecha_vencimiento = Column(DateTime, nullable=False)
    estado = Column(String(20), default="pendiente")  # pendiente, pagada, vencida, cancelada
    metodo_pago = Column(String(50), default="")
    fecha_pago = Column(DateTime, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relaciones
    cliente = relationship("Cliente", back_populates="facturas")

class Saldo(Base):
    __tablename__ = "saldos"
    
    id = Column(String(50), primary_key=True, index=True)
    cliente_id = Column(String(50), ForeignKey("clientes.id"), unique=True, nullable=False, index=True)
    saldo_actual = Column(Float, default=0.0)
    limite_credito = Column(Float, default=0.0)
    saldo_disponible = Column(Float, default=0.0)  # saldo_actual + limite_credito
    fecha_ultima_actualizacion = Column(DateTime, nullable=False)
    moneda = Column(String(10), default="USD")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relaciones
    cliente = relationship("Cliente", back_populates="saldo")

class Plan(Base):
    __tablename__ = "planes"
    
    id = Column(String(50), primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    descripcion = Column(Text, nullable=True)
    precio_mensual = Column(Float, nullable=False)
    datos_incluidos = Column(Float, default=0.0)  # en GB
    minutos_incluidos = Column(Integer, default=0)
    sms_incluidos = Column(Integer, default=0)
    velocidad_maxima = Column(Float, default=0.0)  # en Mbps
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class ConsumoDiario(Base):
    __tablename__ = "consumos_diarios"
    
    id = Column(String(50), primary_key=True, index=True)
    cliente_id = Column(String(50), ForeignKey("clientes.id"), nullable=False, index=True)
    fecha = Column(DateTime, nullable=False)
    datos_consumidos = Column(Float, default=0.0)  # en MB
    minutos_consumidos = Column(Integer, default=0)
    sms_consumidos = Column(Integer, default=0)
    costo_total = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Índices compuestos para consultas eficientes
    __table_args__ = (
        # Índice compuesto para consultas por cliente y fecha
        {'sqlite_autoincrement': True}
    )
