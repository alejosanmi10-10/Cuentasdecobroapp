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

        // Usamos gemini-flash-latest ya que las versiones con sufijo numérico fueron limitadas a 0 en la capa gratuita
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const prompt = `
        Eres un asistente experto en contabilidad extraiendo datos. Analiza este documento comercial (que puede ser un PDF de múltiples páginas) y extrae meticulosamente TODAS las cuentas de cobro/guías de transporte presentes.
        
        REGLA DE ORO (MUY IMPORTANTE): 
        IGNORA por completo y NO extraigas ningún dato de páginas o imágenes que correspondan a una "FACTURA ELECTRÓNICA DE VENTA".
        SOLO debes analizar y extraer información de los documentos titulados "GUIA DIGITAL DE TRANSPORTE DE COMBUSTIBLES...".

        Para CADA GUIA DIGITAL DE TRANSPORTE encontrada, extrae estrictamente un objeto JSON con la siguiente estructura:
        {
            "fecha_salida": "DD/MM/YY" (toma la fecha de salida o fecha visible, conviértela al formato día/mes/año corto ej: 2/02/26),
            "cliente": "Nombre exacto del cliente, comprador y OBLIGATORIAMENTE LA CIUDAD O SEDE DESTINO (ej: 'NUTRIENTES AVICOLAS TULUA' o 'CARVAJAL PLANTA 2 CALOTO'). REGLA EXCEPCIONAL: Si el destino es 'PWR SERVICE', déjalo exactamente como 'PWR SERVICE' sin agregarle la palabra 'Cali' ni otras ciudades.",
            "galonaje": numero (la cantidad en galones, ej: 4000),
            "numero_factura": "Número de factura (ej: 4200060683)",
            "total_calculado": "" (deja esto vacío ya que el total se calculará después)
        }

        Si encuentras múltiples páginas y son Guías Válidas, debes extraer un arreglo con TODAS sin saltarte ninguna. Si una página es una Factura Electrónica, saltatela como si no existiera.

        Devuelve ÚNICAMENTE un arreglo JSON válido, sin formato adicional, markdown (\`\`\`), ni explicaciones de texto. Ejemplo estricto:
        [
            { "fecha_salida": "2/01/26", "cliente": "TULUA", "galonaje": 3000, "numero_factura": "4200059908", "total_calculado": "" }
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

        // Se COMENTA la eliminación local para que el usuario pueda imprimir el soporte
        // fs.unlinkSync(imagePath);

        return Array.isArray(dataArr) ? dataArr : [dataArr];

    } catch (error) {
        console.error("Error crítico en visionService:", error);
        throw error;
    }
};

module.exports = {
    extractInvoiceData
};
