const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Servir ficheiros estáticos da pasta public
app.use(express.static(path.join(__dirname, 'public')));

// Rota de teste/verificação de saúde do servidor
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', plataforma: 'Huambo Plus a funcionar com sucesso' });
});

// Redirecionar qualquer outra rota para o index.html principal
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor Huambo Plus a correr na porta ${PORT}`);
});
