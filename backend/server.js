const express = require('express');
const app = express();
const port = process.env.PORT || 3001;

app.get('/', (req, res) => {
  res.send('¡Hola desde Render!');
});

app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
});





