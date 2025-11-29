import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";
import { hasRole, UserRole } from "@/types/roles";

export async function POST(request: Request): Promise<NextResponse> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userRole = session.user.role as UserRole;
  if (!hasRole(userRole, UserRole.ADMIN)) {
    return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
  }

  const body = (await request.json()) as HandleUploadBody;
  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        return {
          allowedContentTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({

          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log('Gallery upload completed', blob, tokenPayload);
        // Just log the upload completion - don't save to database yet
        // The database insert will happen when the user confirms via a separate endpoint
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("Error uploading gallery file:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
