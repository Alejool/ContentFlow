declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}
declare function route(name: string, params?: Record<string, unknown>, absolute?: boolean): string;
declare function route(): {
  current: (name?: string, params?: Record<string, unknown>) => boolean | string;
};
