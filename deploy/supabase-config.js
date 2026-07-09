// ============================================================================
// Konfigurasi Supabase untuk Bahan Ajar Digital Elektrokoagulasi STEM-ESD
// ============================================================================
// 1. Buat project baru di https://supabase.com (gratis).
// 2. Buka SQL Editor project Anda, jalankan skrip di "supabase-schema.sql"
//    (ada di folder yang sama) untuk membuat tabel & kebijakan akses.
// 3. Buka Project Settings -> API, salin "Project URL" dan "anon public key"
//    ke dua baris di bawah ini.
// 4. Deploy folder ini ke Vercel (situs statis biasa, tidak perlu server
//    tambahan -- semua panggilan database terjadi langsung dari browser).
//
// CATATAN KEAMANAN: anon key ini publik/terlihat oleh siapa pun yang membuka
// halaman. Kebijakan akses (RLS) pada skema yang disediakan mengizinkan
// baca/tulis terbuka pada tabel jawaban mahasiswa -- cukup untuk kebutuhan
// kelas, tapi JANGAN simpan data sensitif (nama asli tanpa izin, dsb.) tanpa
// mempertimbangkan hal ini.
// ============================================================================

window.ECBOOK_SUPABASE_URL = 'https://ozlrffvzfvslrqkxtkij.supabase.co/'; // <-- ganti
window.ECBOOK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96bHJmZnZ6ZnZzbHJxa3h0a2lqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1NjI5OTIsImV4cCI6MjA5OTEzODk5Mn0.xD9lVXHm5qRJxV4jz8JAcRRp_M3An_582BHcfBVlNmg'; // <-- ganti

window.EcbookCloud = (function () {
  function ready() {
    return !!(
      window.ECBOOK_SUPABASE_URL &&
      window.ECBOOK_SUPABASE_ANON_KEY &&
      window.ECBOOK_SUPABASE_URL.indexOf('YOUR-PROJECT') === -1
    );
  }
  function headers(extra) {
    return Object.assign(
      {
        apikey: window.ECBOOK_SUPABASE_ANON_KEY,
        Authorization: 'Bearer ' + window.ECBOOK_SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      extra || {}
    );
  }

  // ---- data mahasiswa (per NIM) ----
  async function pull(nim) {
    if (!ready()) return null;
    try {
      const res = await fetch(
        window.ECBOOK_SUPABASE_URL + '/rest/v1/ecbook_students?nim=eq.' + encodeURIComponent(nim) + '&select=record',
        { headers: headers() }
      );
      if (!res.ok) return null;
      const rows = await res.json();
      return rows && rows[0] ? rows[0].record : null;
    } catch (e) {
      return null;
    }
  }

  function push(nim, record, keepalive) {
    if (!ready()) return Promise.resolve(false);
    const body = JSON.stringify([
      {
        nim,
        name: record.name || null,
        kelas: record.kelas || null,
        record,
        updated_at: new Date().toISOString(),
      },
    ]);
    return fetch(window.ECBOOK_SUPABASE_URL + '/rest/v1/ecbook_students', {
      method: 'POST',
      headers: headers({ Prefer: 'resolution=merge-duplicates' }),
      body,
      keepalive: !!keepalive,
    })
      .then((r) => r.ok)
      .catch(() => false);
  }

  async function pullAll() {
    if (!ready()) return {};
    try {
      const res = await fetch(window.ECBOOK_SUPABASE_URL + '/rest/v1/ecbook_students?select=nim,record', {
        headers: headers(),
      });
      if (!res.ok) return {};
      const rows = await res.json();
      const db = {};
      (rows || []).forEach((r) => {
        db[r.nim] = r.record;
      });
      return db;
    } catch (e) {
      return {};
    }
  }

  async function deleteOne(nim) {
    if (!ready()) return false;
    try {
      const res = await fetch(
        window.ECBOOK_SUPABASE_URL + '/rest/v1/ecbook_students?nim=eq.' + encodeURIComponent(nim),
        { method: 'DELETE', headers: headers() }
      );
      return res.ok;
    } catch (e) {
      return false;
    }
  }

  async function deleteAll() {
    if (!ready()) return false;
    try {
      const res = await fetch(window.ECBOOK_SUPABASE_URL + '/rest/v1/ecbook_students?nim=not.is.null', {
        method: 'DELETE',
        headers: headers(),
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  }

  // ---- gate pretest/posttest (satu baris global) ----
  async function pullGates() {
    if (!ready()) return null;
    try {
      const res = await fetch(window.ECBOOK_SUPABASE_URL + '/rest/v1/ecbook_meta?key=eq.gates&select=value', {
        headers: headers(),
      });
      if (!res.ok) return null;
      const rows = await res.json();
      return rows && rows[0] ? rows[0].value : null;
    } catch (e) {
      return null;
    }
  }

  function pushGates(gates) {
    if (!ready()) return Promise.resolve(false);
    const body = JSON.stringify([{ key: 'gates', value: gates }]);
    return fetch(window.ECBOOK_SUPABASE_URL + '/rest/v1/ecbook_meta', {
      method: 'POST',
      headers: headers({ Prefer: 'resolution=merge-duplicates' }),
      body,
    })
      .then((r) => r.ok)
      .catch(() => false);
  }

  return { ready, pull, push, pullAll, deleteOne, deleteAll, pullGates, pushGates };
})();
