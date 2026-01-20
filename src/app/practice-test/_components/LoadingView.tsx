interface LoadingViewProps {
  message?: string;
}

export function LoadingView({ message = 'Loading...' }: LoadingViewProps) {
  return (
    <div className="max-w-3xl mx-auto px-4">
      <div className="bg-[#282828] rounded-lg p-8 shadow-lg">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2cbb5d]"></div>
          <p className="text-white text-lg">{message}</p>
        </div>
      </div>
    </div>
  );
}
