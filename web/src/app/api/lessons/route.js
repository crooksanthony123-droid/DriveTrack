import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function GET(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const lessons = await sql`
      SELECT l.*, s.name as student_name 
      FROM lessons l
      JOIN students s ON l.student_id = s.id
      WHERE l.instructor_id = ${session.user.id}
      ORDER BY l.lesson_date DESC, l.lesson_time DESC
    `;

    return Response.json(lessons);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to fetch lessons" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      student_id,
      lesson_date,
      lesson_time,
      duration,
      lesson_type,
      notes,
      pickup_location,
    } = body;

    if (
      !student_id ||
      !lesson_date ||
      !lesson_time ||
      !duration ||
      !lesson_type
    ) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const [lesson] = await sql`
      INSERT INTO lessons (instructor_id, student_id, lesson_date, lesson_time, duration, lesson_type, notes, pickup_location)
      VALUES (${session.user.id}, ${student_id}, ${lesson_date}, ${lesson_time}, ${duration}, ${lesson_type}, ${notes || null}, ${pickup_location || null})
      RETURNING *
    `;

    return Response.json(lesson);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to create lesson" }, { status: 500 });
  }
}
