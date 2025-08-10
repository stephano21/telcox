# Telcox Consumo

Sistema de gestión de consumo de servicios de telecomunicaciones con frontend en React + Ant Design y backend en FastAPI.

## 🏗️ Arquitectura

- **Frontend**: React + TypeScript + Ant Design
- **Backend**: FastAPI (Python) + Mock BSS API
- **Contenedores**: Docker + Docker Compose

## 📁 Estructura del Proyecto

```
telcox-consumo/
│
├── backend/                # FastAPI (mock BSS API)
│   ├── app/
│   │   ├── main.py        # Aplicación principal
│   │   └── __init__.py
│   ├── requirements.txt    # Dependencias Python
│   └── Dockerfile
│
├── frontend/               # React (UI)
│   ├── src/
│   │   ├── pages/         # Páginas de la aplicación
│   │   └── components/    # Componentes reutilizables
│   ├── package.json
│   └── Dockerfile
│
├── docker-compose.yml      # Orquestación de servicios
└── README.md
```

## 🚀 Instalación y Uso

### Prerrequisitos

- Docker y Docker Compose instalados
- Python 3.11+ (para desarrollo local del backend)
- Node.js 18+ (para desarrollo local del frontend)

### Opción 1: Con Docker (Recomendado)

1. **Clonar el repositorio:**
   ```bash
   git clone <url-del-repositorio>
   cd telcox-consumo
   ```

2. **Ejecutar con Docker Compose:**
   ```bash
   docker-compose up --build
   ```

3. **Acceder a las aplicaciones:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### Opción 2: Desarrollo Local

#### Backend (FastAPI)

1. **Crear entorno virtual:**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # En Windows: venv\Scripts\activate
   ```

2. **Instalar dependencias:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Ejecutar servidor:**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

#### Frontend (React)

1. **Instalar dependencias:**
   ```bash
   cd frontend
   npm install
   ```

2. **Ejecutar en modo desarrollo:**
   ```bash
   npm run dev
   ```

## 🔌 API Endpoints

### Endpoints Principales

- `GET /` - Información de la API
- `GET /health` - Estado de salud del servicio
- `GET /docs` - Documentación interactiva (Swagger UI)

### Gestión de Consumos

- `GET /api/consumos` - Listar todos los consumos
- `GET /api/consumos/{id}` - Obtener consumo específico
- `POST /api/consumos` - Crear nuevo consumo

### Gestión de Clientes

- `GET /api/clientes` - Listar todos los clientes
- `GET /api/clientes/{id}` - Obtener cliente específico
- `POST /api/clientes` - Crear nuevo cliente

### Simulación BSS API

- `GET /api/bss/consumo/{cliente_id}` - Simular respuesta de BSS API

## 🧪 Testing

### Backend

```bash
cd backend
pytest
```

### Frontend

```bash
cd frontend
npm test
```

## 🐳 Comandos Docker Útiles

```bash
# Construir y ejecutar servicios
docker-compose up --build

# Ejecutar en segundo plano
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener servicios
docker-compose down

# Reconstruir un servicio específico
docker-compose up --build backend
```

## 🔧 Variables de Entorno

### Backend
- `PORT`: Puerto del servidor (default: 8000)

### Frontend
- `VITE_API_URL`: URL del backend API (default: http://localhost:8000)

## 📝 Características

- ✅ API RESTful con FastAPI
- ✅ Documentación automática con Swagger/OpenAPI
- ✅ CORS configurado para desarrollo
- ✅ Modelos Pydantic para validación de datos
- ✅ Mock BSS API para simulación
- ✅ Contenedores Docker optimizados
- ✅ Hot reload para desarrollo

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🆘 Soporte

Si tienes problemas o preguntas:

1. Revisa la documentación de la API en `/docs`
2. Verifica los logs de Docker: `docker-compose logs`
3. Abre un issue en el repositorio

---

**Desarrollado con ❤️ para Telcox**
