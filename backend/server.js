// server.js

const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { google } = require('googleapis');  // Importa la librería googleapis

const app = express();
const port = process.env.PORT || 3001;

// Configuración de middleware
app.use(cors({
  origin: '*', // Permitir cualquier origen temporalmente para pruebas
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// ------------------------------
// Configuración de Google Sheets
// ------------------------------

// Ruta al archivo JSON descargado (credenciales de la cuenta de servicio)
const SERVICE_ACCOUNT_FILE = './service-account.json';

// Configura la autenticación JWT
const auth = new google.auth.GoogleAuth({
  keyFile: SERVICE_ACCOUNT_FILE,
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

// Crea la instancia de la API de Google Sheets
const sheets = google.sheets({ version: 'v4', auth });

// El ID de tu hoja de Google Sheets lo obtienes de la URL y lo defines en tu archivo .env
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

// Función para insertar una fila en la hoja de cálculo
async function appendRow(values) {
  try {
    console.log("📌 Intentando insertar datos en Google Sheets...");
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Solicitudes Chatbot!A:M',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [values]
      }
    });
    console.log("✅ ¡Datos insertados exitosamente en Sheets!", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error insertando datos en Sheets:", error);
    throw error;
  }
}

// ------------------------------
// Endpoints para el servidor
// ------------------------------

// Nueva ruta para manejar POST en "/"
app.post('/', (req, res) => {
  res.status(200).json({ mensaje: "Solicitud POST recibida correctamente!" });
});

// Ruta para recibir datos del formulario
app.post('/api/form', async (req, res) => {
  try {
    const datosFormulario = req.body;
    console.log("📝 Datos recibidos en el servidor:", JSON.stringify(datosFormulario, null, 2));

    const rowData = [
      datosFormulario.nombre || "Sin nombre",
      datosFormulario.rut || "",
      datosFormulario.correo || "",
      datosFormulario.prevision || "",
      datosFormulario.isapre || "",
      Array.isArray(datosFormulario.clinicas) ? datosFormulario.clinicas.join(', ') : (datosFormulario.clinicas || ""),
      datosFormulario.especialidad || "",
      datosFormulario.medico || "No especificado",
      datosFormulario.preferenciaHora || "",
      datosFormulario.fecha || "",
      datosFormulario.horario || "",
      new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago' }),
      datosFormulario.agendarPorTi || ""
    ];

    console.log("⚡ Llamando a `appendRow()` con los siguientes datos:", rowData);
    await appendRow(rowData);
    console.log("🚀 La función `appendRow()` ha sido ejecutada correctamente.");

    res.status(200).json({ mensaje: "Datos guardados correctamente en Google Sheets" });

  } catch (err) {
    console.error("❌ Error interno detallado:", err.message);
    res.status(500).json({ mensaje: "Error interno del servidor", error: err.message });
  }
});

// Levanta el servidor
app.listen(port, () => {
  console.log(`🌍 Servidor corriendo en http://localhost:${port}`);
});



