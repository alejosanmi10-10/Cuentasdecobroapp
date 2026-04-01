const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const dbPath = path.join(__dirname, 'database.json');
let useMongo = false;

// 1. Definir Schema de Mongoose
const quincenaSchema = new mongoose.Schema({
    id: { type: String, required: true },
    title: { type: String, required: true },
    data: { type: Array, default: [] },
    files: { type: Array, default: [] }
});

const QuincenaModel = mongoose.model('Quincena', quincenaSchema);

const initDB = async () => {
    if (process.env.MONGODB_URI) {
        try {
            await mongoose.connect(process.env.MONGODB_URI);
            console.log("🟢 Conectado exitosamente a MongoDB Atlas en la Nube");
            useMongo = true;
        } catch(e) {
            console.error("🔴 Error conectando a MongoDB. Cayendo a base de datos local JSON.", e);
            useMongo = false;
        }
    } else {
        console.log("🟠 No se encontró MONGODB_URI. Usando base de datos local JSON.");
    }

    if (!useMongo && !fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify([]));
    }
};

const getAllQuincenas = async () => {
    if (useMongo) {
        try {
            const records = await QuincenaModel.find({}).lean();
            // Retorna en el formato limpio que espera el frontend
            return records.map(r => ({ id: r.id, title: r.title, data: r.data }));
        } catch(e) {
            console.error(e);
            return [];
        }
    }

    // Modo local
    try {
        const data = fs.readFileSync(dbPath, 'utf8');
        return JSON.parse(data);
    } catch {
        return [];
    }
};

const saveQuincena = async (quincenaData) => {
    if (!quincenaData.id) {
        quincenaData.id = Date.now().toString();
    }

    if (useMongo) {
        try {
            await QuincenaModel.findOneAndUpdate(
                { id: quincenaData.id },
                quincenaData,
                { upsert: true, new: true }
            );
            return quincenaData;
        } catch (e) {
            console.error(e);
            throw new Error("Failed to save to Mongo");
        }
    }

    // Modo local
    const dataTxt = fs.readFileSync(dbPath, 'utf8');
    let quincenas = [];
    try { quincenas = JSON.parse(dataTxt); } catch(e){}
    
    const index = quincenas.findIndex(q => q.id === quincenaData.id);
    if (index !== -1) {
        quincenas[index] = quincenaData;
    } else {
        quincenas.push(quincenaData);
    }
    
    fs.writeFileSync(dbPath, JSON.stringify(quincenas, null, 2));
    return quincenaData;
};

const deleteQuincena = async (id) => {
    if (useMongo) {
        try {
            await QuincenaModel.deleteOne({ id });
            return;
        } catch(e) {
            console.error(e);
            throw new Error("Failed to delete in Mongo");
        }
    }

    // Modo local
    let quincenas = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    const filtered = quincenas.filter(q => q.id !== id);
    fs.writeFileSync(dbPath, JSON.stringify(filtered, null, 2));
};

const getDebugInfo = () => {
    return {
        useMongo,
        hasMongoUri: !!process.env.MONGODB_URI,
        uriPrefix: process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 15) : 'none',
        dbPath
    };
};

module.exports = {
    initDB,
    getAllQuincenas,
    saveQuincena,
    deleteQuincena,
    getDebugInfo
};
