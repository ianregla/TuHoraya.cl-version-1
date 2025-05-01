// index.js
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Ruta para recibir solicitudes del chatbot
app.post('/api/form', (req, res) => {
  const data = req.body;
  console.log('[Solicitud recibida]:', data);

  // Validación mínima
  if (!data.nombre || !data.rut || !data.clinica) {
    return res.status(400).json({ mensaje: 'Faltan campos obligatorios.' });
  }

  // En este punto luego guardaremos en base de datos
  return res.status(200).json({ mensaje: 'Solicitud recibida correctamente.' });
});

// Ruta base para pruebas
app.get('/', (req, res) => {
  res.send('Servidor backend funcionando 🏥');
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
});
