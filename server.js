const express = require("express");
const path = require("path");
const fs = require("fs");
const compression = require("compression");

const app = express();
const PORT = process.env.PORT || 3000;

// ===== VIEW ENGINE =====
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ===== COMPRESSION =====
app.use(compression());

// ===== STATIC FILES (public/assets, public/css, public/js) dengan CACHE =====
// NOTE: sebelumnya cuma "/assets" yang di-serve, jadi /css dan /js 404.
// Sekarang seluruh folder public/ di-serve dari root ("/").
app.use(
    express.static(path.join(__dirname, "public"), {
        // Tidak ada maxAge global di sini dengan sengaja — CSS/JS harus
        // selalu fresh (biar perubahan kelihatan langsung tanpa hard-refresh).
        // Cuma gambar yang di-cache lama, lihat setHeaders di bawah.
        setHeaders: (res, filePath) => {
            if (filePath.match(/\.(jpg|jpeg|png|webp|gif|svg)$/)) {
                res.setHeader("Cache-Control", "public, max-age=604800, immutable");
            } else if (filePath.match(/\.(css|js)$/)) {
                res.setHeader("Cache-Control", "no-cache");
            }
        }
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== HELPER JSON =====
const DATA_DIR = path.join(__dirname, "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

const readJSON = (file, fallback) => {
    const filePath = path.join(DATA_DIR, file);
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
};

const writeJSON = (file, data) => {
    fs.writeFileSync(path.join(DATA_DIR, file), JSON.stringify(data, null, 2));
};

if (!fs.existsSync(path.join(DATA_DIR, "messages.json")))
    writeJSON("messages.json", []);

// ===== DATA (dibaca dari file, bukan hardcode lagi) =====
const events = readJSON("events.json", []);
const galleryData = readJSON("gallery-data.json", {});

// ===== ROUTES GALLERY =====
app.get("/gallery", (req, res) => {
    const categories = Object.keys(galleryData);
    res.render("gallery", {
        title: "Galeri",
        categories,
        galleryData
    });
});

app.get("/gallery/:category", (req, res) => {
    const category = decodeURIComponent(req.params.category);
    const data = galleryData[category];
    if (!data) return res.status(404).send("Kategori tidak ditemukan");

    if (data.type === "category") {
        return res.render("gallery-sub", {
            title: data.title,
            category: category,
            data: data
        });
    }

    if (data.type === "photos") {
        return res.render("gallery-photos", {
            title: data.title,
            category: category,
            data: data
        });
    }

    res.status(404).send("Kategori tidak ditemukan");
});

app.get("/gallery/:category/:subId", (req, res) => {
    const category = decodeURIComponent(req.params.category);
    const subId = req.params.subId;
    const data = galleryData[category];
    if (!data || data.type !== "category")
        return res.status(404).send("Kategori tidak ditemukan");

    const sub = data.subcategories.find(s => s.id === subId);
    if (!sub) return res.status(404).send("Event tidak ditemukan");

    res.render("gallery-detail", {
        title: sub.title,
        category: category,
        sub: sub
    });
});

// ===== ROUTES UTAMA =====
app.get("/", (req, res) => {
    const featuredEvents = events.slice(0, 5);
    res.render("index", { title: "Beranda", events: featuredEvents });
});

app.get("/about", (req, res) => {
    res.render("about", { title: "Tentang" });
});

app.get("/events", (req, res) => {
    let filteredEvents = [...events];
    const { search, category } = req.query;
    if (search) {
        filteredEvents = filteredEvents.filter(
            e =>
                e.title.toLowerCase().includes(search.toLowerCase()) ||
                e.description.toLowerCase().includes(search.toLowerCase())
        );
    }
    if (category) {
        filteredEvents = filteredEvents.filter(e => e.category === category);
    }
    const categories = [
        ...new Set(events.map(e => e.category).filter(Boolean))
    ];
    res.render("events", {
        title: "Event",
        events: filteredEvents,
        categories,
        search: search || "",
        category: category || ""
    });
});

app.get("/event/:id", (req, res) => {
    const event = events.find(e => e.id == req.params.id);
    if (!event) return res.status(404).send("Event tidak ditemukan");
    res.render("event/detail", { title: event.title, event });
});

app.get("/aspirasi", (req, res) => {
    res.render("aspirasi", { title: "Suara Satu Palimanan", success: false });
});

app.post("/aspirasi", (req, res) => {
    const { name, email, message } = req.body;
    if (!name || !email || !message)
        return res.status(400).send("Semua field harus diisi");
    const messages = readJSON("messages.json", []);
    messages.push({
        id: Date.now(),
        name,
        email,
        message,
        created_at: new Date().toISOString()
    });
    writeJSON("messages.json", messages);
    res.redirect("/aspirasi?success=true");
});

// ===== 404 FALLBACK =====
app.use((req, res) => {
    res.status(404).send("Halaman tidak ditemukan");
});

// ===== START =====
app.listen(PORT, () => {
    console.log(`✅ Server berjalan di http://localhost:${PORT}`);
    console.log(`📋 Total event: ${events.length}`);
});
