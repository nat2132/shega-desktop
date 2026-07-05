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

/// <reference types="vite/client" />

interface ImportMeta {
  glob?: (pattern: string, options?: { eager?: boolean }) => Record<string, any>;
}
