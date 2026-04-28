import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function PUT(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      status,
      notes,
      lesson_date,
      lesson_time,
      duration,
      lesson_type,
      pickup_location,
    } = body;

    if (!id) {
      return Response.json({ error: "Lesson ID is required" }, { status: 400 });
    }

    const setClauses = [];
    const values = [];
    let paramCount = 1;

    if (status !== undefined) {
      setClauses.push(`status = $${paramCount++}`);
      values.push(status);
    }
    if (notes !== undefined) {
      setClauses.push(`notes = $${paramCount++}`);
      values.push(notes);
    }
    if (lesson_date !== undefined) {
      setClauses.push(`lesson_date = $${paramCount++}`);
      values.push(lesson_date);
    }
    if (lesson_time !== undefined) {
      setClauses.push(`lesson_time = $${paramCount++}`);
      values.push(lesson_time);
    }
    if (duration !== undefined) {
      setClauses.push(`duration = $${paramCount++}`);
      values.push(duration);
    }
    if (lesson_type !== undefined) {
      setClauses.push(`lesson_type = $${paramCount++}`);
      values.push(lesson_type);
    }
    if (pickup_location !== undefined) {
      setClauses.push(`pickup_location = $${paramCount++}`);
      values.push(pickup_location);
    }

    if (setClauses.length === 0) {
      return Response.json({ error: "No fields to update" }, { status: 400 });
    }

    values.push(id);
    values.push(session.user.id);

    const query = `UPDATE lessons SET ${setClauses.join(", ")} WHERE id = $${paramCount++} AND instructor_id = $${paramCount} RETURNING *`;
    const rows = await sql(query, values);

    return Response.json(rows[0]);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to update lesson" }, { status: 500 });
  }
}
