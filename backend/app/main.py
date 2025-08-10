from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import uuid
import logging
from sqlalchemy import func

from .database import get_db, init_db
from .models import Cliente, Consumo, Factura, Saldo, Plan, ConsumoDiario
from .schemas import (
    ClienteCreate, ClienteResponse, ClienteUpdate,
    ConsumoCreate, ConsumoResponse, ConsumoUpdate,
    FacturaCreate, FacturaResponse, FacturaUpdate,
    SaldoCreate, SaldoResponse, SaldoUpdate,
    PlanCreate, PlanResponse, PlanUpdate,
    ConsumoDiarioCreate, ConsumoDiarioResponse,
    DashboardResumen, DashboardGraficos, ConsumoGrafico,
    LoginRequest, LoginResponse, APIResponse, PaginatedResponse
)
from .auth import get_current_user, create_access_token, get_password_hash, verify_password

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Crear aplicación FastAPI
app = FastAPI(
    title="Telcox Consumo API",
    description="API para gestión de consumo de servicios de telecomunicaciones",
    version="1.0.0"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configurar seguridad
security = HTTPBearer()

# Evento de inicio
@app.on_event("startup")
async def startup_event():
    logger.info("Iniciando aplicación Telcox...")
    try:
        init_db()
        logger.info("Base de datos inicializada correctamente")
        
        # Inicializar datos de prueba
        from .database import init_initial_data
        init_initial_data()
        logger.info("Datos iniciales creados correctamente")
        
    except Exception as e:
        logger.error(f"Error inicializando BD: {e}")

# ============================================================================
# ENDPOINTS DE AUTENTICACIÓN
# ============================================================================

@app.post("/auth/login", response_model=LoginResponse)
async def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """Iniciar sesión de usuario"""
    try:
        # Buscar cliente por email
        cliente = db.query(Cliente).filter(Cliente.email == login_data.email).first()
        if not cliente:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciales inválidas"
            )
        
        # Verificar contraseña
        if not verify_password(login_data.password, cliente.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciales inválidas"
            )
        
        # Crear token de acceso
        access_token = create_access_token(
            data={"sub": cliente.email, "cliente_id": cliente.id}
        )
        
        return LoginResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=1440,  # 24 horas
            user=ClienteResponse.from_orm(cliente)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error en login: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )

@app.post("/auth/register", response_model=ClienteResponse)
async def register(cliente_data: ClienteCreate, db: Session = Depends(get_db)):
    """Registrar nuevo cliente"""
    try:
        # Verificar si el email ya existe
        existing_cliente = db.query(Cliente).filter(Cliente.email == cliente_data.email).first()
        if existing_cliente:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El email ya está registrado"
            )
        
        # Crear nuevo cliente
        cliente_id = f"cliente_{uuid.uuid4().hex[:8]}"
        password_hash = get_password_hash(cliente_data.password)
        
        nuevo_cliente = Cliente(
            id=cliente_id,
            nombre=cliente_data.nombre,
            email=cliente_data.email,
            telefono=cliente_data.telefono,
            password_hash=password_hash,
            plan_actual=cliente_data.plan_actual,
            estado_cuenta=cliente_data.estado_cuenta
        )
        
        db.add(nuevo_cliente)
        db.commit()
        db.refresh(nuevo_cliente)
        
        return ClienteResponse.from_orm(nuevo_cliente)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error en registro: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )

# ============================================================================
# ENDPOINTS DEL DASHBOARD
# ============================================================================

@app.get("/dashboard/resumen", response_model=DashboardResumen)
async def get_dashboard_resumen(
    current_user: Cliente = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener resumen del dashboard para el usuario autenticado"""
    try:
        # Obtener saldo del cliente
        saldo = db.query(Saldo).filter(Saldo.cliente_id == current_user.id).first()
        if not saldo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Saldo no encontrado"
            )
        
        # Calcular consumo del mes actual
        fecha_inicio_mes = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        consumo_mes_actual = db.query(Consumo).filter(
            Consumo.cliente_id == current_user.id,
            Consumo.fecha >= fecha_inicio_mes
        ).with_entities(func.sum(Consumo.cantidad)).scalar() or 0.0
        
        # Calcular consumo del mes anterior
        fecha_inicio_mes_anterior = (fecha_inicio_mes - timedelta(days=1)).replace(day=1)
        fecha_fin_mes_anterior = fecha_inicio_mes - timedelta(seconds=1)
        consumo_mes_anterior = db.query(Consumo).filter(
            Consumo.cliente_id == current_user.id,
            Consumo.fecha >= fecha_inicio_mes_anterior,
            Consumo.fecha <= fecha_fin_mes_anterior
        ).with_entities(func.sum(Consumo.cantidad)).scalar() or 0.0
        
        # Contar facturas
        facturas_pendientes = db.query(Factura).filter(
            Factura.cliente_id == current_user.id,
            Factura.estado == "pendiente"
        ).count()
        
        facturas_vencidas = db.query(Factura).filter(
            Factura.cliente_id == current_user.id,
            Factura.estado == "vencida"
        ).count()
        
        total_facturas = db.query(Factura).filter(
            Factura.cliente_id == current_user.id
        ).count()
        
        return DashboardResumen(
            cliente=ClienteResponse.from_orm(current_user),
            saldo=SaldoResponse.from_orm(saldo),
            consumo_mes_actual=consumo_mes_actual,
            consumo_mes_anterior=consumo_mes_anterior,
            facturas_pendientes=facturas_pendientes,
            facturas_vencidas=facturas_vencidas,
            total_facturas=total_facturas
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error obteniendo resumen del dashboard: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )

@app.get("/dashboard/graficos", response_model=DashboardGraficos)
async def get_dashboard_graficos(
    current_user: Cliente = Depends(get_current_user),
    db: Session = Depends(get_db),
    dias: int = Query(7, description="Número de días para el gráfico diario"),
    meses: int = Query(6, description="Número de meses para el gráfico mensual")
):
    """Obtener datos para gráficos del dashboard"""
    try:
        # Consumo diario
        fecha_inicio = datetime.now() - timedelta(days=dias)
        consumos_diarios = db.query(Consumo).filter(
            Consumo.cliente_id == current_user.id,
            Consumo.fecha >= fecha_inicio
        ).order_by(Consumo.fecha).all()
        
        # Agrupar por día
        consumo_por_dia = {}
        for consumo in consumos_diarios:
            fecha_str = consumo.fecha.strftime("%Y-%m-%d")
            if fecha_str not in consumo_por_dia:
                consumo_por_dia[fecha_str] = {
                    "fecha": fecha_str,
                    "datos": 0.0,
                    "minutos": 0,
                    "sms": 0,
                    "costo": 0.0
                }
            
            if consumo.servicio == "datos":
                consumo_por_dia[fecha_str]["datos"] += consumo.cantidad
            elif consumo.servicio == "minutos":
                consumo_por_dia[fecha_str]["minutos"] += int(consumo.cantidad)
            elif consumo.servicio == "sms":
                consumo_por_dia[fecha_str]["sms"] += int(consumo.cantidad)
            
            consumo_por_dia[fecha_str]["costo"] += consumo.costo_total
        
        consumo_diario = list(consumo_por_dia.values())
        
        # Consumo mensual (últimos N meses)
        fecha_inicio_meses = datetime.now() - timedelta(days=meses * 30)
        consumos_mensuales = db.query(Consumo).filter(
            Consumo.cliente_id == current_user.id,
            Consumo.fecha >= fecha_inicio_meses
        ).order_by(Consumo.fecha).all()
        
        # Agrupar por mes
        consumo_por_mes = {}
        for consumo in consumos_mensuales:
            fecha_str = consumo.fecha.strftime("%Y-%m")
            if fecha_str not in consumo_por_mes:
                consumo_por_mes[fecha_str] = {
                    "fecha": fecha_str,
                    "datos": 0.0,
                    "minutos": 0,
                    "sms": 0,
                    "costo": 0.0
                }
            
            if consumo.servicio == "datos":
                consumo_por_mes[fecha_str]["datos"] += consumo.cantidad
            elif consumo.servicio == "minutos":
                consumo_por_mes[fecha_str]["minutos"] += int(consumo.cantidad)
            elif consumo.servicio == "sms":
                consumo_por_mes[fecha_str]["sms"] += int(consumo.cantidad)
            
            consumo_por_mes[fecha_str]["costo"] += consumo.costo_total
        
        consumo_mensual = list(consumo_por_mes.values())
        
        # Facturación mensual
        facturas_mensuales = db.query(Factura).filter(
            Factura.cliente_id == current_user.id,
            Factura.fecha_emision >= fecha_inicio_meses
        ).order_by(Factura.fecha_emision).all()
        
        facturacion_por_mes = {}
        for factura in facturas_mensuales:
            fecha_str = factura.fecha_emision.strftime("%Y-%m")
            if fecha_str not in facturacion_por_mes:
                facturacion_por_mes[fecha_str] = {
                    "mes": fecha_str,
                    "total": 0.0,
                    "pendientes": 0,
                    "pagadas": 0
                }
            
            facturacion_por_mes[fecha_str]["total"] += factura.monto_total
            if factura.estado == "pendiente":
                facturacion_por_mes[fecha_str]["pendientes"] += 1
            elif factura.estado == "pagada":
                facturacion_por_mes[fecha_str]["pagadas"] += 1
        
        facturacion_mensual = list(facturacion_por_mes.values())
        
        return DashboardGraficos(
            consumo_diario=consumo_diario,
            consumo_mensual=consumo_mensual,
            facturacion_mensual=facturacion_mensual
        )
        
    except Exception as e:
        logger.error(f"Error obteniendo gráficos del dashboard: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )

# ============================================================================
# ENDPOINTS DE CONSUMO
# ============================================================================

@app.get("/consumos", response_model=PaginatedResponse)
async def get_consumos(
    current_user: Cliente = Depends(get_current_user),
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1, description="Número de página"),
    size: int = Query(20, ge=1, le=100, description="Tamaño de página"),
    servicio: Optional[str] = Query(None, description="Filtrar por servicio"),
    fecha_inicio: Optional[datetime] = Query(None, description="Fecha de inicio"),
    fecha_fin: Optional[datetime] = Query(None, description="Fecha de fin")
):
    """Obtener lista paginada de consumos del usuario"""
    try:
        query = db.query(Consumo).filter(Consumo.cliente_id == current_user.id)
        
        # Aplicar filtros
        if servicio:
            query = query.filter(Consumo.servicio == servicio)
        if fecha_inicio:
            query = query.filter(Consumo.fecha >= fecha_inicio)
        if fecha_fin:
            query = query.filter(Consumo.fecha <= fecha_fin)
        
        # Contar total
        total = query.count()
        
        # Paginar
        offset = (page - 1) * size
        consumos = query.order_by(Consumo.fecha.desc()).offset(offset).limit(size).all()
        
        # Calcular páginas
        pages = (total + size - 1) // size
        
        return PaginatedResponse(
            items=[ConsumoResponse.from_orm(c).dict() for c in consumos],
            total=total,
            page=page,
            size=size,
            pages=pages
        )
        
    except Exception as e:
        logger.error(f"Error obteniendo consumos: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )

@app.post("/consumos", response_model=ConsumoResponse)
async def create_consumo(
    consumo_data: ConsumoCreate,
    current_user: Cliente = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Crear nuevo registro de consumo"""
    try:
        # Verificar que el cliente_id coincida con el usuario autenticado
        if consumo_data.cliente_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No autorizado para crear consumo para otro cliente"
            )
        
        # Crear consumo
        consumo_id = f"consumo_{uuid.uuid4().hex[:8]}"
        nuevo_consumo = Consumo(
            id=consumo_id,
            **consumo_data.dict(exclude={"cliente_id"}),
            cliente_id=consumo_data.cliente_id
        )
        
        db.add(nuevo_consumo)
        db.commit()
        db.refresh(nuevo_consumo)
        
        return ConsumoResponse.from_orm(nuevo_consumo)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creando consumo: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )

# ============================================================================
# ENDPOINTS DE FACTURAS
# ============================================================================

@app.get("/facturas", response_model=PaginatedResponse)
async def get_facturas(
    current_user: Cliente = Depends(get_current_user),
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1, description="Número de página"),
    size: int = Query(20, ge=1, le=100, description="Tamaño de página"),
    estado: Optional[str] = Query(None, description="Filtrar por estado")
):
    """Obtener lista paginada de facturas del usuario"""
    try:
        query = db.query(Factura).filter(Factura.cliente_id == current_user.id)
        
        # Aplicar filtros
        if estado:
            query = query.filter(Factura.estado == estado)
        
        # Contar total
        total = query.count()
        
        # Paginar
        offset = (page - 1) * size
        facturas = query.order_by(Factura.fecha_emision.desc()).offset(offset).limit(size).all()
        
        # Calcular páginas
        pages = (total + size - 1) // size
        
        return PaginatedResponse(
            items=[FacturaResponse.from_orm(f).dict() for f in facturas],
            total=total,
            page=page,
            size=size,
            pages=pages
        )
        
    except Exception as e:
        logger.error(f"Error obteniendo facturas: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )

# ============================================================================
# ENDPOINTS DE SALDO
# ============================================================================

@app.get("/saldo", response_model=SaldoResponse)
async def get_saldo(
    current_user: Cliente = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener saldo actual del usuario"""
    try:
        saldo = db.query(Saldo).filter(Saldo.cliente_id == current_user.id).first()
        if not saldo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Saldo no encontrado"
            )
        
        return SaldoResponse.from_orm(saldo)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error obteniendo saldo: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )

@app.get("/user/saldo", response_model=SaldoResponse)
async def get_user_saldo(
    current_user: Cliente = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener saldo actual del usuario (endpoint alternativo)"""
    try:
        saldo = db.query(Saldo).filter(Saldo.cliente_id == current_user.id).first()
        if not saldo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Saldo no encontrado"
            )
        
        return SaldoResponse.from_orm(saldo)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error obteniendo saldo del usuario: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )

# ============================================================================
# ENDPOINTS DE CONSUMO
# ============================================================================



@app.get("/user/consumos", response_model=PaginatedResponse)
async def get_user_consumos(
    current_user: Cliente = Depends(get_current_user),
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1, description="Número de página"),
    size: int = Query(20, ge=1, le=100, description="Tamaño de página"),
    servicio: Optional[str] = Query(None, description="Filtrar por servicio"),
    fecha_inicio: Optional[datetime] = Query(None, description="Fecha de inicio"),
    fecha_fin: Optional[datetime] = Query(None, description="Fecha de fin")
):
    """Obtener lista paginada de consumos del usuario (endpoint alternativo)"""
    try:
        query = db.query(Consumo).filter(Consumo.cliente_id == current_user.id)
        
        # Aplicar filtros
        if servicio:
            query = query.filter(Consumo.servicio == servicio)
        if fecha_inicio:
            query = query.filter(Consumo.fecha >= fecha_inicio)
        if fecha_fin:
            query = query.filter(Consumo.fecha <= fecha_fin)
        
        # Contar total
        total = query.count()
        
        # Paginar
        offset = (page - 1) * size
        consumos = query.order_by(Consumo.fecha.desc()).offset(offset).limit(size).all()
        
        # Calcular páginas
        pages = (total + size - 1) // size
        
        # Convertir a dict de forma segura
        items = []
        for consumo in consumos:
            try:
                consumo_response = ConsumoResponse.from_orm(consumo)
                items.append(consumo_response.dict())
            except Exception as e:
                logger.warning(f"Error convirtiendo consumo {consumo.id}: {e}")
                # Agregar datos básicos si falla la conversión
                items.append({
                    "id": str(consumo.id),
                    "servicio": str(consumo.servicio),
                    "cantidad": float(consumo.cantidad),
                    "unidad": str(consumo.unidad),
                    "fecha": consumo.fecha.isoformat(),
                    "tipo_consumo": str(consumo.tipo_consumo),
                    "costo_unitario": float(consumo.costo_unitario),
                    "costo_total": float(consumo.costo_total),
                    "cliente_id": str(consumo.cliente_id),
                    "created_at": consumo.created_at.isoformat(),
                    "updated_at": consumo.updated_at.isoformat() if consumo.updated_at else None
                })
        
        return PaginatedResponse(
            items=items,
            total=total,
            page=page,
            size=size,
            pages=pages
        )
        
    except Exception as e:
        logger.error(f"Error obteniendo consumos del usuario: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )

@app.get("/user/consumos/resumen", response_model=DashboardResumen)
async def get_user_consumos_resumen(
    current_user: Cliente = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener resumen de consumos del usuario (endpoint alternativo)"""
    try:
        # Obtener saldo del cliente
        saldo = db.query(Saldo).filter(Saldo.cliente_id == current_user.id).first()
        if not saldo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Saldo no encontrado"
            )
        
        # Calcular consumo del mes actual
        fecha_inicio_mes = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        consumo_mes_actual = db.query(Consumo).filter(
            Consumo.cliente_id == current_user.id,
            Consumo.fecha >= fecha_inicio_mes
        ).with_entities(func.sum(Consumo.cantidad)).scalar() or 0.0
        
        # Calcular consumo del mes anterior
        fecha_inicio_mes_anterior = (fecha_inicio_mes - timedelta(days=1)).replace(day=1)
        fecha_fin_mes_anterior = fecha_inicio_mes - timedelta(seconds=1)
        consumo_mes_anterior = db.query(Consumo).filter(
            Consumo.cliente_id == current_user.id,
            Consumo.fecha >= fecha_inicio_mes_anterior,
            Consumo.fecha <= fecha_fin_mes_anterior
        ).with_entities(func.sum(Consumo.cantidad)).scalar() or 0.0
        
        # Contar facturas
        facturas_pendientes = db.query(Factura).filter(
            Factura.cliente_id == current_user.id,
            Factura.estado == "pendiente"
        ).count()
        
        facturas_vencidas = db.query(Factura).filter(
            Factura.cliente_id == current_user.id,
            Factura.estado == "vencida"
        ).count()
        
        total_facturas = db.query(Factura).filter(
            Factura.cliente_id == current_user.id
        ).count()
        
        return DashboardResumen(
            cliente=ClienteResponse.from_orm(current_user),
            saldo=SaldoResponse.from_orm(saldo),
            consumo_mes_actual=consumo_mes_actual,
            consumo_mes_anterior=consumo_mes_anterior,
            facturas_pendientes=facturas_pendientes,
            facturas_vencidas=facturas_vencidas,
            total_facturas=total_facturas
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error obteniendo resumen de consumos del usuario: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )

@app.get("/user/consumos/grafico", response_model=List[ConsumoGrafico])
async def get_user_consumos_grafico(
    current_user: Cliente = Depends(get_current_user),
    db: Session = Depends(get_db),
    dias: int = Query(7, description="Número de días para el gráfico diario")
):
    """Obtener datos para gráficos de consumo del usuario (endpoint alternativo)"""
    try:
        # Consumo diario
        fecha_inicio = datetime.now() - timedelta(days=dias)
        consumos_diarios = db.query(Consumo).filter(
            Consumo.cliente_id == current_user.id,
            Consumo.fecha >= fecha_inicio
        ).order_by(Consumo.fecha).all()
        
        # Agrupar por día
        consumo_por_dia = {}
        for consumo in consumos_diarios:
            fecha_str = consumo.fecha.strftime("%Y-%m-%d")
            if fecha_str not in consumo_por_dia:
                consumo_por_dia[fecha_str] = {
                    "fecha": fecha_str,
                    "datos": 0.0,
                    "minutos": 0,
                    "sms": 0,
                    "costo": 0.0
                }
            
            if consumo.servicio == "datos":
                consumo_por_dia[fecha_str]["datos"] += consumo.cantidad
            elif consumo.servicio == "minutos":
                consumo_por_dia[fecha_str]["minutos"] += int(consumo.cantidad)
            elif consumo.servicio == "sms":
                consumo_por_dia[fecha_str]["sms"] += int(consumo.cantidad)
            
            consumo_por_dia[fecha_str]["costo"] += consumo.costo_total
        
        # Convertir a formato ConsumoGrafico
        consumo_grafico = []
        for fecha, datos in consumo_por_dia.items():
            consumo_grafico.append(ConsumoGrafico(
                fecha=fecha,
                datos=datos["datos"],
                minutos=datos["minutos"],
                sms=datos["sms"],
                costo=datos["costo"]
            ))
        
        return consumo_grafico
        
    except Exception as e:
        logger.error(f"Error obteniendo gráficos de consumo del usuario: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )

# ============================================================================
# ENDPOINTS DE PLANES
# ============================================================================

@app.get("/planes", response_model=List[PlanResponse])
async def get_planes(db: Session = Depends(get_db)):
    """Obtener lista de planes disponibles"""
    try:
        planes = db.query(Plan).filter(Plan.activo == True).all()
        return [PlanResponse.from_orm(p) for p in planes]
        
    except Exception as e:
        logger.error(f"Error obteniendo planes: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )

# ============================================================================
# ENDPOINTS DE ADMINISTRACIÓN
# ============================================================================

@app.get("/admin/users", response_model=PaginatedResponse)
async def get_users(
    current_user: Cliente = Depends(get_current_user),
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1, description="Número de página"),
    size: int = Query(20, ge=1, le=100, description="Tamaño de página"),
    search: Optional[str] = Query(None, description="Buscar por nombre o email"),
    estado: Optional[str] = Query(None, description="Filtrar por estado")
):
    """Obtener lista paginada de usuarios (solo administradores)"""
    try:
        # TODO: Verificar si el usuario actual es administrador
        # Por ahora permitimos acceso a todos los usuarios autenticados
        
        query = db.query(Cliente)
        
        # Aplicar filtros
        if search:
            query = query.filter(
                Cliente.nombre.ilike(f"%{search}%") | 
                Cliente.email.ilike(f"%{search}%")
            )
        
        if estado:
            query = query.filter(Cliente.estado_cuenta == estado)
        
        # Contar total de registros
        total = query.count()
        
        # Aplicar paginación
        users = query.offset((page - 1) * size).limit(size).all()
        
        # Convertir a respuesta
        user_responses = [ClienteResponse.from_orm(user) for user in users]
        
        return PaginatedResponse(
            items=[user.dict() for user in user_responses],
            total=total,
            page=page,
            size=size,
            pages=(total + size - 1) // size
        )
        
    except Exception as e:
        logger.error(f"Error obteniendo usuarios: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )

@app.get("/admin/users/{user_id}", response_model=ClienteResponse)
async def get_user(
    user_id: str,
    current_user: Cliente = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener un usuario específico por ID"""
    try:
        user = db.query(Cliente).filter(Cliente.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )
        
        return ClienteResponse.from_orm(user)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error obteniendo usuario: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )

@app.post("/admin/users", response_model=ClienteResponse)
async def create_user(
    user_data: ClienteCreate,
    current_user: Cliente = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Crear un nuevo usuario"""
    try:
        # Verificar si el email ya existe
        existing_user = db.query(Cliente).filter(Cliente.email == user_data.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El email ya está registrado"
            )
        
        # Crear nuevo usuario
        new_user = Cliente(
            id=f"cliente_{uuid.uuid4().hex[:8]}",
            nombre=user_data.nombre,
            email=user_data.email,
            telefono=user_data.telefono,
            password_hash=get_password_hash(user_data.password),
            plan_actual=user_data.plan_actual,
            estado_cuenta="activo"
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        return ClienteResponse.from_orm(new_user)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creando usuario: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )

@app.put("/admin/users/{user_id}", response_model=ClienteResponse)
async def update_user(
    user_id: str,
    user_data: ClienteUpdate,
    current_user: Cliente = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Actualizar un usuario existente"""
    try:
        user = db.query(Cliente).filter(Cliente.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
                )
        
        # Actualizar campos
        if user_data.nombre is not None:
            user.nombre = user_data.nombre
        if user_data.email is not None:
            # Verificar si el nuevo email ya existe
            if user_data.email != user.email:
                existing_user = db.query(Cliente).filter(Cliente.email == user_data.email).first()
                if existing_user:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="El email ya está registrado"
                    )
            user.email = user_data.email
        if user_data.telefono is not None:
            user.telefono = user_data.telefono
        if user_data.plan_actual is not None:
            user.plan_actual = user_data.plan_actual
        if user_data.estado_cuenta is not None:
            user.estado_cuenta = user_data.estado_cuenta
        
        db.commit()
        db.refresh(user)
        
        return ClienteResponse.from_orm(user)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error actualizando usuario: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )

@app.delete("/admin/users/{user_id}")
async def delete_user(
    user_id: str,
    current_user: Cliente = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Eliminar un usuario"""
    try:
        user = db.query(Cliente).filter(Cliente.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )
        
        # No permitir eliminar el usuario actual
        if user.id == current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No puedes eliminar tu propia cuenta"
            )
        
        db.delete(user)
        db.commit()
        
        return {"message": "Usuario eliminado correctamente"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error eliminando usuario: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )

# ============================================================================
# ENDPOINTS DE SALUD
# ============================================================================

@app.get("/health")
async def health_check():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}

@app.get("/test/facturas")
async def test_facturas(db: Session = Depends(get_db)):
    """Endpoint de prueba para verificar que las facturas funcionen"""
    try:
        total_facturas = db.query(Factura).count()
        facturas_pagadas = db.query(Factura).filter(Factura.estado == "pagada").count()
        facturas_pendientes = db.query(Factura).filter(Factura.estado == "pendiente").count()
        
        return {
            "total_facturas": total_facturas,
            "facturas_pagadas": facturas_pagadas,
            "facturas_pendientes": facturas_pendientes,
            "estados_disponibles": ["pendiente", "pagada", "vencida", "cancelada"]
        }
    except Exception as e:
        logger.error(f"Error en test_facturas: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno: {str(e)}"
        )

@app.get("/")
async def root():
    """Endpoint raíz"""
    return {
        "message": "Bienvenido a la API de Telcox Consumo",
        "version": "1.0.0",
        "docs": "/docs"
    }
