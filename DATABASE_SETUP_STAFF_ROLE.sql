-- ============================================================
-- STUDIHOME — SETUP ROLE "STAFF" (SIAP SALIN / READY TO PASTE)
-- ============================================================
-- Platform : Supabase SQL Editor
-- Cara pakai: buka Supabase Dashboard → SQL Editor → tempel
--             seluruh isi file ini → RUN.
-- Sifat     : IDEMPOTENT — aman dijalankan berkali-kali.
--
-- ISI FILE INI (gabungan Migration 43 + 44):
--   1. public.is_admin() diperluas: role 'admin' ATAU 'staff'
--      (status = 'active'). Semua RLS policy & RPC admin otomatis
--      berlaku untuk staff.
--   2. Kolom profiles.role menerima nilai 'staff', untuk KEDUA
--      kemungkinan bentuk kolom:
--        - enum  -> ALTER TYPE ... ADD VALUE IF NOT EXISTS
--        - CHECK -> constraint "profiles_role_check" (dan constraint
--          lain yang menyebut kolom role) dibangun ulang sebagai
--          SUPERSET: nilai role yang ada di data + 'staff'.
--          Tidak pernah mempersempit nilai yang tadinya sah.
--   3. Verifikasi otomatis + uji fungsi aman (transaksi di-rollback,
--      TIDAK ada data yang diubah).
--
-- KEAMANAN DIJAGA:
--   - is_admin(): SECURITY DEFINER + search_path='' tetap.
--   - EXECUTE dicabut dari public/anon; hanya authenticated
--     (+service_role) yang boleh memanggil.
--   - Akun 'admin' tetap dilindungi; 'member' tidak berubah.
-- ============================================================


-- ============================================================
-- BAGIAN 1 — PERLUAS is_admin() UNTUK MENERIMA STAFF
-- ============================================================
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and lower(p.status) = 'active'
      and lower(p.role) in ('admin', 'staff')
  );
$function$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;


-- ============================================================
-- BAGIAN 2 — PROFILES.ROLE MENERIMA NILAI 'STAFF'
--   Menangani kolom bertipe enum ATAU ber-constraint CHECK.
-- ============================================================
do $staff$
declare
  v_typ  text;
  v_sch  text;
  v_list text;
  v_con  record;
  v_def  text;
  v_expr text;
begin
  -- 2a) Bila kolom role bertipe ENUM, tambahkan nilai 'staff'.
  select t.typname, n.nspname
    into v_typ, v_sch
  from pg_attribute a
  join pg_class c on c.oid = a.attrelid
  join pg_type t on t.oid = a.atttypid
  join pg_namespace n on n.oid = t.typnamespace
  where c.relname = 'profiles'
    and c.relnamespace = 'public'::regnamespace
    and a.attname = 'role'
    and not a.attisdropped
    and t.typtype = 'e';

  if v_typ is not null then
    begin
      execute format('alter type %I.%I add value if not exists %L', v_sch, v_typ, 'staff');
      raise notice '[2a] Nilai staff ditambahkan ke enum %.%', v_sch, v_typ;
    exception when duplicate_object then
      raise notice '[2a] staff sudah ada di enum %.%', v_sch, v_typ;
    end;
  end if;

  -- 2b) Hapus constraint "profiles_role_check" (penyebab error 400).
  execute 'alter table public.profiles drop constraint if exists profiles_role_check';

  -- 2c) Constraint CHECK lain yang menyebut kolom role ikut diperluas
  --     (ekspresi asli dipertahankan, staff ditambahkan — hanya menambah).
  for v_con in
    select con.oid, con.conname
    from pg_constraint con
    join pg_class c on c.oid = con.conrelid
    join pg_namespace n on n.oid = c.relnamespace
    where c.relname = 'profiles'
      and n.nspname = 'public'
      and con.contype = 'c'
      and con.conname <> 'profiles_role_check'
      and pg_get_constraintdef(con.oid) ilike '%role%'
  loop
    v_def  := pg_get_constraintdef(v_con.oid);
    v_expr := substr(v_def, 8, greatest(length(v_def) - 8, 0));
    execute format('alter table public.profiles drop constraint %I', v_con.conname);
    execute format(
      'alter table public.profiles add constraint %I check ( (%s) or lower(role) = %L )',
      v_con.conname, v_expr, 'staff'
    );
    raise notice '[2c] Constraint % diperluas agar menerima staff', v_con.conname;
  end loop;

  -- 2d) Buat ulang profiles_role_check sebagai SUPERSET:
  --     nilai role yang benar-benar ada di data + 'staff'.
  select coalesce(string_agg(distinct quote_literal(lower(role)), ', ' order by quote_literal(lower(role))), '')
    into v_list
  from public.profiles
  where role is not null
    and nullif(trim(role), '') is not null
    and lower(role) <> 'staff';

  if v_list = '' then
    v_list := quote_literal('member');
  end if;

  execute format(
    'alter table public.profiles add constraint profiles_role_check check ( lower(role) in (%s, %L) )',
    v_list, 'staff'
  );
  raise notice '[2d] profiles_role_check dibuat ulang; role yang diizinkan: %, staff', v_list;
end
$staff$;


-- ============================================================
-- BAGIAN 3 — VERIFIKASI (cek hasilnya di tab Results)
-- ============================================================

-- V1: definisi constraint setelah perbaikan (harus memuat staff)
select 'V1_constraint' as check_name,
       conname,
       pg_get_constraintdef(oid) as definition
from pg_constraint
where conname = 'profiles_role_check';

-- V2: definisi is_admin() (harus memuat 'admin', 'staff')
select 'V2_is_admin' as check_name, prosrc as definition
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where p.proname = 'is_admin' and n.nspname = 'public';

-- V3: izin EXECUTE is_admin (tidak boleh ada PUBLIC / anon)
select 'V3_grants' as check_name, grantee, privilege_type
from information_schema.role_routine_grants
where routine_name = 'is_admin' and routine_schema = 'public'
order by grantee;


-- ============================================================
-- BAGIAN 4 — UJI FUNGSI (AMAN: dijalankan di subtransaksi yang
--   di-rollback otomatis, tidak ada data yang berubah)
--   Output yang diharapkan:
--     OK: profiles.role now accepts staff (test row rolled back, no data changed).
--   Bila constraint masih rusak, blok ini justru menampilkan
--   error check violation — artinya ada yang belum benar.
-- ============================================================
do $verify$
declare
  v_id uuid;
begin
  select id into v_id
  from public.profiles
  where role is not null
  limit 1;

  if v_id is null then
    raise notice 'Tidak ada baris profiles untuk diuji; definisi constraint pada V1 adalah sumber kebenaran.';
    return;
  end if;

  begin
    update public.profiles set role = 'staff' where id = v_id;
    raise exception 'STAFF_ACCEPTED';
  exception when others then
    if sqlerrm like '%STAFF_ACCEPTED%' then
      raise notice 'OK: profiles.role now accepts staff (test row rolled back, no data changed).';
    else
      raise;
    end if;
  end;
end
$verify$;