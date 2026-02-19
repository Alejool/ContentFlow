import { ComponentType, lazy, Suspense, ReactNode } from "react";

interface LazyLoadWrapperProps {
  fallback?: ReactNode;
  children: ReactNode;
}

export function LazyLoadWrapper({ 
  fallback = (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>
  ), 
  children 
}: LazyLoadWrapperProps) {
  return <Suspense fallback={fallback}>{children}</Suspense>;
}

// Helper para crear componentes lazy con fallback personalizado
export function createLazyComponent<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: ReactNode
) {
  const LazyComponent = lazy(importFunc);
  
  return (props: any) => (
    <LazyLoadWrapper fallback={fallback}>
      <LazyComponent {...props} />
    </LazyLoadWrapper>
  );
}
