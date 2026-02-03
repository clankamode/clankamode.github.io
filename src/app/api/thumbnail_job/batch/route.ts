import { NextResponse } from 'next/server';
import { ThumbnailJobStatus } from '@/types/ThumbnailJob';
import { supabase } from '@/lib/supabase';

const TABLE_NAME = 'ThumbnailJob';

interface BatchRequestBody {
    ids: string[];
    status?: ThumbnailJobStatus;
    favorite?: boolean;
}

export async function PATCH(request: Request) {
    try {
        const body: BatchRequestBody = await request.json();
        const { ids, status, favorite } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json(
                { error: 'ids array is required' },
                { status: 400 }
            );
        }

        const updates: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        };

        if (status !== undefined) {
            updates.status = status;
        }

        if (favorite !== undefined) {
            updates.favorite = favorite;
        }

        const { data, error } = await supabase
            .from(TABLE_NAME)
            .update(updates)
            .in('id', ids)
            .select();

        if (error) {
            throw error;
        }

        return NextResponse.json({ data });
    } catch (error: unknown) {
        console.error('Error batch updating thumbnails:', error);
        let errorMessage = 'Failed to batch update thumbnails';
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    try {
        const body: { ids: string[] } = await request.json();
        const { ids } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json(
                { error: 'ids array is required' },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from(TABLE_NAME)
            .update({ deleted_at: new Date().toISOString() })
            .in('id', ids)
            .select();

        if (error) {
            throw error;
        }

        return NextResponse.json({ data });
    } catch (error: unknown) {
        console.error('Error batch deleting thumbnails:', error);
        let errorMessage = 'Failed to batch delete thumbnails';
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
