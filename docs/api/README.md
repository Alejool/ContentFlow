# Documentación API

Documentación completa de la API REST de Intellipost.

## Archivos Disponibles

### Documentación Markdown

- **API_ENTERPRISE_V1.md** - Documentación completa en español
  - Autenticación con tokens
  - Endpoints disponibles
  - Ejemplos en cURL, JavaScript y Python
  - Manejo de errores

- **API_ENTERPRISE_V1.en.md** - Complete documentation in English
  - Token-based authentication
  - Available endpoints
  - Examples in cURL, JavaScript and Python
  - Error handling

### Especificaciones OpenAPI

- **api-auth-openapi.json** - Especificación OpenAPI 3.0 en español
- **api-auth-openapi.en.json** - OpenAPI 3.0 specification in English
- **api_definition.json** - Definición general de la API

## Uso con Herramientas

### Postman
1. Importar el archivo `api-auth-openapi.json`
2. Configurar variables de entorno
3. Probar endpoints

### Swagger UI
```bash
docker run -p 8080:8080 -e SWAGGER_JSON=/api/api-auth-openapi.json \
  -v $(pwd):/api swaggerapi/swagger-ui
```

### Insomnia
1. Importar archivo OpenAPI
2. Configurar autenticación
3. Ejecutar requests

## Autenticación

La API usa autenticación basada en tokens JWT:

```bash
# Obtener token
curl -X POST https://api.Intellipost.com/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

## Endpoints Principales

- `POST /v1/auth/login` - Iniciar sesión
- `POST /v1/auth/refresh` - Refrescar token
- `GET /v1/publications` - Listar publicaciones
- `POST /v1/publications` - Crear publicación
- `GET /v1/reels` - Listar reels
- `POST /v1/calendar/events` - Crear evento

Ver documentación completa en los archivos Markdown.
