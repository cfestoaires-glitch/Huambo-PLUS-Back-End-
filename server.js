const path = require('path');
app.use(express.static('public'));

// Rota fallback
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
