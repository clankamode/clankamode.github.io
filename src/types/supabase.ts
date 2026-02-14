export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            ChatConversations: {
                Row: {
                    created_at: string
                    email: string | null
                    google_id: string | null
                    id: string
                    is_archived: boolean | null
                    is_pinned: boolean | null
                    model: string | null
                    title: string | null
                    updated_at: string | null
                }
                Insert: {
                    created_at?: string
                    email?: string | null
                    google_id?: string | null
                    id?: string
                    is_archived?: boolean | null
                    is_pinned?: boolean | null
                    model?: string | null
                    title?: string | null
                    updated_at?: string | null
                }
                Update: {
                    created_at?: string
                    email?: string | null
                    google_id?: string | null
                    id?: string
                    is_archived?: boolean | null
                    is_pinned?: boolean | null
                    model?: string | null
                    title?: string | null
                    updated_at?: string | null
                }
                Relationships: []
            }
            ChatMessages: {
                Row: {
                    content: string
                    conversation_id: string
                    created_at: string
                    id: string
                    metadata: Json | null
                    role: string
                    token_count: number | null
                }
                Insert: {
                    content: string
                    conversation_id: string
                    created_at?: string
                    id?: string
                    metadata?: Json | null
                    role: string
                    token_count?: number | null
                }
                Update: {
                    content?: string
                    conversation_id?: string
                    created_at?: string
                    id?: string
                    metadata?: Json | null
                    role?: string
                    token_count?: number | null
                }
                Relationships: []
            }
            ConceptDependencies: {
                Row: {
                    concept_slug: string
                    created_at: string
                    depends_on_slug: string
                    track_slug: string
                    weight: number
                }
                Insert: {
                    concept_slug: string
                    created_at?: string
                    depends_on_slug: string
                    track_slug: string
                    weight?: number
                }
                Update: {
                    concept_slug?: string
                    created_at?: string
                    depends_on_slug?: string
                    track_slug?: string
                    weight?: number
                }
                Relationships: [
                    {
                        foreignKeyName: "ConceptDependencies_concept_slug_fkey"
                        columns: ["concept_slug"]
                        isOneToOne: false
                        referencedRelation: "Concepts"
                        referencedColumns: ["slug"]
                    },
                    {
                        foreignKeyName: "ConceptDependencies_depends_on_slug_fkey"
                        columns: ["depends_on_slug"]
                        isOneToOne: false
                        referencedRelation: "Concepts"
                        referencedColumns: ["slug"]
                    }
                ]
            }
            Concepts: {
                Row: {
                    created_at: string
                    description: string | null
                    id: string
                    kind: string
                    label: string
                    short_label: string | null
                    slug: string
                    track_slug: string
                }
                Insert: {
                    created_at?: string
                    description?: string | null
                    id?: string
                    kind?: string
                    label: string
                    short_label?: string | null
                    slug: string
                    track_slug: string
                }
                Update: {
                    created_at?: string
                    description?: string | null
                    id?: string
                    kind?: string
                    label?: string
                    short_label?: string | null
                    slug?: string
                    track_slug?: string
                }
                Relationships: []
            }
            HeadShots: {
                Row: {
                    created_at: string
                    id: string
                    url: string
                }
                Insert: {
                    created_at?: string
                    id?: string
                    url: string
                }
                Update: {
                    created_at?: string
                    id?: string
                    url?: string
                }
                Relationships: []
            }
            InterviewQuestions: {
                Row: {
                    created_at: string | null
                    difficulty: string
                    helper_code: string
                    id: string
                    leetcode_number: number | null
                    name: string
                    prompt_full: string
                    starter_code: string
                    test_cases: Json
                    video_ids: string[] | null
                }
                Insert: {
                    created_at?: string | null
                    difficulty: string
                    helper_code?: string
                    id?: string
                    leetcode_number?: number | null
                    name: string
                    prompt_full: string
                    starter_code: string
                    test_cases?: Json
                    video_ids?: string[] | null
                }
                Update: {
                    created_at?: string | null
                    difficulty?: string
                    helper_code?: string
                    id?: string
                    leetcode_number?: number | null
                    name?: string
                    prompt_full?: string
                    starter_code?: string
                    test_cases?: Json
                    video_ids?: string[] | null
                }
                Relationships: []
            }
            LearningArticles: {
                Row: {
                    body: string
                    concept_tags: Json
                    created_at: string
                    excerpt: string | null
                    id: string
                    is_premium: boolean
                    is_published: boolean
                    order_index: number | null
                    primary_concept: string | null
                    reading_time_minutes: number | null
                    slug: string
                    title: string
                    topic_id: string
                    updated_at: string
                }
                Insert: {
                    body: string
                    concept_tags?: Json
                    created_at?: string
                    excerpt?: string | null
                    id?: string
                    is_premium?: boolean
                    is_published?: boolean
                    order_index?: number | null
                    primary_concept?: string | null
                    reading_time_minutes?: number | null
                    slug: string
                    title: string
                    topic_id: string
                    updated_at?: string
                }
                Update: {
                    body?: string
                    concept_tags?: Json
                    created_at?: string
                    excerpt?: string | null
                    id?: string
                    is_premium?: boolean
                    is_published?: boolean
                    order_index?: number | null
                    primary_concept?: string | null
                    reading_time_minutes?: number | null
                    slug?: string
                    title?: string
                    topic_id?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "LearningArticles_topic_id_fkey"
                        columns: ["topic_id"]
                        isOneToOne: false
                        referencedRelation: "LearningTopics"
                        referencedColumns: ["id"]
                    }
                ]
            }
            LearningPillars: {
                Row: {
                    created_at: string
                    description: string | null
                    icon_name: string | null
                    id: string
                    name: string
                    order_index: number | null
                    slug: string
                }
                Insert: {
                    created_at?: string
                    description?: string | null
                    icon_name?: string | null
                    id?: string
                    name: string
                    order_index?: number | null
                    slug: string
                }
                Update: {
                    created_at?: string
                    description?: string | null
                    icon_name?: string | null
                    id?: string
                    name?: string
                    order_index?: number | null
                    slug?: string
                }
                Relationships: []
            }
            LearningTopics: {
                Row: {
                    created_at: string
                    description: string | null
                    id: string
                    name: string
                    order_index: number | null
                    pillar_id: string
                    slug: string
                }
                Insert: {
                    created_at?: string
                    description?: string | null
                    id?: string
                    name: string
                    order_index?: number | null
                    pillar_id: string
                    slug: string
                }
                Update: {
                    created_at?: string
                    description?: string | null
                    id?: string
                    name?: string
                    order_index?: number | null
                    pillar_id?: string
                    slug?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "LearningTopics_pillar_id_fkey"
                        columns: ["pillar_id"]
                        isOneToOne: false
                        referencedRelation: "LearningPillars"
                        referencedColumns: ["id"]
                    }
                ]
            }
            LeetCodeProblems: {
                Row: {
                    created_at: string
                    difficulty: string
                    id: number
                    link: string
                    name: string
                }
                Insert: {
                    created_at?: string
                    difficulty: string
                    id: number
                    link: string
                    name: string
                }
                Update: {
                    created_at?: string
                    difficulty?: string
                    id?: number
                    link?: string
                    name?: string
                }
                Relationships: []
            }
            LiveQuestions: {
                Row: {
                    content: string
                    created_at: string
                    google_id: string | null
                    id: string
                    is_archived: boolean
                    user_email: string
                    user_name: string | null
                    video_url: string | null
                }
                Insert: {
                    content: string
                    created_at?: string
                    google_id?: string | null
                    id?: string
                    is_archived?: boolean
                    user_email: string
                    user_name?: string | null
                    video_url?: string | null
                }
                Update: {
                    content?: string
                    created_at?: string
                    google_id?: string | null
                    id?: string
                    is_archived?: boolean
                    user_email?: string
                    user_name?: string | null
                    video_url?: string | null
                }
                Relationships: []
            }
            LiveQuestionVotes: {
                Row: {
                    created_at: string
                    google_id: string | null
                    id: string
                    question_id: string
                    user_email: string
                }
                Insert: {
                    created_at?: string
                    google_id?: string | null
                    id?: string
                    question_id: string
                    user_email: string
                }
                Update: {
                    created_at?: string
                    google_id?: string | null
                    id?: string
                    question_id?: string
                    user_email?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "LiveQuestionVotes_question_id_fkey"
                        columns: ["question_id"]
                        isOneToOne: false
                        referencedRelation: "LiveQuestions"
                        referencedColumns: ["id"]
                    }
                ]
            }
            QuestionBank: {
                Row: {
                    correct_answer: string | null
                    created_at: string
                    id: string
                    knowledge_area: string | null
                    options: Json | null
                    question: string | null
                    question_number: number
                    rationale: string | null
                    unit: string | null
                }
                Insert: {
                    correct_answer?: string | null
                    created_at?: string
                    id?: string
                    knowledge_area?: string | null
                    options?: Json | null
                    question?: string | null
                    question_number: number
                    rationale?: string | null
                    unit?: string | null
                }
                Update: {
                    correct_answer?: string | null
                    created_at?: string
                    id?: string
                    knowledge_area?: string | null
                    options?: Json | null
                    question?: string | null
                    question_number?: number
                    rationale?: string | null
                    unit?: string | null
                }
                Relationships: []
            }
            TelemetryEvents: {
                Row: {
                    created_at: string
                    dedupe_key: string | null
                    event_type: string
                    google_id: string | null
                    id: string
                    mode: string
                    payload: Json
                    session_id: string
                    track_slug: string
                    email: string
                }
                Insert: {
                    created_at?: string
                    dedupe_key?: string | null
                    event_type: string
                    google_id?: string | null
                    id?: string
                    mode: string
                    payload?: Json
                    session_id: string
                    track_slug: string
                    email: string
                }
                Update: {
                    created_at?: string
                    dedupe_key?: string | null
                    event_type?: string
                    google_id?: string | null
                    id?: string
                    mode?: string
                    payload?: Json
                    session_id?: string
                    track_slug?: string
                    email?: string
                }
                Relationships: []
            }
            TestAnswer: {
                Row: {
                    answered_at: string | null
                    created_at: string
                    email: string | null
                    google_id: string | null
                    id: string
                    is_correct: boolean | null
                    question_number: number | null
                    session_id: number
                    time_spent_seconds: number | null
                    user_answer: string | null
                }
                Insert: {
                    answered_at?: string | null
                    created_at?: string
                    email?: string | null
                    google_id?: string | null
                    id?: string
                    is_correct?: boolean | null
                    question_number?: number | null
                    session_id: number
                    time_spent_seconds?: number | null
                    user_answer?: string | null
                }
                Update: {
                    answered_at?: string | null
                    created_at?: string
                    email?: string | null
                    google_id?: string | null
                    id?: string
                    is_correct?: boolean | null
                    question_number?: number | null
                    session_id?: number
                    time_spent_seconds?: number | null
                    user_answer?: string | null
                }
                Relationships: []
            }
            TestSession: {
                Row: {
                    completed_at: string | null
                    correct_answers: number | null
                    created_at: string
                    email: string | null
                    google_id: string | null
                    id: number
                    score_percentage: number | null
                    started_at: string | null
                    total_questions: number | null
                }
                Insert: {
                    completed_at?: string | null
                    correct_answers?: number | null
                    created_at?: string
                    email?: string | null
                    google_id?: string | null
                    id?: number
                    score_percentage?: number | null
                    started_at?: string | null
                    total_questions?: number | null
                }
                Update: {
                    completed_at?: string | null
                    correct_answers?: number | null
                    created_at?: string
                    email?: string | null
                    google_id?: string | null
                    id?: number
                    score_percentage?: number | null
                    started_at?: string | null
                    total_questions?: number | null
                }
                Relationships: []
            }
            ThumbnailComments: {
                Row: {
                    attachments: Json[] | null
                    author_email: string | null
                    author_image: string | null
                    author_name: string | null
                    created_at: string
                    id: number
                    text: string
                    thumbnail_job_id: number
                }
                Insert: {
                    attachments?: Json[] | null
                    author_email?: string | null
                    author_image?: string | null
                    author_name?: string | null
                    created_at?: string
                    id?: number
                    text: string
                    thumbnail_job_id: number
                }
                Update: {
                    attachments?: Json[] | null
                    author_email?: string | null
                    author_image?: string | null
                    author_name?: string | null
                    created_at?: string
                    id?: number
                    text?: string
                    thumbnail_job_id?: number
                }
                Relationships: [
                    {
                        foreignKeyName: "ThumbnailComments_thumbnail_job_id_fkey"
                        columns: ["thumbnail_job_id"]
                        isOneToOne: false
                        referencedRelation: "ThumbnailJob"
                        referencedColumns: ["id"]
                    }
                ]
            }
            ThumbnailJob: {
                Row: {
                    created_at: string
                    deleted_at: string | null
                    favorite: boolean
                    id: number
                    notes: string | null
                    status: string | null
                    suggested_thumbnails: string[] | null
                    thumbnail: string | null
                    thumbnail_suggestion_status: string | null
                    updated_at: string | null
                    video_title: string | null
                    video_url: string | null
                }
                Insert: {
                    created_at?: string
                    deleted_at?: string | null
                    favorite?: boolean
                    id?: number
                    notes?: string | null
                    status?: string | null
                    suggested_thumbnails?: string[] | null
                    thumbnail?: string | null
                    thumbnail_suggestion_status?: string | null
                    updated_at?: string | null
                    video_title?: string | null
                    video_url?: string | null
                }
                Update: {
                    created_at?: string
                    deleted_at?: string | null
                    favorite?: boolean
                    id?: number
                    notes?: string | null
                    status?: string | null
                    suggested_thumbnails?: string[] | null
                    thumbnail?: string | null
                    thumbnail_suggestion_status?: string | null
                    updated_at?: string | null
                    video_title?: string | null
                    video_url?: string | null
                }
                Relationships: []
            }
            UserArticleProgress: {
                Row: {
                    article_id: string
                    completed_at: string
                    created_at: string
                    id: string
                    email: string
                    google_id: string | null
                }
                Insert: {
                    article_id: string
                    completed_at?: string
                    created_at?: string
                    id?: string
                    email: string
                    google_id?: string | null
                }
                Update: {
                    article_id?: string
                    completed_at?: string
                    created_at?: string
                    id?: string
                    email?: string
                    google_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "UserArticleProgress_article_id_fkey"
                        columns: ["article_id"]
                        isOneToOne: false
                        referencedRelation: "LearningArticles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            UserBookmarks: {
                Row: {
                    article_id: string
                    created_at: string
                    id: string
                    email: string
                    google_id: string | null
                }
                Insert: {
                    article_id: string
                    created_at?: string
                    id?: string
                    email: string
                    google_id?: string | null
                }
                Update: {
                    article_id?: string
                    created_at?: string
                    id?: string
                    email?: string
                    google_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "UserBookmarks_article_id_fkey"
                        columns: ["article_id"]
                        isOneToOne: false
                        referencedRelation: "LearningArticles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            UserConceptStats: {
                Row: {
                    concept_slug: string
                    exposures: number
                    internalized_count: number
                    last_seen_at: string | null
                    track_slug: string
                    email: string
                    google_id: string | null
                }
                Insert: {
                    concept_slug: string
                    exposures?: number
                    internalized_count?: number
                    last_seen_at?: string | null
                    track_slug: string
                    email: string
                    google_id?: string | null
                }
                Update: {
                    concept_slug?: string
                    exposures?: number
                    internalized_count?: number
                    last_seen_at?: string | null
                    track_slug?: string
                    email?: string
                    google_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "UserConceptStats_concept_slug_fkey"
                        columns: ["concept_slug"]
                        isOneToOne: false
                        referencedRelation: "Concepts"
                        referencedColumns: ["slug"]
                    }
                ]
            }
            UserInternalizations: {
                Row: {
                    concept_slug: string
                    track_slug: string
                    created_at: string
                    delta_snapshot: Json
                    id: string
                    note: string | null
                    picked: string
                    session_id: string
                    email: string
                    google_id: string | null
                }
                Insert: {
                    concept_slug: string
                    track_slug: string
                    created_at?: string
                    delta_snapshot?: Json
                    id?: string
                    note?: string | null
                    picked: string
                    session_id: string
                    email: string
                    google_id?: string | null
                }
                Update: {
                    concept_slug?: string
                    track_slug?: string
                    created_at?: string
                    delta_snapshot?: Json
                    id?: string
                    note?: string | null
                    picked?: string
                    session_id?: string
                    email?: string
                    google_id?: string | null
                }
                Relationships: []
            }
            Users: {
                Row: {
                    created_at: string
                    email: string
                    google_id: string | null
                    id: number
                    role: string
                }
                Insert: {
                    created_at?: string
                    email: string
                    google_id?: string | null
                    id?: number
                    role?: string
                }
                Update: {
                    created_at?: string
                    email?: string
                    google_id?: string | null
                    id?: number
                    role?: string
                }
                Relationships: []
            }
            Videos: {
                Row: {
                    created_at: string
                    date_uploaded: string | null
                    description: string | null
                    duration: number | null
                    id: string
                    thumbnail: string | null
                    title: string | null
                }
                Insert: {
                    created_at?: string
                    date_uploaded?: string | null
                    description?: string | null
                    duration?: number | null
                    id: string
                    thumbnail?: string | null
                    title?: string | null
                }
                Update: {
                    created_at?: string
                    date_uploaded?: string | null
                    description?: string | null
                    duration?: number | null
                    id?: string
                    thumbnail?: string | null
                    title?: string | null
                }
                Relationships: []
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
