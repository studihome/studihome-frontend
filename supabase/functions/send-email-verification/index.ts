import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://studihome.id",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);

  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value)
  );

  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json(
      {
        success: false,
        message: "Metode permintaan tidak didukung.",
      },
      405
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const publishableKey =
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ||
      Deno.env.get("SUPABASE_ANON_KEY");

    const secretKeysRaw = Deno.env.get("SUPABASE_SECRET_KEYS");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!supabaseUrl) {
      throw new Error("Konfigurasi SUPABASE_URL tidak tersedia.");
    }

    if (!publishableKey) {
      throw new Error(
        "Kunci publik Supabase tidak tersedia."
      );
    }

    if (!secretKeysRaw) {
      throw new Error(
        "Konfigurasi secret Supabase tidak tersedia."
      );
    }

    if (!resendApiKey) {
      throw new Error(
        "RESEND_API_KEY belum dikonfigurasi."
      );
    }

    let secretKeys: Record<string, string>;

    try {
      secretKeys = JSON.parse(secretKeysRaw);
    } catch {
      throw new Error(
        "Konfigurasi SUPABASE_SECRET_KEYS tidak valid."
      );
    }

    const serviceKey =
      secretKeys.default ||
      secretKeys.service_role ||
      "";

    if (!serviceKey) {
      throw new Error(
        "Secret key default Supabase tidak ditemukan."
      );
    }

    const authHeader = req.headers.get("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return json(
        {
          success: false,
          message: "Sesi login tidak ditemukan.",
        },
        401
      );
    }

    // Client pengguna untuk membaca session.
    const userClient = createClient(
      supabaseUrl,
      publishableKey,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return json(
        {
          success: false,
          message: "Sesi login tidak valid atau sudah berakhir.",
        },
        401
      );
    }

    if (!user.email) {
      return json(
        {
          success: false,
          message: "Akun ini belum memiliki alamat email.",
        },
        400
      );
    }

    // Client server dengan secret key.
    const adminClient = createClient(
      supabaseUrl,
      serviceKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    // Ambil profil.
    const { data: profile, error: profileError } =
      await adminClient
        .from("profiles")
        .select("id,name,email,email_verified,status")
        .eq("id", user.id)
        .single();

    if (profileError) {
      throw profileError;
    }

    if (
      profile?.status &&
      String(profile.status).toLowerCase() === "blocked"
    ) {
      return json(
        {
          success: false,
          message: "Akun Anda sedang diblokir.",
        },
        403
      );
    }

    if (profile?.email_verified === true) {
      return json({
        success: true,
        alreadyVerified: true,
        message: "Email Anda sudah terverifikasi.",
      });
    }

    // Batasi pengiriman ulang untuk mengurangi spam dan biaya email.
    const { data: latestToken, error: latestTokenError } =
      await adminClient
        .from("email_verification_tokens")
        .select("created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (latestTokenError) {
      throw latestTokenError;
    }

    const lastIssuedAt = latestToken?.created_at
      ? Date.parse(latestToken.created_at)
      : 0;

    if (
      Number.isFinite(lastIssuedAt) &&
      lastIssuedAt > 0 &&
      Date.now() - lastIssuedAt < 60 * 1000
    ) {
      return json(
        {
          success: false,
          message: "Tunggu sebentar sebelum mengirim ulang email verifikasi.",
        },
        429
      );
    }

    // Token baru.
    const token = generateToken();
    const tokenHash = await sha256Hex(token);

    // Bersihkan token lama yang belum digunakan.
    const { error: deleteError } =
      await adminClient
        .from("email_verification_tokens")
        .delete()
        .eq("user_id", user.id)
        .is("used_at", null);

    if (deleteError) {
      throw deleteError;
    }

    // Token berlaku 30 menit.
    const expiresAt = new Date(
      Date.now() + 30 * 60 * 1000
    ).toISOString();

    const { error: insertError } =
      await adminClient
        .from("email_verification_tokens")
        .insert({
          user_id: user.id,
          token_hash: tokenHash,
          expires_at: expiresAt,
        });

    if (insertError) {
      throw insertError;
    }

    const verifyUrl =
      `https://studihome.id/?verify_email=${encodeURIComponent(
        token
      )}`;

    const safeName = escapeHtml(
      String(profile?.name || user.email)
    );

    const html = `
<!doctype html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Verifikasi Email Studihome</title>
</head>
<body style="margin:0;padding:0;background:#eef4ff;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">

  <div style="width:100%;padding:32px 16px;box-sizing:border-box;">

    <div style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 18px 45px rgba(21,28,117,.12);border:1px solid #dbe6f5;">

      <div style="background:linear-gradient(135deg,#151c75 0%,#3f48bf 100%);padding:34px 24px;text-align:center;">

        <div style="font-size:42px;line-height:1;color:#facc15;font-weight:900;">
          ✦
        </div>

        <div style="margin-top:8px;font-size:28px;line-height:1.2;color:#ffffff;font-weight:900;">
          Studihome
        </div>

        <div style="margin-top:10px;font-size:13px;line-height:1.6;color:#dbeafe;">
          Platform Pembelajaran Digital, Otomasi & Agency AI
        </div>

      </div>

      <div style="padding:32px 28px;">

        <div style="display:inline-block;background:#eef4ff;color:#151c75;border:1px solid #d7e4ff;border-radius:999px;padding:7px 13px;font-size:11px;font-weight:800;letter-spacing:.5px;">
          VERIFIKASI EMAIL
        </div>

        <h1 style="margin:20px 0 12px;font-size:24px;line-height:1.35;color:#151c75;font-weight:900;">
          Tinggal satu langkah lagi 👋
        </h1>

        <p style="margin:0 0 14px;font-size:14px;line-height:1.75;color:#334155;">
          Halo <strong>${safeName}</strong>,
        </p>

        <p style="margin:0 0 18px;font-size:14px;line-height:1.75;color:#475569;">
          Akun Studihome Anda sudah aktif.
          Yuk, verifikasi email agar status Anda menjadi
          <strong style="color:#151c75;">Member Terverifikasi</strong>.
        </p>

        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;padding:18px;margin:22px 0;">

          <div style="font-size:13px;font-weight:800;color:#151c75;margin-bottom:7px;">
            Kenapa perlu diverifikasi?
          </div>

          <div style="font-size:13px;line-height:1.7;color:#64748b;">
            Verifikasi membantu memastikan alamat email Anda benar
            dan memudahkan Studihome mengirim informasi penting
            terkait akun dan layanan Anda.
          </div>

        </div>

        <div style="text-align:center;margin:30px 0 24px;">

          <a
            href="${verifyUrl}"
            style="display:inline-block;background:linear-gradient(135deg,#eab308 0%,#f59e0b 100%);color:#111827;text-decoration:none;padding:14px 26px;border-radius:14px;font-size:14px;font-weight:900;box-shadow:0 8px 18px rgba(234,179,8,.25);"
          >
            ✓ &nbsp; Verifikasi Email
          </a>

        </div>

        <p style="margin:0 0 10px;font-size:12px;line-height:1.7;color:#64748b;text-align:center;">
          Tautan verifikasi berlaku selama <strong>30 menit</strong>.
        </p>

        <p style="margin:0;font-size:11px;line-height:1.7;color:#94a3b8;text-align:center;">
          Setelah selesai, Anda akan kembali ke Studihome.
        </p>

        <div style="height:1px;background:#e2e8f0;margin:26px 0 20px;"></div>

        <div style="text-align:center;">

          <div style="font-size:12px;font-weight:800;color:#151c75;">
            Studihome
          </div>

          <div style="margin-top:5px;font-size:11px;color:#94a3b8;">
            Kerja cerdas, hasil tuntas.
          </div>

          <div style="margin-top:12px;font-size:10px;color:#cbd5e1;">
            © 2026 Studihome. Semua hak dilindungi.
          </div>

        </div>

      </div>

    </div>

    <div style="max-width:620px;margin:14px auto 0;text-align:center;font-size:10px;line-height:1.6;color:#94a3b8;">
      Email ini dikirim otomatis oleh sistem Studihome.
    </div>

  </div>

</body>
</html>
`;

    const resendResponse = await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
        body: JSON.stringify({
          from: "Studihome <noreply@studihome.id>",
          to: [user.email],
          subject: "Verifikasi Email Anda — Studihome",
          html,
        }),
      }
    );

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      throw new Error(
        resendData?.message ||
          "Email verifikasi gagal dikirim."
      );
    }

    return json({
      success: true,
      alreadyVerified: false,
      message:
        "Email verifikasi berhasil dikirim.",
    });
  } catch (error) {
    console.error(
      "send-email-verification error:",
      error
    );

    return json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan saat mengirim email verifikasi.",
      },
      500
    );
  }
});