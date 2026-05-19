<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Carbon\Carbon;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

use App\Models\User;
use App\Models\Publications\Publication;
use App\Models\Campaigns\CampaignAnalytics;
use App\Models\Social\SocialAccount;
use App\Models\Social\SocialMediaMetrics;
use App\Models\Workspace\Workspace;

class ExistingUserDummyDataSeeder extends Seeder
{
  /**
   * Run the database seeder.
   */
  public function run(): void
  {
    // Ensure we have some test users first with more realistic data
    $testUsers = [
      [
        'name' => 'María García',
        'email' => 'demo@gmail.com',
        'photo_url' => 'https://i.pravatar.cc/150?img=1',
        'bio' => 'Social Media Manager especializada en estrategias de contenido digital',
        'timezone' => 'America/Mexico_City',
      ],
      [
        'name' => 'Carlos Rodríguez',
        'email' => 'admin@gmail.com',
        'photo_url' => 'https://i.pravatar.cc/150?img=12',
        'bio' => 'Director de Marketing Digital con 10+ años de experiencia',
        'timezone' => 'America/Bogota',
      ],
      [
        'name' => 'Ana Martínez',
        'email' => 'test@example.com',
        'photo_url' => 'https://i.pravatar.cc/150?img=5',
        'bio' => 'Content Creator y Community Manager',
        'timezone' => 'Europe/Madrid',
      ],
    ];

    foreach ($testUsers as $testUser) {
      if (!User::where('email', $testUser['email'])->exists()) {
        $this->command->info("Creating test user: {$testUser['email']}");
        User::create([
          'name' => $testUser['name'],
          'email' => $testUser['email'],
          'password' => bcrypt('password'),
          'email_verified_at' => now(),
          'photo_url' => $testUser['photo_url'],
          'bio' => $testUser['bio'],
          'timezone' => $testUser['timezone'],
        ]);
      }
    }

    $users = User::all();
    $this->command->info("Found {$users->count()} users. Generating data...");


    foreach ($users as $user) {
      $this->command->info("Processing user: {$user->email}");

      // Ensure user has a workspace (create one if missing or use default)
      $workspaceId = $user->current_workspace_id;
      if (!$workspaceId) {
        $workspace = $user->workspaces()->first();
        if ($workspace) {
          $workspaceId = $workspace->id;
          $user->update(['current_workspace_id' => $workspaceId]);
        } else {
          // Try to Create a default workspace if none exists
          $this->command->warn("User {$user->email} has no workspace. running WorkspaceSeeder for this user...");

          // Create a personal workspace for this user manually since they don't have one
          $workspace = Workspace::create([
            'name' => 'Personal Workspace',
            'slug' => Str::slug($user->name . ' Personal ' . Str::random(4)),
            'created_by' => $user->id,
          ]);

          // Attach implicitly (assuming role pivot existence, or just setting ID for now to pass foreign key checks)
          // If creating a fresh workspace, we should probably attach the user as owner.
          // But for dummy data, setting the ID is crucial for the publications relationship.
          $user->workspaces()->attach($workspace->id, ['role_id' => 1]); // Assuming 1 is Owner or similar, or just attach
          $user->update(['current_workspace_id' => $workspace->id]);
          $workspaceId = $workspace->id;
        }
      }

      $this->createPublicationsAndAnalytics($user, $workspaceId);
      $this->createSocialAccountsAndMetrics($user, $workspaceId);
    }

    $this->command->info(' Dummy data generation completed for all users!');
  }

  private function createPublicationsAndAnalytics($user, $workspaceId)
  {
    // Detailed publication templates with realistic content - MEJORADO
    $publicationTemplates = [
      [
        'title' => 'Rebajas de Verano 2026 - Hasta 50% de Descuento',
        'body' => "🌞 ¡El verano está aquí y nuestras ofertas también! 🔥\n\nDisfruta de descuentos increíbles en toda nuestra colección de verano. Desde ropa de playa hasta accesorios frescos, tenemos todo lo que necesitas para brillar esta temporada.\n\n✨ Ofertas destacadas:\n• Trajes de baño: 40% OFF\n• Gafas de sol: 30% OFF\n• Sandalias: 50% OFF\n• Vestidos de verano: 35% OFF\n\n📦 Envío GRATIS en compras superiores a $50\n⏰ Oferta válida hasta el 31 de marzo\n\n¡No dejes pasar esta oportunidad única!",
        'hashtags' => ['#verano2026 #rebajas'],
        'goal' => 'Incrementar ventas de verano en un 35% y liquidar inventario de temporada',
        'url' => 'https://tienda.example.com/verano-2026',
      ],
      [
        'title' => 'Lanzamiento Colección Invierno - Nuevos Diseños',
        'body' => "❄️ Nueva Colección de Invierno Ya Disponible ❄️\n\nDescubre las últimas tendencias en moda invernal. Diseños exclusivos que combinan estilo y comodidad para mantenerte abrigado con clase.\n\n🧥 Lo nuevo de la temporada:\n• Abrigos premium de lana merino\n• Suéteres de cachemira italiano\n• Botas impermeables de diseño exclusivo\n• Accesorios térmicos elegantes\n• Bufandas artesanales\n\n🎁 REGALO: Guantes térmicos gratis en compras superiores a $150\n🚚 Envío express gratis en pedidos superiores a $100\n\nCompra ahora y recibe antes del frío extremo.",
        'hashtags' => ['#invierno #moda #nuevaColeccion'],
        'goal' => 'Lanzamiento exitoso con 500+ ventas en primera semana y posicionamiento de marca premium',
        'url' => 'https://tienda.example.com/invierno-coleccion',
      ],
      [
        'title' => 'Promo Gadgets Tech - Vida Inteligente',
        'body' => "🚀 Tecnología que Transforma tu Vida 📱\n\n¿Listo para actualizar tu setup? Tenemos los gadgets más innovadores del mercado con precios especiales de lanzamiento.\n\n Productos destacados:\n• Smartwatches última generación con GPS y monitor cardíaco\n• Auriculares con cancelación de ruido activa\n• Cargadores inalámbricos de carga rápida 30W\n• Accesorios gaming profesionales RGB\n• Tablets con stylus incluido\n\n🎁 BONUS EXCLUSIVO:\n✓ Garantía extendida 2 años gratis en compras mayores a $200\n✓ Soporte técnico premium 24/7\n✓ Devolución sin preguntas 30 días\n\n⚡ Stock limitado - ¡Aprovecha ahora!\n\n#TechLife #Innovation",
        'hashtags' => ['#tecnologia #gadgets #tech'],
        'goal' => 'Posicionar marca en segmento tech con 2000+ impresiones y 150+ conversiones',
        'url' => 'https://tech.example.com/promo-gadgets',
      ],
      [
        'title' => 'Campaña Alimentación Orgánica - Vida Saludable',
        'body' => "🌱 Alimentación Consciente, Vida Saludable 🥗\n\nÚnete al movimiento de comida orgánica y descubre cómo pequeños cambios en tu dieta pueden transformar tu bienestar y el del planeta.\n\n🍎 Beneficios comprobados de lo orgánico:\n✓ Sin pesticidas ni químicos dañinos\n✓ 40% más valor nutricional\n✓ Sabor auténtico y natural\n✓ Apoyas agricultura sostenible local\n✓ Reduces tu huella de carbono\n\n🛒 En nuestra tienda encontrarás:\n• Frutas y verduras de temporada\n• Granos integrales certificados\n• Lácteos de granjas locales\n• Carnes de pastoreo libre\n\n🌍 Tu salud y el planeta te lo agradecerán 💚\n\n📍 Visítanos o compra online con envío el mismo día",
        'hashtags' => ['#organico #comidaSana #wellness'],
        'goal' => 'Educar audiencia sobre alimentación orgánica - 5000 alcance y 300+ visitas a tienda',
        'url' => 'https://organic.example.com/productos',
      ],
      [
        'title' => 'Desafío Fitness 30 Días - Transformación Total',
        'body' => "💪 Desafío Fitness de 30 Días - ¡Transforma Tu Cuerpo y Mente! 🏋️\n\n¿Estás listo para el cambio definitivo? Únete a nuestro desafío de transformación integral y alcanza tus metas fitness con apoyo profesional.\n\n📋 El programa incluye:\n• Plan de entrenamiento personalizado por nivel\n• Guía nutricional completa con recetas\n• Seguimiento diario con coach certificado\n• Comunidad privada de apoyo 24/7\n• App móvil con videos y tracking\n• Premios para los mejores resultados\n• Certificado de finalización\n\n🎯 Resultados garantizados:\n✓ Pérdida de grasa visible\n✓ Aumento de masa muscular\n✓ Más energía y vitalidad\n✓ Mejor calidad de sueño\n✓ Hábitos saludables permanentes\n\n💰 Inversión: $97 (valor real $297)\n🎁 BONUS: Consulta nutricional gratis\n\n⏰ Comienza HOY y ve resultados reales en 30 días.\n\n¡Tu mejor versión te está esperando!",
        'hashtags' => ['#fitness #workout #desafio #transformacion'],
        'goal' => 'Conseguir 200 participantes en el desafío y generar $19,400 en ingresos',
        'url' => 'https://fitness.example.com/desafio-30-dias',
      ],
      [
        'title' => 'Black Friday Mega Ofertas - Tiempo Limitado',
        'body' => "🖤 BLACK FRIDAY ESTÁ AQUÍ 🛍️\n\n¡Las ofertas más esperadas del año han llegado! Descuentos de hasta 70% en productos seleccionados de todas las categorías.\n\n⚡ OFERTAS RELÁMPAGO POR CATEGORÍA:\n• Electrónica: hasta 60% OFF\n• Moda y Accesorios: hasta 70% OFF\n• Hogar y Decoración: hasta 50% OFF\n• Deportes y Fitness: hasta 55% OFF\n• Belleza y Cuidado Personal: hasta 45% OFF\n• Juguetes y Niños: hasta 65% OFF\n\n🎁 BENEFICIOS EXCLUSIVOS:\n⏰ Solo por 48 horas\n🚚 Envío express GRATIS a todo el país\n💳 12 meses sin intereses con tarjetas participantes\n🎯 Cupón extra 10% con código: BF2026\n📦 Devoluciones extendidas hasta enero\n\n⚠️ ¡Corre! Las mejores ofertas se agotan en minutos.\n\n🛒 Compra ahora: [LINK EN BIO]",
        'hashtags' => ['#blackFriday #ofertas #descuentos'],
        'goal' => 'Maximizar ventas - objetivo $50,000 en 48 horas y liquidar inventario del año',
        'url' => 'https://shop.example.com/black-friday-2026',
      ],
      [
        'title' => 'Propósitos Año Nuevo 2026 - Nuevo Comienzo',
        'body' => "🎆 Nuevo Año, Nueva Tú ✨\n\n2026 es tu año para brillar y cumplir todos tus sueños. Te ayudamos a cumplir tus propósitos con nuestros programas especiales de inicio de año.\n\n🎯 Propósitos más populares y nuestras soluciones:\n• Vida más saludable → Planes wellness personalizados\n• Mejor forma física → Membresías gym con entrenador\n• Desarrollo personal → Cursos online certificados\n• Organización y productividad → Planners digitales y apps\n• Aprender algo nuevo → Masterclasses con expertos\n• Mejorar finanzas → Asesoría financiera gratuita\n\n🎁 OFERTA ESPECIAL AÑO NUEVO:\n✓ 30% OFF en todos los programas anuales durante enero\n✓ Primer mes gratis en membresías\n✓ Acceso a comunidad exclusiva\n✓ Garantía de satisfacción 60 días\n\n💪 Empieza el año con el pie derecho. ¡Tú puedes lograrlo! 💫\n\n📅 Inscripciones abiertas hasta el 31 de enero",
        'hashtags' => ['#anoNuevo #propositos #metas'],
        'goal' => 'Engagement alto - 10,000 interacciones en enero y 500+ inscripciones a programas',
        'url' => 'https://programas.example.com/ano-nuevo-2026',
      ],
      [
        'title' => 'Moda Sostenible - Estilo con Conciencia Ecológica',
        'body' => "🌿 Moda Sostenible: Estilo con Conciencia 👗\n\nLa moda puede ser hermosa Y responsable con el planeta. Descubre nuestra línea eco-friendly hecha con materiales reciclados y procesos 100% sostenibles.\n\n♻️ Nuestro compromiso ambiental:\n• 100% algodón orgánico certificado GOTS\n• Tintes naturales biodegradables\n• Packaging compostable y reciclable\n• Producción ética certificada Fair Trade\n• Energía renovable en toda la cadena\n• Cero desperdicio en manufactura\n\n🌳 Impacto positivo:\n✓ Cada compra planta 3 árboles\n✓ 1% de ventas a conservación oceánica\n✓ Empleos dignos en comunidades locales\n✓ Reducción 80% huella de carbono vs moda rápida\n\n👕 Colección disponible:\n• Camisetas básicas desde $29\n• Jeans sostenibles desde $79\n• Vestidos elegantes desde $99\n• Accesorios eco desde $15\n\n🌍 Viste bien, siente mejor, cuida el planeta.\n\n🛒 Compra consciente: [LINK EN BIO]",
        'hashtags' => ['#modaSostenible #ecoFriendly'],
        'goal' => 'Posicionar marca como líder en moda sostenible y alcanzar 1000+ ventas en Q1',
        'url' => 'https://eco.example.com/moda-sostenible',
      ],
      [
        'title' => 'Webinar Gratuito - Marketing Digital 2026',
        'body' => "🎓 Webinar GRATUITO: Estrategias de Marketing Digital para 2026 📊\n\n¿Quieres llevar tu negocio al siguiente nivel? Únete a nuestro webinar exclusivo con expertos de la industria.\n\n📅 Fecha: Próximo jueves 20:00 hrs\n⏱️ Duración: 90 minutos + Q&A\n💻 Modalidad: Online en vivo\n\n📚 Aprenderás:\n• Tendencias de marketing digital 2026\n• Estrategias de contenido que convierten\n• Automatización de ventas con IA\n• Publicidad en redes sociales ROI positivo\n• Email marketing que funciona\n• Analítica y métricas clave\n\n🎁 BONUS para asistentes:\n✓ Plantillas de contenido descargables\n✓ Checklist de marketing digital\n✓ 30 min consultoría gratis\n✓ Certificado de asistencia\n\n👨‍🏫 Imparte: Juan Pérez, CMO con 15+ años experiencia\n\n🎟️ Cupos limitados - Regístrate GRATIS\n\n🔗 Link de registro en bio",
        'hashtags' => ['#webinar #marketingDigital'],
        'goal' => 'Generar 500+ registros y convertir 10% en clientes de servicios premium',
        'url' => 'https://eventos.example.com/webinar-marketing-2026',
      ],
      [
        'title' => 'Lanzamiento App Móvil - Productividad Máxima',
        'body' => "📱 ¡Lanzamos nuestra APP! Tu asistente de productividad personal 🚀\n\nDespués de 2 años de desarrollo, finalmente está aquí: la app que revolucionará tu forma de trabajar y organizarte.\n\n⚡ Características principales:\n• Gestión de tareas con IA predictiva\n• Calendario inteligente que se auto-organiza\n• Sincronización multi-dispositivo en tiempo real\n• Modo focus con bloqueo de distracciones\n• Integración con 50+ herramientas\n• Reportes de productividad personalizados\n• Recordatorios inteligentes basados en contexto\n\n🎯 Beneficios comprobados:\n✓ 40% más productividad\n✓ 60% menos estrés\n✓ 3 horas ahorradas por día\n✓ Mejor balance vida-trabajo\n\n💰 Precio de lanzamiento:\n• Plan Básico: GRATIS para siempre\n• Plan Pro: $9.99/mes (50% OFF primer año)\n• Plan Teams: $49.99/mes para equipos\n\n🎁 OFERTA LANZAMIENTO:\nPrimeros 1000 usuarios obtienen Plan Pro GRATIS por 6 meses\n\n📲 Descarga ya:\n• iOS: App Store\n• Android: Google Play\n\n#ProductividadMaxima",
        'hashtags' => ['#appMovil #productividad #tecnologia'],
        'goal' => 'Alcanzar 10,000 descargas en primer mes y 1000+ suscripciones Pro',
        'url' => 'https://app.example.com/descargar',
      ],
      [
        'title' => 'Curso Online - Fotografía Profesional desde Cero',
        'body' => "📸 Curso Online: Fotografía Profesional desde Cero 🎨\n\n¿Siempre quisiste ser fotógrafo profesional? Este es tu momento. Aprende de los mejores y convierte tu pasión en profesión.\n\n🎓 Programa completo (12 semanas):\n\nMódulo 1: Fundamentos\n• Composición y encuadre\n• Manejo de luz natural y artificial\n• Configuración de cámara profesional\n\nMódulo 2: Técnicas Avanzadas\n• Fotografía de retrato\n• Fotografía de producto\n• Fotografía de paisaje\n• Fotografía nocturna\n\nMódulo 3: Post-producción\n• Lightroom profesional\n• Photoshop avanzado\n• Flujo de trabajo optimizado\n\nMódulo 4: Negocio\n• Cómo conseguir clientes\n• Pricing y cotizaciones\n• Portfolio profesional\n• Marketing para fotógrafos\n\n👨‍🏫 Instructor: Laura Sánchez\n• 20+ años experiencia\n• Fotógrafa National Geographic\n• +50,000 estudiantes\n\n💎 Incluye:\n✓ 80+ videos HD\n✓ Ejercicios prácticos\n✓ Feedback personalizado\n✓ Certificado profesional\n✓ Acceso de por vida\n✓ Comunidad privada\n✓ Actualizaciones gratis\n\n💰 Inversión: $197 (valor $997)\n🎁 BONUS: Presets Lightroom profesionales\n\n⏰ Inscripciones cierran en 48 horas\n\n🔗 Más info y registro: [LINK EN BIO]",
        'hashtags' => ['#fotografia #cursoOnline'],
        'goal' => 'Vender 100 cursos en lanzamiento inicial generando $19,700 en ingresos',
        'url' => 'https://cursos.example.com/fotografia-profesional',
      ],
      [
        'title' => 'Concurso Redes Sociales - Gana Viaje a París',
        'body' => "🎉 ¡MEGA CONCURSO! Gana un Viaje para 2 a París ✈️🗼\n\nCelebramos 10 años y queremos premiarte con el viaje de tus sueños a la Ciudad de la Luz.\n\n🎁 PREMIO PRINCIPAL:\n• Vuelos redondos para 2 personas\n• 7 noches en hotel 4 estrellas\n• Tours guiados por la ciudad\n• Entradas a museos principales\n• $1000 USD para gastos\n• Valor total: $8,500 USD\n\n🏆 PREMIOS ADICIONALES:\n• 2do lugar: iPhone 15 Pro Max\n• 3er lugar: iPad Air + Apple Pencil\n• 10 menciones: Gift cards $100\n\n📝 CÓMO PARTICIPAR:\n1️⃣ Sigue nuestra cuenta @example\n2️⃣ Dale LIKE a esta publicación\n3️⃣ Comenta por qué quieres ir a París\n4️⃣ Comparte en tus stories (etiquétanos)\n5️⃣ Etiqueta a 3 amigos\n\n⚡ PARTICIPACIONES EXTRA:\n• +1 por cada amigo que te etiquete\n• +5 por compartir en Facebook\n• +10 por crear video sobre nosotros\n\n📅 Fecha límite: 30 de marzo\n🎲 Sorteo en vivo: 5 de abril\n\n📜 Bases completas en: [LINK EN BIO]\n\n¡Mucha suerte a todos! 🍀✨",
        'hashtags' => ['#concurso #sorteo #ganaViaj'],
        'goal' => 'Viralizar marca alcanzando 50,000+ interacciones y 10,000+ nuevos seguidores',
        'url' => 'https://concurso.example.com/viaje-paris',
      ],
      [
        'title' => 'Podcast Semanal - Historias de Éxito Empresarial',
        'body' => "🎙️ NUEVO EPISODIO de nuestro Podcast 🚀\n\nEsta semana entrevistamos a María López, CEO de TechStart, quien nos cuenta cómo pasó de $0 a $10M en ventas en solo 3 años.\n\n🎧 En este episodio descubrirás:\n• Los 3 errores que casi destruyen su empresa\n• La estrategia de marketing que cambió todo\n• Cómo construir un equipo de alto rendimiento\n• Consejos para conseguir inversión\n• El mindset del emprendedor exitoso\n\n Momentos destacados:\n[00:05] Introducción y background\n[12:30] El momento de quiebre\n[28:45] Estrategia de crecimiento\n[45:20] Lecciones aprendidas\n[58:00] Consejos para emprendedores\n\n🎁 RECURSOS GRATUITOS:\n✓ Template de business plan\n✓ Checklist de validación de idea\n✓ Guía de pitch para inversores\n\n📱 Escúchalo en:\n• Spotify\n• Apple Podcasts\n• YouTube\n• Google Podcasts\n\n⭐ Déjanos tu reseña de 5 estrellas\n\n#NuevoEpisodio",
        'hashtags' => ['#podcast #emprendimiento #negocio'],
        'goal' => 'Alcanzar 5,000 reproducciones y posicionar el podcast en top 10 de negocios',
        'url' => 'https://podcast.example.com/episodio-15',
      ],
      [
        'title' => 'Masterclass Gratuita - Inversiones Inteligentes',
        'body' => "💰 Masterclass GRATUITA: Inversiones Inteligentes para Principiantes 📈\n\n¿Quieres hacer crecer tu dinero pero no sabes por dónde empezar? Esta masterclass es para ti.\n\n📅 Cuándo: Sábado 15 de marzo, 10:00 AM\n⏱️ Duración: 3 horas intensivas\n💻 Dónde: Online en vivo + grabación\n\n📚 Temario completo:\n\n1️⃣ Fundamentos de Inversión\n• Tipos de activos (acciones, bonos, ETFs)\n• Riesgo vs retorno\n• Diversificación de portafolio\n\n2️⃣ Estrategias Prácticas\n• Inversión a largo plazo\n• Dollar cost averaging\n• Rebalanceo de portafolio\n\n3️⃣ Herramientas y Plataformas\n• Mejores brokers para principiantes\n• Apps de inversión\n• Análisis de mercado\n\n4️⃣ Errores Comunes\n• Qué NO hacer al invertir\n• Sesgos psicológicos\n• Gestión de emociones\n\n👨‍🏫 Instructor: Roberto Sánchez\n• CFA Charterholder\n• 15+ años en Wall Street\n• Autor bestseller \"Invierte Inteligente\"\n\n🎁 BONOS EXCLUSIVOS:\n✓ Plantilla de análisis de inversiones\n✓ Calculadora de retorno de inversión\n✓ Lista de 50 acciones recomendadas\n✓ 30 días acceso premium a plataforma\n✓ Certificado de participación\n\n💎 Valor: $297 → HOY GRATIS\n\n🎟️ Cupos limitados a 500 personas\n\n🔗 Regístrate ahora: [LINK EN BIO]",
        'hashtags' => ['#inversiones #finanzas #masterclass'],
        'goal' => 'Generar 500 registros y convertir 15% en clientes de asesoría premium',
        'url' => 'https://masterclass.example.com/inversiones',
      ],
      [
        'title' => 'Lanzamiento Libro - Guía Completa de Redes Sociales',
        'body' => "📚 ¡MI LIBRO YA ESTÁ DISPONIBLE! 🎉\n\n\"Domina las Redes Sociales: Guía Completa para Emprendedores\"\n\nDespués de 2 años de trabajo, finalmente puedo compartir contigo todo lo que sé sobre marketing en redes sociales.\n\n📖 Qué encontrarás en el libro:\n\n✅ Capítulo 1: Estrategia de Contenido\n• Cómo crear contenido que vende\n• Calendario editorial efectivo\n• Storytelling que conecta\n\n✅ Capítulo 2: Crecimiento Orgánico\n• Algoritmos explicados simple\n• Técnicas de engagement\n• Colaboraciones estratégicas\n\n✅ Capítulo 3: Publicidad Pagada\n• Facebook & Instagram Ads\n• TikTok Ads que convierten\n• ROI y métricas clave\n\n✅ Capítulo 4: Monetización\n• Productos digitales\n• Servicios y consultoría\n• Marcas y patrocinios\n\n✅ Capítulo 5: Herramientas\n• Apps imprescindibles\n• Automatización inteligente\n• Analítica avanzada\n\n📊 Incluye:\n• 300+ páginas de contenido\n• 50+ plantillas descargables\n• 100+ ejemplos reales\n• Casos de estudio detallados\n• Acceso a comunidad privada\n• Actualizaciones de por vida\n\n💰 Precio de lanzamiento:\n• Ebook: $29 (valor $79)\n• Físico: $49 (valor $129)\n• Bundle: $59 (ambos formatos)\n\n🎁 BONUS LIMITADO (primeros 100):\n✓ Sesión de consultoría 1-on-1 (valor $200)\n✓ Plantillas de Canva premium\n✓ Swipe file con 500+ posts\n\n⭐ Ya tiene 50+ reseñas de 5 estrellas\n\n🛒 Compra ahora: [LINK EN BIO]",
        'hashtags' => ['#libro #redesSociales #marketing'],
        'goal' => 'Vender 1,000 copias en primer mes generando $29,000+ en ingresos',
        'url' => 'https://libro.example.com/redes-sociales',
      ],
      [
        'title' => 'Evento Presencial - Networking Empresarial',
        'body' => "🤝 EVENTO PRESENCIAL: Networking Night para Emprendedores 🌟\n\nConecta con otros emprendedores, inversionistas y líderes de la industria en una noche inolvidable.\n\n📅 Fecha: Viernes 22 de marzo\n🕖 Hora: 7:00 PM - 11:00 PM\n📍 Lugar: Hotel Marriott, Salón Principal\n👥 Capacidad: 200 personas\n\n🎯 Perfil de asistentes:\n• Emprendedores y fundadores\n• Inversionistas ángeles y VCs\n• CEOs y directores\n• Profesionales de marketing y ventas\n• Consultores y coaches\n\n📋 Agenda del evento:\n\n7:00 PM - Registro y bienvenida\n• Cóctel de bienvenida\n• Entrega de kit de networking\n\n7:30 PM - Keynote Speaker\n• \"El Futuro del Emprendimiento en Latinoamérica\"\n• Por: Juan Martínez, CEO de StartupHub\n\n8:30 PM - Speed Networking\n• Sesiones de 5 minutos\n• Conoce a 20+ personas\n• Intercambio de contactos\n\n9:30 PM - Networking Libre\n• Cena buffet gourmet\n• Barra libre premium\n• Música en vivo\n\n10:30 PM - Pitch Competition\n• 5 startups presentan\n• Premio: $10,000 en servicios\n\n💼 Incluye:\n✓ Acceso a todas las actividades\n✓ Cena y bebidas ilimitadas\n✓ Kit de networking (tarjetas, badge)\n✓ Acceso a app de networking\n✓ Fotos profesionales\n✓ Grabación del evento\n\n🎁 BONUS:\n• Directorio digital de asistentes\n• Grupo privado de WhatsApp\n• Invitación a eventos futuros\n\n💰 Inversión:\n• Early Bird: $79 (hasta 10 marzo)\n• Regular: $99\n• VIP: $149 (incluye meet & greet)\n\n⚡ ¡Solo quedan 50 lugares!\n\n🎟️ Compra tu boleto: [LINK EN BIO]",
        'hashtags' => ['#networking #evento #emprendedores #negocios'],
        'goal' => 'Vender 200 boletos generando $19,800 y crear comunidad empresarial',
        'url' => 'https://eventos.example.com/networking-night',
      ],
      [
        'title' => 'Servicio de Consultoría - Transformación Digital',
        'body' => "🚀 TRANSFORMACIÓN DIGITAL para tu Empresa 💼\n\n¿Tu negocio sigue operando como en el 2010? Es hora de evolucionar.\n\nAyudamos a empresas tradicionales a digitalizarse y multiplicar sus ventas.\n\n📊 Nuestro proceso probado:\n\n1️⃣ DIAGNÓSTICO (Semana 1-2)\n• Auditoría completa de procesos\n• Análisis de competencia digital\n• Identificación de oportunidades\n• Roadmap personalizado\n\n2️⃣ ESTRATEGIA (Semana 3-4)\n• Definición de objetivos SMART\n• Selección de tecnologías\n• Plan de implementación\n• Presupuesto detallado\n\n3️⃣ IMPLEMENTACIÓN (Mes 2-4)\n• Migración a la nube\n• Automatización de procesos\n• CRM y herramientas de ventas\n• E-commerce y pagos online\n• Marketing digital\n\n4️⃣ CAPACITACIÓN (Mes 5)\n• Training para todo el equipo\n• Manuales y documentación\n• Soporte técnico 24/7\n\n5️⃣ OPTIMIZACIÓN (Mes 6+)\n• Análisis de resultados\n• Ajustes y mejoras\n• Escalamiento\n• Soporte continuo\n\n✅ Resultados garantizados:\n• 40% reducción de costos operativos\n• 3x aumento en productividad\n• 5x crecimiento en ventas online\n• ROI positivo en 6 meses\n\n🏆 Casos de éxito:\n• Retail: +250% ventas online\n• Manufactura: -60% tiempo de producción\n• Servicios: +180% clientes nuevos\n\n👥 Nuestro equipo:\n• Consultores certificados\n• Desarrolladores senior\n• Especialistas en UX/UI\n• Expertos en marketing digital\n\n💰 Inversión:\n• Paquete Básico: $15,000\n• Paquete Pro: $35,000\n• Paquete Enterprise: $75,000\n• Pago en 6 cuotas sin intereses\n\n🎁 OFERTA ESPECIAL:\nPrimeras 10 empresas obtienen:\n✓ 20% descuento\n✓ 3 meses soporte gratis\n✓ Auditoría SEO incluida\n\n📞 Agenda consulta gratuita: [LINK EN BIO]",
        'hashtags' => ['#transformacionDigital #consultoria #digitalizacion'],
        'goal' => 'Cerrar 10 contratos generando $250,000+ en ingresos',
        'url' => 'https://consultoria.example.com/transformacion-digital',
      ],
      [
        'title' => 'Programa de Afiliados - Gana Dinero Recomendando',
        'body' => "💸 PROGRAMA DE AFILIADOS: Gana hasta $5,000/mes 🤑\n\n¿Quieres generar ingresos pasivos recomendando productos que amas?\n\nÚnete a nuestro programa de afiliados y empieza a ganar hoy.\n\n💰 Comisiones generosas:\n• 30% en productos digitales\n• 20% en servicios mensuales\n• 15% en productos físicos\n• Comisiones recurrentes de por vida\n• Pagos quincenales vía PayPal/transferencia\n\n🎯 Cómo funciona:\n\n1️⃣ Regístrate gratis\n• Aprobación inmediata\n• Acceso a dashboard\n• Links personalizados\n\n2️⃣ Promociona\n• Comparte en redes sociales\n• Crea contenido (blogs, videos)\n• Email marketing\n• Anuncios pagados (opcional)\n\n3️⃣ Gana dinero\n• Tracking en tiempo real\n• Reportes detallados\n• Pagos automáticos\n\n📊 Herramientas incluidas:\n• Banners y creativos profesionales\n• Plantillas de email\n• Scripts para videos\n• Swipe copy para posts\n• Landing pages optimizadas\n• Capacitación gratuita\n\n🏆 Programa de incentivos:\n• 5 ventas: Bonus $100\n• 20 ventas: Bonus $500\n• 50 ventas: Bonus $2,000\n• Top 10 afiliados: Viaje todo pagado\n\n Estrategias que funcionan:\n✓ Reviews honestos en YouTube\n✓ Tutoriales paso a paso\n✓ Comparativas de productos\n✓ Casos de estudio\n✓ Webinars y lives\n\n📈 Potencial de ingresos:\n• Principiante: $500-1,000/mes\n• Intermedio: $2,000-5,000/mes\n• Avanzado: $10,000+/mes\n\n👥 Comunidad de afiliados:\n• Grupo privado de Facebook\n• Calls semanales de estrategia\n• Networking con top afiliados\n• Soporte prioritario\n\n🎁 BONUS DE BIENVENIDA:\n✓ Curso de marketing de afiliados ($297)\n✓ 100 plantillas de contenido\n✓ Consultoría 1-on-1 (30 min)\n\n✅ Sin costos ocultos\n✅ Sin cuotas mensuales\n✅ Sin mínimo de ventas\n✅ Cancela cuando quieras\n\n🚀 Únete ahora: [LINK EN BIO]",
        'hashtags' => ['#afiliados #ingresoPasivo #ganarDinero'],
        'goal' => 'Reclutar 500 afiliados activos generando $100,000+ en ventas',
        'url' => 'https://afiliados.example.com/registro',
      ],
      [
        'title' => 'Bootcamp Intensivo - Desarrollo Web Full Stack',
        'body' => "💻 BOOTCAMP INTENSIVO: Conviértete en Desarrollador Full Stack en 12 Semanas 🚀\n\n¿Quieres cambiar de carrera y ganar $50,000+ al año?\n\nNuestro bootcamp te prepara para conseguir tu primer trabajo como desarrollador.\n\n📚 Programa completo:\n\n🔹 FRONTEND (Semanas 1-4)\n• HTML5, CSS3, JavaScript ES6+\n• React.js y Next.js\n• Tailwind CSS y diseño responsive\n• Git y GitHub\n\n🔹 BACKEND (Semanas 5-8)\n• Node.js y Express\n• Bases de datos (PostgreSQL, MongoDB)\n• APIs RESTful y GraphQL\n• Autenticación y seguridad\n\n🔹 DEVOPS (Semanas 9-10)\n• Docker y contenedores\n• CI/CD con GitHub Actions\n• Deploy en AWS, Vercel, Heroku\n• Monitoreo y logs\n\n🔹 PROYECTO FINAL (Semanas 11-12)\n• Aplicación full stack completa\n• Trabajo en equipo (metodología Agile)\n• Presentación a empresas\n• Portfolio profesional\n\n⏰ Modalidad:\n• 100% online en vivo\n• Lunes a viernes 6-10 PM\n• Sábados 9 AM - 1 PM\n• Grabaciones disponibles\n• 400+ horas de contenido\n\n👨‍🏫 Instructores:\n• Desarrolladores senior de Google, Meta, Amazon\n• 10+ años de experiencia\n• Mentores dedicados\n\n💼 Garantía de empleo:\n✓ Preparación para entrevistas\n✓ Revisión de CV y\n✓ Simulacros de entrevistas técnicas\n✓ Conexión con 100+ empresas\n✓ Garantía: Consigues trabajo o te devolvemos el dinero\n\n📊 Estadísticas:\n• 94% consigue empleo en 3 meses\n• Salario promedio: $55,000/año\n• +2,000 graduados exitosos\n• 4.9/5 estrellas (500+ reviews)\n\n💰 Inversión:\n• Pago único: $8,997\n• 12 cuotas: $849/mes\n• ISA (Income Share Agreement): Paga cuando consigas trabajo\n\n🎁 INCLUYE:\n✓ Acceso de por vida al contenido\n✓ Laptop MacBook (en modalidad presencial)\n✓ Licencias de software ($500 valor)\n✓ Certificado profesional\n✓ Membresía comunidad alumni\n\n🎯 Requisitos:\n• Ninguna experiencia previa necesaria\n• Computadora con internet\n• Dedicación 25-30 hrs/semana\n• Ganas de aprender\n\n📅 Próxima cohorte: 1 de abril\n⚡ Solo 30 cupos disponibles\n\n🚀 Aplica ahora: [LINK EN BIO]",
        'hashtags' => ['#bootcamp #programacion #desarrolloWeb #fullstack '],
        'goal' => 'Llenar cohorte de 30 estudiantes generando $269,910 en ingresos',
        'url' => 'https://bootcamp.example.com/fullstack',
      ],
      [
        'title' => 'Membresía Premium - Comunidad Exclusiva',
        'body' => "👑 MEMBRESÍA PREMIUM: Únete a la Comunidad Más Exclusiva de Emprendedores 🌟\n\nAcceso ilimitado a recursos, networking y mentoría de clase mundial.\n\n🎯 Qué incluye la membresía:\n\n📚 CONTENIDO EXCLUSIVO\n• 50+ cursos completos\n• Masterclasses mensuales en vivo\n• Biblioteca con 500+ recursos\n• Plantillas y herramientas premium\n• Actualizaciones semanales\n\n👥 NETWORKING DE ALTO NIVEL\n• Comunidad privada de 5,000+ miembros\n• Eventos presenciales trimestrales\n• Grupos de mastermind\n• Directorio de miembros\n• Oportunidades de colaboración\n\n🎓 MENTORÍA PERSONALIZADA\n• 2 sesiones 1-on-1 al mes\n• Revisión de estrategias\n• Feedback en tiempo real\n• Acceso a mentores expertos\n\n💼 OPORTUNIDADES DE NEGOCIO\n• Job board exclusivo\n• Pitch a inversionistas\n• Partnerships estratégicos\n• Descuentos en servicios (30-50% OFF)\n\n🛠️ HERRAMIENTAS PREMIUM\n• CRM integrado\n• Email marketing ilimitado\n• Landing page builder\n• Analytics avanzado\n• Automatizaciones\n\n📊 RESULTADOS DE MIEMBROS:\n• 78% aumentó ingresos en 6 meses\n• 65% consiguió nuevos clientes\n• 52% levantó capital\n• 89% recomienda la membresía\n\n💰 PLANES DISPONIBLES:\n\n🥉 BÁSICO - $49/mes\n• Acceso a cursos\n• Comunidad online\n• 1 sesión de mentoría/mes\n\n🥈 PRO - $99/mes (MÁS POPULAR)\n• Todo lo de Básico +\n• Masterclasses en vivo\n• 2 sesiones de mentoría/mes\n• Eventos presenciales\n• Herramientas premium\n\n🥇 ELITE - $299/mes\n• Todo lo de Pro +\n• Mentoría ilimitada\n• Acceso VIP a eventos\n• Networking con CEOs\n• Consultoría estratégica\n• Concierge service\n\n🎁 OFERTA DE LANZAMIENTO:\n✓ 50% OFF primer mes\n✓ Garantía 30 días (devolvemos dinero)\n✓ Bonos valorados en $2,000\n✓ Acceso inmediato\n\n⭐ Testimonios:\n\"Esta comunidad cambió mi negocio. En 3 meses recuperé la inversión 10x\" - Carlos M.\n\n\"El networking solo vale 10x el precio de la membresía\" - Ana R.\n\n\"Mejor inversión que he hecho en mi carrera\" - Luis P.\n\n🚀 Únete hoy: [LINK EN BIO]\n\n⏰ Oferta termina en 48 horas",
        'hashtags' => ['#membresia #comunidad #emprendedores'],
        'goal' => 'Conseguir 500 miembros generando $49,500/mes en ingresos recurrentes',
        'url' => 'https://membresia.example.com/premium',
      ],
    ];

    // Create 20-25 publications per user with richer test data (aumentado para más variedad)
    $count = rand(20, 25);
    $campaignPool = [];

    for ($i = 0; $i < $count; $i++) {
      $template = $publicationTemplates[array_rand($publicationTemplates)];
      
      $title = $template['title'] . ' - ' . Str::random(4);
      $startDate = Carbon::now()->subDays(rand(10, 90));
      $endDate = $startDate->copy()->addDays(rand(7, 60));

      // 40% chance to be part of a campaign grouping
      $isCampaign = rand(1, 100) <= 40;
      $campaignName = null;
      if ($isCampaign) {
        if (rand(1, 100) <= 60 && !empty($campaignPool)) {
          $campaignName = $campaignPool[array_rand($campaignPool)];
        } else {
          $campaignName = Str::title(Str::random(6)) . ' Campaign';
          $campaignPool[] = $campaignName;
        }
      }

      $goal = $isCampaign ? "Campaign: {$campaignName} - " . $template['goal'] : $template['goal'];
      $description = ($isCampaign ? "Parte de la campaña {$campaignName}. " : '') . 
                     "Publicación de prueba con contenido detallado y hashtags relevantes.";

      // Random status distribution - más variedad
      $statusOptions = ['published', 'published', 'published', 'published', 'scheduled', 'scheduled', 'draft', 'approved', 'rejected'];
      $status = $statusOptions[array_rand($statusOptions)];

      // Platform settings with detailed configuration
      $platformSettings = [
        'facebook' => [
          'enabled' => rand(0, 1) === 1,
          'post_type' => ['status', 'photo', 'link'][rand(0, 2)],
          'target_audience' => ['all', '18-35', '25-45'][rand(0, 2)],
        ],
        'twitter' => [
          'enabled' => rand(0, 1) === 1,
          'thread' => rand(0, 1) === 1,
          'reply_settings' => ['everyone', 'following', 'mentioned'][rand(0, 2)],
        ],
      ];

      $publication = Publication::create([
        'user_id' => $user->id,
        'workspace_id' => $workspaceId,
        'title' => $title,
        'slug' => Str::slug($title . '-' . Str::random(4)),
        'status' => $status,
        'goal' => $goal,
        'body' => $template['body'],
        'description' => $description,
        'hashtags' => $template['hashtags'],
        'url' => $template['url'],
        'platform_settings' => $platformSettings,
        'start_date' => $startDate,
        'end_date' => $endDate,
        'publish_date' => $startDate,
        'published_at' => $status === 'published' ? $startDate : null,
        'published_by' => $status === 'published' ? $user->id : null,
        'approved_at' => in_array($status, ['published', 'approved', 'scheduled']) ? $startDate->copy()->subHours(2) : null,
        'approved_by' => in_array($status, ['published', 'approved', 'scheduled']) ? $user->id : null,
      ]);

      // Create an activity record for the publication creation if an activities table exists
      try {
        if (Schema::hasTable('activities')) {
          DB::table('activities')->insert([
            'user_id' => $user->id,
            'subject_type' => Publication::class,
            'subject_id' => $publication->id,
            'description' => "Created publication {$publication->title}",
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
          ]);
        }
      } catch (\Throwable $e) {
        // ignore if activity table has different schema
      }

      // Generate Analytics for published publications
      if ($status === 'published') {
        $this->generateCampaignAnalytics($publication, $isCampaign);
      }
    }
  }

  private function generateCampaignAnalytics($publication, $isCampaign = false)
  {
    $currentDate = $publication->start_date->copy();
    $endDate = $publication->end_date->copy()->min(Carbon::now()); // Don't generate future data yet

    // Campaigns tend to have higher baseline
    $baseViews = $isCampaign ? rand(500, 3000) : rand(100, 1000);

    while ($currentDate <= $endDate) {
      $isWeekend = $currentDate->isWeekend();
      $multiplier = $isWeekend ? 0.6 : 1.1;

      // Randomize daily stats
      $views = (int) ($baseViews * $multiplier * (rand(80, 120) / 100));
      $clicks = (int) ($views * (rand(2, 10) / 100));
      $conversions = (int) ($clicks * (rand(5, 20) / 100));
      $likes = (int) ($views * (rand(5, 15) / 100));
      $comments = (int) ($likes * (rand(5, 20) / 100));
      $shares = (int) ($likes * (rand(2, 10) / 100));
      $saves = (int) ($likes * (rand(1, 5) / 100));

      CampaignAnalytics::create([
        'publication_id' => $publication->id, // IMPORTANT: Using publication_id
        'user_id' => $publication->user_id,
        'date' => $currentDate->format('Y-m-d'),
        'views' => $views,
        'clicks' => $clicks,
        'conversions' => $conversions,
        'likes' => $likes,
        'comments' => $comments,
        'shares' => $shares,
        'saves' => $saves,
        'reach' => (int) ($views * (rand(80, 95) / 100)),
        'impressions' => (int) ($views * (rand(110, 140) / 100)),
        'engagement_rate' => $views > 0 ? round((($likes + $comments + $shares + $saves) / $views) * 100, 2) : 0,
        'ctr' => $views > 0 ? round(($clicks / $views) * 100, 2) : 0,
        'conversion_rate' => $clicks > 0 ? round(($conversions / $clicks) * 100, 2) : 0,
      ]);

      $currentDate->addDay();

      // Slightly trend the base views up or down
      $baseViews = $baseViews * (rand(95, 105) / 100);
    }
  }

  private function createSocialAccountsAndMetrics($user, $workspaceId)
  {
    // Plataformas sociales más realistas
    $platforms = [
      ['name' => 'facebook', 'account_name' => 'Mi Página Facebook', 'followers_base' => rand(5000, 50000)],
      ['name' => 'twitter', 'account_name' => '@mi_twitter', 'followers_base' => rand(2000, 30000)],
      ['name' => 'tiktok', 'account_name' => '@mi_tiktok', 'followers_base' => rand(15000, 200000)],
      ['name' => 'youtube', 'account_name' => 'Mi Canal YouTube', 'followers_base' => rand(5000, 100000)],
    ];

    foreach ($platforms as $platform) {
      // Check if account already exists to avoid duplicates
      $account = SocialAccount::firstOrCreate(
        [
          'user_id' => $user->id,
          'workspace_id' => $workspaceId,
          'platform' => $platform['name']
        ],
        [
          'account_id' => 'test_' . $platform['name'] . '_' . $user->id . '_' . rand(1000, 9999),
          'account_name' => $platform['account_name'] . ' - ' . $user->name,
          'access_token' => 'dummy_token_' . Str::random(32),
          'refresh_token' => 'dummy_refresh_' . Str::random(32),
          'token_expires_at' => now()->addDays(60),
        ]
      );

      // Generate Social Media Metrics for last 90 days
      $this->generateSocialMetrics($account, $platform['followers_base']);
    }
  }

  private function generateSocialMetrics($account, $followersBase = 10000)
  {
    $startDate = Carbon::now()->subDays(90);
    $currentDate = $startDate->copy();

    $followers = $followersBase;

    while ($currentDate <= Carbon::now()) {

      // Check if metric exists
      $exists = SocialMediaMetrics::where('social_account_id', $account->id)
        ->where('date', $currentDate->format('Y-m-d'))
        ->exists();

      if (!$exists) {
        $isWeekend = $currentDate->isWeekend();
        
        // Crecimiento más realista basado en la plataforma
        $growthRate = match($account->platform) {
          'tiktok' => rand(50, 300),      // TikTok crece más rápido
          'youtube' => rand(10, 100),     // YouTube crecimiento medio
          'facebook' => rand(5, 50),      // Facebook crecimiento más lento
          'twitter' => rand(-10, 80),     // Twitter puede perder seguidores
          default => rand(0, 50),
        };
        
        $dailyGrowth = $isWeekend ? (int)($growthRate * 0.7) : $growthRate;
        $followers += $dailyGrowth;
        if ($followers < 0) $followers = 0;

        // Posts más realistas por plataforma
        $postsPerDay = match($account->platform) {
          'tiktok' => $isWeekend ? rand(2, 5) : rand(1, 3),
          'twitter' => $isWeekend ? rand(3, 8) : rand(5, 15),
          'facebook' => $isWeekend ? rand(1, 2) : rand(0, 2),
          'youtube' => rand(0, 1), // YouTube publica menos frecuente
          default => rand(0, 2),
        };

        // Engagement más realista
        $engagementRate = match($account->platform) {
          'tiktok' => rand(8, 18),      // TikTok tiene alto engagement
          'youtube' => rand(4, 10),     // YouTube engagement medio-alto
          'facebook' => rand(1, 4),     // Facebook engagement bajo
          'twitter' => rand(1, 3),      // Twitter engagement bajo
          default => rand(1, 5),
        };

        $views = (int)($followers * ($postsPerDay + 1) * (rand(10, 30) / 100));
        $totalLikes = (int)($views * ($engagementRate / 100));
        $totalComments = (int)($totalLikes * (rand(5, 15) / 100));
        $totalShares = (int)($totalLikes * (rand(2, 8) / 100));

        SocialMediaMetrics::create([
          'social_account_id' => $account->id,
          'user_id' => $account->user_id,
          'date' => $currentDate->format('Y-m-d'),
          'followers' => $followers,
          'following' => rand(100, 1000),
          'posts_count' => $postsPerDay,
          'total_likes' => $totalLikes,
          'total_comments' => $totalComments,
          'total_shares' => $totalShares,
          'engagement_rate' => $engagementRate,
        ]);
      }

      $currentDate->addDay();
    }
  }
}
