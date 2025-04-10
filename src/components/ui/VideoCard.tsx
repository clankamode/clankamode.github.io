interface VideoCardProps {
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  date: string;
}

export default function VideoCard({ title, description, thumbnailUrl, videoUrl, date }: VideoCardProps) {
  return (
    <div className="group bg-[#1a1a1a] rounded-lg border border-[#3e3e3e] hover:border-[#2cbb5d] transition-all duration-300">
      <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="block relative">
        <div className="relative h-48 overflow-hidden rounded-t-lg">
          <img
            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
            src={thumbnailUrl}
            alt={title}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] to-transparent opacity-50 group-hover:opacity-70 transition-opacity duration-300"></div>
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-12 h-12 bg-[#2cbb5d] rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </div>
      </a>
      <div className="p-5">
        <a href={videoUrl} target="_blank" rel="noopener noreferrer">
          <h5 className="mb-2 text-xl font-bold tracking-tight text-white group-hover:text-[#2cbb5d] transition-colors duration-300">
            {title}
          </h5>
        </a>
        <p className="mb-3 font-normal text-gray-400 line-clamp-2">
          {description}
        </p>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">
            {date}
          </span>
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-[#2cbb5d] rounded-lg hover:bg-[#28a754] focus:ring-2 focus:ring-[#2cbb5d]/50 transition-all duration-300"
          >
            Watch
            <svg
              className="w-3.5 h-3.5 ml-1"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 14 10"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M1 5h12m0 0L9 1m4 4L9 9"
              />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
} 