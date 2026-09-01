const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração de Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Inicialização do Supabase Client
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

let supabase = null;
if (SUPABASE_URL && SUPABASE_KEY) {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
} else {
    console.warn("Aviso: Variáveis SUPABASE_URL ou SUPABASE_KEY não foram configuradas.");
}

// ------------------------------------------------------------------
// 1. ROTA DE AUTENTICAÇÃO / LOGIN (ADMINISTRADOR E UTILIZADOR)
// ------------------------------------------------------------------
app.post('/api/login', async (req, res) => {
    const { email, senha, tipo } = req.body;

    // A. Acesso Especial para ADMINISTRADOR (Opção 1)
    if (tipo === 'admin') {
        if (email === 'admin@huamboplus.com' && senha === 'admin123') {
            return res.json({
                mensagem: 'Login de Administrador efetuado com sucesso',
                usuario: {
                    email: 'admin@huamboplus.com',
                    tipo: 'admin',
                    nome: 'Administrador Principal'
                }
            });
        } else {
            return res.status(401).json({ erro: 'Credenciais de Administrador incorretas.' });
        }
    }

    // B. Acesso para UTILIZADOR COMUM (Autenticação via Supabase)
    if (!supabase) {
        return res.status(500).json({ erro: 'Base de dados não configurada no servidor.' });
    }

    try {
        const { data, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('email', email)
            .eq('senha', senha)
            .single();

        if (error || !data) {
            return res.status(401).json({ erro: 'Email ou senha de utilizador incorretos.' });
        }

        return res.json({
            mensagem: 'Login de Utilizador efetuado com sucesso',
            usuario: {
                email: data.email,
                tipo: 'usuario',
                nome: data.nome || 'Utilizador'
            }
        });
    } catch (err) {
        console.error('Erro na autenticação:', err);
        return res.status(500).json({ erro: 'Erro interno no servidor ao processar o login.' });
    }
});

// ------------------------------------------------------------------
// 2. ROTAS DA API DE PRESTADORES DE SERVIÇOS
// ------------------------------------------------------------------

// Listar e pesquisar prestadores com filtros
app.get('/api/prestadores', async (req, res) => {
    if (!supabase) return res.json([]);

    try {
        const { q, municipio, categoria } = req.query;
        let query = supabase.from('prestadores').select('*');

        if (municipio) {
            query = query.eq('municipio', municipio);
        }
        if (categoria) {
            query = query.eq('categoria', categoria);
        }
        if (q) {
            query = query.or(`nome.ilike.%${q}%,categoria.ilike.%${q}%`);
        }

        const { data, error } = await query;
        if (error) throw error;

        return res.json(data || []);
    } catch (err) {
        console.error('Erro ao buscar prestadores:', err);
        return res.status(500).json({ erro: 'Erro ao buscar prestadores de serviços.' });
    }
});

// Registar nova candidatura de prestador
app.post('/api/prestadores', async (req, res) => {
    if (!supabase) return res.status(500).json({ erro: 'Supabase não conectado.' });

    try {
        const { nome, nif, categoria, municipio, telefone, taxa } = req.body;

        const { data, error } = await supabase.from('prestadores').insert([
            {
                nome,
                nif,
                categoria,
                municipio,
                telefone,
                taxa_deslocacao: parseFloat(taxa) || 0
            }
        ]);

        if (error) throw error;

        return res.status(201).json({ mensagem: 'Prestador registado com sucesso!', data });
    } catch (err) {
        console.error('Erro ao registar prestador:', err);
        return res.status(500).json({ erro: 'Erro ao guardar dados do prestador.' });
    }
});

// ------------------------------------------------------------------
// 3. ROTAS DA API DO MURAL DE GRITOS
// ------------------------------------------------------------------

// Obter lista de pedidos de serviço do Mural
app.get('/api/gritos', async (req, res) => {
    if (!supabase) return res.json([]);

    try {
        const { data, error } = await supabase
            .from('gritos')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return res.json(data || []);
    } catch (err) {
        console.error('Erro ao procurar gritos:', err);
        return res.status(500).json({ erro: 'Erro ao carregar o Mural de Gritos.' });
    }
});

// Publicar um novo pedido no Mural
app.post('/api/gritos', async (req, res) => {
    if (!supabase) return res.status(500).json({ erro: 'Supabase não conectado.' });

    try {
        const { titulo, municipio, descricao, telefone } = req.body;

        const { data, error } = await supabase.from('gritos').insert([
            {
                titulo,
                municipio,
                descricao,
                telefone
            }
        ]);

        if (error) throw error;

        return res.status(201).json({ mensagem: 'Grito publicado com sucesso!', data });
    } catch (err) {
        console.error('Erro ao publicar grito:', err);
        return res.status(500).json({ erro: 'Erro ao registar pedido no Mural.' });
    }
});

// Rota padrão para servir a aplicação web
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar Servidor Node.js
app.listen(PORT, () => {
    console.log(`Servidor a executar na porta ${PORT}`);
});
