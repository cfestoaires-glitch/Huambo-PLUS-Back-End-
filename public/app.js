// ============================================================
//  CONFIGURAÇÃO SUPABASE (substitui pelos teus valores)
// ============================================================
const SUPABASE_URL = 'https://vpuKKvxnlwyhoqpgckzh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_726ASiOd_Urr5agzhw6Mzw_3cqIZyTf';

let supabase = null;
let socket = null;
let currentUser = null;
let currentPrestadorId = null;
let TAB_ATUAL = 'home';
let FAVORITOS = [];
let GRITOS = [];
let PRESTADORES = [];
let CANDIDATOS = [];
let POSICAO_USUARIO = null;
let MAPA_INSTANCIA = null;
let IDIOMA_ATUAL = 'pt';
let DARK_MODE = localStorage.getItem('huambo_dark') === 'true';

// ============================================================
//  FUNÇÃO PARA MOSTRAR TELA (DEFINIDA ANTES DE TUDO)
// ============================================================
function mostrarTela(id) {
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    const tela = document.getElementById(id);
    if (tela) tela.classList.add('active');
}

// ============================================================
//  TELA DE LOGIN FORÇADA (FALLBACK)
// ============================================================
function forcarLogin() {
    console.log('⏰ Forçando tela de login (fallback).');
    mostrarTela('login');
}

// ============================================================
//  INICIALIZAR SUPABASE (CORRIGIDO)
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    // Mostrar login após 2 segundos (sempre – fallback)
    setTimeout(forcarLogin, 2000);

    // Tentar inicializar Supabase
    if (typeof window.supabase !== 'undefined') {
        try {
            supabase = window.supabase.createClient(
                SUPABASE_URL,
                SUPABASE_ANON_KEY
            );
            console.log('✅ Supabase inicializado');
            // Se o Supabase carregar, verificamos a sessão
            verificarSessao();
        } catch (e) {
            console.error('Erro ao inicializar Supabase:', e);
        }
    } else {
        console.warn('⚠️ Supabase não disponível. Apenas login visível.');
    }
});

// ============================================================
//  VERIFICAR SESSÃO (se Supabase disponível)
// ============================================================
async function verificarSessao() {
    if (!supabase) return;
    try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
            const { data: perfil } = await supabase
                .from('perfis')
                .select('*')
                .eq('id', data.session.user.id)
                .single();
            currentUser = perfil || { id: data.session.user.id, nome: data.session.user.email };
            iniciarApp();
        }
    } catch (e) {
        console.error('Erro ao verificar sessão:', e);
    }
}

// ============================================================
//  FUNÇÕES DE AUTENTICAÇÃO
// ============================================================
async function handleLogin() {
    if (!supabase) {
        mostrarToast('Supabase não disponível. Recarrega a página.');
        return;
    }
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPassword').value;
    const msg = document.getElementById('loginMsg');
    if (!email || !pass) {
        msg.textContent = 'Preencha todos os campos.';
        return;
    }

    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) {
            msg.textContent = 'Erro: ' + error.message;
            return;
        }
        const { data: perfil } = await supabase
            .from('perfis')
            .select('*')
            .eq('id', data.user.id)
            .single();
        if (!perfil) {
            await supabase.from('perfis').insert([{ id: data.user.id, nome: email, tipo: 'CLIENTE' }]);
            currentUser = { id: data.user.id, nome: email, tipo: 'CLIENTE' };
        } else {
            currentUser = perfil;
        }
        msg.textContent = '';
        mostrarToast('Bem-vindo, ' + currentUser.nome);
        iniciarApp();
    } catch (e) {
        msg.textContent = 'Erro: ' + e.message;
    }
}

async function handleRegister() {
    if (!supabase) {
        mostrarToast('Supabase não disponível. Recarrega a página.');
        return;
    }
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPassword').value;
    const msg = document.getElementById('loginMsg');
    if (!email || !pass) {
        msg.textContent = 'Preencha todos os campos.';
        return;
    }
    try {
        const { data, error } = await supabase.auth.signUp({ email, password: pass });
        if (error) {
            msg.textContent = 'Erro: ' + error.message;
            return;
        }
        await supabase.from('perfis').insert([{ id: data.user.id, nome: email, tipo: 'CLIENTE' }]);
        msg.textContent = 'Registado! Faça login.';
        msg.className = 'login-msg success';
        setTimeout(() => { msg.className = 'login-msg'; }, 3000);
    } catch (e) {
        msg.textContent = 'Erro: ' + e.message;
    }
}

async function logout() {
    if (supabase) await supabase.auth.signOut();
    currentUser = null;
    if (socket) socket.disconnect();
    mostrarTela('login');
    mostrarToast('Sessão encerrada.');
}

// ============================================================
//  FUNÇÕES DE UI (Toast, Tabs, etc.)
// ============================================================
function mostrarToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), 2800);
}

function mudarTab(tab) {
    TAB_ATUAL = tab;
    document.querySelectorAll('.nav-item').forEach(el =>
        el.classList.toggle('active', el.dataset.tab === tab)
    );
    renderizarConteudo();
}

function toggleDarkMode() {
    DARK_MODE = !DARK_MODE;
    document.body.classList.toggle('dark-mode', DARK_MODE);
    localStorage.setItem('huambo_dark', DARK_MODE);
    document.getElementById('darkIcon').className = DARK_MODE ? 'fas fa-sun' : 'fas fa-moon';
}

function setLoginTipo(tipo) {
    document.querySelectorAll('.login-tabs button').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.login-tabs button').forEach(b => {
        if (b.textContent.trim().toLowerCase().includes(tipo)) b.classList.add('active');
    });
    document.getElementById('adminCodeField').style.display = tipo === 'admin' ? 'block' : 'none';
}

function mudarIdioma(lang) {
    IDIOMA_ATUAL = lang;
    document.querySelectorAll('.idioma-selector button').forEach(b =>
        b.classList.toggle('active', b.dataset.lang === lang)
    );
}

// ============================================================
//  CARREGAR DADOS DO SUPABASE (se disponível)
// ============================================================
async function carregarDados() {
    if (!supabase) return;
    try {
        const { data: prestadores } = await supabase.from('prestadores').select('*');
        PRESTADORES = prestadores || [];
        const { data: gritos } = await supabase.from('gritos').select('*');
        GRITOS = gritos || [];
        if (currentUser) {
            const { data: favs } = await supabase
                .from('favoritos')
                .select('prestador_id')
                .eq('user_id', currentUser.id);
            FAVORITOS = favs?.map(f => f.prestador_id) || [];
            document.getElementById('favBadge').textContent = FAVORITOS.length;
        }
        const { data: candidatos } = await supabase
            .from('candidatos')
            .select('*')
            .eq('status', 'PENDENTE');
        CANDIDATOS = candidatos || [];
        document.getElementById('gritoBadge').textContent = GRITOS.filter(g => g.status === 'ABERTO').length;
    } catch (e) {
        console.error('Erro ao carregar dados:', e);
    }
}

// ============================================================
//  SOCKET.IO (CHAT) – apenas se houver utilizador
// ============================================================
function conectarSocket() {
    if (!currentUser) return;
    socket = io();
    socket.on('connect', () => console.log('🔌 Socket conectado'));
    socket.on('chat_history', (msgs) => {
        const container = document.getElementById('chatContainer');
        if (!container) return;
        container.innerHTML = msgs.map(m =>
            `<div class="chat-msg ${m.user_id === currentUser.id ? 'me' : 'other'}">${m.nome}: ${m.texto}</div>`
        ).join('');
        container.scrollTop = container.scrollHeight;
    });
    socket.on('new_message', (m) => {
        const container = document.getElementById('chatContainer');
        if (!container) return;
        const div = document.createElement('div');
        div.className = `chat-msg ${m.user_id === currentUser.id ? 'me' : 'other'}`;
        div.textContent = m.nome + ': ' + m.texto;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    });
}

function abrirChat(prestadorId) {
    if (!currentUser) { mostrarToast('Faça login.'); return; }
    currentPrestadorId = prestadorId;
    if (!socket) conectarSocket();
    socket.emit('join_chat', { userId: currentUser.id, prestadorId });
    document.getElementById('modalChat').classList.add('open');
    const p = PRESTADORES.find(x => x.id === prestadorId);
    document.getElementById('chatTitulo').textContent = 'Chat com ' + (p ? p.nome : 'Prestador');
}

function enviarMensagemChat() {
    const input = document.getElementById('chatInput');
    const texto = input.value.trim();
    if (!texto || !currentPrestadorId) return;
    socket.emit('send_message', {
        userId: currentUser.id,
        prestadorId: currentPrestadorId,
        texto,
        nome: currentUser.nome
    });
    input.value = '';
}

function fecharModalChat() {
    document.getElementById('modalChat').classList.remove('open');
}

// ============================================================
//  RENDERIZAR CONTEÚDO (APENAS SE HOUVER DADOS)
// ============================================================
function renderizarConteudo() {
    const container = document.getElementById('mainContent');
    if (!container) return;
    switch (TAB_ATUAL) {
        case 'home': container.innerHTML = renderHome(); break;
        case 'busca': container.innerHTML = renderBusca(); break;
        case 'gritos': container.innerHTML = renderGritos(); break;
        case 'favoritos': container.innerHTML = renderFavoritos(); break;
        case 'central': container.innerHTML = renderCentral(); break;
        case 'perfil': container.innerHTML = renderPerfil(); break;
        default: container.innerHTML = '';
    }
    afterRender();
}

function renderHome() {
    const destaques = PRESTADORES.filter(p => p.destaque).slice(0, 5);
    let html = `<div class="cat-grid">${['Saúde','Construção','Educação','Tecnologia'].map(c => `<div class="cat-main" onclick="mudarTab('busca'); setTimeout(()=>{ document.getElementById('filtroCategoria').value='${c}'; filtrarBusca(); },100);"><i class="fas fa-tag"></i> ${c}</div>`).join('')}</div>`;
    html += `<h3 style="margin:12px 0;">⭐ Destaques</h3>`;
    destaques.forEach(p => html += renderCard(p));
    return html;
}

function renderBusca() {
    const municipios = ['Todos', ...new Set(PRESTADORES.map(p => p.municipio))];
    const cats = ['Todas', ...new Set(PRESTADORES.map(p => p.categoria))];
    return `<div class="search-wrapper"><i class="fas fa-search"></i><input type="text" id="buscaInput" placeholder="Buscar..."></div>
        <div id="map" style="height:200px;border-radius:16px;margin:12px 0;"></div>
        <div class="filtros"><select id="filtroMunicipio">${municipios.map(m => `<option value="${m}">${m}</option>`).join('')}</select><select id="filtroCategoria">${cats.map(c => `<option value="${c}">${c}</option>`).join('')}</select></div>
        <button class="btn-filtrar" onclick="filtrarBusca()">Filtrar</button>
        <div id="resultadosBusca"></div>`;
}

function renderGritos() {
    let html = `<button class="btn-grito" onclick="abrirModalGrito()">+ Novo Grito</button>`;
    if (GRITOS.length === 0) html += '<div class="sem-res">Nenhum pedido.</div>';
    else GRITOS.forEach(g => html += `<div class="grito-card"><div class="titulo">${g.titulo}</div><div class="desc">${g.descricao}</div><div class="meta"><span>${g.categoria}</span><span>${g.municipio}</span><span class="status status-aberto">${g.status}</span></div></div>`);
    return html;
}

function renderFavoritos() {
    const favs = PRESTADORES.filter(p => FAVORITOS.includes(p.id));
    return favs.length ? favs.map(p => renderCard(p)).join('') : '<div class="sem-res">Sem favoritos.</div>';
}

function renderCentral() {
    if (!currentUser) return '<div class="sem-res">Faça login.</div>';
    const prestador = PRESTADORES.find(p => p.user_id === currentUser.id);
    if (!prestador) return '<div class="sem-res">Não és prestador. Regista-te!</div>';
    return `<div class="central-prof"><h3>Central - ${prestador.nome}</h3><p>Leads: ${prestador.leads?.length || 0}</p></div>`;
}

function renderPerfil() {
    if (!currentUser) return '<div class="sem-res">Faça login.</div>';
    return `<div class="perfil-header"><div class="avatar">👤</div><div class="nome">${currentUser.nome}</div><div class="email">${currentUser.email}</div></div><div class="perfil-info"><div class="linha"><span>Telefone</span><span>${currentUser.telefone || 'N/A'}</span></div></div><button class="btn-login" onclick="abrirModalRegistoPrestador()">Registar como Prestador</button><button class="btn-sair" onclick="logout()">Sair</button>`;
}

function renderCard(p) {
    const isFav = FAVORITOS.includes(p.id);
    return `<div class="card" data-id="${p.id}"><div class="top"><div><div class="nome">${p.nome}</div><div class="tags">${p.categorias?.slice(0,2).map(c => `<span>${c}</span>`).join('') || ''}</div></div><span class="tipo-badge">${p.tipo || 'Profissional'}</span></div><div class="rating">⭐ ${p.avaliacao_media || 0}</div><div class="bottom"><span class="local">📍 ${p.municipio}</span><span class="preco">${p.preco_base > 0 ? p.preco_base+' Kz' : 'Sob consulta'}</span><button class="fav-btn ${isFav ? 'active' : ''}" onclick="event.stopPropagation(); toggleFavorito('${p.id}')"><i class="fas fa-heart"></i></button><button class="chat-btn" onclick="event.stopPropagation(); abrirChat('${p.id}')"><i class="fas fa-comment"></i></button></div></div>`;
}

function filtrarBusca() {
    const termo = document.getElementById('buscaInput')?.value?.toLowerCase() || '';
    const mun = document.getElementById('filtroMunicipio')?.value || 'Todos';
    const cat = document.getElementById('filtroCategoria')?.value || 'Todas';
    let filtrados = PRESTADORES.filter(p => {
        const matchTermo = p.nome.toLowerCase().includes(termo) || p.descricao?.toLowerCase().includes(termo);
        const matchMun = mun === 'Todos' || p.municipio === mun;
        const matchCat = cat === 'Todas' || p.categoria === cat;
        return matchTermo && matchMun && matchCat;
    });
    const container = document.getElementById('resultadosBusca');
    if (!container) return;
    if (!filtrados.length) { container.innerHTML = '<div class="sem-res">Nenhum resultado.</div>'; return; }
    container.innerHTML = filtrados.map(p => renderCard(p)).join('');
    // Rebind events
    container.querySelectorAll('.fav-btn').forEach(btn => {
        btn.onclick = (e) => { e.stopPropagation(); toggleFavorito(btn.closest('.card')?.dataset.id); };
    });
    container.querySelectorAll('.chat-btn').forEach(btn => {
        btn.onclick = (e) => { e.stopPropagation(); abrirChat(btn.closest('.card')?.dataset.id); };
    });
}

async function toggleFavorito(prestadorId) {
    if (!prestadorId) return;
    if (!currentUser) { mostrarToast('Faça login.'); return; }
    if (!supabase) return;
    const exists = FAVORITOS.includes(prestadorId);
    if (exists) {
        await supabase.from('favoritos').delete().eq('user_id', currentUser.id).eq('prestador_id', prestadorId);
        FAVORITOS = FAVORITOS.filter(id => id !== prestadorId);
    } else {
        await supabase.from('favoritos').insert([{ user_id: currentUser.id, prestador_id: prestadorId }]);
        FAVORITOS.push(prestadorId);
    }
    document.getElementById('favBadge').textContent = FAVORITOS.length;
    renderizarConteudo();
}

function abrirModalGrito() {
    document.getElementById('modalGrito').classList.add('open');
}
function fecharModalGrito() {
    document.getElementById('modalGrito').classList.remove('open');
}
async function criarGrito() {
    const titulo = document.getElementById('gritoTitulo').value;
    const desc = document.getElementById('gritoDescricao').value;
    const cat = document.getElementById('gritoCategoria').value;
    const mun = document.getElementById('gritoMunicipio').value;
    if (!titulo || !desc || !cat || !mun) { mostrarToast('Preencha todos os campos.'); return; }
    if (!supabase) return;
    try {
        const { data } = await supabase.from('gritos').insert([{ cliente_id: currentUser.id, titulo, descricao: desc, categoria: cat, municipio: mun, status: 'ABERTO' }]).select().single();
        GRITOS.push(data);
        document.getElementById('gritoBadge').textContent = GRITOS.filter(g => g.status === 'ABERTO').length;
        fecharModalGrito();
        renderizarConteudo();
        mostrarToast('Grito publicado!');
    } catch (e) {
        mostrarToast('Erro ao publicar.');
    }
}

function abrirModalRegistoPrestador() {
    document.getElementById('modalRegistoPrestador').classList.add('open');
}
function fecharModalRegistoPrestador() {
    document.getElementById('modalRegistoPrestador').classList.remove('open');
}
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('formRegistoPrestador');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nome = document.getElementById('regNome').value;
            const profissao = document.getElementById('regProfissao').value;
            const categoria = document.getElementById('regCategoria').value;
            const municipio = document.getElementById('regMunicipio').value;
            const telefone = document.getElementById('regTelefone').value;
            const descricao = document.getElementById('regDescricao').value;
            const selfie = document.getElementById('regSelfie').files[0];
            const bi = document.getElementById('regBI').files[0];
            if (!selfie || !bi) { mostrarToast('Envie selfie e BI.'); return; }
            try {
                const selfieData = await new Promise(r => { const reader = new FileReader(); reader.onload = () => r(reader.result); reader.readAsDataURL(selfie); });
                const biData = await new Promise(r => { const reader = new FileReader(); reader.onload = () => r(reader.result); reader.readAsDataURL(bi); });
                await supabase.from('candidatos').insert([{ nome, profissao, categoria, municipio, telefone, descricao, selfie: selfieData, bi: biData, status: 'PENDENTE' }]);
                fecharModalRegistoPrestador();
                mostrarToast('Candidatura enviada! Aguarde aprovação.');
            } catch (e) {
                mostrarToast('Erro: ' + e.message);
            }
        });
    }
});

let avaliarTarget = null;
function abrirModalAvaliar(id, nome) {
    avaliarTarget = { id, nome };
    document.getElementById('avaliarTarget').textContent = 'Avaliar ' + nome;
    document.getElementById('modalAvaliar').classList.add('open');
}
function fecharModalAvaliar() {
    document.getElementById('modalAvaliar').classList.remove('open');
}
async function enviarAvaliacao() {
    if (!avaliarTarget) return;
    const nota = parseInt(document.getElementById('avaliarNota').value);
    const texto = document.getElementById('avaliarTexto').value.trim() || 'Sem comentário.';
    try {
        await supabase.from('avaliacoes').insert([{ prestador_id: avaliarTarget.id, user_id: currentUser.id, nota, texto }]);
        fecharModalAvaliar();
        mostrarToast('Avaliação enviada!');
        renderizarConteudo();
    } catch (e) {
        mostrarToast('Erro ao enviar avaliação.');
    }
}

function fecharModalDetalhes() {
    document.getElementById('modalDetalhes').classList.remove('open');
}
function abrirModalDetalhes(id) {
    const p = PRESTADORES.find(x => x.id === id);
    if (!p) return;
    const container = document.getElementById('detalhesConteudo');
    if (!container) return;
    const estrelas = '★'.repeat(Math.floor(p.avaliacao_media)) + (p.avaliacao_media % 1 >= 0.5 ? '½' : '');
    const avaliacoesHtml = p.avaliacoes && p.avaliacoes.length > 0 ?
        p.avaliacoes.map(a => `<div class="avaliacao-item"><div class="user">${a.user} ${'★'.repeat(Math.floor(a.nota))}</div><div class="texto">${a.texto}</div></div>`).join('') :
        '<p style="color:var(--cinza-texto);font-size:13px;">Sem avaliações.</p>';
    container.innerHTML = `<h2>${p.nome}</h2><div class="sub">${p.categorias?.join(' • ') || ''} • ${p.municipio}</div><div class="linha-detalhe"><span>⭐ Avaliação</span><span>${estrelas} ${p.avaliacao_media} (${p.total_avaliacoes})</span></div><div class="linha-detalhe"><span>💰 Preço</span><span>${p.preco_base > 0 ? p.preco_base+' Kz' : 'Sob consulta'}</span></div><div class="linha-detalhe"><span>📋 Sobre</span><span style="font-weight:400;">${p.descricao}</span></div><div style="margin:10px 0;font-weight:600;">💬 Avaliações</div>${avaliacoesHtml}<div class="avaliar-area"><button class="btn-acao" onclick="abrirModalAvaliar('${p.id}','${p.nome}')"><i class="fas fa-star"></i> Avaliar ${p.nome}</button></div><button class="btn-acao" onclick="abrirChat('${p.id}')"><i class="fas fa-comment-dots"></i> Falar com ${p.nome}</button><button class="btn-acao secundario" onclick="simularOrcamento('${p.id}')"><i class="fas fa-file-invoice"></i> Solicitar Orçamento</button>`;
    document.getElementById('modalDetalhes').classList.add('open');
}

function simularOrcamento(id) {
    const p = PRESTADORES.find(x => x.id === id);
    if (!p) return;
    mostrarToast(`Orçamento solicitado a ${p.nome}!`);
}

function initMap(prestadores) { /* placeholder, já que o mapa não é crítico */ }
function obterLocalizacao() { /* placeholder */ }
function afterRender() {
    document.querySelectorAll('.card').forEach(el => {
        el.onclick = (e) => {
            if (e.target.closest('.fav-btn') || e.target.closest('.chat-btn')) return;
            const id = el.dataset.id;
            abrirModalDetalhes(id);
        };
    });
}

async function iniciarApp() {
    mostrarTela('main');
    await carregarDados();
    if (DARK_MODE) {
        document.body.classList.add('dark-mode');
        document.getElementById('darkIcon').className = 'fas fa-sun';
    }
    mudarTab('home');
    if (currentUser) conectarSocket();
}

// Expor funções globais
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.logout = logout;
window.mudarTab = mudarTab;
window.mudarIdioma = mudarIdioma;
window.toggleDarkMode = toggleDarkMode;
window.setLoginTipo = setLoginTipo;
window.filtrarBusca = filtrarBusca;
window.toggleFavorito = toggleFavorito;
window.abrirModalGrito = abrirModalGrito;
window.fecharModalGrito = fecharModalGrito;
window.criarGrito = criarGrito;
window.abrirChat = abrirChat;
window.enviarMensagemChat = enviarMensagemChat;
window.fecharModalChat = fecharModalChat;
window.fecharModalDetalhes = fecharModalDetalhes;
window.fecharModalAvaliar = fecharModalAvaliar;
window.enviarAvaliacao = enviarAvaliacao;
window.abrirModalRegistoPrestador = abrirModalRegistoPrestador;
window.fecharModalRegistoPrestador = fecharModalRegistoPrestador;
window.abrirModalAvaliar = abrirModalAvaliar;
window.simularOrcamento = simularOrcamento;

console.log('🚀 Huambo Plus app.js carregado.');
