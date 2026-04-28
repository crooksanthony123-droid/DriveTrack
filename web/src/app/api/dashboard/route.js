import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";
import { format } from "date-fns";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const today = format(new Date(), "yyyy-MM-dd");

    // 1. Today's lessons
    const todayLessons = await sql`
      SELECT l.*, s.name as student_name 
      FROM lessons l
      JOIN students s ON l.student_id = s.id
      WHERE l.instructor_id = ${userId} AND l.lesson_date = ${today}
      ORDER BY l.lesson_time ASC
    `;

    // 2. Upcoming lessons (after today, next 5)
    const upcomingLessons = await sql`
      SELECT l.*, s.name as student_name 
      FROM lessons l
      JOIN students s ON l.student_id = s.id
      WHERE l.instructor_id = ${userId} AND l.lesson_date > ${today} AND l.status = 'Scheduled'
      ORDER BY l.lesson_date ASC, l.lesson_time ASC
      LIMIT 5
    `;

    // 3. Total active students
    const [studentCount] = await sql`
      SELECT COUNT(*) as count FROM students WHERE instructor_id = ${userId}
    `;

    // 4. Unpaid invoices stats
    const [unpaidStats] = await sql`
      SELECT 
        COUNT(*) as count, 
        SUM(total_amount) as total 
      FROM invoices 
      WHERE instructor_id = ${userId} AND status = 'Unpaid'
    `;

    return Response.json({
      todayLessons,
      upcomingLessons,
      totalStudents: parseInt(studentCount.count),
      unpaidInvoices: {
        count: parseInt(unpaidStats.count || 0),
        amount: parseFloat(unpaidStats.total || 0),
      },
    });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 },
    );
  }
}
