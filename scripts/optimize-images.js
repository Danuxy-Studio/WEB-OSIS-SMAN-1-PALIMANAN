/**
 * scripts/optimize-images.js
 *
 * Kompres + resize semua foto di public/assets IN-PLACE (nama file & path
 * TIDAK berubah, jadi tidak perlu ubah kode/template sama sekali).
 * Originalnya di-backup dulu ke public/assets-original-backup/ sebelum
 * ditimpa, jadi kalau hasilnya kurang puas bisa dikembalikan.
 *
 * Cara pakai:
 *   1. npm install --save-dev sharp
 *   2. node scripts/optimize-images.js
 *
 * Target resize (cukup buat kebutuhan tampil di web, tidak upscale):
 *   - logo/               -> max lebar 400px   (dipakai kecil, ~50-200px)
 *   - slider/, bg2.jpg    -> max lebar 1600px  (hero & slider full-width)
 *   - foto-event/, gallery/, foto-osis-mpk/ -> max lebar 900px (grid galeri)
 *   - lainnya             -> max lebar 1200px
 *
 * Kualitas: JPEG q=75 (mozjpeg), PNG dikompres tanpa ubah transparansi.
 */

const fs = require("fs");
const path = require("path");

let sharp;
try {
    sharp = require("sharp");
} catch (err) {
    console.error("❌ Package 'sharp' belum terinstall.");
    console.error("   Jalankan dulu: npm install --save-dev sharp");
    process.exit(1);
}

const ASSETS_DIR = path.join(__dirname, "..", "public", "assets");
const BACKUP_DIR = path.join(__dirname, "..", "public", "assets-original-backup");
const VALID_EXT = [".jpg", ".jpeg", ".png"];

function getMaxWidth(filePath) {
    const rel = path.relative(ASSETS_DIR, filePath).replace(/\\/g, "/");
    if (rel.startsWith("logo/")) return 400;
    if (rel.startsWith("slider/") || rel === "bg2.jpg") return 1600;
    if (
        rel.startsWith("foto-event/") ||
        rel.startsWith("gallery/") ||
        rel.startsWith("foto-osis-mpk/") ||
        rel.startsWith("gema-satra/")
    ) return 900;
    return 1200;
}

function walk(dir, files = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walk(full, files);
        } else if (VALID_EXT.includes(path.extname(entry.name).toLowerCase())) {
            files.push(full);
        }
    }
    return files;
}

function humanSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

async function optimizeOne(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const originalSize = fs.statSync(filePath).size;
    const maxWidth = getMaxWidth(filePath);

    // Backup original sebelum ditimpa (skip kalau sudah pernah di-backup)
    const rel = path.relative(ASSETS_DIR, filePath);
    const backupPath = path.join(BACKUP_DIR, rel);
    if (!fs.existsSync(backupPath)) {
        fs.mkdirSync(path.dirname(backupPath), { recursive: true });
        fs.copyFileSync(filePath, backupPath);
    }

    // Selalu proses ulang dari backup (bukan dari hasil kompres sebelumnya)
    // biar tidak degradasi kualitas kalau script dijalankan berkali-kali.
    const source = fs.existsSync(backupPath) ? backupPath : filePath;

    let pipeline = sharp(source).resize({
        width: maxWidth,
        withoutEnlargement: true
    });

    if (ext === ".png") {
        pipeline = pipeline.png({ quality: 80, compressionLevel: 9, palette: true });
    } else {
        pipeline = pipeline.jpeg({ quality: 75, mozjpeg: true });
    }

    const buffer = await pipeline.toBuffer();
    fs.writeFileSync(filePath, buffer);

    const newSize = buffer.length;
    return { filePath: rel, originalSize, newSize };
}

async function main() {
    if (!fs.existsSync(ASSETS_DIR)) {
        console.error("❌ Folder public/assets tidak ditemukan. Jalankan script ini dari root project.");
        process.exit(1);
    }

    const files = walk(ASSETS_DIR);
    if (files.length === 0) {
        console.log("Tidak ada file .jpg/.jpeg/.png ditemukan di public/assets.");
        return;
    }

    console.log(`Memproses ${files.length} gambar...\n`);

    let totalBefore = 0;
    let totalAfter = 0;
    const results = [];

    for (const file of files) {
        try {
            const result = await optimizeOne(file);
            totalBefore += result.originalSize;
            totalAfter += result.newSize;
            results.push(result);
            const savedPct = (
                (1 - result.newSize / result.originalSize) *
                100
            ).toFixed(0);
            console.log(
                `✓ ${result.filePath}  ${humanSize(result.originalSize)} → ${humanSize(result.newSize)}  (-${savedPct}%)`
            );
        } catch (err) {
            console.error(`✗ Gagal proses ${file}:`, err.message);
        }
    }

    console.log("\n============================================");
    console.log(`Total sebelum : ${humanSize(totalBefore)}`);
    console.log(`Total sesudah : ${humanSize(totalAfter)}`);
    console.log(`Hemat         : ${humanSize(totalBefore - totalAfter)} (${((1 - totalAfter / totalBefore) * 100).toFixed(0)}%)`);
    console.log("============================================");
    console.log(`\nBackup file asli ada di: public/assets-original-backup/`);
    console.log(`(folder ini aman dihapus kalau sudah yakin hasilnya bagus,`);
    console.log(` atau biarkan saja untuk jaga-jaga / rollback)`);
}

main();
