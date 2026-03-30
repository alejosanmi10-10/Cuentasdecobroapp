const express = require('express');
const cors = require('cors');
const uploadRouter = require('./upload.cjs');
const storage = require('./storage.cjs');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/upload', uploadRouter);

app.get('/api/quincenas', (req, res) => {
    res.json(storage.getAllQuincenas());
});

app.post('/api/quincenas', (req, res) => {
    try {
        const saved = storage.saveQuincena(req.body);
        res.json({ success: true, quincena: saved });
    } catch(err) {
        res.status(500).json({ error: "Failed to save quincena" });
    }
});

app.delete('/api/quincenas/:id', (req, res) => {
    try {
        storage.deleteQuincena(req.params.id);
        res.json({ success: true });
    } catch(err) {
        res.status(500).json({ error: "Failed to delete" });
    }
});

app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
