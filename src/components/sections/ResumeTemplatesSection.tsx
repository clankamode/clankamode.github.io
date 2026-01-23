'use client';

import { signIn, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';

const templates = [
  {
    name: 'Google Docs Resume Template',
    format: 'Google Docs',
    description:
      'Clean, modern layout with sections for impact, projects, and metrics. Make a copy and edit in minutes.',
    viewHref: 'https://docs.google.com/document/d/1T-B8k4Szrg7Xz2hwC4UaEHaWLBTzf0BSpbKRBAg8noI/view',
    editHref: 'https://docs.google.com/document/d/1T-B8k4Szrg7Xz2hwC4UaEHaWLBTzf0BSpbKRBAg8noI/copy',
  },
  {
    name: 'LaTeX Resume Template',
    format: 'LaTeX / Overleaf',
    description:
      'Pixel-perfect typesetting with easy section controls. Ideal for technical roles and clean PDF export.',
    viewHref: 'https://www.overleaf.com/latex/templates/deedy-resume/cstpnrbkhndn',
    editHref: 'https://www.overleaf.com/project/new/template/19515?id=65338200&latexEngine=pdflatex&mainFile=main.tex&templateName=Jake%27s+Resume+%28Anonymous%29&texImage=texlive-full%3A2025.1',
  },
];

export default function ResumeTemplatesSection() {
  const { status } = useSession();
  const isAuthenticated = status === 'authenticated';

  const handleAction = (href: string) => {
    if (!isAuthenticated) {
      signIn('google');
      return;
    }
    window.open(href, '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="flex min-h-[calc(100vh-80px)] items-center bg-background py-20">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-12 px-6">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Templates</p>
          <h2 className="mt-4 text-4xl font-bold tracking-[-0.02em] text-text-primary md:text-5xl">
            Resume templates that get you interviews.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-text-secondary">
            Grab a template in the format you prefer, then tailor it with measurable impact and clear structure.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {templates.map((template) => (
            <div
              key={template.name}
              className="relative rounded-xl border border-border-subtle bg-surface-interactive p-6 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-border-interactive hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <span className="font-mono text-xs uppercase tracking-[0.1em] text-text-muted">
                    {template.format}
                  </span>
                  <h3 className="mt-1 text-lg font-semibold text-text-primary">{template.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                    {template.description}
                  </p>
                </div>

                <div className="flex gap-3 sm:flex-shrink-0">
                  {isAuthenticated ? (
                    <>
                      <Button
                        variant="secondary"
                        className="border-border-interactive bg-transparent text-text-primary hover:bg-white/5"
                        onClick={() => handleAction(template.viewHref)}
                      >
                        View
                      </Button>
                      <Button
                        variant="primary"
                        className="hover:shadow-[0_0_20px_rgba(44,187,93,0.15)] hover:brightness-110"
                        onClick={() => handleAction(template.editHref)}
                      >
                        Copy
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="primary"
                      className="group gap-2 hover:shadow-[0_0_20px_rgba(44,187,93,0.15)] hover:brightness-110"
                      onClick={() => signIn('google')}
                    >
                      <svg
                        className="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                      Login to Access
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
