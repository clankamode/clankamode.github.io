import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";
import { hasRole, UserRole } from "@/types/roles";
import { supabase } from "@/lib/supabase";
import { del } from "@vercel/blob";

export async function DELETE(request: Request): Promise<NextResponse> {
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

    // Delete from database
    const { error: deleteError } = await supabase
      .from('HeadShots')
      .delete()
      .eq('url', url);

    if (deleteError) {
      console.error("Error deleting headshot from database:", deleteError);
      return NextResponse.json({ error: "Failed to delete headshot" }, { status: 500 });
    }

    // Delete from blob storage
    try {
      await del(url);
    } catch (blobError) {
      console.error("Error deleting blob:", blobError);
      // Continue even if blob deletion fails - database record is already deleted
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting headshot:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

