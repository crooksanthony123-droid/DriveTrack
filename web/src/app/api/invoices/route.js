import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const invoices = await sql`
      SELECT i.*, s.name as student_name, s.phone as student_phone, s.email as student_email
      FROM invoices i
      JOIN students s ON i.student_id = s.id
      WHERE i.instructor_id = ${session.user.id}
      ORDER BY i.created_at DESC
    `;

    return Response.json(invoices);
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Failed to fetch invoices" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { student_id, rate_per_hour, total_amount, lesson_ids } = body;

    if (!student_id || !rate_per_hour || !total_amount) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const lessonIdsJson = lesson_ids ? JSON.stringify(lesson_ids) : null;

    const [invoice] = await sql`
      INSERT INTO invoices (instructor_id, student_id, rate_per_hour, total_amount, lesson_ids)
      VALUES (${session.user.id}, ${student_id}, ${rate_per_hour}, ${total_amount}, ${lessonIdsJson})
      RETURNING *
    `;

    return Response.json(invoice);
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Failed to create invoice" },
      { status: 500 },
    );
  }
}
