
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const Note = require("./models/Note");

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend files
app.use(express.static(path.join(__dirname, "public")));

// Create uploads folder if it does not exist
const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Configure file storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + "-" +
            file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");

        cb(null, uniqueName);
    }
});

// Accept PDF, DOC and DOCX files
const fileFilter = (req, file, cb) => {
    const allowedTypes = [".pdf", ".doc", ".docx"];
    const extension = path.extname(file.originalname).toLowerCase();

    if (allowedTypes.includes(extension)) {
        cb(null, true);
    } else {
        cb(new Error("Only PDF, DOC and DOCX files are allowed."));
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 }
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("MongoDB connected successfully!"))
    .catch((error) => console.error("MongoDB error:", error.message));

// Upload notes
app.post("/api/notes", upload.single("noteFile"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Please select a file." });
        }

        const { title, subject, description, uploadedBy } = req.body;

        if (!title || !subject || !uploadedBy) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({
                message: "Title, subject and student name are required."
            });
        }

        const note = new Note({
            title,
            subject,
            description,
            uploadedBy,
            fileName: req.file.originalname,
            filePath: req.file.filename
        });

        await note.save();

        res.status(201).json({
            message: "Note uploaded successfully!",
            note
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// View and search notes
app.get("/api/notes", async (req, res) => {
    try {
        const search = req.query.search || "";

        const notes = await Note.find({
            $or: [
                { title: { $regex: search, $options: "i" } },
                { subject: { $regex: search, $options: "i" } }
            ]
        }).sort({ uploadedAt: -1 });

        res.json(notes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Download a note
app.get("/api/notes/download/:id", async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);

        if (!note) {
            return res.status(404).json({ message: "Note not found." });
        }

        const filePath = path.join(uploadDir, note.filePath);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: "File not found." });
        }

        res.download(filePath, note.fileName);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Handle upload errors
app.use((error, req, res, next) => {
    res.status(400).json({ message: error.message });
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
