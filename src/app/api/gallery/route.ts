import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";
import { hasRole, UserRole } from "@/types/roles";
import { supabase } from "@/lib/supabase";

export async function GET(): Promise<NextResponse> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userRole = session.user.role as UserRole;
  if (!hasRole(userRole, UserRole.EDITOR)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { data: headshots, error: fetchError } = await supabase
      .from('HeadShots')
      .select('url, created_at')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error("Error fetching headshots:", fetchError);
      return NextResponse.json({ error: "Failed to load gallery" }, { status: 500 });
    }

    // Map headshots to match the expected format
    const formattedHeadshots = (headshots || []).map((headshot) => ({
      url: headshot.url,
      uploadedAt: headshot.created_at ? new Date(headshot.created_at).toISOString() : null,
    }));

    return NextResponse.json({ data: formattedHeadshots });
  } catch (error) {
    console.error("Error listing gallery items:", error);
    return NextResponse.json({ error: "Failed to load gallery" }, { status: 500 });
  }
}
