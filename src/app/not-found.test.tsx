import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test, vi } from 'vitest';
import NotFound from './not-found';

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('not-found page', () => {
  test('renders 404 with generic navigation options', () => {
    const html = renderToStaticMarkup(<NotFound />);

    expect(html).toContain('404');
    expect(html).toContain('This page doesn');
    expect(html).toContain('Go Home');
    expect(html).toContain('href="/"');
    expect(html).toContain('Browse Questions');
    expect(html).toContain('href="/questions"');
  });
});
