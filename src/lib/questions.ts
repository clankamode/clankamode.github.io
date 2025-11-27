import { supabase } from './supabase';

export interface Question {
  id: string;
  content: string;
  createdAt: string;
  isArchived: boolean;
  videoUrl: string | null;
  voteCount: number;
}

// Server-side function to fetch questions (for SEO - no user-specific data)
export async function getQuestions(): Promise<Question[]> {
  try {
    const { data: questions, error: questionsError } = await supabase
      .from('LiveQuestions')
      .select('id, content, created_at, is_archived, video_url, LiveQuestionVotes(count)')
      .order('created_at', { ascending: false });

    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
      return [];
    }

    interface SupabaseQuestionRow {
      id: string;
      content: string;
      created_at: string;
      is_archived: boolean;
      video_url: string | null;
      LiveQuestionVotes?: Array<{ count: number }>;
    }

    const formatted = (questions || []).map((question: SupabaseQuestionRow) => ({
      id: question.id,
      content: question.content,
      createdAt: question.created_at,
      isArchived: question.is_archived || false,
      videoUrl: question.video_url || null,
      voteCount: question.LiveQuestionVotes?.[0]?.count || 0,
    }));

    return formatted;
  } catch (error) {
    console.error('Error fetching questions:', error);
    return [];
  }
}

