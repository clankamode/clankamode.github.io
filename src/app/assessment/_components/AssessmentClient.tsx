'use client';

import { useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

type ButtonVariant = 'novice' | 'intermediate' | 'advanced';

const levels: Array<{
  id: string;
  title: string;
  difficulty: string;
  description: string;
  questionInfo: string;
  icon: React.ReactNode;
  variant: ButtonVariant;
}> = [
    {
      id: 'noob',
      title: 'Noob',
      difficulty: 'Easy',
      description: '2 easy questions to warm up and build confidence. Perfect for beginners.',
      questionInfo: '2 easy questions',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      variant: 'novice' as const,
    },
    {
      id: 'intermediate',
      title: 'Intermediate',
      difficulty: 'Medium',
      description: '1 easy + 1 medium to keep you sharp. Ideal for maintaining your skills.',
      questionInfo: '1 easy + 1 medium',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      variant: 'intermediate' as const,
    },
    {
      id: 'faang',
      title: 'FAANG-level',
      difficulty: 'Hard',
      description: '2 medium or a medium + hard for the real deal. Simulate actual interview conditions.',
      questionInfo: '2 medium / 1 medium + 1 hard',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
        </svg>
      ),
      variant: 'advanced' as const,
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

  const selectedLevelData = levels.find((level) => level.id === selectedLevel);
  const selectedLevelLabel = selectedLevelData?.title ?? 'Assessment';

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
    <div className="flex min-h-screen flex-col bg-background pt-24 text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 pb-16">
        {/* Header Section */}
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Channel Logo */}
          <a
            href="https://www.youtube.com/@jamesperaltaSWE?sub_confirmation=1"
            target="_blank"
            rel="noopener noreferrer"
            className="group mb-2 relative inline-block"
          >
            <div className="relative p-1 rounded-full bg-gradient-to-tr from-brand-green via-brand-amber to-brand-gold">
              <Image
                src="https://yt3.googleusercontent.com/1yE8FhBsduYXodmbR2TzuJf3DViBwKahmshEktiwcJocxc-3K7kmhQLmYiu_-AUVdWle4aRC=s160-c-k-c0x00ffffff-no-rj"
                alt="James Peralta"
                width={96}
                height={96}
                className="rounded-full border-4 border-background object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#ff0000] border-2 border-background transition-transform duration-300 group-hover:scale-110 shadow-lg">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </div>
          </a>

          <div className="space-y-2 max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold font-sans tracking-tight text-foreground">
              Peralta Mock Assessment
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Real interview-level questions pulled straight from James’s own prep.
              No theory dumps. No inflated difficulty. Just problems that actually show up.
            </p>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {levels.map((level) => (
            <Card
              key={level.id}
              className={cn(
                "flex flex-col relative overflow-hidden transition-all duration-500 border-white/5 bg-card/30 backdrop-blur-md hover:translate-y-[-5px]",
                "hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.05)]",
                level.id === 'noob' && "hover:border-brand-green/30 hover:shadow-[0_0_30px_-5px_rgba(44,187,93,0.1)]",
                level.id === 'intermediate' && "hover:border-brand-amber/30 hover:shadow-[0_0_30px_-5px_rgba(245,158,11,0.1)]",
                level.id === 'faang' && "hover:border-brand-red/30 hover:shadow-[0_0_30px_-5px_rgba(239,68,68,0.1)]"
              )}
            >
              <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none",
                level.id === 'noob' && "bg-gradient-to-br from-brand-green/5 to-transparent",
                level.id === 'intermediate' && "bg-gradient-to-br from-brand-amber/5 to-transparent",
                level.id === 'faang' && "bg-gradient-to-br from-brand-red/5 to-transparent"
              )} />

              <CardHeader className="pb-4 relative z-10">
                <div className="flex items-start justify-between mb-2">
                  <div className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-2xl shadow-inner transition-all duration-300 group-hover:scale-110",
                    level.variant === 'novice' && "bg-brand-green/10 text-brand-green shadow-[0_0_15px_-5px_rgba(44,187,93,0.3)]",
                    level.variant === 'intermediate' && "bg-brand-amber/10 text-brand-amber shadow-[0_0_15px_-5px_rgba(245,158,11,0.3)]",
                    level.variant === 'advanced' && "bg-brand-red/10 text-brand-red shadow-[0_0_15px_-5px_rgba(239,68,68,0.3)]"
                  )}>
                    {level.icon}
                  </div>
                  <Badge variant={level.variant} dot className="shadow-lg backdrop-blur-md">
                    {level.difficulty}
                  </Badge>
                </div>
                <CardTitle className="text-xl font-bold font-display tracking-tight mt-2">{level.title}</CardTitle>
                <CardDescription className="line-clamp-3 text-base leading-relaxed">
                  {level.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1 pb-4 relative z-10">
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-white/5 border border-white/5 p-3 rounded-lg backdrop-blur-md">
                  <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span className="font-mono text-xs uppercase tracking-wide opacity-80">{level.questionInfo}</span>
                </div>
              </CardContent>

              <CardFooter className="pt-0 relative z-10">
                <Button
                  variant={level.variant}
                  className="w-full h-11 shadow-lg"
                  onClick={() => handleStart(level.id)}
                  disabled={loading}
                >
                  {loading && selectedLevel === level.id ? 'Loading...' : 'Start Challenge'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive text-center font-medium animate-in fade-in slide-in-from-bottom-2">
            {error}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4 animate-in fade-in">
          <Card className="w-full max-w-lg shadow-2xl border-none ring-1 ring-border">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle className="text-xl">Your {selectedLevelLabel} assessment</CardTitle>
                <CardDescription>Two non-premium LeetCode questions ready to go.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={handleClose} className="h-8 w-8 p-0 rounded-full">
                ✕
              </Button>
            </CardHeader>

            <CardContent className="space-y-3 pt-4">
              {questions.length === 0 ? (
                <div className="rounded-lg border border-border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
                  No questions returned yet. Please close and try again.
                </div>
              ) : (
                questions.map((question) => (
                  <div
                    key={question.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-card p-4 hover:border-brand-green/30 transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-foreground">
                        {question.title}
                      </p>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full mt-1 inline-block",
                        question.difficulty === 'Easy' && "bg-brand-green/10 text-brand-green",
                        question.difficulty === 'Medium' && "bg-brand-amber/10 text-brand-amber",
                        question.difficulty === 'Hard' && "bg-brand-gold/10 text-brand-gold"
                      )}>
                        {question.difficulty}
                      </span>
                    </div>
                    <a
                      href={question.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 text-muted-foreground hover:text-brand-amber transition-colors p-2 hover:bg-muted/50 rounded-full"
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
            </CardContent>

            <CardFooter className="justify-end pt-2">
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
