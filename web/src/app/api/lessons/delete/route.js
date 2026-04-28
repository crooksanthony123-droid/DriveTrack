import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function DELETE(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return Response.json({ error: "Lesson ID is required" }, { status: 400 });
    }

    await sql`
      DELETE FROM lessons 
      WHERE id = ${id} AND instructor_id = ${session.user.id}
    `;

    return Response.json({ success: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to delete lesson" }, { status: 500 });
  }
}
