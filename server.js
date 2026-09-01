const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;

// Obriga o servidor a servir os ficheiros da pasta public (index.html, app.js, etc.)
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
    console.log(`Servidor a correr na porta ${PORT}`);
});
