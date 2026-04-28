import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const students = await sql`
      SELECT * FROM students 
      WHERE instructor_id = ${session.user.id} 
      ORDER BY name ASC
    `;

    return Response.json(students);
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Failed to fetch students" },
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
    const { name, phone, email, licence_type, target_hours, status } = body;

    if (!name) {
      return Response.json({ error: "Name is required" }, { status: 400 });
    }

    const [student] = await sql`
      INSERT INTO students (instructor_id, name, phone, email, licence_type, target_hours, status)
      VALUES (${session.user.id}, ${name}, ${phone || null}, ${email || null}, ${licence_type}, ${target_hours || 120}, ${status || "Active"})
      RETURNING *
    `;

    return Response.json(student);
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Failed to create student" },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, phone, email, licence_type, target_hours, status } = body;

    if (!id) {
      return Response.json(
        { error: "Student ID is required" },
        { status: 400 },
      );
    }

    const setClauses = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      setClauses.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (phone !== undefined) {
      setClauses.push(`phone = $${paramCount++}`);
      values.push(phone);
    }
    if (email !== undefined) {
      setClauses.push(`email = $${paramCount++}`);
      values.push(email);
    }
    if (licence_type !== undefined) {
      setClauses.push(`licence_type = $${paramCount++}`);
      values.push(licence_type);
    }
    if (target_hours !== undefined) {
      setClauses.push(`target_hours = $${paramCount++}`);
      values.push(target_hours);
    }
    if (status !== undefined) {
      setClauses.push(`status = $${paramCount++}`);
      values.push(status);
    }

    if (setClauses.length === 0) {
      return Response.json({ error: "No fields to update" }, { status: 400 });
    }

    values.push(id);
    values.push(session.user.id);

    const query = `UPDATE students SET ${setClauses.join(", ")} WHERE id = $${paramCount++} AND instructor_id = $${paramCount} RETURNING *`;
    const rows = await sql(query, values);

    return Response.json(rows[0]);
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Failed to update student" },
      { status: 500 },
    );
  }
}
