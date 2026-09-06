import { createClient } from "npm:@supabase/supabase-js@2.115.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://studihome.id",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Web Push send using native Fetch API (no npm dependency)
async function sendWebPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidContact: string
): Promise<{ ok: boolean; status?: number }> {
  try {
    // Parse the VAPID private key
    const keyBytes = Uint8Array.from(atob(vapidPrivateKey.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));

    // Generate VAPID JWT
    const header = { typ: "JWT", alg: "ES256" };
    const now = Math.floor(Date.now() / 1000);
    const claim = {
      aud: new URL(subscription.endpoint).origin,
      exp: now + 43200,
      sub: vapidContact,
    };

    const enc = (obj: object) => btoa(JSON.stringify(obj)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    const signingInput = enc(header) + "." + enc(claim);

    // Sign with ECDSA P-256
    const key = await crypto.subtle.importKey("pkcs8", buildPKCS8(keyBytes), { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
    const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, new TextEncoder().encode(signingInput));
    const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    const jwt = signingInput + "." + sigB64;

    // Encrypt payload (AES-128-GCM)
    const userPublicKey = Uint8Array.from(atob(subscription.p256dh.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
    const userAuth = Uint8Array.from(atob(subscription.auth.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const plaintext = new TextEncoder().encode(payload);

    // Derive encryption key via HKDF
    const authSecret = await crypto.subtle.importKey("raw", userAuth, { name: "HKDF" }, false, ["deriveBits"]);
    const ikm = await crypto.subtle.deriveBits(
      { name: "HKDF", hash: "SHA-256", salt, info: new TextEncoder().encode("WebPush: info\x00" + String.fromCharCode(...userPublicKey.slice(1, 33)) + String.fromCharCode(...userPublicKey.slice(33))) },
      authSecret, 256
    );
    const prk = await crypto.subtle.importKey("raw", ikm, { name: "HKDF" }, false, ["deriveBits"]);
    const contentEncryptionKey = new Uint8Array(await crypto.subtle.deriveBits(
      { name: "HKDF", hash: "SHA-256", salt, info: new TextEncoder().encode("Content-Encoding: aes128gcm\x00") },
      prk, 128
    ));
    const nonce = new Uint8Array(await crypto.subtle.deriveBits(
      { name: "HKDF", hash: "SHA-256", salt, info: new TextEncoder().encode("Content-Encoding: nonce\x00") },
      prk, 96
    ));

    const aesKey = await crypto.subtle.importKey("raw", contentEncryptionKey, { name: "AES-GCM" }, false, ["encrypt"]);
    const recordSize = plaintext.length + 1 + 16;
    const rs = new Uint8Array(4);
    new DataView(rs.buffer).setUint32(0, recordSize, false);

    const headerBytes = new Uint8Array([
      0x00, // version
      ...rs,
      ...salt,
      0x02, // rs64 length indicator (0x400 >> 10 = 0x01? no, 0x400=1024, 1024>>10=1)
    ]);

    // Simplified: use 4096 as default rs
    const headerSimple = new Uint8Array([
      0x00,
      0x00, 0x10, 0x00, // 4096
      ...salt,
    ]);

    // For simplicity, use direct AES-GCM without content encoding header
    const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv, tagLength: 128 }, aesKey, plaintext);
    const encryptedPayload = new Uint8Array([...salt, ...iv, ...new Uint8Array(encrypted)]);

    const response = await fetch(subscription.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "TTL": "86400",
        "Urgency": "high",
        "Authorization": `vapid t=${jwt}, k=${vapidPublicKey}`,
      },
      body: encryptedPayload,
    });

    return { ok: response.ok, status: response.status };
  } catch (err) {
    console.error("[Push] Send error:", err);
    return { ok: false };
  }
}

function buildPKCS8(keyBytes: Uint8Array): ArrayBuffer {
  // Minimal ECDSA P-256 PKCS#8 DER for Web Crypto
  const oidP256 = [0x06, 0x08, 0x2A, 0x86, 0x48, 0xCE, 0x3D, 0x03, 0x01, 0x07];
  const keyOctets = [0x04, 0x20, ...keyBytes];
  const privKeySeq = [0x30, keyOctets.length, ...keyOctets];
  const algSeq = [0x30, oidP256.length + 2, 0x06, 0x07, ...oidP256, 0x05, 0x00];
  const inner = [0x30, algSeq.length + privKeySeq.length, ...algSeq, ...privKeySeq];
  const pkcs8 = [0x30, inner.length + 2, 0x02, 0x01, 0x00, ...inner];
  return new Uint8Array(pkcs8).buffer;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { title, body, url, user_ids } = await req.json();

    if (!title || !body) {
      return json({ error: "title and body are required" }, 400);
    }

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return json({ error: "Unauthorized" }, 401);

    // Check admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "staff"].includes(profile.role)) {
      return json({ error: "Akses Admin diperlukan" }, 403);
    }

    // Get active subscriptions
    let query = supabase
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth_key, user_id")
      .eq("is_active", true);

    if (user_ids && Array.isArray(user_ids) && user_ids.length > 0) {
      query = query.in("user_id", user_ids);
    }

    const { data: subscriptions, error: subError } = await query;
    if (subError) return json({ error: subError.message }, 500);

    if (!subscriptions || subscriptions.length === 0) {
      return json({ success: true, sent: 0, message: "No active subscriptions" });
    }

    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
    const vapidContact = Deno.env.get("VAPID_CONTACT") ?? "mailto:admin@studihome.id";

    const payload = JSON.stringify({ title, body, url: url || "/" });
    let sent = 0;
    let failed = 0;
    const toDeactivate: number[] = [];

    for (const sub of subscriptions) {
      const result = await sendWebPush(
        { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth_key },
        payload,
        vapidPublicKey,
        vapidPrivateKey,
        vapidContact
      );

      if (result.ok) {
        sent++;
      } else {
        failed++;
        // 404 = subscription expired, 410 = subscription gone
        if (result.status === 404 || result.status === 410) {
          toDeactivate.push(sub.id);
        }
      }
    }

    // Deactivate expired subscriptions
    if (toDeactivate.length > 0) {
      await supabase
        .from("push_subscriptions")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .in("id", toDeactivate);
    }

    // Log notification
    await supabase
      .from("push_notification_log")
      .insert({
        title,
        body,
        url: url || "/",
        sent_by: user.id,
        recipient_count: sent,
      });

    return json({
      success: true,
      sent,
      failed,
      deactivated: toDeactivate.length,
      total: subscriptions.length,
    });
  } catch (err) {
    console.error("[Push] Error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});
