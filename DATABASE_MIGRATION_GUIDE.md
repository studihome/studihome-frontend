# 🔐 DATABASE MIGRATION GUIDE — STUDIHOME

**Tanggal:** 22 Agustus 2026
**Status:** ✅ SEMUA MIGRASI SELESAI
**Supabase Project:** `studihome` (`hbfmhwwxbgidsnljupca`)

---

## 📊 RINGKASAN STATUS

| # | Migrasi | Prioritas | Status |
|---|---|---|---|
| 1 | Revoke `is_admin()` dari anon | 🔴 P0 | ✅ SELESAI |
| 2 | Revoke functions lainnya dari anon | 🔴 P0 | ✅ SELESAI |
| 3 | RLS `site_settings` | 🟡 P1 | ✅ SELESAI |
| 4 | RLS `products`, `testimonials`, `ai_links`, `modules` | 🟡 P1 | ✅ SELESAI |
| 5 | RLS `profiles` (role/status) | 🟡 P1 | ✅ SELESAI |
| 6 | Storage bucket `creator-media` | 🟡 P1 | ✅ SELESAI |
| 7 | Leaked-password protection | 🟡 P1 | ✅ SELESAI (Dashboard) |
| 8 | `search_path` hardening | 🟢 P2 | ✅ SELESAI |
| 9 | `email_verification_tokens` | 🔴 P0 | ✅ SELESAI |

---

## 📋 SEMUA FUNCTION DI DATABASE

Daftar lengkap SECURITY DEFINER functions (dari database aktual):

| Function | Parameters | `search_path` |
|---|---|---|
| `admin_add_creator_external_rating` | `p_creator_id uuid, p_reviewer_name text, p_rating integer, p_review text, p_source_label text` | ✅ `""` |
| `admin_add_creator_like_adjustment` | `p_creator_id uuid, p_delta_count integer, p_reason text` | ✅ `""` |
| `admin_delete_creator_like` | `p_like_id uuid` | ✅ `""` |
| `admin_reject_order` | `p_order_id uuid` | ✅ `""` |
| `admin_review_creator` | `p_creator_id uuid, p_decision text, p_note text` | ✅ `""` |
| `admin_set_creator_portfolio_active` | `p_portfolio_id uuid, p_active boolean` | ✅ `""` |
| `admin_set_creator_rating_visibility` | `p_rating_id uuid, p_visible boolean` | ✅ `""` |
| `admin_set_creator_verified` | `p_creator_id uuid, p_verified boolean` | ✅ `""` |
| `admin_verify_order` | `p_order_id uuid` | ✅ `""` |
| `can_publish_creator` | `p_creator_id uuid` | ✅ `""` |
| `change_creator_username_for_profile` | `p_creator_id uuid, p_username text` | ✅ `""` |
| `change_creator_username_once` | `p_username text` | ✅ `""` |
| `claim_free_product` | `p_product_id uuid` | ✅ `""` |
| `consume_email_verification_token` | `p_token text` | ✅ `""` |
| `create_order` | `p_product_id uuid, p_name text, p_phone text` | ✅ `""` |
| `enforce_creator_profile_rules` | — | ✅ `""` |
| `enforce_creator_review_rules` | — | ✅ `""` |
| `ensure_creator_draft` | — | ✅ `""` |
| `get_creator_like_count` | `p_creator_id uuid` | ✅ `""` |
| `get_creator_trust_metrics` | `p_creator_id uuid` | ✅ `""` |
| `get_public_creator_trust_summary` | — | ✅ `""` |
| `get_smart_demand_summary` | `p_days integer` | ✅ `""` |
| `handle_new_user` | — | ✅ `""` |
| `has_creator_workspace_access` | — | ✅ `""` (fixed) |
| `has_premium_creator_access` | — | ✅ `""` (fixed) |
| `is_admin` | — | ✅ `""` |
| `is_creator_eligible` | — | ✅ `""` |
| `record_smart_demand` | `p_intent_key text, p_category_key text, p_session_key uuid` | ✅ `""` |
| `rls_auto_enable` | — | ✅ `pg_catalog` (intentional) |
| `submit_creator_for_review` | — | ✅ `""` |
| `submit_payment_confirmation` | `p_order_id uuid` | ✅ `""` |

---

## 🔧 ROLLBACK REFERENCE

Jika ada masalah setelah migrasi, gunakan rollback di bawah sesuai migrasi:

### Rollback Migrasi 1 & 2 (login gagal)
```sql
GRANT EXECUTE ON FUNCTION public.is_admin() TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_creator_workspace_access() TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_premium_creator_access() TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_creator_eligible() TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_publish_creator(p_creator_id uuid) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_creator_username(p_username text) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.change_creator_username_once(p_username text) TO PUBLIC;
```

### Rollback Migrasi 5 (Dapur save gagal)
```sql
DROP POLICY IF EXISTS "user_bisa_update_profil_sendiri" ON profiles;
DROP POLICY IF EXISTS "hanya_admin_bisa_ubah_role_status" ON profiles;
```

### Rollback Migrasi 6 (upload foto gagal)
```sql
DROP POLICY IF EXISTS "hanya_owner_bisa_upload_avatar" ON storage.objects;
DROP POLICY IF EXISTS "semua_orang_bisa_baca_avatar" ON storage.objects;
DROP POLICY IF EXISTS "hanya_owner_bisa_hapus_avatar" ON storage.objects;
```

### Rollback Migrasi 8 (search_path)
```sql
ALTER FUNCTION public.has_creator_workspace_access() RESET search_path;
ALTER FUNCTION public.has_premium_creator_access() RESET search_path;
```

---

## ✅ CHECKLIST VERIFIKASI SETELAH MIGRASI

| # | Cek | Status |
|---|---|---|
| 1 | Anonymous TIDAK bisa execute `is_admin()` | ☑️ |
| 2 | Anonymous TIDAK bisa execute functions lainnya | ☑️ |
| 3 | Hanya admin yang bisa ubah `site_settings` | ☑️ |
| 4 | Hanya admin yang bisa ubah `products`, `testimonials`, `ai_links`, `modules` | ☑️ |
| 5 | User TIDAK bisa ubah role/status sendiri | ☑️ |
| 6 | User TIDAK bisa upload avatar ke folder orang lain | ☑️ |
| 7 | Password bocor ditolak saat registrasi | ☑️ |
| 8 | `email_verification_tokens` bisa diakses service_role | ☑️ |
| 9 | Semua function punya `search_path=""` | ☑️ |
| 10 | Semua fitur utama masih berfungsi | ☑️ |

---

## 📝 CATATAN

1. **Migrasi dilakukan pada:** 22 Agustus 2026
2. **Dilakukan via:** Supabase SQL Editor
3. **Tidak ada data yang hilang** — semua migrasi bersifat keamanan
4. **Semua function sudah verified** — tidak ada yang perlu diubah lagi
5. **PR #27** sudah merge ke main — frontend fixes sudah deploy

---

**Dokumen ini dibuat oleh Codebuff pada 22 Agustus 2026**
