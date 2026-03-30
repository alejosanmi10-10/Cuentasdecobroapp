const express = require('express');
const multer = require('multer');
const visionService = require('./visionService.cjs');

const router = express.Router();
const fs = require('fs');

if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads', { recursive: true });
}

// Multer configured to save uploaded files temporarily
const upload = multer({ dest: 'uploads/' });

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
            data: extractedData
        });
    } catch (error) {
        console.error('Error processing upload:', error);
        res.status(500).json({ error: 'Internal server error while processing the invoice' });
    }
});

module.exports = router;
