import type { CommandItem } from '@/Hooks/useCommandPalette';
import { useCommandPalette } from '@/Hooks/useCommandPalette';
import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Dialog,
  DialogPanel,
} from '@headlessui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Command, Search } from 'lucide-react';
import { Fragment, useEffect, useRef } from 'react';
import { CATEGORY_LABELS, COMMAND_PALETTE_COMMANDS } from './commandPaletteCommands';

export default function CommandPalette() {
  const { isOpen, query, setQuery, groupedCommands, handleSelect, setIsOpen } =
    useCommandPalette(COMMAND_PALETTE_COMMANDS);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      // defer to let the dialog finish mounting before focusing
      const id = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [isOpen]);

  const hasResults = Object.keys(groupedCommands).length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog as="div" className="relative z-50" onClose={setIsOpen} open={isOpen}>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-gray-500/25 backdrop-blur-sm dark:bg-black/50" />

          {/* Dialog container */}
          <div className="fixed inset-0 z-10 overflow-y-auto p-4 sm:p-20">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="mx-auto max-w-2xl"
            >
              <DialogPanel className="transform divide-y divide-gray-100 overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black/5 dark:divide-gray-800 dark:bg-gray-900">
                <Combobox
                  onChange={(item: CommandItem | null) => {
                    if (item) handleSelect(item);
                  }}
                >
                  {/* Search Input */}
                  <div className="relative">
                    <Search
                      className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-gray-400"
                      aria-hidden="true"
                    />
                    <ComboboxInput
                      ref={inputRef}
                      className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-gray-900 placeholder:text-gray-400 focus:ring-0 dark:text-gray-100 sm:text-sm"
                      placeholder="Escribe un comando o busca..."
                      onChange={(event) => setQuery(event.target.value)}
                      value={query}
                      autoComplete="off"
                    />
                  </div>

                  {/* Results */}
                  {hasResults && (
                    <ComboboxOptions
                      static
                      className="max-h-[28rem] scroll-py-2 overflow-y-auto p-2"
                    >
                      {Object.entries(groupedCommands).map(([category, items]) => (
                        <div key={category} className="mb-2">
                          {/* Category Label */}
                          <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                            {CATEGORY_LABELS[category] || category}
                          </div>

                          {/* Category Items */}
                          {items.map((item) => (
                            <ComboboxOption key={item.id} value={item} as={Fragment}>
                              {({ focus }) => (
                                <div
                                  className={`flex cursor-pointer select-none items-center rounded-lg p-3 transition-colors ${
                                    focus ? 'bg-gray-100 dark:bg-gray-800' : ''
                                  }`}
                                >
                                  {/* Icon */}
                                  <div
                                    className={`flex h-10 w-10 flex-none items-center justify-center rounded-lg transition-colors ${
                                      focus
                                        ? 'bg-white dark:bg-gray-700'
                                        : 'bg-gray-50 dark:bg-gray-800'
                                    }`}
                                  >
                                    <item.icon
                                      className={`h-5 w-5 transition-colors ${
                                        focus
                                          ? 'text-primary-600 dark:text-primary-400'
                                          : 'text-gray-500 dark:text-gray-400'
                                      }`}
                                      aria-hidden="true"
                                    />
                                  </div>

                                  {/* Text */}
                                  <div className="ml-4 flex-auto">
                                    <p
                                      className={`text-sm font-medium transition-colors ${
                                        focus
                                          ? 'text-gray-900 dark:text-white'
                                          : 'text-gray-700 dark:text-gray-300'
                                      }`}
                                    >
                                      {item.name}
                                    </p>
                                    {item.description && (
                                      <p
                                        className={`text-xs transition-colors ${
                                          focus
                                            ? 'text-gray-500 dark:text-gray-400'
                                            : 'text-gray-500 dark:text-gray-500'
                                        }`}
                                      >
                                        {item.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </ComboboxOption>
                          ))}
                        </div>
                      ))}
                    </ComboboxOptions>
                  )}

                  {/* Empty State */}
                  {query !== '' && !hasResults && (
                    <div className="px-6 py-14 text-center text-sm sm:px-14">
                      <Command className="mx-auto h-6 w-6 text-gray-400" aria-hidden="true" />
                      <p className="mt-4 font-semibold text-gray-900 dark:text-white">
                        No se encontraron resultados
                      </p>
                      <p className="mt-2 text-gray-500">
                        No pudimos encontrar nada para &ldquo;{query}&rdquo;. Intenta con otra cosa.
                      </p>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex flex-wrap items-center bg-gray-50 px-4 py-2.5 text-xs text-gray-500 dark:bg-gray-800/50 dark:text-gray-400">
                    <kbd className="flex items-center gap-1 rounded border border-gray-200 bg-white px-1.5 py-0.5 font-mono shadow-sm dark:border-gray-600 dark:bg-gray-700">
                      <span className="text-xs">⌘</span> K
                    </kbd>
                    <span className="ml-2">para abrir/cerrar</span>
                    <span className="mx-2">·</span>
                    <kbd className="rounded border border-gray-200 bg-white px-1.5 py-0.5 font-mono shadow-sm dark:border-gray-600 dark:bg-gray-700">
                      ↑↓
                    </kbd>
                    <span className="ml-2">para navegar</span>
                    <span className="mx-2">·</span>
                    <kbd className="rounded border border-gray-200 bg-white px-1.5 py-0.5 font-mono shadow-sm dark:border-gray-600 dark:bg-gray-700">
                      ↵
                    </kbd>
                    <span className="ml-2">para seleccionar</span>
                  </div>
                </Combobox>
              </DialogPanel>
            </motion.div>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
