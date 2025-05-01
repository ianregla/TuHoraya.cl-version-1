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
// Ejemplo de URL: https://docs.google.com/spreadsheets/d/TU_SPREADSHEET_ID/edit
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

// Función para insertar una fila en la hoja de cálculo
async function appendRow(values) {
  try {
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      // Rango actualizado a A:M para 13 columnas:
      // 1: nombre, 2: rut, 3: correo, 4: prevision, 5: isapre,
      // 6: clinicas, 7: especialidad, 8: medico, 9: preferenciaHora,
      // 10: fecha (específica, sin hora), 11: horario, 12: fechaRegistro, 13: agendarPorTi.
      range: 'Solicitudes Chatbot!A:M', 
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [values]
      }
    });
    console.log("Datos insertados en Sheets:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error insertando datos en Sheets:", error);
    throw error;
  }
}

// ------------------------------
// Endpoint para recibir datos del formulario
// ------------------------------
app.post('/api/form', async (req, res) => {
  try {
    const datosFormulario = req.body;
    
    // Imprime los datos recibidos en la terminal para verificar su contenido
    console.log("Datos recibidos en el servidor:", JSON.stringify(datosFormulario, null, 2));
    
    // Extrae y asigna valores, usando valores por defecto si es necesario.
    const nombre          = datosFormulario.nombre || "Sin nombre";
    const rut             = datosFormulario.rut || "";
    const correo          = datosFormulario.correo || "";
    const prevision       = datosFormulario.prevision || "";
    const isapre          = datosFormulario.isapre || "";
    // Si "clinicas" es un arreglo, se unen en una cadena separada por comas.
    const clinicas        = (Array.isArray(datosFormulario.clinicas))
                              ? datosFormulario.clinicas.join(', ')
                              : (datosFormulario.clinicas || "");
    const especialidad    = datosFormulario.especialidad || "";
    const medico          = datosFormulario.medico || "No especificado";
    const preferenciaHora = datosFormulario.preferenciaHora || "";
    
    // Para la fecha específica, se espera que el frontend envíe un string en formato "dd/mm/yyyy".
    // Se convierte ese valor en un objeto Date y luego se formatea para que quede en "dd/mm/yyyy".
    const optionsDate = { timeZone: 'America/Santiago', day: '2-digit', month: '2-digit', year: 'numeric' };
    let fecha = "";
    if (datosFormulario.fecha) {
      const partesFecha = datosFormulario.fecha.split("/");
      if (partesFecha.length === 3) {
        const day = parseInt(partesFecha[0], 10);
        const month = parseInt(partesFecha[1], 10);
        const year = parseInt(partesFecha[2], 10);
        const fechaObj = new Date(year, month - 1, day);
        fecha = fechaObj.toLocaleDateString('es-CL', optionsDate);
      }
    }
    
    const horario      = datosFormulario.horario || "";
    // Se extrae el dato correspondiente a la confirmación.
    const agendarPorTi = datosFormulario.agendarPorTi || "";
    
    // Se crea la fecha de registro con hora formateada en "dd/mm/yyyy HH:mm" usando la zona horaria de Chile.
    const now = new Date();
    const optionsTime = { timeZone: 'America/Santiago', hour: '2-digit', minute: '2-digit', hour12: false };
    const fechaRegistro = `${now.toLocaleDateString('es-CL', optionsDate)} ${now.toLocaleTimeString('es-CL', optionsTime)}`;
    
    // Organiza los datos en el mismo orden que configuraste en la hoja de Google Sheets.
    // Orden:
    // 1. nombre
    // 2. rut
    // 3. correo
    // 4. prevision
    // 5. isapre
    // 6. clinicas
    // 7. especialidad
    // 8. medico
    // 9. preferenciaHora
    // 10. fecha (específica, sin hora)
    // 11. horario
    // 12. fechaRegistro (con hora)
    // 13. agendarPorTi
    const rowData = [
      nombre,
      rut,
      correo,
      prevision,
      isapre,
      clinicas,
      especialidad,
      medico,
      preferenciaHora,
      fecha,
      horario,
      fechaRegistro,
      agendarPorTi
    ];
    
    // Llama a la función para insertar la fila en Google Sheets.
    await appendRow(rowData);
    
    res.status(200).json({ mensaje: "Datos guardados correctamente en Google Sheets" });
  
  } catch (err) {
    console.error("Error interno detallado:", err.message);
    res.status(500).json({ mensaje: "Error interno del servidor", error: err.message });
  }
});

// Levanta el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});


