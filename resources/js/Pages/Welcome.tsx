import Logo from "@/../assets/logo.png";
import FeatureCard from "@/Components/common/FeatureCard";
import ThemeLanguageContainer from "@/Components/common/ThemeLanguageContainer";
import { SOCIAL_PLATFORMS } from "@/Constants/socialPlatforms";
import { useTheme } from "@/Hooks/useTheme";
import { Head, Link } from "@inertiajs/react";
import {
  ArrowRight,
  Brain,
  Calendar,
  Globe,
  Mail,
  Rocket,
  Share2,
  Shield,
  Sparkles,
  Upload,
  Zap,
} from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

interface AuthProps {
  user: {
    name: string;
    email: string;
  } | null;
}

interface WelcomeProps {
  auth: AuthProps;
  canLogin: boolean;
  canRegister: boolean;
}

const SUPPORTED_NETWORKS = Object.values(SOCIAL_PLATFORMS)
  .filter((platform) => platform.active)
  .map((platform) => platform.name);

export default function Welcome({ auth, canLogin, canRegister }: WelcomeProps) {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();

  useEffect(() => {
    const browserLang = navigator.language.split("-")[0];
    const supportedLanguages = ["en", "es"];

    const defaultLang = supportedLanguages.includes(browserLang)
      ? browserLang
      : "es";

    if (i18n.language !== defaultLang) {
      i18n.changeLanguage(defaultLang);
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme-color", "orange");
  }, []);

  const features = [
    {
      href: canLogin ? "/dashboard" : "/register",
      icon: <Upload className="w-6 h-6 text-primary-600" />,
      title:
        t("welcome.contentManagement.title") ||
        "Gestión de Contenido Inteligente",
      description:
        t("welcome.contentManagement.description") ||
        "Organiza y gestiona archivos multimedia con sistemas avanzados de filtrado y etiquetas.",
      tags: [
        t("welcome.tags.collections"),
        t("welcome.tags.tags"),
        t("welcome.tags.search"),
        t("welcome.tags.filters"),
      ],
    },
    {
      href: canLogin ? "/dashboard" : "/register",
      icon: <Share2 className="w-6 h-6 text-primary-600" />,
      title:
        t("welcome.socialIntegration.title") || "Integración Multiplataforma",
      description:
        t("welcome.socialIntegration.description") ||
        "Conecta y gestiona contenido en Facebook, Instagram, TikTok, YouTube y más.",
      tags: Object.values(SOCIAL_PLATFORMS)
        .filter((p) => p.active)
        .map(
          (p) =>
            t(`welcome.tags.${p.key === "x" ? "twitter" : p.key}`) || p.name,
        ),
    },
    {
      href: canLogin ? "/dashboard" : "/register",
      icon: <Calendar className="w-6 h-6 text-primary-600" />,
      title: t("welcome.scheduling.title") || "Programación Inteligente",
      description:
        t("welcome.scheduling.description") ||
        "Programa publicaciones en horarios óptimos con recomendaciones impulsadas por IA.",
      tags: [
        t("welcome.tags.calendar"),
        t("welcome.tags.queue"),
        t("welcome.tags.auto_post"),
        t("welcome.tags.time_zones"),
      ],
    },
    {
      href: canLogin ? "/dashboard" : "/register",
      icon: <Brain className="w-6 h-6 text-primary-600" />,
      title: t("welcome.aiTools.title") || "Optimización con IA",
      description:
        t("welcome.aiTools.description") ||
        "Obtén recomendaciones de hashtags, horarios óptimos y sugerencias de contenido.",
      tags: [
        t("welcome.tags.hashtags"),
        t("welcome.tags.optimization"),
        t("welcome.tags.recommendations"),
        t("welcome.tags.ai"),
      ],
    },
  ];

  return (
    <>
      <Head title="ContentFlow - Plataforma de Gestión de Contenido" />

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 relative overflow-hidden">
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse-slow" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[120px] animate-pulse-slow delay-1000" />
        </div>

        <div className="relative z-10">
          <header className="absolute top-0 left-0 right-0 z-50">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-3 md:mt-5">
              <div className="flex items-center justify-between h-16 md:h-20">
                <div className="flex items-center flex-shrink-0">
                  <Link href="/" className="flex items-center">
                    <div className="w-20 md:w-28">
                      <img
                        src={Logo}
                        alt="ContentFlow Logo"
                        className="w-full h-auto object-contain"
                      />
                    </div>
                  </Link>
                </div>

                <div className="flex items-center flex-shrink-0">
                  <ThemeLanguageContainer
                    isWelcome={true}
                    canLogin={canLogin}
                    canRegister={canRegister}
                    loginText={t("welcome.login")}
                    registerText={t("welcome.getStarted")}
                  />
                </div>
              </div>
            </div>
          </header>

          <main className="pt-32 pb-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-primary-50 dark:bg-primary-900/20 mb-6">
                  <span className="text-sm font-medium text-primary-600 dark:text-primary-400 flex items-center gap-1">
                    <Sparkles className="w-4 h-4" />
                    {t("welcome.beta") || "Beta Activa"} v.1.0
                  </span>
                </div>

                <h1
                  className={`text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl
                  ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                >
                  {t("welcome.title") || "Transforma tu contenido"}
                  <span className="text-primary-600 mt-3 flex items-center justify-center gap-2">
                    <Zap className="w-8 h-8" />
                    {t("welcome.titleHighlight") || "en resultados reales"}
                    <Rocket className="w-8 h-8" />
                  </span>
                </h1>

                <p
                  className={`mx-auto mt-6 max-w-2xl text-lg
                  ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}
                >
                  {t("welcome.subtitle") ||
                    "La plataforma todo en uno para crear, programar y optimizar contenido en redes sociales. Impulsado por IA."}
                </p>

                <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                  {canRegister ? (
                    <>
                      <Link
                        href="/register"
                        className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl"
                      >
                        {t("welcome.startFree") || "Comenzar Gratis"}
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Link>
                    </>
                  ) : canLogin ? (
                    <Link
                      href="/dashboard"
                      className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl"
                    >
                      {t("welcome.goToDashboard") || "Ir al Dashboard"}
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                  ) : null}
                </div>
                <div className="mt-24 py-8 border-y border-gray-200/50 dark:border-white/5 bg-white/50 dark:bg-white/5 backdrop-blur-sm relative left-[50%] right-[50%] mx-[-50vw] w-screen px-4">
                  <div className="max-w-7xl mx-auto text-center">
                    <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-8">
                      {t(
                        "welcome.connectsWith",
                        "Se integra perfectamente con",
                      )}
                    </p>
                    <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
                      {SUPPORTED_NETWORKS.map((brand) => (
                        <span
                          key={brand}
                          className="text-xl md:text-2xl font-bold font-heading text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors cursor-default"
                        >
                          {brand}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-20">
                <h2
                  className={`text-3xl font-bold text-center ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}
                >
                  {t("welcome.featuresTitle") ||
                    "Todo lo que necesitas en una plataforma"}
                </h2>
                <p
                  className={`mt-4 text-center ${
                    theme === "dark" ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  {t("welcome.featuresSubtitle") ||
                    "Gestiona todo tu contenido social desde un solo lugar"}
                </p>

                <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {features.map((feature, index) => (
                    <FeatureCard key={index} {...feature} />
                  ))}
                </div>
              </div>

              <div className="mt-20 relative overflow-hidden rounded-lg bg-gradient-to-r from-primary-50 to-pink-50 dark:from-primary-900/20 dark:to-pink-900/20 backdrop-blur-sm p-8">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-200/20 dark:bg-primary-500/10 rounded-full -translate-y-32 translate-x-32"></div>
                <div className="relative text-center">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {t("welcome.readyToStart") ||
                      "¿Listo para transformar tu contenido?"}
                  </h2>
                  <p className="mt-2 text-gray-600 dark:text-gray-300">
                    {t("welcome.joinNow") ||
                      "Únete a miles de creadores que ya usan ContentFlow"}
                  </p>

                  <div className="mt-8">
                    {canRegister ? (
                      <Link
                        href="/register"
                        className="inline-flex items-center justify-center px-8 py-3 text-lg font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl"
                      >
                        {t("welcome.createAccount") || "Crear Cuenta Gratis"}
                        <Rocket className="w-6 h-6 ml-2" />
                      </Link>
                    ) : canLogin ? (
                      <Link
                        href="/dashboard"
                        className="inline-flex items-center justify-center px-8 py-3 text-lg font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl"
                      >
                        {t("welcome.continue") || "Continuar al Dashboard"}
                        <ArrowRight className="w-6 h-6 ml-2" />
                      </Link>
                    ) : null}
                  </div>

                  <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                    {t("welcome.noCreditCard") ||
                      "Sin tarjeta de crédito • Prueba de 14 días"}
                  </p>
                </div>
              </div>
            </div>
          </main>

          <footer className="border-t border-gray-200 dark:border-gray-800 py-8">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="flex items-center mb-4 md:mb-0">
                  <Link href="/" className="flex items-center">
                    <div className="w-20 md:w-28">
                      <img
                        src={Logo}
                        alt="ContentFlow Logo"
                        className="w-full h-auto object-contain"
                      />
                    </div>
                  </Link>
                </div>

                <div className="flex items-center space-x-6">
                  <Link
                    href={route("privacy")}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center gap-1"
                  >
                    <Shield className="w-4 h-4" />
                    {t("welcome.privacy") || "Privacidad"}
                  </Link>
                  <Link
                    href={route("terms")}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center gap-1"
                  >
                    <Globe className="w-4 h-4" />
                    {t("welcome.terms") || "Términos"}
                  </Link>
                  <Link
                    href={route("contact")}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center gap-1"
                  >
                    <Mail className="w-4 h-4" />
                    {t("welcome.contact") || "Contacto"}
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
