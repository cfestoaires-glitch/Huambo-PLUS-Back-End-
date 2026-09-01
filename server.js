require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const server = http.createServer(app);

// Configuração do Socket.IO com CORS liberado
const io = new Server(server, {
    cors: { 
        origin: "*", 
        methods: ["GET", "POST"] 
    }
});

// Inicialização do Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ ERRO CRÍTICO: Variáveis de ambiente SUPABASE_URL ou SUPABASE_KEY não configuradas no .env');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Rota de Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// Helper para gerar o identificador único da sala (suporta números e UUIDs)
function gerarIdSala(idA, idB) {
    const ids = [String(idA), String(idB)].sort();
    return `chat_${ids[0]}_${ids[1]}`;
}

// ============================================================
//  GERENCIAMENTO DE CONEXÕES WEBSOCKET
// ============================================================
io.on('connection', (socket) => {
    console.log(`🔌 Cliente conectado: ${socket.id}`);

    // Entrar em uma sala de chat e carregar histórico
    socket.on('join_chat', async ({ userId, prestadorId }) => {
        if (!userId || !prestadorId) {
            console.warn(`⚠️ Tentativa de entrada em chat sem parâmetros válidos.`);
            return;
        }

        const sala = gerarIdSala(userId, prestadorId);
        
        // Sai da sala anterior se existir
        if (socket.salaAtual) {
            socket.leave(socket.salaAtual);
        }

        socket.join(sala);
        socket.salaAtual = sala;
        console.log(`👤 Utilizador [${userId}] entrou na sala [${sala}]`);

        try {
            const { data: historico, error } = await supabase
                .from('mensagens')
                .select('*')
                .eq('sala', sala)
                .order('created_at', { ascending: true });

            if (error) {
                console.error(`❌ Erro ao procurar histórico da sala ${sala}:`, error.message);
                socket.emit('chat_history', []);
                return;
            }

            socket.emit('chat_history', historico || []);
        } catch (err) {
            console.error('❌ Erro inesperado ao carregar histórico:', err);
            socket.emit('chat_history', []);
        }
    });

    // Envio e distribuição de mensagem
    socket.on('send_message', async ({ userId, prestadorId, texto, nome }) => {
        if (!userId || !prestadorId || !texto?.trim()) return;

        const sala = gerarIdSala(userId, prestadorId);

        try {
            const novaMensagem = {
                sala,
                user_id: userId,
                texto: texto.trim(),
                nome: nome || 'Utilizador'
            };

            const { data, error } = await supabase
                .from('mensagens')
                .insert([novaMensagem])
                .select()
                .single();

            if (error) {
                console.error(`❌ Erro ao guardar mensagem no banco:`, error.message);
                return;
            }

            // Emitir mensagem para todos presentes na mesma sala
            io.to(sala).emit('new_message', data);
        } catch (err) {
            console.error('❌ Erro inesperado ao enviar mensagem:', err);
        }
    });

    socket.on('disconnect', () => {
        console.log(`❌ Cliente desconectado: ${socket.id}`);
    });
});

// Start Server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Servidor Huambo Plus a rodar na porta ${PORT}`);
});
