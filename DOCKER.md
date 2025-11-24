# Docker Setup para PDF Wizardz

## 🐳 Construcción y Ejecución

### Opción 1: Docker Compose (Recomendado)

1. **Configurar variables de entorno:**
   ```bash
   cp .docker.env.example .env
   # Edita .env y agrega tu GEMINI_API_KEY
   ```

2. **Construir y ejecutar:**
   ```bash
   docker-compose up -d --build
   ```

3. **Ver logs:**
   ```bash
   docker-compose logs -f
   ```

4. **Detener:**
   ```bash
   docker-compose down
   ```

### Opción 2: Docker CLI

1. **Construir la imagen:**
   ```bash
   docker build -t pdf-wizardz:latest --build-arg GEMINI_API_KEY=tu_api_key .
   ```

2. **Ejecutar el contenedor:**
   ```bash
   docker run -d \
     --name pdf-wizardz \
     -p 80:80 \
     --restart unless-stopped \
     pdf-wizardz:latest
   ```

3. **Ver logs:**
   ```bash
   docker logs -f pdf-wizardz
   ```

4. **Detener y eliminar:**
   ```bash
   docker stop pdf-wizardz
   docker rm pdf-wizardz
   ```

## 🔧 Configuración

### Variables de Entorno

- `GEMINI_API_KEY`: Clave API de Google Gemini (requerida para funciones de IA)
  - Se puede pasar como build arg: `--build-arg GEMINI_API_KEY=xxx`
  - O como variable de entorno en runtime (aunque se compila en build time)

### Puertos

- **Puerto 80**: Puerto HTTP por defecto
- Para cambiar el puerto, modifica el mapeo en `docker-compose.yml`:
  ```yaml
  ports:
    - "3000:80"  # Acceso en localhost:3000
  ```

### Health Check

El contenedor incluye un health check que verifica:
- Endpoint: `http://localhost/health`
- Intervalo: 30 segundos
- Timeout: 3 segundos

## 📦 Estructura del Dockerfile

### Multi-stage Build

1. **Stage 1 (builder)**: 
   - Usa Node.js 20 Alpine
   - Instala dependencias
   - Construye la aplicación con `npm run build`

2. **Stage 2 (production)**:
   - Usa Nginx Alpine (imagen ligera)
   - Copia archivos construidos
   - Configura Nginx para SPA

### Archivos Incluidos

- `/usr/share/nginx/html/`: Archivos estáticos construidos
- `/etc/nginx/conf.d/default.conf`: Configuración de Nginx
- Archivos públicos: `robots.txt`, `sitemap.xml`, políticas HTML

## 🚀 Despliegue en Producción

### Con Docker Compose

```bash
# 1. Configurar .env
echo "GEMINI_API_KEY=tu_clave_aqui" > .env

# 2. Construir y desplegar
docker-compose up -d --build

# 3. Verificar
curl http://localhost/health
```

### Con Docker Swarm / Kubernetes

El Dockerfile es compatible con orquestadores. Ajusta según tu infraestructura.

## 🔍 Troubleshooting

### El contenedor no inicia

```bash
# Ver logs
docker logs pdf-wizardz

# Verificar configuración
docker exec -it pdf-wizardz nginx -t
```

### Error de permisos

```bash
# Asegúrate de que nginx puede leer los archivos
docker exec -it pdf-wizardz ls -la /usr/share/nginx/html
```

### La aplicación no carga

1. Verifica que el build se completó correctamente
2. Revisa los logs de nginx: `docker logs pdf-wizardz`
3. Verifica que el puerto está mapeado correctamente

### Variables de entorno no funcionan

Las variables de entorno de Vite se compilan en build time. Si necesitas cambiarlas:
1. Reconstruye la imagen con nuevos build args
2. O usa variables de entorno en runtime (requiere configuración adicional)

## 📝 Notas

- La imagen final es ligera (~50MB) gracias a Nginx Alpine
- El build stage se descarta después de copiar los archivos
- Nginx está configurado para SPA (todas las rutas van a index.html)
- Los archivos estáticos tienen cache de 1 año
- Health check incluido para monitoreo

## 🔐 Seguridad

- Headers de seguridad configurados en nginx
- No se exponen archivos de desarrollo
- Solo se copian archivos necesarios para producción
- Variables sensibles no se incluyen en la imagen

