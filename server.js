const express = require('express');
const path = require('path');
const app = express();

// Serve os ficheiros estáticos da pasta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Redireciona qualquer rota para o index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor a correr na porta ${PORT}`);
});
