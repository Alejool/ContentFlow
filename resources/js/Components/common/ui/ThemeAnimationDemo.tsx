import { useTheme } from "@/Hooks/useTheme";
import { Moon, Sun, Monitor, Sparkles } from "lucide-react";
import { useState } from "react";
import { flushSync } from "react-dom";

/**
 * Componente de demostración para probar la animación de cambio de tema
 * Muestra diferentes áreas clicables para ver cómo la animación se expande desde diferentes puntos
 */
export default function ThemeAnimationDemo() {
  const { theme, setTheme, actualTheme } = useTheme();
  const [isAnimating, setIsAnimating] = useState(false);
  const [lastClickPosition, setLastClickPosition] = useState<{ x: number; y: number } | null>(null);

  const handleThemeChange = (newTheme: "light" | "dark" | "system", e: React.MouseEvent) => {
    if (isAnimating) return;

    const x = e.clientX;
    const y = e.clientY;
    
    setLastClickPosition({ x, y });
    
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    setIsAnimating(true);

    const performChange = () => {
      setTheme(newTheme);
      setTimeout(() => {
        setIsAnimating(false);
        setTimeout(() => setLastClickPosition(null), 1000);
      }, 700);
    };

    if (!(document as any).startViewTransition) {
      performChange();
      return;
    }

    document.documentElement.style.setProperty("--x", `${x}px`);
    document.documentElement.style.setProperty("--y", `${y}px`);
    document.documentElement.style.setProperty("--r", `${endRadius}px`);
    document.documentElement.setAttribute("data-theme-transition", "true");

    const transition = (document as any).startViewTransition(async () => {
      flushSync(() => {
        setTheme(newTheme);
      });
    });

    transition.finished.finally(() => {
      document.documentElement.removeAttribute("data-theme-transition");
      setIsAnimating(false);
      setTimeout(() => setLastClickPosition(null), 1000);
    });
  };

  const themeOptions = [
    {
      value: "light" as const,
      label: "Light Mode",
      icon: Sun,
      gradient: "from-amber-400 to-orange-500",
      bgColor: "bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20",
    },
    {
      value: "dark" as const,
      label: "Dark Mode",
      icon: Moon,
      gradient: "from-indigo-500 to-purple-600",
      bgColor: "bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-indigo-900/20 dark:to-purple-900/20",
    },
    {
      value: "system" as const,
      label: "System",
      icon: Monitor,
      gradient: "from-gray-500 to-gray-700",
      bgColor: "bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900",
    },
  ];

  return (
    <div className="min-h-screen p-8 bg-white dark:bg-gray-950 transition-colors">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-8 h-8 text-primary-500" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Theme Animation Demo
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Haz clic en cualquier botón para ver la animación circular expandiéndose desde ese punto
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
            <span className="text-sm font-medium">Tema actual:</span>
            <span className="font-bold">{theme}</span>
            {theme === "system" && (
              <span className="text-xs opacity-70">({actualTheme})</span>
            )}
          </div>
        </div>

        {/* Grid de botones grandes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {themeOptions.map((option) => {
            const Icon = option.icon;
            const isActive = theme === option.value;

            return (
              <button
                key={option.value}
                onClick={(e) => handleThemeChange(option.value, e)}
                disabled={isAnimating}
                className={`
                  relative p-8 rounded-2xl
                  ${option.bgColor}
                  border-2 transition-all duration-300
                  ${
                    isActive
                      ? "border-primary-500 shadow-xl scale-105"
                      : "border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 hover:scale-102 shadow-lg"
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                  group
                `}
              >
                <div className="flex flex-col items-center gap-4">
                  <div
                    className={`
                    w-20 h-20 rounded-full
                    bg-gradient-to-br ${option.gradient}
                    flex items-center justify-center
                    transition-transform duration-300
                    ${isActive ? "scale-110" : "group-hover:scale-110"}
                  `}
                  >
                    <Icon className="w-10 h-10 text-white" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {option.label}
                    </h3>
                    {isActive && (
                      <span className="text-sm text-primary-600 dark:text-primary-400 font-medium">
                        ✓ Activo
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Botones en las esquinas */}
        <div className="relative h-64 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <p className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-center">
            Haz clic en las esquinas para ver la animación desde diferentes puntos
          </p>

          {/* Esquina superior izquierda */}
          <button
            onClick={(e) => handleThemeChange(theme === "dark" ? "light" : "dark", e)}
            disabled={isAnimating}
            className="absolute top-4 left-4 p-4 rounded-full bg-primary-500 hover:bg-primary-600 text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
          >
            <Sun className="w-6 h-6" />
          </button>

          {/* Esquina superior derecha */}
          <button
            onClick={(e) => handleThemeChange(theme === "dark" ? "light" : "dark", e)}
            disabled={isAnimating}
            className="absolute top-4 right-4 p-4 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
          >
            <Moon className="w-6 h-6" />
          </button>

          {/* Esquina inferior izquierda */}
          <button
            onClick={(e) => handleThemeChange("system", e)}
            disabled={isAnimating}
            className="absolute bottom-4 left-4 p-4 rounded-full bg-gray-500 hover:bg-gray-600 text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
          >
            <Monitor className="w-6 h-6" />
          </button>

          {/* Esquina inferior derecha */}
          <button
            onClick={(e) => handleThemeChange(theme === "light" ? "dark" : "light", e)}
            disabled={isAnimating}
            className="absolute bottom-4 right-4 p-4 rounded-full bg-purple-500 hover:bg-purple-600 text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
          >
            <Sparkles className="w-6 h-6" />
          </button>

          {/* Indicador de último clic */}
          {lastClickPosition && (
            <div
              className="absolute w-4 h-4 rounded-full bg-red-500 animate-ping"
              style={{
                left: `${lastClickPosition.x}px`,
                top: `${lastClickPosition.y}px`,
                transform: "translate(-50%, -50%)",
              }}
            />
          )}
        </div>

        {/* Info */}
        <div className="p-6 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-2">
            ℹ️ Cómo funciona
          </h3>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <li>• La animación usa la View Transition API del navegador</li>
            <li>• Se expande en forma circular desde el punto exacto donde haces clic</li>
            <li>• El radio se calcula dinámicamente para cubrir toda la pantalla</li>
            <li>• Duración: 0.7 segundos con curva de animación suave</li>
            <li>• Funciona en Chrome, Edge y Opera (navegadores Chromium)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
