const express = require('express');
const cors = require('cors');
const path = require('path');
const uploadRouter = require('./upload.cjs');
const storage = require('./storage.cjs');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/upload', uploadRouter);

app.get('/api/quincenas', async (req, res) => {
    res.json(await storage.getAllQuincenas());
});

app.post('/api/quincenas', async (req, res) => {
    try {
        const saved = await storage.saveQuincena(req.body);
        res.json({ success: true, quincena: saved });
    } catch(err) {
        res.status(500).json({ error: "Failed to save quincena" });
    }
});

app.delete('/api/quincenas/:id', async (req, res) => {
    try {
        await storage.deleteQuincena(req.params.id);
        res.json({ success: true });
    } catch(err) {
        res.status(500).json({ error: "Failed to delete" });
    }
});

// Statics for Production Vue App
app.use(express.static(path.join(__dirname, 'dist')));

// Fallback logic for Vue Router (if implemented later) or single page app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, async () => {
    await storage.initDB();
    console.log(`Backend server running on http://localhost:${PORT}`);
});
