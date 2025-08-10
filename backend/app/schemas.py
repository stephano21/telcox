from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum

# Enums para valores predefinidos
class EstadoCuenta(str, Enum):
    ACTIVO = "activo"
    SUSPENDIDO = "suspendido"
    CANCELADO = "cancelado"

class EstadoFactura(str, Enum):
    PENDIENTE = "pendiente"
    PAGADA = "pagada"
    VENCIDA = "vencida"
    CANCELADA = "cancelada"

class TipoServicio(str, Enum):
    DATOS = "datos"
    MINUTOS = "minutos"
    SMS = "sms"

class TipoConsumo(str, Enum):
    NORMAL = "normal"
    ROAMING = "roaming"
    PREMIUM = "premium"

# Esquemas base
class ClienteBase(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., pattern=r"^[^@]+@[^@]+\.[^@]+$")
    telefono: str = Field(..., min_length=10, max_length=20)
    plan_actual: str = Field(default="básico")
    estado_cuenta: EstadoCuenta = Field(default=EstadoCuenta.ACTIVO)

class ClienteCreate(ClienteBase):
    password: str = Field(..., min_length=6)

class ClienteUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[str] = Field(None, pattern=r"^[^@]+@[^@]+\.[^@]+$")
    telefono: Optional[str] = Field(None, min_length=10, max_length=20)
    plan_actual: Optional[str] = None
    estado_cuenta: Optional[EstadoCuenta] = None

class ClienteResponse(ClienteBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Esquemas para Consumo
class ConsumoBase(BaseModel):
    servicio: TipoServicio
    cantidad: float = Field(..., gt=0)
    unidad: str = Field(..., max_length=20)
    fecha: datetime
    tipo_consumo: TipoConsumo = Field(default=TipoConsumo.NORMAL)
    costo_unitario: float = Field(default=0.0, ge=0)
    costo_total: float = Field(default=0.0, ge=0)

class ConsumoCreate(ConsumoBase):
    cliente_id: str

class ConsumoUpdate(BaseModel):
    servicio: Optional[TipoServicio] = None
    cantidad: Optional[float] = Field(None, gt=0)
    unidad: Optional[str] = Field(None, max_length=20)
    fecha: Optional[datetime] = None
    tipo_consumo: Optional[TipoConsumo] = None
    costo_unitario: Optional[float] = Field(None, ge=0)
    costo_total: Optional[float] = Field(None, ge=0)

class ConsumoResponse(ConsumoBase):
    id: str
    cliente_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Esquemas para Factura
class FacturaBase(BaseModel):
    numero_factura: str = Field(..., max_length=50)
    monto_total: float = Field(..., gt=0)
    monto_subtotal: float = Field(default=0.0, ge=0)
    impuestos: float = Field(default=0.0, ge=0)
    descuentos: float = Field(default=0.0, ge=0)
    fecha_emision: datetime
    fecha_vencimiento: datetime
    estado: EstadoFactura = Field(default=EstadoFactura.PENDIENTE)
    metodo_pago: str = Field(default="", max_length=50)
    fecha_pago: Optional[datetime] = None

class FacturaCreate(FacturaBase):
    cliente_id: str

class FacturaUpdate(BaseModel):
    monto_total: Optional[float] = Field(None, gt=0)
    monto_subtotal: Optional[float] = Field(None, ge=0)
    impuestos: Optional[float] = Field(None, ge=0)
    descuentos: Optional[float] = Field(None, ge=0)
    estado: Optional[EstadoFactura] = None
    metodo_pago: Optional[str] = Field(None, max_length=50)
    fecha_pago: Optional[datetime] = None

class FacturaResponse(FacturaBase):
    id: str
    cliente_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Esquemas para Saldo
class SaldoBase(BaseModel):
    saldo_actual: float = Field(default=0.0)
    limite_credito: float = Field(default=0.0, ge=0)
    saldo_disponible: float = Field(default=0.0, ge=0)
    moneda: str = Field(default="USD", max_length=10)

class SaldoCreate(SaldoBase):
    cliente_id: str
    fecha_ultima_actualizacion: datetime

class SaldoUpdate(BaseModel):
    saldo_actual: Optional[float] = None
    limite_credito: Optional[float] = Field(None, ge=0)
    saldo_disponible: Optional[float] = Field(None, ge=0)
    moneda: Optional[str] = Field(None, max_length=10)
    fecha_ultima_actualizacion: Optional[datetime] = None

class SaldoResponse(SaldoBase):
    id: str
    cliente_id: str
    fecha_ultima_actualizacion: datetime
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Esquemas para Plan
class PlanBase(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=100)
    descripcion: Optional[str] = None
    precio_mensual: float = Field(..., gt=0)
    datos_incluidos: float = Field(default=0.0, ge=0)
    minutos_incluidos: int = Field(default=0, ge=0)
    sms_incluidos: int = Field(default=0, ge=0)
    velocidad_maxima: float = Field(default=0.0, ge=0)
    activo: bool = Field(default=True)

class PlanCreate(PlanBase):
    pass

class PlanUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=2, max_length=100)
    descripcion: Optional[str] = None
    precio_mensual: Optional[float] = Field(None, gt=0)
    datos_incluidos: Optional[float] = Field(None, ge=0)
    minutos_incluidos: Optional[int] = Field(None, ge=0)
    sms_incluidos: Optional[int] = Field(None, ge=0)
    velocidad_maxima: Optional[float] = Field(None, ge=0)
    activo: Optional[bool] = None

class PlanResponse(PlanBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Esquemas para ConsumoDiario
class ConsumoDiarioBase(BaseModel):
    fecha: datetime
    datos_consumidos: float = Field(default=0.0, ge=0)
    minutos_consumidos: int = Field(default=0, ge=0)
    sms_consumidos: int = Field(default=0, ge=0)
    costo_total: float = Field(default=0.0, ge=0)

class ConsumoDiarioCreate(ConsumoDiarioBase):
    cliente_id: str

class ConsumoDiarioResponse(ConsumoDiarioBase):
    id: str
    cliente_id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# Esquemas para Dashboard
class DashboardResumen(BaseModel):
    cliente: ClienteResponse
    saldo: SaldoResponse
    consumo_mes_actual: float
    consumo_mes_anterior: float
    facturas_pendientes: int
    facturas_vencidas: int
    total_facturas: int

class ConsumoGrafico(BaseModel):
    fecha: str
    datos: float
    minutos: int
    sms: int
    costo: float

class DashboardGraficos(BaseModel):
    consumo_diario: List[ConsumoGrafico]
    consumo_mensual: List[ConsumoGrafico]
    facturacion_mensual: List[dict]

# Esquemas para autenticación
class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: ClienteResponse

class TokenData(BaseModel):
    email: Optional[str] = None
    cliente_id: Optional[str] = None

# Esquemas para respuestas de API
class APIResponse(BaseModel):
    success: bool
    message: str
    data: Optional[dict] = None

class PaginatedResponse(BaseModel):
    items: List[dict]
    total: int
    page: int
    size: int
    pages: int
