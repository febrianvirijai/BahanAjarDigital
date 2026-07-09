-- ============================================================================
-- Skema Supabase untuk Bahan Ajar Digital Elektrokoagulasi STEM-ESD
-- Jalankan seluruh skrip ini sekali di: Project Anda -> SQL Editor -> New query
-- ============================================================================

create table if not exists ecbook_students (
  nim text primary key,
  name text,
  kelas text,
  record jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists ecbook_meta (
  key text primary key,
  value jsonb not null default '{}'::jsonb
);

-- Baris default untuk gate pretest/posttest (tertutup secara default)
insert into ecbook_meta (key, value)
values ('gates', '{"pretest": false, "posttest": false}'::jsonb)
on conflict (key) do nothing;

-- Aktifkan Row Level Security
alter table ecbook_students enable row level security;
alter table ecbook_meta enable row level security;

-- Kebijakan terbuka: aplikasi ini tidak punya login server-side (identitas
-- mahasiswa/dosen hanya diverifikasi di klien), jadi anon key perlu bisa
-- baca & tulis kedua tabel ini. Cukup untuk kebutuhan kelas -- JANGAN
-- gunakan pola ini untuk data sensitif tanpa autentikasi Supabase yang
-- sesungguhnya (auth.uid()).
drop policy if exists "anon full access students" on ecbook_students;
create policy "anon full access students" on ecbook_students
  for all using (true) with check (true);

drop policy if exists "anon full access meta" on ecbook_meta;
create policy "anon full access meta" on ecbook_meta
  for all using (true) with check (true);
