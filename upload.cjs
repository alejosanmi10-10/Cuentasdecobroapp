const express = require('express');
const multer = require('multer');
const visionService = require('./visionService.cjs');

const router = express.Router();
const fs = require('fs');

if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads', { recursive: true });
}

const path = require('path');

// Multer configured with diskStorage to PRESERVE file extensions for browser rendering
const storageMulter = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        const ext = path.extname(file.originalname) || '';
        cb(null, file.fieldname + '-' + uniqueSuffix + ext)
    }
});
const upload = multer({ storage: storageMulter });

router.post('/', upload.single('invoice'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded. Please upload a specific invoice.' });
        }

        console.log(`Processing temporary file: ${req.file.path}`);

        // Pass the file path and mimetype to our vision service
        const extractedData = await visionService.extractInvoiceData(req.file.path, req.file.mimetype);

        res.json({
            success: true,
            data: extractedData,
            filename: req.file.filename
        });
    } catch (error) {
        console.error('Error processing upload:', error);
        
        let errorDetalle = error.message;
        if (!errorDetalle) {
            try {
                errorDetalle = JSON.stringify(error);
            } catch(e) {
                errorDetalle = String(error);
            }
        }
        
        res.status(500).json({ error: errorDetalle || 'Error interno desconocido' });
    }
});

module.exports = router;
