import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function PUT(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const [updatedInvoice] = await sql`
      UPDATE invoices 
      SET status = ${status}
      WHERE id = ${id} AND instructor_id = ${session.user.id}
      RETURNING *
    `;

    return Response.json(updatedInvoice);
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Failed to update invoice" },
      { status: 500 },
    );
  }
}
