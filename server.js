const express = require('express');
const path = require('path');
const fs = require('fs');
cons
const PORT = process.env.PORT || 3000;

// Tenta servir a pasta public
app.use(express.static(path.join(__dirname, 'public')));

// ROTA DE RAIO-X PARA DEBUG
app.get('/debug', (req, res) => {
    try {
        const rootFiles = fs.readdirSync(__dirname);
        let publicFiles = "A pasta 'public' NÃO EXISTE aqui!";
        
        const publicPath = path.join(__dirname, 'public');
        if (fs.existsSync(publicPath)) {
            publicFiles = fs.readdirSync(publicPath).join(' | ');
        }
        
        res.send(`
            <h2>Raio-X do Servidor</h2>
            <h3>Ficheiros na pasta principal (Raiz):</h3>
            <p style="color: blue;">${rootFiles.join(' | ')}</p>
            <hr>
            <h3>Ficheiros dentro da pasta 'public':</h3>
            <p style="color: red;">${publicFiles}</p>
        `);
    } catch (error) {
        res.send("Erro no Raio-X: " + error.message);
    }
});

app.listen(PORT, () => {
    console.log(`Servidor a correr na porta ${PORT}`);
});
