const express = require("express");
const path = require("path");
const fs = require("fs");
const compression = require("compression"); // <-- tambahkan

const app = express();
const PORT = process.env.PORT || 3000;

// === COMPRESSION (gzip) ===
app.use(compression());

// === STATIC FILES dengan CACHE HEADERS ===
const staticOptions = {
    maxAge: "7d", // cache selama 7 hari
    setHeaders: (res, filePath) => {
        if (
            filePath.endsWith(".jpg") ||
            filePath.endsWith(".jpeg") ||
            filePath.endsWith(".png")
        ) {
            res.setHeader("Cache-Control", "public, max-age=604800, immutable");
        }
    }
};

// Serving assets dari folder assets (di root)
app.use(
    "/assets",
    express.static(path.join(__dirname, "assets"), staticOptions)
);
// Juga dari public/assets (untuk Vercel compatibility)
app.use(
    "/assets",
    express.static(path.join(__dirname, "public", "assets"), staticOptions)
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== DATA EVENT HARDCODE =====
const events = [
    {
        id: 1,
        title: "Gema Sastra",
        slug: "gema-sastra",
        logo: "/assets/logo/gema-sastra.png",
        category: "Budaya & Literasi",
        date: "2026-02-15",
        location: "Aula Sekolah",
        description:
            "Lomba Bulan Bahasa dengan berbagai kompetisi sastra dan budaya.",
        shortDesc:
            "Bulan Bahasa — lomba menyanyi daerah, story telling, cerdas cermat kebahasaan."
    },
    {
        id: 2,
        title: "Nepal Festival",
        slug: "nepal-festival",
        logo: "/assets/logo/nepal-festival.png",
        category: "Seni & Kreativitas",
        date: "2026-03-01",
        location: "Lapangan Sekolah",
        description:
            "Festival seni dan kreativitas siswa, menampilkan bakat terbaik.",
        shortDesc:
            "Wadah kreativitas — lomba menyanyi, menari, lukis kaca, promosi produk, musikalisasi puisi."
    },
    {
        id: 3,
        title: "Porak",
        slug: "porak",
        logo: "/assets/logo/porak.png",
        category: "Olahraga & Sportivitas",
        date: "2026-03-20",
        location: "Stadion",
        description: "Pekan Olahraga dengan berbagai perlombaan atletik.",
        shortDesc: "Pekan Olahraga — futsal, lompat jauh, lompat tinggi."
    },
    {
        id: 4,
        title: "MPLS",
        slug: "mpls",
        logo: "/assets/logo/mpls.png",
        category: "Pengenalan Sekolah",
        date: "2026-07-15",
        location: "SMAN 1 Palimanan",
        description: "Masa Pengenalan Lingkungan Sekolah untuk siswa baru.",
        shortDesc:
            "Pengenalan lingkungan sekolah, budaya organisasi, dan pembentukan karakter."
    },
    {
        id: 5,
        title: "Diklat OSIS",
        slug: "diklat",
        logo: "/assets/logo/diklat.png",
        category: "Pengembangan Organisasi",
        date: "2026-08-10",
        location: "Aula Sekolah",
        description: "Pelatihan dan pengembangan kapasitas pengurus OSIS.",
        shortDesc:
            "Pelatihan kepemimpinan, manajemen organisasi, dan pengembangan diri."
    }
];

// ===== HELPER JSON =====
const DATA_DIR = path.join(__dirname, "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

const readJSON = file => {
    const filePath = path.join(DATA_DIR, file);
    if (!fs.existsSync(filePath)) return [];
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
};

const writeJSON = (file, data) => {
    fs.writeFileSync(path.join(DATA_DIR, file), JSON.stringify(data, null, 2));
};

if (!fs.existsSync(path.join(DATA_DIR, "messages.json")))
    writeJSON("messages.json", []);
if (!fs.existsSync(path.join(DATA_DIR, "gallery.json"))) {
    writeJSON("gallery.json", [
        {
            id: 1,
            title: "Momen Lomba",
            image: "https://picsum.photos/seed/gallery1/600/300"
        },
        {
            id: 2,
            title: "Kegiatan OSIS",
            image: "https://picsum.photos/seed/gallery2/600/300"
        }
    ]);
}

// ===== ROUTES =====
app.get("/", (req, res) => {
    const featuredEvents = events.slice(0, 4);
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

app.get("/gallery", (req, res) => {
    const images = readJSON("gallery.json");
    res.render("gallery", { title: "Galeri", images });
});

app.get("/aspirasi", (req, res) => {
    res.render("aspirasi", { title: "Suara Satu Palimanan", success: false });
});

app.post("/aspirasi", (req, res) => {
    const { name, email, message } = req.body;
    if (!name || !email || !message)
        return res.status(400).send("Semua field harus diisi");
    const messages = readJSON("messages.json");
    messages.push({
        id: Date.now(),
        name,
        email,
        message,
        created_at: new Date().toISOString()
    });
    writeJSON("messages.json", messages);
    res.render("aspirasi", { title: "Suara Satu Palimanan", success: true });
});

// ===== START =====
app.listen(PORT, () => {
    console.log(`✅ Server berjalan di http://localhost:${PORT}`);
    console.log(`📋 Total event: ${events.length}`);
});
