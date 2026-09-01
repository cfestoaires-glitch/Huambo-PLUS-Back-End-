// ============================================================
//  CONFIGURAÇÃO SUPABASE
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
let IDIOMA_ATUAL = 'pt';
let DARK_MODE = localStorage.getItem('huambo_dark') === 'true';

// ============================================================
//  CONTROLE DE TELAS E INICIALIZAÇÃO
// ============================================================
function mostrarTela(id) {
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    const tela = document.getElementById(id);
    if (tela) tela.classList.add('active');
}

function forcarLogin() {
    if (!currentUser) {
        console.log('⏰ Redirecionando para tela de login.');
        mostrarTela('login');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Fallback de segurança para garantir exibição do login se não houver sessão ativa
    setTimeout(forcarLogin, 2000);

    if (typeof window.supabase !== 'undefined') {
        try {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('✅ Supabase inicializado');
            verificarSessao();
        } catch (e) {
            console.error('Erro ao inicializar Supabase:', e);
        }
    } else {
        console.warn('⚠️ Supabase JS SDK não carregado no HTML.');
    }
});

// ============================================================
//  SESSÃO E AUTENTICAÇÃO
// ============================================================
async function verificarSessao() {
    if (!supabase) return;
    try {
        const { data } = await supabase.auth.getSession();
        if (data?.session) {
            const { data: perfil } = await supabase
                .from('perfis')
                .select('*')
                .eq('id', data.session.user.id)
                .single();
                
            currentUser = perfil || { id: data.session.user.id, nome: data.session.user.email, email: data.session.user.email };
            await iniciarApp();
        }
    } catch (e) {
        console.error('Erro ao verificar sessão:', e);
    }
}

async function handleLogin() {
    if (!supabase) return mostrarToast('Supabase indisponível. Recarregue a página.');
    
    const email = document.getElementById('loginEmail')?.value.trim();
    const pass = document.getElementById('loginPassword')?.value.trim();
    const msg = document.getElementById('loginMsg');

    if (!email || !pass) {
        if (msg) msg.textContent = 'Preencha todos os campos.';
        return;
    }

    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) throw error;

        const { data: perfil } = await supabase
            .from('perfis')
            .select('*')
            .eq('id', data.user.id)
            .single();

        if (!perfil) {
            const novoPerfil = { id: data.user.id, nome: email, email: email, tipo: 'CLIENTE' };
            await supabase.from('perfis').insert([novoPerfil]);
            currentUser = novoPerfil;
        } else {
            currentUser = perfil;
        }

        if (msg) msg.textContent = '';
        mostrarToast('Bem-vindo, ' + (currentUser.nome || email));
        iniciarApp();
    } catch (e) {
        if (msg) msg.textContent = 'Erro: ' + e.message;
    }
}

async function handleRegister() {
    if (!supabase) return mostrarToast('Supabase indisponível.');
    
    const email = document.getElementById('loginEmail')?.value.trim();
    const pass = document.getElementById('loginPassword')?.value.trim();
    const msg = document.getElementById('loginMsg');

    if (!email || !pass) {
        if (msg) msg.textContent = 'Preencha todos os campos.';
        return;
    }

    try {
        const { data, error } = await supabase.auth.signUp({ email, password: pass });
        if (error) throw error;

        if (data.user) {
            await supabase.from('perfis').insert([{ id: data.user.id, nome: email, email: email, tipo: 'CLIENTE' }]);
            if (msg) {
                msg.textContent = 'Registo efetuado! Faça login para continuar.';
                msg.className = 'login-msg success';
                setTimeout(() => { msg.className = 'login-msg'; }, 4000);
            }
        }
    } catch (e) {
        if (msg) msg.textContent = 'Erro: ' + e.message;
    }
}

async function logout() {
    if (supabase) await supabase.auth.signOut();
    currentUser = null;
    if (socket) {
        socket.disconnect();
        socket = null;
    }
    mostrarTela('login');
    mostrarToast('Sessão encerrada.');
}

// ============================================================
//  UI UTILS & ESTADOS
// ============================================================
function mostrarToast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
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
    const icon = document.getElementById('darkIcon');
    if (icon) icon.className = DARK_MODE ? 'fas fa-sun' : 'fas fa-moon';
}

function setLoginTipo(tipo) {
    document.querySelectorAll('.login-tabs button').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.login-tabs button').forEach(b => {
        if (b.textContent.trim().toLowerCase().includes(tipo)) b.classList.add('active');
    });
    const adminField = document.getElementById('adminCodeField');
    if (adminField) adminField.style.display = tipo === 'admin' ? 'block' : 'none';
}

function mudarIdioma(lang) {
    IDIOMA_ATUAL = lang;
    document.querySelectorAll('.idioma-selector button').forEach(b =>
        b.classList.toggle('active', b.dataset.lang === lang)
    );
}

// ============================================================
//  CARREGAMENTO DE DADOS
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
            
            const badgeFav = document.getElementById('favBadge');
            if (badgeFav) badgeFav.textContent = FAVORITOS.length;
        }

        const badgeGrito = document.getElementById('gritoBadge');
        if (badgeGrito) badgeGrito.textContent = GRITOS.filter(g => g.status === 'ABERTO').length;

    } catch (e) {
        console.error('Erro ao carregar dados:', e);
    }
}

// ============================================================
//  SOCKET.IO & CHAT
// ============================================================
function conectarSocket() {
    if (!currentUser || (socket && socket.connected)) return;

    socket = io();

    socket.on('connect', () => console.log('🔌 Socket conectado'));

    socket.on('chat_history', (msgs) => {
        const container = document.getElementById('chatContainer');
        if (!container) return;
        container.innerHTML = msgs.map(m =>
            `<div class="chat-msg ${m.user_id === currentUser.id ? 'me' : 'other'}">
                <strong>${m.nome}:</strong> ${m.texto}
             </div>`
        ).join('');
        container.scrollTop = container.scrollHeight;
    });

    socket.on('new_message', (m) => {
        const container = document.getElementById('chatContainer');
        if (!container) return;
        const div = document.createElement('div');
        div.className = `chat-msg ${m.user_id === currentUser.id ? 'me' : 'other'}`;
        div.innerHTML = `<strong>${m.nome}:</strong> ${m.texto}`;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    });
}

function abrirChat(prestadorId) {
    if (!currentUser) return mostrarToast('Faça login para iniciar conversas.');
    currentPrestadorId = prestadorId;

    if (!socket) conectarSocket();

    socket.emit('join_chat', { userId: currentUser.id, prestadorId });
    document.getElementById('modalChat')?.classList.add('open');
    
    const p = PRESTADORES.find(x => x.id === prestadorId);
    const titulo = document.getElementById('chatTitulo');
    if (titulo) titulo.textContent = 'Chat com ' + (p ? p.nome : 'Prestador');
}

function enviarMensagemChat() {
    const input = document.getElementById('chatInput');
    const texto = input?.value.trim();
    if (!texto || !currentPrestadorId || !currentUser) return;

    socket.emit('send_message', {
        userId: currentUser.id,
        prestadorId: currentPrestadorId,
        texto,
        nome: currentUser.nome || currentUser.email
    });
    input.value = '';
}

function fecharModalChat() {
    document.getElementById('modalChat')?.classList.remove('open');
}

// ============================================================
//  RENDERIZAÇÃO DA INTERFACE
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
    const categorias = ['Saúde', 'Construção', 'Educação', 'Tecnologia'];
    
    let html = `<div class="cat-grid">
        ${categorias.map(c => `
            <div class="cat-main" onclick="mudarTab('busca'); setTimeout(()=>{ const f = document.getElementById('filtroCategoria'); if(f){ f.value='${c}'; filtrarBusca(); } }, 100);">
                <i class="fas fa-tag"></i> ${c}
            </div>`).join('')}
    </div>`;
    
    html += `<h3 style="margin: 16px 0 12px 0;">⭐ Destaques</h3>`;
    if (destaques.length === 0) {
        html += '<div class="sem-res">Sem prestadores em destaque no momento.</div>';
    } else {
        destaques.forEach(p => html += renderCard(p));
    }
    return html;
}

function renderBusca() {
    const municipios = ['Todos', ...new Set(PRESTADORES.map(p => p.municipio).filter(Boolean))];
    const cats = ['Todas', ...new Set(PRESTADORES.map(p => p.categoria).filter(Boolean))];

    return `
        <div class="search-wrapper">
            <i class="fas fa-search"></i>
            <input type="text" id="buscaInput" placeholder="Buscar serviços ou profissionais..." oninput="filtrarBusca()">
        </div>
        <div id="map" style="height:180px; border-radius:16px; margin:12px 0; background:var(--cinza-bg, #f0f0f0);"></div>
        <div class="filtros">
            <select id="filtroMunicipio" onchange="filtrarBusca()">
                ${municipios.map(m => `<option value="${m}">${m}</option>`).join('')}
            </select>
            <select id="filtroCategoria" onchange="filtrarBusca()">
                ${cats.map(c => `<option value="${c}">${c}</option>`).join('')}
            </select>
        </div>
        <div id="resultadosBusca" style="margin-top: 12px;">
            ${PRESTADORES.map(p => renderCard(p)).join('')}
        </div>`;
}

function renderGritos() {
    let html = `<button class="btn-grito" onclick="abrirModalGrito()">+ Publicar Grito de Socorro</button>`;
    if (GRITOS.length === 0) {
        html += '<div class="sem-res">Nenhum pedido de socorro ativo.</div>';
    } else {
        GRITOS.forEach(g => {
            html += `
                <div class="grito-card">
                    <div class="titulo">${g.titulo}</div>
                    <div class="desc">${g.descricao}</div>
                    <div class="meta">
                        <span>🏷️ ${g.categoria}</span>
                        <span>📍 ${g.municipio}</span>
                        <span class="status status-aberto">${g.status}</span>
                    </div>
                </div>`;
        });
    }
    return html;
}

function renderFavoritos() {
    const favs = PRESTADORES.filter(p => FAVORITOS.includes(p.id));
    return favs.length ? favs.map(p => renderCard(p)).join('') : '<div class="sem-res">Nenhum prestador favorito guardado.</div>';
}

function renderCentral() {
    if (!currentUser) return '<div class="sem-res">Faça login para aceder à central.</div>';
    const prestador = PRESTADORES.find(p => p.user_id === currentUser.id);
    if (!prestador) return '<div class="sem-res">Ainda não és um prestador registado. Solicita a tua conta no perfil!</div>';
    return `<div class="central-prof"><h3>Central do Prestador - ${prestador.nome}</h3><p>Oportunidades de Leads: <strong>${prestador.leads?.length || 0}</strong></p></div>`;
}

function renderPerfil() {
    if (!currentUser) return '<div class="sem-res">Faça login para ver o perfil.</div>';
    return `
        <div class="perfil-header">
            <div class="avatar">👤</div>
            <div class="nome">${currentUser.nome || 'Utilizador'}</div>
            <div class="email">${currentUser.email || ''}</div>
        </div>
        <div class="perfil-info">
            <div class="linha"><span>Telefone</span><span>${currentUser.telefone || 'Não registado'}</span></div>
        </div>
        <button class="btn-login" style="margin-top:16px;" onclick="abrirModalRegistoPrestador()">Registar como Prestador</button>
        <button class="btn-sair" style="margin-top:10px;" onclick="logout()">Encerrar Sessão</button>`;
}

function renderCard(p) {
    const isFav = FAVORITOS.includes(p.id);
    const categorias = p.categorias || (p.categoria ? [p.categoria] : []);
    
    return `
        <div class="card" data-id="${p.id}">
            <div class="top">
                <div>
                    <div class="nome">${p.nome}</div>
                    <div class="tags">${categorias.slice(0, 2).map(c => `<span>${c}</span>`).join('')}</div>
                </div>
                <span class="tipo-badge">${p.tipo || 'Profissional'}</span>
            </div>
            <div class="rating">⭐ ${p.avaliacao_media || '0.0'}</div>
            <div class="bottom">
                <span class="local">📍 ${p.municipio || 'Huambo'}</span>
                <span class="preco">${p.preco_base > 0 ? p.preco_base + ' Kz' : 'Sob consulta'}</span>
                <button class="fav-btn ${isFav ? 'active' : ''}" onclick="event.stopPropagation(); toggleFavorito('${p.id}')">
                    <i class="fas fa-heart"></i>
                </button>
                <button class="chat-btn" onclick="event.stopPropagation(); abrirChat('${p.id}')">
                    <i class="fas fa-comment"></i>
                </button>
            </div>
        </div>`;
}

// ============================================================
//  AÇÕES E EVENTOS DA APLICAÇÃO
// ============================================================
function filtrarBusca() {
    const termo = document.getElementById('buscaInput')?.value?.toLowerCase() || '';
    const mun = document.getElementById('filtroMunicipio')?.value || 'Todos';
    const cat = document.getElementById('filtroCategoria')?.value || 'Todas';

    let filtrados = PRESTADORES.filter(p => {
        const matchTermo = p.nome.toLowerCase().includes(termo) || (p.descricao && p.descricao.toLowerCase().includes(termo));
        const matchMun = mun === 'Todos' || p.municipio === mun;
        const matchCat = cat === 'Todas' || p.categoria === cat || (p.categorias && p.categorias.includes(cat));
        return matchTermo && matchMun && matchCat;
    });

    const container = document.getElementById('resultadosBusca');
    if (!container) return;
    
    if (!filtrados.length) { 
        container.innerHTML = '<div class="sem-res">Nenhum resultado encontrado.</div>'; 
        return; 
    }

    container.innerHTML = filtrados.map(p => renderCard(p)).join('');
    afterRender();
}

async function toggleFavorito(prestadorId) {
    if (!prestadorId) return;
    if (!currentUser) return mostrarToast('Faça login para guardar favoritos.');
    if (!supabase) return;

    const exists = FAVORITOS.includes(prestadorId);
    try {
        if (exists) {
            await supabase.from('favoritos').delete().eq('user_id', currentUser.id).eq('prestador_id', prestadorId);
            FAVORITOS = FAVORITOS.filter(id => id !== prestadorId);
        } else {
            await supabase.from('favoritos').insert([{ user_id: currentUser.id, prestador_id: prestadorId }]);
            FAVORITOS.push(prestadorId);
        }
        
        const badgeFav = document.getElementById('favBadge');
        if (badgeFav) badgeFav.textContent = FAVORITOS.length;
        renderizarConteudo();
    } catch (e) {
        console.error('Erro ao alternar favorito:', e);
    }
}

function abrirModalGrito() { document.getElementById('modalGrito')?.classList.add('open'); }
function fecharModalGrito() { document.getElementById('modalGrito')?.classList.remove('open'); }

async function criarGrito() {
    const titulo = document.getElementById('gritoTitulo')?.value.trim();
    const desc = document.getElementById('gritoDescricao')?.value.trim();
    const cat = document.getElementById('gritoCategoria')?.value;
    const mun = document.getElementById('gritoMunicipio')?.value;

    if (!titulo || !desc || !cat || !mun) return mostrarToast('Preencha todos os campos.');
    if (!supabase || !currentUser) return mostrarToast('Sessão inválida.');

    try {
        const { data, error } = await supabase.from('gritos').insert([{
            cliente_id: currentUser.id, 
            titulo, 
            descricao: desc, 
            categoria: cat, 
            municipio: mun, 
            status: 'ABERTO' 
        }]).select().single();

        if (error) throw error;

        GRITOS.push(data);
        const badgeGrito = document.getElementById('gritoBadge');
        if (badgeGrito) badgeGrito.textContent = GRITOS.filter(g => g.status === 'ABERTO').length;
        
        fecharModalGrito();
        renderizarConteudo();
        mostrarToast('Grito publicado com sucesso!');
    } catch (e) {
        mostrarToast('Erro ao publicar pedido.');
    }
}

function abrirModalRegistoPrestador() { document.getElementById('modalRegistoPrestador')?.classList.add('open'); }
function fecharModalRegistoPrestador() { document.getElementById('modalRegistoPrestador')?.classList.remove('open'); }

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
            const selfieFile = document.getElementById('regSelfie').files[0];
            const biFile = document.getElementById('regBI').files[0];

            if (!selfieFile || !biFile) return mostrarToast('Submeta a Selfie e a cópia do BI.');

            const readFileAsBase64 = (file) => new Promise((res, rej) => {
                const r = new FileReader();
                r.onload = () => res(r.result);
                r.onerror = rej;
                r.readAsDataURL(file);
            });

            try {
                const selfieData = await readFileAsBase64(selfieFile);
                const biData = await readFileAsBase64(biFile);

                const { error } = await supabase.from('candidatos').insert([{
                    nome, profissao, categoria, municipio, telefone, descricao, 
                    selfie: selfieData, bi: biData, status: 'PENDENTE' 
                }]);

                if (error) throw error;

                fecharModalRegistoPrestador();
                mostrarToast('Candidatura enviada! Aguarde pela aprovação.');
            } catch (err) {
                mostrarToast('Erro ao submeter: ' + err.message);
            }
        });
    }
});

let avaliarTarget = null;
function abrirModalAvaliar(id, nome) {
    avaliarTarget = { id, nome };
    const targetLabel = document.getElementById('avaliarTarget');
    if (targetLabel) targetLabel.textContent = 'Avaliar ' + nome;
    document.getElementById('modalAvaliar')?.classList.add('open');
}
function fecharModalAvaliar() { document.getElementById('modalAvaliar')?.classList.remove('open'); }

async function enviarAvaliacao() {
    if (!avaliarTarget || !currentUser) return;
    const nota = parseInt(document.getElementById('avaliarNota').value);
    const texto = document.getElementById('avaliarTexto').value.trim() || 'Sem comentário.';

    try {
        const { error } = await supabase.from('avaliacoes').insert([{ 
            prestador_id: avaliarTarget.id, 
            user_id: currentUser.id, 
            nota, 
            texto 
        }]);

        if (error) throw error;

        fecharModalAvaliar();
        mostrarToast('Avaliação registada!');
        await carregarDados();
        renderizarConteudo();
    } catch (e) {
        mostrarToast('Erro ao enviar avaliação.');
    }
}

function fecharModalDetalhes() { document.getElementById('modalDetalhes')?.classList.remove('open'); }

function abrirModalDetalhes(id) {
    const p = PRESTADORES.find(x => x.id === id);
    if (!p) return;

    const container = document.getElementById('detalhesConteudo');
    if (!container) return;

    const notaNum = p.avaliacao_media || 0;
    const estrelas = '★'.repeat(Math.floor(notaNum)) + (notaNum % 1 >= 0.5 ? '½' : '');
    
    const avaliacoesHtml = (p.avaliacoes && p.avaliacoes.length > 0) ?
        p.avaliacoes.map(a => `<div class="avaliacao-item"><div class="user">${a.user || 'Cliente'} ${'★'.repeat(Math.floor(a.nota))}</div><div class="texto">${a.texto}</div></div>`).join('') :
        '<p style="color:var(--cinza-texto, #888); font-size:13px;">Sem avaliações ainda.</p>';

    container.innerHTML = `
        <h2>${p.nome}</h2>
        <div class="sub">${(p.categorias || [p.categoria]).join(' • ')} • ${p.municipio}</div>
        <div class="linha-detalhe"><span>⭐ Avaliação</span><span>${estrelas} ${notaNum} (${p.total_avaliacoes || 0})</span></div>
        <div class="linha-detalhe"><span>💰 Preço</span><span>${p.preco_base > 0 ? p.preco_base + ' Kz' : 'Sob consulta'}</span></div>
        <div class="linha-detalhe"><span>📋 Sobre</span><span style="font-weight:400;">${p.descricao || 'Sem descrição.'}</span></div>
        <div style="margin:14px 0 6px 0; font-weight:600;">💬 Avaliações</div>
        ${avaliacoesHtml}
        <div class="avaliar-area" style="margin-top:12px;">
            <button class="btn-acao" onclick="abrirModalAvaliar('${p.id}','${p.nome}')"><i class="fas fa-star"></i> Avaliar ${p.nome}</button>
        </div>
        <button class="btn-acao" onclick="fecharModalDetalhes(); abrirChat('${p.id}')"><i class="fas fa-comment-dots"></i> Falar com ${p.nome}</button>
        <button class="btn-acao secundario" onclick="simularOrcamento('${p.id}')"><i class="fas fa-file-invoice"></i> Solicitar Orçamento</button>`;

    document.getElementById('modalDetalhes')?.classList.add('open');
}

function simularOrcamento(id) {
    const p = PRESTADORES.find(x => x.id === id);
    if (p) mostrarToast(`Pedido de orçamento enviado a ${p.nome}!`);
}

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
        const icon = document.getElementById('darkIcon');
        if (icon) icon.className = 'fas fa-sun';
    }
    
    mudarTab('home');
    if (currentUser) conectarSocket();
}

// ============================================================
//  EXPOSIÇÃO DE MÉTODOS GLOBAIS PARA O HTML
// ============================================================
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

console.log('🚀 Huambo Plus app.js carregado com sucesso.');
