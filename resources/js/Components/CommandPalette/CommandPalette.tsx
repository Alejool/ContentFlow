import { Combobox, Dialog, Transition } from "@headlessui/react";
import { router } from "@inertiajs/react";
import {
  Calendar,
  Command,
  FileText,
  LayoutDashboard,
  LogOut,
  Plus,
  Search,
  Settings,
  Target,
} from "lucide-react";
import { Fragment, useEffect, useState } from "react";

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");

  // Toggle with Cmd+K or Ctrl+K or custom event
  useEffect(() => {
    const onKeydown = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setIsOpen(!isOpen);
      }
    };

    const onOpenEvent = () => setIsOpen(true);

    window.addEventListener("keydown", onKeydown);
    window.addEventListener("open-command-palette", onOpenEvent);

    return () => {
      window.removeEventListener("keydown", onKeydown);
      window.removeEventListener("open-command-palette", onOpenEvent);
    };
  }, [isOpen]);

  const navigation = [
    { name: "Dashboard", href: route("dashboard"), icon: LayoutDashboard },
    { name: "Gestionar Contenido", href: "/ManageContent", icon: FileText },
    {
      name: "Planificador",
      href: "/ManageContent?tab=calendar",
      icon: Calendar,
    },
    {
      name: "Espacios de Trabajo",
      href: route("workspaces.index"),
      icon: Target,
    },
    { name: "Configuración", href: route("profile.edit"), icon: Settings },
  ];

  const actions = [
    {
      name: "Crear publicación",
      action: () => router.visit("/ManageContent?action=create"),
      icon: Plus,
    },
    {
      name: "Cerrar sesión",
      action: () => router.post(route("logout")),
      icon: LogOut,
    },
  ];

  // Combine and filter
  const filteredItems =
    query === ""
      ? [...navigation, ...actions]
      : [...navigation, ...actions].filter((item) =>
          item.name.toLowerCase().includes(query.toLowerCase()),
        );

  const handleSelect = (item: any) => {
    setIsOpen(false);
    setQuery("");

    if (item.href) {
      router.visit(item.href);
    } else if (item.action) {
      item.action();
    }
  };

  return (
    <Transition.Root
      show={isOpen}
      as={Fragment}
      afterLeave={() => setQuery("")}
      appear
    >
      <Dialog as="div" className="relative z-50" onClose={setIsOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500/25 dark:bg-black/50 backdrop-blur-sm transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto p-4 sm:p-20 md:p-20 lg:p-20">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="mx-auto max-w-2xl transform divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden rounded-lg bg-white dark:bg-gray-900 shadow-2xl ring-1 ring-black/5 transition-all">
              <Combobox onChange={(item: any) => handleSelect(item)}>
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute top-3.5 left-4 h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                  <Combobox.Input
                    className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:ring-0 sm:text-sm"
                    placeholder="Escribe un comando o busca..."
                    onChange={(event) => setQuery(event.target.value)}
                    autoComplete="off"
                  />
                </div>

                {filteredItems.length > 0 && (
                  <Combobox.Options
                    static
                    className="max-h-96 scroll-py-3 overflow-y-auto p-3"
                  >
                    {filteredItems.map((item) => (
                      <Combobox.Option
                        key={item.name}
                        value={item}
                        className={({ active }) =>
                          `flex cursor-default select-none rounded-lg px-3 py-2 p-3 transition-colors ${
                            active ? "bg-gray-100 dark:bg-gray-800" : ""
                          }`
                        }
                      >
                        {({ active }) => (
                          <>
                            <div
                              className={`flex h-10 w-10 flex-none items-center justify-center rounded-lg ${active ? "bg-white dark:bg-gray-700" : "bg-gray-50 dark:bg-gray-800"}`}
                            >
                              <item.icon
                                className={`h-5 w-5 ${active ? "text-primary-600 dark:text-primary-400" : "text-gray-500 dark:text-gray-400"}`}
                                aria-hidden="true"
                              />
                            </div>
                            <div className="ml-4 flex-auto my-auto">
                              <p
                                className={`text-sm font-medium ${active ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"}`}
                              >
                                {item.name}
                              </p>
                              <p
                                className={`text-xs ${active ? "text-gray-500 dark:text-gray-400" : "text-gray-500 dark:text-gray-500"}`}
                              >
                                {item.href ? "Ir a..." : "Acción"}
                              </p>
                            </div>
                          </>
                        )}
                      </Combobox.Option>
                    ))}
                  </Combobox.Options>
                )}

                {query !== "" && filteredItems.length === 0 && (
                  <div className="py-14 px-6 text-center text-sm sm:px-14">
                    <Command
                      className="mx-auto h-6 w-6 text-gray-400"
                      aria-hidden="true"
                    />
                    <p className="mt-4 font-semibold text-gray-900 dark:text-white">
                      No se encontraron resultados
                    </p>
                    <p className="mt-2 text-gray-500">
                      No pudimos encontrar nada para "{query}". Intenta con otra
                      cosa.
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap items-center bg-gray-50 dark:bg-gray-800/50 py-2.5 px-4 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-1.5 py-0.5 shadow-sm font-mono">
                    <span className="text-xs">⌘</span> K
                  </span>
                  <span className="ml-2">para cerrar</span>
                </div>
              </Combobox>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
