const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'database.json');

const initDB = () => {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify([]));
    }
};

const getAllQuincenas = () => {
    initDB();
    const data = fs.readFileSync(dbPath, 'utf8');
    try {
        return JSON.parse(data);
    } catch {
        return [];
    }
};

const saveQuincena = (quincenaData) => {
    const quincenas = getAllQuincenas();
    
    // Si ya tiene ID, actualizamos
    if (quincenaData.id) {
        const index = quincenas.findIndex(q => q.id === quincenaData.id);
        if (index !== -1) {
            quincenas[index] = quincenaData;
        } else {
            quincenas.push(quincenaData);
        }
    } else {
        // Nueva quincena
        quincenaData.id = Date.now().toString();
        quincenas.push(quincenaData);
    }
    
    fs.writeFileSync(dbPath, JSON.stringify(quincenas, null, 2));
    return quincenaData;
};

const deleteQuincena = (id) => {
    const quincenas = getAllQuincenas();
    const filtered = quincenas.filter(q => q.id !== id);
    fs.writeFileSync(dbPath, JSON.stringify(filtered, null, 2));
};

module.exports = {
    getAllQuincenas,
    saveQuincena,
    deleteQuincena
};
