const express = require('express');
const cors = require('cors');
const fs = require('fs'); // 🔹 Importar módulo para escribir logs en archivo
const path = require('path'); // Importar módulo para manejar rutas
require('dotenv').config({ path: './.env' });
const { google } = require('googleapis');

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
// 🔹 **Configurar log en archivo `server.log`**
// ------------------------------
const logFilePath = path.join(__dirname, 'server.log');
const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

// Sobrescribir console.log y console.error para que escriban en el archivo y en stdout
console.log = (...args) => {
  const message = `[LOG] ${args.join(" ")}\n`;
  process.stdout.write(message);
  logStream.write(message);
};
console.error = (...args) => {
  const message = `[ERROR] ${args.join(" ")}\n`;
  process.stderr.write(message);
  logStream.write(message);
};

console.log("🚀 Servidor iniciado. Verificando si Render registra este mensaje.");

// ------------------------------
// Endpoint de prueba para verificar si se registran las rutas
// ------------------------------
app.get('/logtest', (req, res) => {
  res.send("Endpoint /logtest funcionando correctamente.");
});

// ------------------------------
// Endpoint para consultar logs
// ------------------------------
app.get('/logs', (req, res) => {
  fs.readFile(logFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error("❌ Error al leer `server.log`:", err.message);
      return res.status(500).json({ mensaje: "❌ Error al obtener los logs", error: err.message });
    }
    res.status(200).json({ logs: data });
  });
});

// ------------------------------
// Configuración de Google Sheets
// ------------------------------

// Verificar que `SPREADSHEET_ID` está presente
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
if (!SPREADSHEET_ID) {
  console.error("❌ Error: `SPREADSHEET_ID` no está definido. Verifica tu archivo .env.");
}

// Ruta al archivo JSON descargado (credenciales de la cuenta de servicio)
const SERVICE_ACCOUNT_FILE = './service_account_key.json'; // 👈 ¡ARCHIVO RENOMBRADO!

// Configura la autenticación JWT
const auth = new google.auth.GoogleAuth({
  keyFile: SERVICE_ACCOUNT_FILE,
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

// Crea la instancia de la API de Google Sheets
const sheets = google.sheets({ version: 'v4', auth });

// ------------------------------
// Función para insertar datos en Google Sheets
// ------------------------------
async function appendRow(values) {
  try {
    console.log("📌 `appendRow()` ha sido llamada, verificando ejecución...");

    if (!SPREADSHEET_ID) {
      throw new Error("❌ Error: `SPREADSHEET_ID` no está configurado.");
    }

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
    console.error("❌ Error en `appendRow()`, detalle:", error.message);
    throw error;
  }
}

// ------------------------------
// Endpoints del servidor
// ------------------------------
app.post('/', (req, res) => {
  console.log("🚀 Solicitud POST recibida en '/'");
  res.status(200).json({ mensaje: "Solicitud POST recibida correctamente!" });
});

app.post('/api/form', async (req, res) => {
  console.log("🚀 Solicitud POST recibida en `/api/form`");

  try {
    if (!req.body) {
      console.error("❌ Error: No se recibió cuerpo en la solicitud.");
      return res.status(400).json({ mensaje: "❌ Error: No se recibieron datos." });
    }

    console.log("📝 Datos recibidos en el servidor:", JSON.stringify(req.body, null, 2));

    const rowData = [
      req.body.nombre || "Sin nombre",
      req.body.rut || "",
      req.body.correo || "",
      req.body.prevision || "",
      req.body.isapre || "",
      Array.isArray(req.body.clinicas) ? req.body.clinicas.join(', ') : (req.body.clinicas || ""),
      req.body.especialidad || "",
      req.body.medico || "No especificado",
      req.body.preferenciaHora || "",
      req.body.fecha || "",
      req.body.horario || "",
      new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago' }),
      req.body.agendarPorTi || ""
    ];

    console.log("⚡ Verificación antes de llamar a `appendRow()`, revisando datos:", rowData);
    console.log("📌 Antes de responder en /api/form, verificando si Render captura este mensaje...");

    try {
      console.log("📌 Llamando a `appendRow()`...");
      const resultado = await appendRow(rowData);
      console.log("🚀 `appendRow()` ejecutado correctamente, resultado:", resultado);
      res.status(200).json({ mensaje: "✅ Datos guardados correctamente en Google Sheets" });
    } catch (error) {
      console.error("❌ Error en `appendRow()`, detalle:", error.message);
      res.status(500).json({ mensaje: "❌ Error al guardar en Google Sheets", error: error.message });
    }

  } catch (err) {
    console.error("❌ Error interno detallado:", err.message);
    res.status(500).json({ mensaje: "❌ Error interno del servidor", error: err.message });
  }
});

// ✅ **Confirmar que el servidor está escuchando en el puerto correcto**
app.listen(port, () => {
  console.log(`🌍 Servidor corriendo en http://localhost:${port}`);
});





