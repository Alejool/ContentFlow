"use client";

import { ColorModeProvider, type ColorModeProviderProps } from "./color-mode";

export function Provider(props: ColorModeProviderProps) {
  return <ColorModeProvider {...props} />;
}
