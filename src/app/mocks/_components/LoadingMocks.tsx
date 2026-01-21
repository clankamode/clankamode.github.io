export default function LoadingMocks() {
  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-3xl">
        <div className="bg-surface-workbench rounded-lg border border-border-subtle overflow-hidden transition-all duration-300 mb-8">
          <div className="aspect-video bg-surface-dense animate-pulse"></div>
          <div className="p-6">
            <div className="h-7 bg-surface-dense animate-pulse rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-surface-dense animate-pulse rounded w-full mb-3"></div>
            <div className="h-4 bg-surface-dense animate-pulse rounded w-5/6 mb-3"></div>
            <div className="h-4 bg-surface-dense animate-pulse rounded w-2/3 mb-8"></div>
            
            <div className="h-5 bg-surface-dense animate-pulse rounded w-1/4 mb-6"></div>
            
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 bg-surface-dense animate-pulse rounded"></div>
              ))}
            </div>
            
            <div className="h-12 bg-surface-dense animate-pulse rounded w-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
} 