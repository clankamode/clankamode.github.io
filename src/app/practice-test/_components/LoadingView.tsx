interface LoadingViewProps {
  message?: string;
}

export function LoadingView({ message = 'Loading...' }: LoadingViewProps) {
  return (
    <div className="max-w-3xl mx-auto px-4">
      <div className="frame bg-surface-workbench p-8 shadow-lg">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green"></div>
          <p className="text-foreground text-xl">{message}</p>
        </div>
      </div>
    </div>
  );
}
