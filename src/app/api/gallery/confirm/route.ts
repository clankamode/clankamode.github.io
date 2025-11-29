import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";
import { hasRole, UserRole } from "@/types/roles";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request): Promise<NextResponse> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userRole = session.user.role as UserRole;
  if (!hasRole(userRole, UserRole.ADMIN)) {
    return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Save to HeadShots table
    const { data: headshot, error: insertError } = await supabase
      .from('HeadShots')
      .insert({
        url,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error saving headshot to database:", insertError);
      return NextResponse.json({ error: "Failed to save headshot" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: headshot }, { status: 201 });
  } catch (error) {
    console.error("Error confirming gallery upload:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

