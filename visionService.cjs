require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GoogleAIFileManager } = require('@google/generative-ai/server');
const fs = require('fs');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);

const extractInvoiceData = async (imagePath, mimeType = 'application/pdf') => {
    try {
        console.log("Subiendo archivo a Gemini API (GoogleAIFileManager)...");

        const uploadResult = await fileManager.uploadFile(imagePath, {
            mimeType: mimeType,
            displayName: "InvoiceDocument"
        });

        console.log(`Archivo subido con éxito, procesando URI: ${uploadResult.file.uri}`);

        // Usaremos el modelo de Nueva Generación: Gemini 2.5 Flash
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
        Eres un asistente experto en contabilidad extraiendo datos. Analiza este documento comercial (que puede ser un PDF de múltiples páginas) y extrae meticulosamente TODAS las cuentas de cobro/guías de transporte presentes.
        
        REGLA DE ORO (MUY IMPORTANTE): 
        IGNORA por completo y NO extraigas ningún dato de páginas o imágenes que correspondan a una "FACTURA ELECTRÓNICA DE VENTA".
        SOLO debes analizar y extraer información de los documentos titulados "GUIA DIGITAL DE TRANSPORTE DE COMBUSTIBLES...".

        Para CADA GUIA DIGITAL DE TRANSPORTE encontrada, extrae estrictamente un objeto JSON con la siguiente estructura:
        {
            "fecha_salida": "DD/MM/YY" (toma la fecha de salida o fecha visible, conviértela al formato día/mes/año corto ej: 2/02/26),
            "cliente": "Nombre exacto del cliente comprador o destino (ej: ESTACION DE SERVICIO CENTRO DE...)",
            "destino": "YUMBO",
            "galonaje": numero (la cantidad en galones o Volumen máximo, ej: 3200),
            "numero_factura": "Extrae el texto exacto de 'Número de guía:' que está justo debajo del título INFORMACIÓN GENERAL (ej: 4500320001689074). Ignora el 'Número de Factura'.",
            "placa": "Extrae el texto de 'Placa cabezote' que está abajo a la derecha en INFORMACIÓN TRANSPORTE (ej: SSK877)",
            "total_calculado": numero (si no hay total impreso, déjalo vacío)
        }

        Si encuentras múltiples páginas y son Guías Válidas, debes extraer un arreglo con TODAS sin saltarte ninguna. Si una página es una Factura Electrónica, saltatela como si no existiera.

        Devuelve ÚNICAMENTE un arreglo JSON válido, sin formato adicional, markdown (\`\`\`), ni explicaciones de texto. Ejemplo estricto:
        [
            { "fecha_salida": "16/03/26", "cliente": "ESTACION DE SERVICIO LA FONTANA", "destino": "YUMBO", "galonaje": 3200, "numero_factura": "4500320001689074", "placa": "SSK877", "total_calculado": "" }
        ]
        `;

        console.log("Instrucciones enviadas. Esperando la IA de Gemini...");
        const result = await model.generateContent([
            {
                fileData: {
                    mimeType: uploadResult.file.mimeType,
                    fileUri: uploadResult.file.uri
                }
            },
            { text: prompt }
        ]);

        const textResponse = result.response.text();

        // Limpiamos la respuesta de cualquier markup residual o espacios en blanco
        const cleanJson = textResponse.replace(/```json/gi, '').replace(/```/gi, '').trim();
        let dataArr;
        try {
            dataArr = JSON.parse(cleanJson);
        } catch (parseError) {
            console.error("Gemini no devolvió un JSON perfectamente válido:", cleanJson);
            throw new Error("Formato de extracción inválido");
        }

        // Limpiar el servidor en la nube para ahorrar cuota
        try {
            await fileManager.deleteFile(uploadResult.file.name);
            console.log("Archivo temporal en Gemini limpiado.");
        } catch (e) {
            console.error("Error menor limpiando el archivo en la nube:", e);
        }

        // Limpiar el archivo local para no inflar la carpeta /uploads
        fs.unlinkSync(imagePath);

        return Array.isArray(dataArr) ? dataArr : [dataArr];

    } catch (error) {
        console.error("Error crítico en visionService:", error);
        throw error;
    }
};

module.exports = {
    extractInvoiceData
};
