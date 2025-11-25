export interface SuggestedQuery {
    title: string;
    query: string;
}

const createTimestampsQuery = `Here’s a transcript of my YouTube video.

Please generate chapters and timestamps for the video.

For chapters: Create concise, high-signal YouTube chapters that reflect real topic shifts.

Hard Rules:
- Format exactly: HH:MM:SS Title (no bullets, no extra lines, no emojis).
- First chapter must be: 00:00:00 Intro (or a better intro title if obvious).
- Spacing: Aim for 5–10 minutes between chapters (fewer, meatier cuts > dense micro-chapters).
- Count: Typically 6–14 chapters for 45–120 min videos; scale proportionally.
- Grounding: Derive chapter titles solely from the transcript—no hallucinations.
- Clarity & SEO: Use short, keyword-rich but non-clickbaity titles that reflect what viewers learn next.
- Continuity: Place timestamps at true transition points (topic/segment/guest demo change).
- Consistency: If the transcript lacks timecodes, infer using duration and relative pacing; still respect 5–10 min spacing.
- No extras: Output only the chapters—no explanations, summaries, or headings.
- Heuristics to find transitions (use these while scanning):
- New question, problem, or example introduced
- Tool switch (IDE ↔ whiteboard, coding ↔ testing)
- Result achieved or milestone hit (first working output, bug fix)
- Section labels spoken (“Question 2”, “follow-up”, “review”, “wrap-up”)
- Guest switches, Q&A start, or feedback section
- Tone for titles: Action-oriented, specific, and scannable (avoid fluff like “talking about”).
Output:
Return only lines in HH:MM:SS Title format, first at 00:00:00.

For timestamps: generate 3 short, relevant hashtags that would help with SEO and discovery.
They should be concise, audience-relevant, and match the main themes of the video.
Only return the hashtags, nothing else.

\`\`\`
Insert Transcript Here
\`\`\`
`;

export const suggestedQueries: SuggestedQuery[] = [
    { title: 'Generate Chapters & Timestamps', query: createTimestampsQuery },
];

