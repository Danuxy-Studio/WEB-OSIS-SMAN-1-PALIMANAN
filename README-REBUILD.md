# Rebuild Notes — OSIS SMAN 1 Palimanan

Rebuild ini **tetap pakai Express + EJS** (bukan migrasi ke Next.js/Astro),
fokus ke: struktur modular, design token warna (PRD 6.1), data dipisah dari
kode, dan hilangkan semua duplikasi script/CSS. Asset gambar tidak diubah
(masih JPG/PNG apa adanya, sesuai kesepakatan).

## Cara pasang ke repo `WEB-SEKOLAH` kamu

Timpa (replace) file-file berikut di repo asli sesuai path masing-masing:

| File di sini | Taruh di repo kamu |
|---|---|
| `server.js` | `server.js` |
| `data/events.json` | `data/events.json` |
| `data/gallery-data.json` | `data/gallery-data.json` (**file baru**) |
| `public/css/style.css` | `public/css/style.css` |
| `public/js/main.js` | `public/js/main.js` |
| `views/partials/header.ejs` | `views/partials/header.ejs` |
| `views/partials/footer.ejs` | `views/partials/footer.ejs` |
| `views/partials/event-slider.ejs` | `views/partials/event-slider.ejs` (**file baru**) |
| `views/index.ejs` | `views/index.ejs` |
| `views/about.ejs` | `views/about.ejs` |
| `views/aspirasi.ejs` | `views/aspirasi.ejs` |
| `views/events.ejs` | `views/events.ejs` |
| `views/gallery.ejs` | `views/gallery.ejs` |
| `views/gallery-sub.ejs` | `views/gallery-sub.ejs` |
| `views/gallery-photos.ejs` | `views/gallery-photos.ejs` |
| `views/gallery-detail.ejs` | `views/gallery-detail.ejs` |
| `views/event/detail.ejs` | `views/event/detail.ejs` |
| `views/event/gema-sastra.ejs` | `views/event/gema-sastra.ejs` |
| `views/event/nepal-festival.ejs` | `views/event/nepal-festival.ejs` |
| `views/event/porak.ejs` | `views/event/porak.ejs` |
| `views/event/mpls.ejs` | `views/event/mpls.ejs` |
| `views/event/diklat.ejs` | `views/event/diklat.ejs` |

### 🧹 Wajib dihapus dari repo kamu (file mubazir/duplikat)
- `index.html` di root — tidak dipakai Express (Express render via EJS), ini vestige.
- `views/galery/` (folder typo, isinya `index.ejs` duplikat dari `gallery.ejs`) — tidak direferensikan route manapun di `server.js`.
- `data/gallery.json` — ini hasil auto-seed lama berisi struktur `{id,title,image}` yang **tidak pernah dipakai** oleh route manapun (dead code). Sudah dihapus dari `server.js`; kalau file fisiknya masih ada, boleh dihapus manual juga (aman, tidak dibaca lagi).

```bash
rm -rf views/galery
rm -f index.html
rm -f data/gallery.json   # opsional, sudah tidak dibaca server.js
```

Lalu jalankan seperti biasa:
```bash
npm install
npm start
```

## Ringkasan perubahan

### 1. Struktur & data
- `events` (5 event) dan `galleryData` (kategori galeri) yang sebelumnya **hardcode di `server.js`** sekarang dipindah ke `data/events.json` dan `data/gallery-data.json`. Server tinggal `readJSON(...)`.
- `server.js` sekarang serve **seluruh folder `public/`** (`/assets`, `/css`, `/js`) — sebelumnya cuma `/assets` yang di-mount, jadi `public/css/style.css` dan `public/js/main.js` sebenarnya **404** kalau dipakai sebelumnya.

### 2. Design token warna (PRD 6.1)
Semua warna sekarang lewat CSS variable di `public/css/style.css`:
```css
:root { --bg-primary, --bg-secondary, --bg-card, --text-primary, --text-secondary,
         --border-color, --brand-blue, --brand-blue-hover, --brand-blue-light, ... }
body.dark-mode { /* override token yang sama dengan warna dark mode */ }
```
Konsisten dipakai di semua halaman (sebelumnya beberapa halaman punya warna hardcode inline yang nggak berubah pas dark mode, misal form pencarian di `/events`).

### 3. Auto Dark Mode (US-01 di PRD)
- Sebelumnya: default selalu **Light**, baru berubah kalau user klik toggle manual.
- Sekarang: script kecil di paling atas `<body>` (blocking, anti-FOUC) cek `localStorage` dulu; kalau belum ada preferensi tersimpan, ikuti `prefers-color-scheme` dari HP/OS otomatis.

### 4. Hilangkan duplikasi (modular)
- **6 blok `<script>` slider** yang identik (home + 5 halaman event) → **1 fungsi generik** `initSliders()` di `public/js/main.js`, dipicu lewat atribut `data-slider`.
- **2 blok script lightbox** (gallery-detail & gallery-photos) → 1 fungsi `initLightbox()`.
- 5 file event (`gema-sastra.ejs`, dst) sekarang pakai partial `views/partials/event-slider.ejs` untuk galeri fotonya, bukan copy-paste markup+script ratusan baris per file.
- `<style>` inline raksasa (~700 baris) di `header.ejs` dipindah ke `public/css/style.css` — file EJS sekarang cuma markup.

### 5. Bug yang ketemu & diperbaiki
- **Alert sukses aspirasi tidak pernah muncul.** `POST /aspirasi` sebelumnya `res.render(...)` tanpa mengubah URL, padahal script cek `?success=true` dari URL. Diperbaiki jadi `res.redirect("/aspirasi?success=true")`.
- **`aspirasi.ejs`** punya tag `</form>` tanpa `<form>` pembuka (HTML tidak valid). Sudah dihapus.
- **`porak.ejs`** salah taruh `</div>` penutup `.event-detail-full` — bagian "Galeri Foto" jadi ada di luar card, beda sendiri dari 4 halaman event lain. Sudah disamakan strukturnya.
- Homepage sebelumnya cuma menampilkan **4** event (`events.slice(0, 4)`) padahal card yang di-hardcode ada **5** dan PRD juga bilang 5 Event Unggulan. Diperbaiki jadi `.slice(0, 5)`, dan card-nya sekarang di-generate dari data (bukan hardcode 5× blok HTML yang identik).

### 6. Efek fade hero (sudah disepakati sebelumnya)
Gradient overlay hero diperhalus jadi 6 color-stop dan dipastikan menyatu penuh ke `--bg-primary` di titik akhir, baik light maupun dark mode.

## Belum termasuk (sesuai kesepakatan)
- Migrasi ke Next.js/Astro/TypeScript — stack tetap Express + EJS.

## 🖼️ Optimasi Foto (biar situs lebih ringan)

Total foto ~100MB itu penyebab utama situs terasa berat. Sudah disiapkan
`scripts/optimize-images.js` yang kompres + resize semua foto di
`public/assets/` **in-place** — nama file & path tetap sama persis, jadi
**tidak perlu ubah kode/template apapun**, cukup jalankan sekali:

```bash
npm install --save-dev sharp
node scripts/optimize-images.js
```

Yang dilakukan script:
- Resize foto sesuai kebutuhan tampil (logo max 400px, hero/slider max 1600px,
  foto galeri grid max 900px) — foto kamera HP biasanya 3000-4000px lebar,
  padahal tampil di web cuma butuh beberapa ratus px.
- Kompres ulang (JPEG q75 mozjpeg, PNG dikompres tanpa hilangkan transparansi).
- **Originalnya di-backup otomatis** ke `public/assets-original-backup/`
  sebelum ditimpa — kalau hasilnya kurang puas, tinggal copy balik dari situ.
- Aman dijalankan berulang kali (selalu proses ulang dari backup, bukan dari
  hasil kompres sebelumnya, jadi kualitas nggak makin turun tiap kali dijalankan).

Biasanya total ukuran turun **70-90%** dari total asli tanpa keliatan bedanya
di mata (foto galeri di grid kecil nggak butuh resolusi 4000px).

Setelah dijalankan, jangan lupa hapus `data/gallery.json` yang lama (dead code)
dan test buka tiap halaman buat pastiin foto masih muncul normal.

### Lanjutan opsional: WebP
Kalau setelah ini masih mau lebih ringan lagi, langkah berikutnya adalah
convert ke `.webp` (PRD 6.2). Ini butuh update path di `data/events.json`,
`data/gallery-data.json`, dan beberapa `.ejs`/`.css` yang reference gambar
langsung — kalau mau, bilang aja nanti aku siapkan sekalian.

