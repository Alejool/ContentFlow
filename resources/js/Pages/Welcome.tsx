import Button from '@/Components/common/Modern/Button';
import ThemeLanguageContainer from '@/Components/common/ThemeLanguageContainer';
import OptimizedImage from '@/Components/common/ui/OptimizedImage';
import { SOCIAL_PLATFORMS } from '@/Constants/ConfigSocialMedia/socialPlatforms';
import { useTheme } from '@/Hooks/Layout/useTheme';
import Logo from '@assets/logo.svg';
import { Head, Link } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  Brain,
  Calendar,
  CheckCircle2,
  Globe,
  Image as ImageIcon,
  Mail,
  Rocket,
  Share2,
  Shield,
  Sparkles,
  Upload,
  Users,
  Zap,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface AuthProps {
  user: {
    name: string;
    email: string;
  } | null;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  description: string;
  limits: {
    publications_per_month: number;
    social_accounts: number;
    storage_gb: number;
  };
  features: Record<string, any>;
  popular?: boolean;
}

interface WelcomeProps {
  auth: AuthProps;
  canLogin: boolean;
  canRegister: boolean;
  plans: Plan[];
  systemFeatures: {
    ai: boolean;
    analytics: boolean;
    reels: boolean;
    approval_workflows: boolean;
  };
}

const SUPPORTED_NETWORKS = Object.values(SOCIAL_PLATFORMS).filter((platform) => platform.active);

export default function Welcome({
  auth,
  canLogin,
  canRegister,
  plans = [],
  systemFeatures,
}: WelcomeProps) {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const pricingSectionRef = useRef<HTMLDivElement>(null);
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0);

  const scrollToPricing = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    pricingSectionRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  useEffect(() => {
    const browserLang = navigator.language.split('-')[0];
    const supportedLanguages = ['en', 'es'];

    const defaultLang = supportedLanguages.includes(browserLang) ? browserLang : 'es';
    const currentLang = i18n.language ?? 'es';

    if (currentLang !== defaultLang) {
      i18n.changeLanguage(defaultLang);
    }
  }, [i18n]);

  useEffect(() => {
    // Force orange theme for welcome page
    document.documentElement.setAttribute('data-theme-color', 'orange');

    // Clear any custom color properties that might persist from authenticated session
    const root = document.documentElement;
    [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].forEach((weight) => {
      root.style.removeProperty(`--primary-${weight}`);
    });
  }, []);

  // Definir todas las características posibles
  const allFeatures = [
    {
      id: 'content',
      icon: <Upload className="h-12 w-12" />,
      title: 'Gestión de Contenido Multimedia',
      description:
        'Organiza y gestiona todos tus archivos multimedia en un solo lugar con colecciones inteligentes, etiquetas y búsqueda avanzada.',
      highlights: [
        'Biblioteca multimedia ilimitada',
        'Colecciones y etiquetas personalizadas',
        'Búsqueda y filtros avanzados',
        'Soporte para imágenes, videos y GIFs',
      ],
      enabled: true, // Siempre habilitado
    },
    {
      id: 'publishing',
      icon: <Share2 className="h-12 w-12" />,
      title: 'Publicación Multiplataforma',
      description: `Publica en ${SUPPORTED_NETWORKS.length} redes sociales desde un solo lugar: ${SUPPORTED_NETWORKS.map((p) => p.name).join(', ')}.`,
      highlights: [
        `${SUPPORTED_NETWORKS.length} plataformas soportadas`,
        'Publicación simultánea',
        'Formatos específicos por red',
        'Gestión de múltiples cuentas',
      ],
      enabled: true,
    },
    {
      id: 'scheduling',
      icon: <Calendar className="h-12 w-12" />,
      title: 'Programación Inteligente',
      description:
        'Programa tus publicaciones con calendario visual, cola automática y sugerencias de horarios óptimos.',
      highlights: [
        'Calendario visual interactivo',
        'Cola de publicaciones automática',
        'Programación por zonas horarias',
        'Vista de calendario mensual',
      ],
      enabled: true, // Siempre habilitado
    },
    {
      id: 'ai',
      icon: <Brain className="h-12 w-12" />,
      title: 'Inteligencia Artificial',
      description:
        'Genera contenido, hashtags y descripciones con IA. Obtén sugerencias personalizadas para maximizar el engagement.',
      highlights: [
        'Generación de contenido con IA',
        'Sugerencias de hashtags inteligentes',
        'Optimización de textos',
        'Análisis de tendencias',
      ],
      enabled: systemFeatures?.ai || false,
    },
    {
      id: 'analytics',
      icon: <BarChart3 className="h-12 w-12" />,
      title: 'Analíticas Avanzadas',
      description:
        'Monitorea el rendimiento de tus publicaciones con métricas detalladas, gráficos interactivos y reportes personalizados.',
      highlights: [
        'Métricas en tiempo real',
        'Gráficos interactivos',
        'Reportes personalizados',
        'Comparativas de rendimiento',
      ],
      enabled: systemFeatures?.analytics || false,
    },
    {
      id: 'team',
      icon: <Users className="h-12 w-12" />,
      title: 'Colaboración en Equipo',
      description:
        'Trabaja en equipo con roles y permisos personalizados, flujos de aprobación y comentarios en tiempo real.',
      highlights: [
        'Múltiples miembros del equipo',
        'Roles y permisos granulares',
        'Comentarios y colaboración',
        'Gestión de workspaces',
      ],
      enabled: true, // Siempre habilitado
    },
    {
      id: 'approval',
      icon: <CheckCircle2 className="h-12 w-12" />,
      title: 'Flujos de Aprobación',
      description:
        'Implementa procesos de revisión y aprobación con múltiples niveles, notificaciones automáticas y historial completo.',
      highlights: [
        'Aprobaciones multinivel',
        'Notificaciones automáticas',
        'Historial de cambios',
        'Comentarios y feedback',
      ],
      enabled: systemFeatures?.approval_workflows || false,
    },
    {
      id: 'editor',
      icon: <ImageIcon className="h-12 w-12" />,
      title: 'Editor de Contenido',
      description:
        'Crea y edita publicaciones con un editor visual intuitivo, plantillas prediseñadas y vista previa en tiempo real.',
      highlights: [
        'Editor visual intuitivo',
        'Plantillas prediseñadas',
        'Vista previa por plataforma',
        'Emojis y formato enriquecido',
      ],
      enabled: true, // Siempre habilitado
    },
  ];

  // Filtrar solo las características habilitadas
  const features = allFeatures.filter((feature) => feature.enabled);

  // Auto-advance carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeatureIndex((prev) => (prev + 1) % features.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Head title="Intellipost - Plataforma de Gestión de Contenido" />

      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-50 to-white dark:from-neutral-900 dark:to-neutral-950">
        <div className="pointer-events-none fixed inset-0 z-0">
          <div className="animate-pulse-slow absolute top-[-10%] left-[-10%] h-[50%] w-[50%] rounded-full bg-blue-500/10 blur-[120px]" />
          <div className="animate-pulse-slow absolute right-[-10%] bottom-[-10%] h-[50%] w-[50%] rounded-full bg-purple-500/10 blur-[120px] delay-1000" />
        </div>

        <div className="relative z-10">
          <header className="absolute top-0 right-0 left-0 z-50">
            <div className="mx-auto mt-3 max-w-7xl px-4 sm:px-6 md:mt-5 lg:px-8">
              <div className="flex h-16 items-center justify-between md:h-20">
                <div className="flex shrink-0 items-center">
                  <Link href="/" className="flex items-center">
                    <div className="">
                      <OptimizedImage
                        src={Logo}
                        alt=""
                        eager={true}
                        className="h-autow-full w-48 object-contain"
                      />
                    </div>
                  </Link>
                </div>

                <div className="flex shrink-0 items-center">
                  <ThemeLanguageContainer
                    isWelcome={true}
                    canLogin={canLogin}
                    canRegister={canRegister}
                  />
                </div>
              </div>
            </div>
          </header>

          <main className="pt-32 pb-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="bg-primary-50 dark:bg-primary-900/20 mb-6 inline-flex items-center justify-center rounded-full px-4 py-2"
                >
                  <span className="text-primary-600 dark:text-primary-400 flex items-center gap-1 text-sm font-medium">
                    <motion.div
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                    >
                      <Sparkles className="h-4 w-4" />
                    </motion.div>
                    {t('welcome.beta') || 'Beta Activa'} v.1.0
                  </span>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl dark:text-white"
                >
                  {t('welcome.title') || 'Transforma tu contenido'}
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="text-primary-600 mt-3 flex items-center justify-center gap-2"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Zap className="h-8 w-8" />
                    </motion.div>
                    {t('welcome.titleHighlight') || 'en resultados reales'}
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Rocket className="h-8 w-8" />
                    </motion.div>
                  </motion.span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="mx-auto mt-6 max-w-2xl text-lg text-gray-700 dark:text-neutral-300"
                >
                  {t('welcome.subtitle') ||
                    'La plataforma todo en uno para crear, programar y optimizar contenido en redes sociales. Impulsado por IA.'}
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                  className="mt-10 flex flex-col justify-center gap-4 sm:flex-row"
                >
                  {canRegister ? (
                    <>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Link
                          href="/register"
                          className="bg-primary-600 hover:bg-primary-700 inline-flex items-center justify-center rounded-lg px-8 py-3 text-base font-medium text-white shadow-lg transition-colors hover:shadow-xl"
                        >
                          {t('welcome.startFree') || 'Comenzar Gratis'}
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <a
                          href="#pricing"
                          onClick={scrollToPricing}
                          className="border-primary-600 text-primary-600 hover:bg-primary-50 dark:text-primary-400 inline-flex items-center justify-center rounded-lg border bg-white px-8 py-3 text-base font-medium transition-colors dark:bg-neutral-800 dark:hover:bg-gray-700"
                        >
                          {t('welcome.viewPricing') || 'Ver Planes'}
                        </a>
                      </motion.div>
                    </>
                  ) : canLogin ? (
                    <Link
                      href="/dashboard"
                      className="bg-primary-600 hover:bg-primary-700 inline-flex items-center justify-center rounded-lg px-8 py-3 text-base font-medium text-white shadow-lg transition-colors hover:shadow-xl"
                    >
                      {t('welcome.goToDashboard') || 'Ir al Dashboard'}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  ) : null}
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="relative right-[50%] left-[50%] mx-[-50vw] mt-24 w-screen border-y border-gray-200/50 px-4 py-8 backdrop-blur-sm dark:border-white/5"
                >
                  <div className="mx-auto max-w-7xl text-center">
                    <motion.p
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: 0.4 }}
                      className="mb-8 text-sm font-semibold tracking-wider text-gray-500 uppercase dark:text-neutral-400"
                    >
                      {t('welcome.connectsWith', 'Se integra perfectamente con')}
                    </motion.p>
                    <div className="flex flex-wrap justify-center gap-8 md:gap-16">
                      {SUPPORTED_NETWORKS.map((platform, index) => {
                        const Icon = platform.icon;
                        return (
                          <motion.div
                            key={platform.key}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{
                              duration: 0.5,
                              delay: 0.5 + index * 0.1,
                            }}
                            whileHover={{ scale: 1.1, filter: 'grayscale(0%)' }}
                            className="font-heading flex cursor-default items-center gap-3 text-xl font-bold text-gray-400 grayscale transition-all duration-300 hover:text-gray-900 md:text-2xl dark:text-neutral-500 dark:hover:text-white"
                          >
                            <Icon className={`h-6 w-6 md:h-8 md:w-8 ${platform.textColor}`} />
                            <span>{platform.name}</span>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="mt-20"
              >
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="mb-4 text-center text-3xl font-bold text-gray-900 dark:text-white"
                >
                  {t('welcome.featuresTitle') || 'Todo lo que necesitas en una plataforma'}
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="mt-4 mb-12 text-center text-gray-600 dark:text-neutral-300"
                >
                  {t('welcome.featuresSubtitle') ||
                    'Gestiona tu contenido con herramientas impulsadas por IA'}
                </motion.p>

                {/* Animated Feature Carousel */}
                <div className="relative mx-auto max-w-6xl">
                  {features.length > 0 && (
                    <>
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={currentFeatureIndex}
                          initial={{ opacity: 0, x: 100 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -100 }}
                          transition={{ duration: 0.5, ease: 'easeInOut' }}
                          className="relative"
                        >
                          <div className="bg-primary-500 relative overflow-hidden rounded-lg p-1">
                            <div className="relative rounded-lg bg-white p-8 md:p-12 dark:bg-neutral-900">
                              <div className="grid items-center gap-8 md:grid-cols-2">
                                {/* Left side - Icon and Title */}
                                <motion.div
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: 0.2, duration: 0.5 }}
                                  className="text-center md:text-left"
                                >
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{
                                      delay: 0.3,
                                      type: 'spring',
                                      stiffness: 200,
                                    }}
                                    className="bg-primary-500 mb-6 inline-flex h-24 w-24 items-center justify-center rounded-lg text-white shadow-2xl"
                                  >
                                    {features[currentFeatureIndex]?.icon}
                                  </motion.div>
                                  <h3 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl dark:text-white">
                                    {features[currentFeatureIndex]?.title}
                                  </h3>
                                  <p className="text-lg text-gray-600 dark:text-neutral-300">
                                    {features[currentFeatureIndex]?.description}
                                  </p>
                                </motion.div>

                                {/* Right side - Highlights */}
                                <motion.div
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: 0.4, duration: 0.5 }}
                                  className="space-y-4"
                                >
                                  {features[currentFeatureIndex]?.highlights.map(
                                    (highlight, idx) => (
                                      <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{
                                          delay: 0.5 + idx * 0.1,
                                          duration: 0.4,
                                        }}
                                        className="flex items-start gap-3 rounded-lg bg-gray-50 p-4 transition-colors hover:bg-gray-100 dark:bg-neutral-800/50 dark:hover:bg-gray-800"
                                      >
                                        <motion.div
                                          initial={{ scale: 0 }}
                                          animate={{ scale: 1 }}
                                          transition={{
                                            delay: 0.6 + idx * 0.1,
                                            type: 'spring',
                                          }}
                                          className="bg-primary-500 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                                        >
                                          <CheckCircle2 className="h-4 w-4 text-white" />
                                        </motion.div>
                                        <span className="font-medium text-gray-700 dark:text-neutral-300">
                                          {highlight}
                                        </span>
                                      </motion.div>
                                    ),
                                  )}
                                </motion.div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      </AnimatePresence>

                      {/* Pagination Dots */}
                      <div className="mt-8 flex justify-center gap-3">
                        {features.map((_, index) => (
                          <motion.button
                            key={index}
                            onClick={() => setCurrentFeatureIndex(index)}
                            className={`relative h-3 rounded-full transition-all duration-300 ${
                              index === currentFeatureIndex
                                ? 'bg-primary-600 w-12'
                                : 'w-3 bg-gray-300 hover:bg-gray-400 dark:bg-neutral-600 dark:hover:bg-gray-500'
                            }`}
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            {index === currentFeatureIndex && (
                              <motion.div
                                className="bg-primary-600 absolute inset-0 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: '100%' }}
                                transition={{ duration: 5, ease: 'linear' }}
                              />
                            )}
                          </motion.button>
                        ))}
                      </div>

                      {/* Navigation Arrows */}
                      <div className="pointer-events-none absolute top-1/2 right-0 left-0 flex -translate-y-1/2 justify-between px-4">
                        <motion.div
                          whileHover={{ scale: 1.1, x: -5 }}
                          whileTap={{ scale: 0.9 }}
                          className="pointer-events-auto"
                        >
                          <Button
                            onClick={() =>
                              setCurrentFeatureIndex(
                                (prev) => (prev - 1 + features.length) % features.length,
                              )
                            }
                            buttonStyle="solid"
                            variant="ghost"
                            size="md"
                            rounded="full"
                            shadow="lg"
                            className="!h-12 !w-12 !p-0"
                          >
                            <ArrowRight className="h-6 w-6 rotate-180" />
                          </Button>
                        </motion.div>
                        <motion.div
                          whileHover={{ scale: 1.1, x: 5 }}
                          whileTap={{ scale: 0.9 }}
                          className="pointer-events-auto"
                        >
                          <Button
                            onClick={() =>
                              setCurrentFeatureIndex((prev) => (prev + 1) % features.length)
                            }
                            buttonStyle="solid"
                            variant="ghost"
                            size="md"
                            rounded="full"
                            shadow="lg"
                            className="!h-12 !w-12 !p-0"
                          >
                            <ArrowRight className="h-6 w-6" />
                          </Button>
                        </motion.div>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>

              {/* Pricing Preview Section */}
              <motion.div
                ref={pricingSectionRef}
                id="pricing"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="mt-20"
              >
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-center text-3xl font-bold text-gray-900 dark:text-white"
                >
                  {t('welcome.pricingTitle') || 'Planes para cada necesidad'}
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="mt-4 text-center text-gray-600 dark:text-neutral-300"
                >
                  {t('welcome.pricingSubtitle') ||
                    'Desde planes gratuitos hasta soluciones empresariales'}
                </motion.p>

                <div
                  className={`mt-10 grid gap-6 ${plans.length === 1 ? 'mx-auto max-w-md grid-cols-1' : plans.length === 2 ? 'mx-auto max-w-3xl sm:grid-cols-2' : plans.length === 3 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-4'}`}
                >
                  {plans.map((plan, planIndex) => {
                    const isPopular = plan.popular;

                    // Formatear límites con traducciones
                    const getPublicationsText = () => {
                      if (plan.limits.publications_per_month === -1) {
                        return (
                          t('pricing.features.publicationsUnlimited') || 'Publicaciones ilimitadas'
                        );
                      }
                      const count = plan.limits.publications_per_month;
                      return `${count} ${t('common.publicationsPerMonth') || 'publicaciones/mes'}`;
                    };

                    const getSocialAccountsText = () => {
                      if (plan.limits.social_accounts === -1) {
                        return (
                          t('pricing.features.socialAccountsUnlimited') ||
                          'Cuentas sociales ilimitadas'
                        );
                      }
                      const count = plan.limits.social_accounts;
                      return `${count} ${count === 1 ? t('common.socialAccount') || 'red social' : t('common.socialAccounts') || 'redes sociales'}`;
                    };

                    const getStorageText = () => {
                      if (plan.limits.storage_gb >= 1000) {
                        return `${plan.limits.storage_gb / 1000}TB ${t('common.storage') || 'almacenamiento'}`;
                      }
                      return `${plan.limits.storage_gb}GB ${t('common.storage') || 'almacenamiento'}`;
                    };

                    return (
                      <motion.div
                        key={plan.id}
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{
                          duration: 0.5,
                          delay: 0.6 + planIndex * 0.1,
                        }}
                        whileHover={{ scale: 1.05, y: -5 }}
                      >
                        <Link
                          href={
                            canRegister
                              ? `/register?plan=${plan.id}`
                              : canLogin
                                ? '/pricing'
                                : '/register'
                          }
                          className={`relative block rounded-lg border ${
                            isPopular
                              ? 'border-primary-500 shadow-lg'
                              : 'hover:border-primary-500 border-gray-200 hover:shadow-lg dark:border-neutral-700'
                          } h-full cursor-pointer bg-white p-6 transition-all dark:bg-neutral-800`}
                        >
                          {isPopular && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0 }}
                              whileInView={{ opacity: 1, scale: 1 }}
                              viewport={{ once: true }}
                              transition={{
                                delay: 0.8 + planIndex * 0.1,
                                type: 'spring',
                              }}
                              className="absolute -top-4 left-1/2 -translate-x-1/2 transform"
                            >
                              <span className="bg-primary-500 inline-flex items-center rounded-full px-3 py-1 text-xs font-medium text-white">
                                {t('pricing.mostPopular') || 'Más Popular'}
                              </span>
                            </motion.div>
                          )}
                          <div className="text-center">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                              {t(`pricing.plans.${plan.id}.name`) || plan.name}
                            </h3>
                            <div className="mt-4">
                              <span className="text-4xl font-bold text-gray-900 dark:text-white">
                                ${plan.price}
                              </span>
                              <span className="text-gray-600 dark:text-neutral-400">
                                {t('pricing.perMonth') || '/mes'}
                              </span>
                            </div>
                            <ul className="mt-6 space-y-3 text-left text-sm">
                              <li className="flex items-center gap-2">
                                <div className="bg-primary-500 h-1.5 w-1.5 rounded-full"></div>
                                <span className="text-gray-700 dark:text-neutral-300">
                                  {getPublicationsText()}
                                </span>
                              </li>
                              <li className="flex items-center gap-2">
                                <div className="bg-primary-500 h-1.5 w-1.5 rounded-full"></div>
                                <span className="text-gray-700 dark:text-neutral-300">
                                  {getSocialAccountsText()}
                                </span>
                              </li>
                              <li className="flex items-center gap-2">
                                <div className="bg-primary-500 h-1.5 w-1.5 rounded-full"></div>
                                <span className="text-gray-700 dark:text-neutral-300">
                                  {getStorageText()}
                                </span>
                              </li>
                            </ul>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>

                <div className="mt-8 text-center">
                  {auth.user ? (
                    <Link
                      href="/pricing"
                      className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 inline-flex items-center justify-center font-medium"
                    >
                      {t('welcome.viewAllPlans') || 'Ver todos los planes y características'}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  ) : (
                    <Link
                      href="/register"
                      className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 inline-flex items-center justify-center font-medium"
                    >
                      {t('welcome.viewAllPlans') || 'Ver todos los planes y características'}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  )}
                </div>
              </motion.div>

              <div className="from-primary-50 dark:from-primary-900/20 relative mt-20 overflow-hidden rounded-lg bg-gradient-to-r to-pink-50 p-8 backdrop-blur-sm dark:to-pink-900/20">
                <div className="bg-primary-200/20 dark:bg-primary-500/10 absolute top-0 right-0 h-64 w-64 translate-x-32 -translate-y-32 rounded-full"></div>
                <div className="relative text-center">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {t('welcome.readyToStart') || '¿Listo para transformar tu contenido?'}
                  </h2>
                  <p className="mt-2 text-gray-600 dark:text-neutral-300">
                    {t('welcome.joinNow') || 'Únete a miles de creadores que ya usan Intellipost'}
                  </p>

                  <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
                    {canRegister ? (
                      <>
                        <Link
                          href="/register"
                          className="bg-primary-600 hover:bg-primary-700 inline-flex items-center justify-center rounded-lg px-8 py-3 text-lg font-medium text-white shadow-lg transition-colors hover:shadow-xl"
                        >
                          {t('welcome.createAccount') || 'Crear Cuenta Gratis'}
                          <Rocket className="ml-2 h-6 w-6" />
                        </Link>
                        <a
                          href="#pricing"
                          onClick={scrollToPricing}
                          className="border-primary-600 text-primary-600 hover:bg-primary-50 dark:text-primary-400 inline-flex items-center justify-center rounded-lg border bg-white px-8 py-3 text-lg font-medium transition-colors dark:bg-neutral-800 dark:hover:bg-gray-700"
                        >
                          {t('welcome.viewPricing') || 'Ver Planes y Precios'}
                        </a>
                      </>
                    ) : canLogin ? (
                      <Link
                        href="/dashboard"
                        className="bg-primary-600 hover:bg-primary-700 inline-flex items-center justify-center rounded-lg px-8 py-3 text-lg font-medium text-white shadow-lg transition-colors hover:shadow-xl"
                      >
                        {t('welcome.continue') || 'Continuar al Dashboard'}
                        <ArrowRight className="ml-2 h-6 w-6" />
                      </Link>
                    ) : null}
                  </div>

                  <div className="mt-6 flex flex-col items-center justify-center gap-4 text-sm text-gray-600 sm:flex-row dark:text-neutral-400">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      <span>{t('welcome.demoAccess') || 'Demo de 30 días disponible'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>

          <footer className="border-t border-gray-200 py-8 dark:border-neutral-800">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col items-center justify-between md:flex-row">
                <div className="mb-4 flex items-center md:mb-0">
                  <Link href="/" className="flex items-center">
                    <div className="w-20 md:w-28">
                      <OptimizedImage
                        src={Logo}
                        alt="logo empresa"
                        className="h-auto w-full object-contain"
                      />
                    </div>
                  </Link>
                </div>

                <div className="flex items-center space-x-6">
                  <Link
                    href={route('privacy')}
                    className="hover:text-primary-600 dark:hover:text-primary-400 flex items-center gap-1 text-sm text-gray-600 transition-colors dark:text-neutral-400"
                  >
                    <Shield className="h-4 w-4" />
                    {t('welcome.privacy') || 'Privacidad'}
                  </Link>
                  <Link
                    href={route('terms')}
                    className="hover:text-primary-600 dark:hover:text-primary-400 flex items-center gap-1 text-sm text-gray-600 transition-colors dark:text-neutral-400"
                  >
                    <Globe className="h-4 w-4" />
                    {t('welcome.terms') || 'Términos'}
                  </Link>
                  <Link
                    href={route('contact')}
                    className="hover:text-primary-600 dark:hover:text-primary-400 flex items-center gap-1 text-sm text-gray-600 transition-colors dark:text-neutral-400"
                  >
                    <Mail className="h-4 w-4" />
                    {t('welcome.contact') || 'Contacto'}
                  </Link>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}
