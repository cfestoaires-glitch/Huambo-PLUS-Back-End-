require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

app.use(cors());
app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id);

    socket.on('join_chat', async ({ userId, prestadorId }) => {
        const sala = `chat_${Math.min(userId, prestadorId)}_${Math.max(userId, prestadorId)}`;
        socket.join(sala);
        socket.sala = sala;
        console.log(`${userId} entrou na sala ${sala}`);

        const { data } = await supabase
            .from('mensagens')
            .select('*')
            .eq('sala', sala)
            .order('created_at', { ascending: true });
        socket.emit('chat_history', data || []);
    });

    socket.on('send_message', async ({ userId, prestadorId, texto, nome }) => {
        const sala = `chat_${Math.min(userId, prestadorId)}_${Math.max(userId, prestadorId)}`;
        const { data } = await supabase
            .from('mensagens')
            .insert([{ sala, user_id: userId, texto, nome, created_at: new Date() }])
            .select()
            .single();
        if (data) io.to(sala).emit('new_message', data);
    });

    socket.on('disconnect', () => console.log('Cliente desconectado:', socket.id));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));