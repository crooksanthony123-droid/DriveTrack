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
      return Response.json(
        { error: "Invoice ID is required" },
        { status: 400 },
      );
    }

    const rows = await sql`
      DELETE FROM invoices
      WHERE id = ${id} AND instructor_id = ${session.user.id}
      RETURNING id
    `;

    if (rows.length === 0) {
      return Response.json({ error: "Invoice not found" }, { status: 404 });
    }

    return Response.json({ success: true, id: rows[0].id });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Failed to delete invoice" },
      { status: 500 },
    );
  }
}
