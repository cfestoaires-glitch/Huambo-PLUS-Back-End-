const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;

// Expõe a pasta public para o Render servir o frontend
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
    console.log(`Servidor a correr na porta ${PORT}`);
});

