import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { X, Keyboard } from "lucide-react";
import { useTranslation } from "react-i18next";
import Button from "@/Components/common/Modern/Button";

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

interface ShortcutDefinition {
  macKeys: string[];
  winKeys: string[];
  translationKey: string;
  fallbackText: string;
  category: string;
}

// Constante centralizada para definir todos los atajos
const SHORTCUTS_CONFIG: ShortcutDefinition[] = [
  // Apariencia
  {
    macKeys: ["⌘", "⌥", "T"],
    winKeys: ["Ctrl", "Alt", "T"],
    translationKey: "shortcuts.theme.toggle",
    fallbackText: "Cambiar tema (Claro/Oscuro)",
    category: "appearance",
  },
  // Navegación
  {
    macKeys: ["⌘", "K"],
    winKeys: ["Ctrl", "K"],
    translationKey: "shortcuts.search.open",
    fallbackText: "Abrir búsqueda rápida",
    category: "navigation",
  },
  // Ayuda
  {
    macKeys: ["⌘", "/"],
    winKeys: ["Ctrl", "/"],
    translationKey: "shortcuts.help.show",
    fallbackText: "Mostrar atajos de teclado",
    category: "help",
  },
];

export default function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  const { t } = useTranslation();

  const isMac =
    typeof navigator !== "undefined" &&
    (navigator.userAgent.toUpperCase().indexOf("MAC") >= 0 ||
      navigator.userAgent.toUpperCase().indexOf("IPHONE") >= 0 ||
      navigator.userAgent.toUpperCase().indexOf("IPAD") >= 0);

  // Mapeo de categorías a sus traducciones
  const categoryTranslations: Record<string, string> = {
    appearance: t("shortcuts.category.appearance", "Apariencia"),
    navigation: t("shortcuts.category.navigation", "Navegación"),
    help: t("shortcuts.category.help", "Ayuda"),
  };

  // Convertir la configuración a shortcuts con las teclas apropiadas
  const shortcuts: Shortcut[] = SHORTCUTS_CONFIG.map((config) => ({
    keys: isMac ? config.macKeys : config.winKeys,
    description: t(config.translationKey, config.fallbackText),
    category: categoryTranslations[config.category] || config.category,
  }));

  const groupedShortcuts = shortcuts.reduce(
    (acc, shortcut) => {
      if (!acc[shortcut.category]) {
        acc[shortcut.category] = [];
      }
      acc[shortcut.category].push(shortcut);
      return acc;
    },
    {} as Record<string, Shortcut[]>,
  );

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-2xl rounded-lg bg-white shadow-2xl dark:border dark:border-neutral-700 dark:bg-neutral-800">
          <div className="flex items-center justify-between border-b border-gray-200 p-6 pb-4 dark:border-neutral-700">
            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 p-1.5">
                  <Keyboard className="h-5 w-5 text-white" />
                </div>
                {t("shortcuts.title", "Atajos de Teclado")}
              </div>
            </DialogTitle>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-neutral-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="custom-scrollbar max-h-[60vh] overflow-y-auto p-6">
            {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
              <div key={category} className="mb-6 last:mb-0">
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {category}
                </h3>
                <div className="space-y-2">
                  {categoryShortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100 dark:bg-neutral-900/50 dark:hover:bg-neutral-900"
                    >
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {shortcut.description}
                      </span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, keyIndex) => (
                          <span key={keyIndex} className="flex items-center gap-1">
                            <kbd className="rounded border border-gray-300 bg-white px-2.5 py-1.5 font-mono text-xs font-bold text-gray-700 shadow-sm dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-200">
                              {key}
                            </kbd>
                            {keyIndex < shortcut.keys.length - 1 && (
                              <span className="text-xs font-bold text-gray-400 dark:text-gray-600">
                                +
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-200 p-4 dark:border-neutral-700">
            <Button onClick={onClose} variant="secondary" buttonStyle="ghost" size="md">
              {t("common.close", "Cerrar")}
            </Button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
