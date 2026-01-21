interface ErrorViewProps {
  error: string;
  onBack: () => void;
}

export function ErrorView({ error, onBack }: ErrorViewProps) {
  return (
    <div className="max-w-3xl mx-auto px-4">
      <div className="frame bg-surface-workbench p-8 shadow-lg">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-3xl font-bold text-foreground mb-4">Error</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <button
            onClick={onBack}
            className="bg-brand-green hover:bg-brand-green/90 text-black font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Back to Tests
          </button>
        </div>
      </div>
    </div>
  );
}
