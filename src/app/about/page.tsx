export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 py-12">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            About Me
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400">
            Helping developers prepare for technical interviews
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              My Journey
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              With over a decade of experience in software development and technical interviews,
              I've helped hundreds of developers land their dream jobs at top tech companies.
            </p>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              After conducting numerous technical interviews and mentoring aspiring developers,
              I realized there was a need for high-quality, practical coding interview preparation
              content that goes beyond just solving problems.
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              That's why I started this channel - to share my knowledge and help developers
              not just pass interviews, but excel in them.
            </p>
          </div>
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-8">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              What I Cover
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-600 dark:text-gray-400">System Design Interviews</span>
              </li>
              <li className="flex items-start">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-600 dark:text-gray-400">Data Structures & Algorithms</span>
              </li>
              <li className="flex items-start">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-600 dark:text-gray-400">Problem-Solving Strategies</span>
              </li>
              <li className="flex items-start">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-600 dark:text-gray-400">Interview Best Practices</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Join Our Community
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            Subscribe to our YouTube channel and join thousands of developers who are
            preparing for their technical interviews. Get access to weekly videos,
            coding challenges, and interview tips.
          </p>
          <a
            href="https://youtube.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-5 py-3 text-base font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-900"
          >
            Subscribe to YouTube Channel
            <svg className="ml-2 -mr-1 w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
} 