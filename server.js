const express = require('express');
const path = require('path');
const app = express();

// Diz ao servidor para procurar os ficheiros estáticos (HTML, CSS, JS) dentro da pasta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Garante que qualquer rota aponta para o index.html dentro da pasta 'public'
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor a correr na porta ${PORT}`);
});
