import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rows = await sql`
      SELECT * FROM instructor_settings WHERE instructor_id = ${session.user.id}
    `;

    if (rows.length === 0) {
      // Return defaults
      return Response.json({
        full_name: session.user.name || "",
        business_name: "",
        phone: "",
        email: session.user.email || "",
        abn: "",
        default_hourly_rate: 65,
        invoice_footer:
          "Thank you for choosing DriveTrack for your driving education.",
      });
    }

    return Response.json(rows[0]);
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Failed to fetch settings" },
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
    const {
      full_name,
      business_name,
      phone,
      email,
      abn,
      default_hourly_rate,
      invoice_footer,
    } = body;

    const [settings] = await sql`
      INSERT INTO instructor_settings (instructor_id, full_name, business_name, phone, email, abn, default_hourly_rate, invoice_footer, updated_at)
      VALUES (
        ${session.user.id},
        ${full_name || null},
        ${business_name || null},
        ${phone || null},
        ${email || null},
        ${abn || null},
        ${default_hourly_rate || 65},
        ${invoice_footer || "Thank you for choosing DriveTrack for your driving education."},
        NOW()
      )
      ON CONFLICT (instructor_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        business_name = EXCLUDED.business_name,
        phone = EXCLUDED.phone,
        email = EXCLUDED.email,
        abn = EXCLUDED.abn,
        default_hourly_rate = EXCLUDED.default_hourly_rate,
        invoice_footer = EXCLUDED.invoice_footer,
        updated_at = NOW()
      RETURNING *
    `;

    return Response.json(settings);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
