-- Migration 37: harden the internal Creator publish validation trigger.
-- The function is invoked only by the BEFORE UPDATE trigger on creator_profiles.

create or replace function public.validate_creator_publish()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if new.is_published is distinct from old.is_published
     and new.is_published = true then
    if not exists (
      select 1
      from public.creator_services as service
      where service.creator_id = new.id
        and service.is_active = true
    ) then
      raise exception 'Tambahkan minimal 1 jasa aktif sebelum mempublikasikan halaman Creator.';
    end if;
  end if;

  return new;
end;
$function$;

-- This is an internal trigger function, not a Data API/RPC endpoint.
revoke all on function public.validate_creator_publish() from public;
revoke all on function public.validate_creator_publish() from anon;
revoke all on function public.validate_creator_publish() from authenticated;

