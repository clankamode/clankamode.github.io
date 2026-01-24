import { test, expect } from '@playwright/test';

// Test data constants
const SECTION_HEADING = 'Resume templates that get you interviews.';
const SECTION_DESCRIPTION = 'Grab a template in the format you prefer, then tailor it with measurable impact and clear structure.';

const TEMPLATES = {
  GOOGLE_DOCS: {
    name: 'Google Docs Resume Template',
    format: 'Google Docs',
    description: 'Clean, modern layout with sections for impact, projects, and metrics. Make a copy and edit in minutes.',
    viewHref: 'https://docs.google.com/document/d/1T-B8k4Szrg7Xz2hwC4UaEHaWLBTzf0BSpbKRBAg8noI/view',
    editHref: 'https://docs.google.com/document/d/1T-B8k4Szrg7Xz2hwC4UaEHaWLBTzf0BSpbKRBAg8noI/copy',
  },
  LATEX: {
    name: 'LaTeX Resume Template',
    format: 'LaTeX / Overleaf',
    description: 'Pixel-perfect typesetting with easy section controls. Ideal for technical roles and clean PDF export.',
    viewHref: 'https://www.overleaf.com/latex/templates/deedy-resume/cstpnrbkhndn',
    editHref: 'https://www.overleaf.com/project/new/template/19515?id=65338200&latexEngine=pdflatex&mainFile=main.tex&templateName=Jake%27s+Resume+%28Anonymous%29&texImage=texlive-full%3A2025.1',
  },
};

test.describe('Resume Templates Page - Unauthenticated', () => {
  const shouldSkip = (testInfo: { project: { name: string } }) => {
    return testInfo.project.name !== 'chromium-unauth';
  };

  test('should display section heading and description', async ({ page }, testInfo) => {
    test.skip(shouldSkip(testInfo), 'This test only runs in chromium-unauth project');
    await page.goto('/resumes');

    const heading = page.getByRole('heading', { name: SECTION_HEADING });
    await expect(heading).toBeVisible();
    await expect(heading).toHaveText(SECTION_HEADING);
    await expect(page.getByText(SECTION_DESCRIPTION)).toBeVisible();

    const templatesLabel = page.locator('p').filter({ hasText: /^Templates$/ });
    await expect(templatesLabel).toBeVisible();
  });

  test('should display both template cards with correct content', async ({ page }, testInfo) => {
    test.skip(shouldSkip(testInfo), 'This test only runs in chromium-unauth project');
    await page.goto('/resumes');

    const googleDocsCard = page.locator('section').filter({ hasText: TEMPLATES.GOOGLE_DOCS.name });
    await expect(googleDocsCard).toBeVisible();
    const googleDocsFormat = googleDocsCard.locator('span.font-mono').filter({ hasText: TEMPLATES.GOOGLE_DOCS.format });
    await expect(googleDocsFormat).toBeVisible();
    await expect(googleDocsCard.getByRole('heading', { name: TEMPLATES.GOOGLE_DOCS.name })).toBeVisible();
    await expect(googleDocsCard.getByText(TEMPLATES.GOOGLE_DOCS.description)).toBeVisible();

    const latexCard = page.locator('section').filter({ hasText: TEMPLATES.LATEX.name });
    await expect(latexCard).toBeVisible();
    const latexFormat = latexCard.locator('span.font-mono').filter({ hasText: TEMPLATES.LATEX.format });
    await expect(latexFormat).toBeVisible();
    await expect(latexCard.getByRole('heading', { name: TEMPLATES.LATEX.name })).toBeVisible();
    await expect(latexCard.getByText(TEMPLATES.LATEX.description)).toBeVisible();
  });

  test('should show "Login to Access" button with lock icon when not authenticated', async ({ page }, testInfo) => {
    test.skip(shouldSkip(testInfo), 'This test only runs in chromium-unauth project');
    await page.goto('/resumes');

    const loginButtons = page.getByRole('button', { name: /Login to Access/i });
    await expect(loginButtons).toHaveCount(2);

    const firstButton = loginButtons.first();
    await expect(firstButton).toBeVisible();
    await expect(firstButton).toContainText('Login to Access');

    const lockIcon = firstButton.locator('svg');
    await expect(lockIcon).toBeVisible();
    await expect(firstButton).toHaveClass(/group/);
    await expect(firstButton).toHaveClass(/gap-2/);
  });

  test('should trigger signIn when clicking "Login to Access" button', async ({ page }, testInfo) => {
    test.skip(shouldSkip(testInfo), 'This test only runs in chromium-unauth project');
    await page.goto('/resumes');

    const signInPromise = page.waitForURL(/\/api\/auth\/signin\/google/, { timeout: 5000 }).catch(() => null);
    const loginButton = page.getByRole('button', { name: /Login to Access/i }).first();
    await loginButton.click();
    await expect(loginButton).toBeVisible();
  });

  test('should have hover animation on login button icon', async ({ page }, testInfo) => {
    test.skip(shouldSkip(testInfo), 'This test only runs in chromium-unauth project');
    await page.goto('/resumes');

    const loginButton = page.getByRole('button', { name: /Login to Access/i }).first();
    const lockIcon = loginButton.locator('svg');

    await expect(lockIcon).toHaveClass(/transition-transform/);
    await expect(lockIcon).toHaveClass(/duration-200/);
    await expect(lockIcon).toHaveClass(/group-hover:scale-110/);

    await loginButton.hover();
    const iconClasses = await lockIcon.getAttribute('class');
    expect(iconClasses).toContain('group-hover:scale-110');
  });
});

test.describe('Resume Templates Page - Authenticated', () => {
  const shouldSkip = (testInfo: { project: { name: string } }) => {
    return testInfo.project.name === 'chromium-unauth';
  };

  test('should show "View" and "Copy" buttons when authenticated', async ({ page }, testInfo) => {
    test.skip(shouldSkip(testInfo), 'This test only runs in authenticated projects');
    await page.goto('/resumes');

    const viewButtons = page.getByRole('button', { name: 'View' });
    const copyButtons = page.getByRole('button', { name: 'Copy' });

    await expect(viewButtons).toHaveCount(2);
    await expect(copyButtons).toHaveCount(2);
    await expect(viewButtons.first()).toBeVisible();
    await expect(copyButtons.first()).toBeVisible();
  });

  test('should not show "Login to Access" button when authenticated', async ({ page }, testInfo) => {
    test.skip(shouldSkip(testInfo), 'This test only runs in authenticated projects');
    await page.goto('/resumes');

    const loginButtons = page.getByRole('button', { name: /Login to Access/i });
    await expect(loginButtons).toHaveCount(0);
  });

  test('should open template view link in new tab when clicking "View"', async ({ page, context }, testInfo) => {
    test.skip(shouldSkip(testInfo), 'This test only runs in authenticated projects');
    await page.goto('/resumes');

    const newPagePromise = context.waitForEvent('page');
    const viewButton = page.getByRole('button', { name: 'View' }).first();
    await viewButton.click();

    const newPage = await newPagePromise;
    await newPage.waitForLoadState();

    expect(newPage.url()).toContain('docs.google.com');
    expect(newPage.url()).toContain('view');
    await newPage.close();
  });

  test('should open template edit link in new tab when clicking "Copy"', async ({ page, context }, testInfo) => {
    test.skip(shouldSkip(testInfo), 'This test only runs in authenticated projects');
    await page.goto('/resumes');

    const newPagePromise = context.waitForEvent('page');
    const copyButton = page.getByRole('button', { name: 'Copy' }).first();
    await copyButton.click();

    const newPage = await newPagePromise;
    await newPage.waitForLoadState();

    expect(newPage.url()).toMatch(/docs\.google\.com|overleaf\.com/);
    await newPage.close();
  });

  test('should have correct button styling when authenticated', async ({ page }, testInfo) => {
    test.skip(shouldSkip(testInfo), 'This test only runs in authenticated projects');
    await page.goto('/resumes');

    const viewButton = page.getByRole('button', { name: 'View' }).first();
    const copyButton = page.getByRole('button', { name: 'Copy' }).first();

    await expect(viewButton).toHaveClass(/border-border-interactive/);
    await expect(viewButton).toHaveClass(/bg-transparent/);
    await expect(copyButton).toHaveClass(/hover:shadow/);
    await expect(copyButton).toHaveClass(/hover:brightness-110/);
  });

  test('should display all template information correctly when authenticated', async ({ page }, testInfo) => {
    test.skip(shouldSkip(testInfo), 'This test only runs in authenticated projects');
    await page.goto('/resumes');

    const googleDocsSection = page.locator('section').filter({ hasText: TEMPLATES.GOOGLE_DOCS.name });
    const googleDocsFormat = googleDocsSection.locator('span.font-mono').filter({ hasText: TEMPLATES.GOOGLE_DOCS.format });
    await expect(googleDocsFormat).toBeVisible();
    await expect(googleDocsSection.getByRole('heading', { name: TEMPLATES.GOOGLE_DOCS.name })).toBeVisible();
    await expect(googleDocsSection.getByText(TEMPLATES.GOOGLE_DOCS.description)).toBeVisible();

    const latexSection = page.locator('section').filter({ hasText: TEMPLATES.LATEX.name });
    const latexFormat = latexSection.locator('span.font-mono').filter({ hasText: TEMPLATES.LATEX.format });
    await expect(latexFormat).toBeVisible();
    await expect(latexSection.getByRole('heading', { name: TEMPLATES.LATEX.name })).toBeVisible();
    await expect(latexSection.getByText(TEMPLATES.LATEX.description)).toBeVisible();
  });
});
