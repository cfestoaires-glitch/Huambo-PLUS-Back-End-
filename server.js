const express = require('express');
const cors = require('cors');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Servir ficheiros estáticos da pasta public (index.html, styles.css, app.js)
app.use(express.static(path.join(__dirname, 'public')));

// Inicialização da conexão ao Supabase através das variáveis de ambiente do Render
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn("⚠️ ATENÇÃO: SUPABASE_URL ou SUPABASE_KEY não estão definidas nas variáveis de ambiente!");
}

const supabase = createClient(supabaseUrl, supabaseKey);

/* ==========================================================================
   ROTAS DA API (PRESTADORES)
   ========================================================================== */

// 1. Listar todos os prestadores de serviços
app.get('/api/prestadores', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('prestadores')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.status(200).json(data);
    } catch (err) {
        console.error("Erro ao procurar prestadores:", err.message);
        res.status(500).json({ error: "Erro interno do servidor ao carregar prestadores." });
    }
});

// 2. Cadastrar um novo prestador de serviços
app.post('/api/prestadores', async (req, res) => {
    try {
        const { nome, profissao, categoria, municipio, telefone, nif, taxa, lat, lng } = req.body;

        if (!nome || !profissao || !categoria || !municipio || !telefone) {
            return res.status(400).json({ error: "Campos obrigatórios em falta." });
        }

        const { data, error } = await supabase
            .from('prestadores')
            .insert([{
                nome,
                profissao,
                categoria,
                municipio,
                telefone,
                nif: nif || null,
                taxa_deslocacao: taxa || 0,
                lat: lat || null,
                lng: lng || null
            }])
            .select();

        if (error) throw error;
        res.status(201).json({ message: "Prestador registado com sucesso!", data });
    } catch (err) {
        console.error("Erro ao cadastrar prestador:", err.message);
        res.status(400).json({ error: err.message });
    }
});

/* ==========================================================================
   ROTAS DA API (MURAL DE GRITOS)
   ========================================================================== */

// 3. Listar todos os gritos (pedidos rápidos)
app.get('/api/gritos', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('gritos')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.status(200).json(data);
    } catch (err) {
        console.error("Erro ao procurar gritos:", err.message);
        res.status(500).json({ error: "Erro interno ao carregar o mural de gritos." });
    }
});

// 4. Publicar um novo grito
app.post('/api/gritos', async (req, res) => {
    try {
        const { titulo, descricao, categoria, municipio, orcamento, contacto } = req.body;

        if (!titulo || !descricao || !municipio || !contacto) {
            return res.status(400).json({ error: "Campos obrigatórios em falta." });
        }

        const { data, error } = await supabase
            .from('gritos')
            .insert([{
                titulo,
                descricao,
                categoria: categoria || null,
                municipio,
                orcamento: orcamento || 0,
                contacto
            }])
            .select();

        if (error) throw error;
        res.status(201).json({ message: "Grito publicado com sucesso!", data });
    } catch (err) {
        console.error("Erro ao publicar grito:", err.message);
        res.status(400).json({ error: err.message });
    }
});

/* ==========================================================================
   ROTA FALLBACK (Single Page Application)
   ========================================================================== */

// Redireciona qualquer outra rota para o index.html da pasta public
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Inicialização do Servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor Huambo Plus a rodar na porta ${PORT}`);
});
