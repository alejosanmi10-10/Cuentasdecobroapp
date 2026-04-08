const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const uploadRouter = require('./upload.cjs');
const storage = require('./storage.cjs');

// === INICIO DE SISTEMA DE LOGS INTERNOS ===
const logFile = path.join(__dirname, 'server.log');
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

const writeLog = (prefix, ...args) => {
    const msg = `[${new Date().toISOString()}] ${prefix}: ` + args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ') + '\n';
    try { fs.appendFileSync(logFile, msg); } catch(e) {}
};

console.log = (...args) => {
    writeLog('INFO', ...args);
    originalConsoleLog(...args);
};

console.error = (...args) => {
    writeLog('ERROR', ...args);
    originalConsoleError(...args);
};
// === FIN DE SISTEMA DE LOGS INTERNOS ===

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Servir la carpeta de subidas de forma estática
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Endpoint secreto para ver los logs en Render
app.get('/api/logs', (req, res) => {
    try {
        const logs = fs.readFileSync(logFile, 'utf8');
        res.type('text/plain').send(logs);
    } catch(err) {
        res.send("No logs yet.");
    }
});

// Routes
app.use('/api/upload', uploadRouter);

app.get('/api/quincenas', async (req, res) => {
    res.json(await storage.getAllQuincenas());
});

app.get('/api/debug', (req, res) => {
    res.json(storage.getDebugInfo());
});

app.post('/api/quincenas', async (req, res) => {
    try {
        const saved = await storage.saveQuincena(req.body);
        res.json({ success: true, quincena: saved });
    } catch(err) {
        console.error("Internal Server Error at POST /api/quincenas:", err);
        res.status(500).json({ error: "Failed to save quincena", details: err.message });
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
app.use((req, res, next) => {
    if (req.method === 'GET') {
        res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    } else {
        next();
    }
});

app.listen(PORT, async () => {
    await storage.initDB();
    console.log(`Backend server running on http://localhost:${PORT}`);
});
