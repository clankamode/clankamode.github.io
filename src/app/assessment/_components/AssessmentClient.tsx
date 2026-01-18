'use client';

import { useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import Image from 'next/image';

const levels = [
  {
    id: 'noob',
    title: 'Noob',
    difficulty: 'Easy',
    description: '2 easy questions to warm up and build confidence. Perfect for beginners or when you need a quick practice session.',
    questionInfo: '2 easy questions',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    badgeColor: 'bg-[#2cbb5d]/10 text-[#2cbb5d]',
    iconBg: 'bg-[#2cbb5d]/10',
    iconColor: 'text-[#2cbb5d]',
    buttonGradient: 'bg-gradient-to-r from-[#2cbb5d] to-[#25a24f]',
  },
  {
    id: 'intermediate',
    title: 'Intermediate',
    difficulty: 'Medium',
    description: '1 easy + 1 medium to keep you sharp. Ideal for maintaining your skills and building consistency.',
    questionInfo: '1 easy + 1 medium',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    badgeColor: 'bg-yellow-500/10 text-yellow-500',
    iconBg: 'bg-yellow-500/10',
    iconColor: 'text-yellow-500',
    buttonGradient: 'bg-gradient-to-r from-yellow-500 to-orange-500',
  },
  {
    id: 'faang',
    title: 'FAANG-level',
    difficulty: 'Hard',
    description: '2 medium or a medium + hard for the real deal. Simulate actual interview conditions with challenging problems.',
    questionInfo: '2 medium / 1 medium + 1 hard',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
      </svg>
    ),
    badgeColor: 'bg-red-500/10 text-red-500',
    iconBg: 'bg-red-500/10',
    iconColor: 'text-red-500',
    buttonGradient: 'bg-gradient-to-r from-pink-500 to-red-500',
  },
];

interface AssessmentQuestion {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  url: string;
}

export default function AssessmentClient() {
  const { status } = useSession();
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedLevelLabel = levels.find((level) => level.id === selectedLevel)?.title ?? 'Assessment';

  const handleStart = async (levelId: string) => {
    if (status !== 'authenticated') {
      await signIn('google', { callbackUrl: '/assessment' });
      return;
    }

    setSelectedLevel(levelId);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/assessment/questions?level=${levelId}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.error || 'Failed to load questions');
      }

      const data = await response.json();
      setQuestions(data.questions || []);
      setIsModalOpen(true);
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : 'Failed to load questions';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setQuestions([]);
    setSelectedLevel(null);
    setError(null);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#0d0d0d] pt-20 text-white">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 pb-16">
        {/* Header Section */}
        <div className="flex flex-col items-center text-center">
          {/* Channel Logo - Click to Subscribe */}
          <a
            href="https://www.youtube.com/@jamesperaltaSWE?sub_confirmation=1"
            target="_blank"
            rel="noopener noreferrer"
            className="group mb-6 relative"
          >
            <Image
              src="https://yt3.googleusercontent.com/1yE8FhBsduYXodmbR2TzuJf3DViBwKahmshEktiwcJocxc-3K7kmhQLmYiu_-AUVdWle4aRC=s160-c-k-c0x00ffffff-no-rj"
              alt="James Peralta"
              width={96}
              height={96}
              className="rounded-full border-2 border-[#2cbb5d]/50 object-cover transition-all duration-300 group-hover:border-[#2cbb5d] group-hover:scale-105"
            />
            <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#ff0000] border-2 border-[#0d0d0d] transition-transform duration-300 group-hover:scale-110">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </div>
          </a>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Peralta Mock Assessment</h1>
          <p className="text-gray-400 max-w-2xl text-lg">
          Peralta Mock Assessments give you 2 real interview-level questions pulled straight from James’s own prep.
          No theory dumps. No inflated difficulty. Just problems that actually show up - because they already did.
          </p>

        </div>

        {/* Cards Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {levels.map((level) => (
            <div
              key={level.id}
              className="group flex flex-col rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] p-6 transition-all duration-300 hover:border-[#3e3e3e]"
            >
              {/* Icon and Badge Row */}
              <div className="flex items-start justify-between mb-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${level.iconBg} ${level.iconColor}`}>
                  {level.icon}
                </div>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${level.badgeColor}`}>
                  {level.difficulty}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white mb-2">{level.title}</h2>
                <p className="text-sm text-gray-400 mb-4 leading-relaxed">{level.description}</p>
                
                {/* Question Info */}
                <div className="flex items-center gap-2 mb-6">
                  <span className={`w-2 h-2 rounded-full ${level.iconBg.replace('/10', '')}`}></span>
                  <span className="text-sm text-gray-500">{level.questionInfo}</span>
                </div>
              </div>

              {/* Button */}
              <button
                type="button"
                onClick={() => handleStart(level.id)}
                disabled={loading}
                className={`w-full inline-flex items-center justify-center gap-2 rounded-lg ${level.buttonGradient} px-4 py-3 text-sm font-semibold text-white transition-all duration-300 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70`}
              >
                {loading && selectedLevel === level.id ? (
                  'Loading...'
                ) : (
                  <>
                    Start Challenge
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200 text-center">
            {error}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-lg rounded-xl bg-[#1f1f1f] p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white">Your {selectedLevelLabel} assessment</h3>
                <p className="text-sm text-gray-400">Two non-premium LeetCode questions ready to go.</p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {questions.length === 0 ? (
                <p className="rounded-lg border border-[#2f2f2f] bg-[#272727] p-3 text-sm text-gray-400">
                  No questions returned yet. Please close and try again.
                </p>
              ) : (
                questions.map((question) => (
                  <div
                    key={question.id}
                    className="flex items-center justify-between rounded-lg border border-[#2f2f2f] bg-[#272727] p-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {question.title}
                      </p>
                    </div>
                    <a
                      href={question.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 text-gray-400 hover:text-[#ffa116] transition-colors duration-200"
                      title="View on LeetCode"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M18 13v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-md border border-[#3a3a3a] px-4 py-2 text-sm text-gray-300 hover:bg-[#2b2b2b]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
