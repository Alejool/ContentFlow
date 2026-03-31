# 🎬 Generador Automático de Reels con IA

Sistema completo para generar reels optimizados automáticamente a partir de videos con valor agregado mediante inteligencia artificial.

## 🌟 Características Principales

### 1. **Optimización Multi-Plataforma**
- ✅ Instagram Reels (9:16, hasta 90s)
- ✅ TikTok (9:16, hasta 180s)
- ✅ YouTube Shorts (9:16, hasta 60s)
- Ajuste automático de resolución, bitrate y formato

### 2. **Procesamiento Inteligente con IA**
- 🎯 Detección automática de momentos destacados
- 📝 Generación de subtítulos automáticos (multiidioma)
- 🏷️ Sugerencias de hashtags optimizados
- ✍️ Descripciones generadas por IA
- 🎨 Thumbnails automáticos

### 3. **Generación de Clips**
- ✂️ Extracción de clips cortos desde videos largos
- 🎬 Detección de highlights basada en:
  - Picos de audio (aplausos, risas, música)
  - Contenido visual interesante (caras, objetos, texto)
  - Análisis de escenas con IA

### 4. **Valor Agregado Automático**
- 🎵 Análisis de audio para detectar momentos clave
- 👁️ Reconocimiento visual de objetos y escenas
- 🌈 Análisis de colores dominantes
- 😊 Detección de caras y emociones
- 📊 Métricas de engagement predichas

## 📦 Instalación

### 1. Requisitos Previos

```bash
# Instalar FFmpeg (requerido para procesamiento de video)
# Ubuntu/Debian
sudo apt-get install ffmpeg

# macOS
brew install ffmpeg

# Windows
# Descargar desde https://ffmpeg.org/download.html
```

### 2. Configuración

Agregar al archivo `.env`:

```env
# FFmpeg Paths
FFMPEG_PATH=/usr/bin/ffmpeg
FFPROBE_PATH=/usr/bin/ffprobe

# Reel Generation Settings
AUTO_GENERATE_REELS=false
REELS_ADD_SUBTITLES=true
REELS_LANGUAGE=es
REELS_MAX_CLIPS=5
REELS_CLIP_DURATION=30
```

### 3. Ejecutar Migraciones

```bash
php artisan migrate
```

### 4. Instalar Dependencias PHP

```bash
composer require php-ffmpeg/php-ffmpeg
```

## 🚀 Uso

### Opción 1: Generación Manual (API)

```javascript
// Desde el frontend
const response = await axios.post('/api/reels/generate', {
  media_file_id: 123,
  publication_id: 456, // opcional
  platforms: ['instagram', 'tiktok', 'youtube_shorts'],
  add_subtitles: true,
  language: 'es',
  generate_clips: true,
  clip_duration: 15,
  max_clips: 3
});
```

### Opción 2: Generación Automática

Habilitar en `.env`:
```env
AUTO_GENERATE_REELS=true
```

Los reels se generarán automáticamente cuando se suba un video.

### Opción 3: Componente React

```tsx
import ReelGenerator from '@/Components/ManageContent/ReelGenerator';

<ReelGenerator 
  mediaFileId={mediaFile.id}
  publicationId={publication.id}
  onComplete={() => console.log('Reels generados!')}
/>
```

## 🏗️ Arquitectura

### Servicios Principales

1. **VideoClipGeneratorService**
   - Genera clips optimizados por plataforma
   - Aplica filtros y efectos
   - Agrega subtítulos y watermarks

2. **VideoAnalysisService**
   - Analiza contenido del video
   - Detecta highlights automáticamente
   - Genera metadata con IA

3. **AIService** (existente)
   - Transcripción de audio
   - Generación de descripciones
   - Sugerencias de hashtags

### Jobs Asíncronos

- **GenerateReelsFromVideo**: Job principal que orquesta todo el proceso
- **ProcessBackgroundUpload**: Integrado para auto-generación

### Flujo de Trabajo

```
1. Usuario sube video
   ↓
2. ProcessBackgroundUpload procesa el archivo
   ↓
3. [Opcional] GenerateReelsFromVideo se dispara automáticamente
   ↓
4. VideoAnalysisService analiza el contenido
   ↓
5. VideoClipGeneratorService genera reels optimizados
   ↓
6. Se crean MediaFiles para cada reel generado
   ↓
7. Se notifica al usuario
```

## 📊 Especificaciones por Plataforma

### Instagram Reels
- Resolución: 1080x1920 (9:16)
- Duración: 3-90 segundos
- Bitrate: 5000 kbps
- Formato: MP4 (H.264 + AAC)
- Tamaño máximo: 4GB

### TikTok
- Resolución: 1080x1920 (9:16)
- Duración: 3-180 segundos
- Bitrate: 4000 kbps
- Formato: MP4 (H.264 + AAC)
- Tamaño máximo: 4GB

### YouTube Shorts
- Resolución: 1080x1920 (9:16)
- Duración: 1-60 segundos
- Bitrate: 6000 kbps
- Formato: MP4 (H.264 + AAC)
- Tamaño máximo: 256MB

## 🎨 Personalización

### Agregar Watermark

```php
$options = [
  'watermark_path' => '/path/to/watermark.png',
];

$clipGenerator->createOptimizedReel($mediaFile, 'instagram', $options);
```

### Configurar Detección de Highlights

```php
$options = [
  'auto_detect_highlights' => true,
  'clip_duration' => 20,
  'max_clips' => 5,
];

$clips = $clipGenerator->generateClipsFromVideo($mediaFile, $options);
```

## 🔧 Troubleshooting

### Error: FFmpeg no encontrado
```bash
# Verificar instalación
ffmpeg -version

# Actualizar path en .env
FFMPEG_PATH=/usr/local/bin/ffmpeg
```

### Error: Memoria insuficiente
```bash
# Aumentar límite de memoria en php.ini
memory_limit = 512M

# O en el job
ini_set('memory_limit', '512M');
```

### Error: Timeout en procesamiento
```bash
# Aumentar timeout en el job
public $timeout = 3600; // 1 hora
```

## 📈 Mejoras Futuras

- [ ] Integración con AWS Rekognition para análisis visual avanzado
- [ ] Soporte para múltiples idiomas en subtítulos simultáneos
- [ ] Efectos y transiciones automáticas
- [ ] Música de fondo automática
- [ ] A/B testing de thumbnails
- [ ] Predicción de viralidad con ML
- [ ] Edición colaborativa en tiempo real
- [ ] Templates personalizables por marca

## 🤝 Contribuir

Para agregar nuevas plataformas o features:

1. Extender `VideoClipGeneratorService::getPlatformSpecs()`
2. Agregar configuración en `config/media.php`
3. Actualizar el componente React con la nueva opción

## 📝 Licencia

Propietario - Todos los derechos reservados
