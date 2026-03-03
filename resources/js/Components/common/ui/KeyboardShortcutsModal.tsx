import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { X, Keyboard } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/Hooks/useTheme";

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

export default function KeyboardShortcutsModal({
  isOpen,
  onClose,
}: KeyboardShortcutsModalProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const isMac = typeof navigator !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;

  const shortcuts: Shortcut[] = [
    {
      keys: isMac ? ["⌘", "⌥", "T"] : ["Ctrl", "Alt", "T"],
      description: t("shortcuts.theme.toggle") || "Cambiar tema (Claro/Oscuro/Sistema)",
      category: t("shortcuts.category.appearance") || "Apariencia",
    },
    {
      keys: isMac ? ["⌘", "/"] : ["Ctrl", "/"],
      description: t("shortcuts.help.show") || "Mostrar atajos de teclado",
      category: t("shortcuts.category.help") || "Ayuda",
    },
  ];

  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, Shortcut[]>);

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm"
        aria-hidden="true"
      />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-2xl rounded-lg shadow-2xl bg-white dark:bg-neutral-800 dark:border dark:border-neutral-700">
          <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-200 dark:border-neutral-700">
            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg">
                  <Keyboard className="w-5 h-5 text-white" />
                </div>
                {t("shortcuts.title") || "Atajos de Teclado"}
              </div>
            </DialogTitle>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-500 dark:text-gray-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
              <div key={category} className="mb-6 last:mb-0">
                <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                  {category}
                </h3>
                <div className="space-y-2">
                  {categoryShortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-neutral-900/50 hover:bg-gray-100 dark:hover:bg-neutral-900 transition-colors"
                    >
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {shortcut.description}
                      </span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, keyIndex) => (
                          <span key={keyIndex} className="flex items-center gap-1">
                            <kbd
                              className={`
                                px-2.5 py-1.5 rounded text-xs font-mono font-bold shadow-sm
                                ${theme === "dark"
                                  ? "bg-neutral-700 text-neutral-200 border border-neutral-600"
                                  : "bg-white text-gray-700 border border-gray-300"
                                }
                              `}
                            >
                              {key}
                            </kbd>
                            {keyIndex < shortcut.keys.length - 1 && (
                              <span className="text-gray-400 dark:text-gray-600 text-xs font-bold">
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

          <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-neutral-700">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg font-medium transition-colors bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600 text-gray-700 dark:text-white"
            >
              {t("common.close") || "Cerrar"}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
