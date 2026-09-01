// 1. Configuração do Supabase
const supabaseUrl = 'https://vpukkvxnlwyhoqpgckzh.supabase.co';
const supabaseKey = 'sb_publishable_XawUI3JjNpCjETe4tEAXwQ_QkgkVlul';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Variável global para guardar os prestadores que vêm da nuvem
let prestadoresCloud = [];

// 2. Função para ir buscar os dados reais à Base de Dados
async function carregarPrestadoresDaNuvem() {
    const container = document.getElementById("container-cards");
    if (!container) return;
    
    container.innerHTML = '<p style="text-align: center; padding: 20px; color: var(--text-muted);">A carregar prestadores da nuvem...</p>';

    try {
        const { data: prestadores, error } = await supabase
            .from('prestadores')
            .select('*')
            .order('criado_em', { ascending: false });

        if (error) throw error;

        prestadoresCloud = prestadores || [];
        renderizarPrestadores(prestadoresCloud);
    } catch (error) {
        console.error("Erro ao carregar dados:", error.message);
        container.innerHTML = '<p style="color: red; text-align: center;">Erro ao ligar à base de dados. Verifica a ligação.</p>';
    }
}

// 3. Garantir que o Modal de Perfil e Chat existe no DOM
function garantirModalPerfil() {
    if (document.getElementById("modal-perfil-detalhe")) return;

    const modalHtml = `
        <div id="modal-perfil-detalhe" class="modal">
            <div class="modal-content" style="max-height: 90vh; overflow-y: auto;">
                <span class="close-modal" id="fechar-modal-perfil">&times;</span>
                <div id="conteudo-perfil-modal"></div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML("beforeend", modalHtml);

    document.getElementById("fechar-modal-perfil").addEventListener("click", () => {
        document.getElementById("modal-perfil-detalhe").style.display = "none";
    });
}

// 4. Abrir Perfil com Portfólio e Chat Interno
function abrirPerfilPrestador(p) {
    garantirModalPerfil();
    const containerModal = document.getElementById("conteudo-perfil-modal");
    
    const badgeHtml = p.is_piloto ? `<span class="badge-piloto"><i class="fa-solid fa-star"></i> Perfil Piloto / Exemplo</span><br>` : '';
    
    // Portfólio
    let portfolioHtml = '<p style="color: var(--text-muted); font-size: 0.8rem;">Sem fotos de portfólio registadas.</p>';
    if (p.portfolio && p.portfolio.length > 0) {
        portfolioHtml = `<div class="portfolio-grid">
            ${p.portfolio.map(img => `<img src="${img}" class="portfolio-thumb" alt="Trabalho realizado">`).join('')}
        </div>`;
    }

    // Estrutura padrão de chat local temporária para demonstração do perfil selecionado
    if (!p.mensagens) {
        p.mensagens = [
            { remetente: "recebida", texto: `Olá! Sou o/a ${p.nome}. Como posso ajudar com os meus serviços em ${p.municipio}?` }
        ];
    }

    containerModal.innerHTML = `
        ${badgeHtml}
        <h2 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 2px;">${p.nome}</h2>
        <p style="font-size: 0.8rem; color: var(--primary-color); margin-bottom: 8px;"><strong>${p.categoria}</strong> • ${p.municipio}</p>
        
        <p style="font-size: 0.8rem; margin-bottom: 2px;">📞 <strong>Contacto:</strong> ${p.telefone || 'Não especificado'}</p>
        <p style="font-size: 0.8rem; margin-bottom: 8px;">💰 <strong>Taxa de Deslocação:</strong> ${p.taxa || 0} Kz</p>
        
        <h3 style="font-size: 0.85rem; font-weight: 600; margin-top: 8px;">Portfólio de Trabalhos</h3>
        ${portfolioHtml}

        <h3 style="font-size: 0.85rem; font-weight: 600; margin-top: 8px;">Chat Interno com o Prestador</h3>
        <div class="chat-box-container">
            <div id="chat-mensagens-${p.id}" class="chat-mensagens-list"></div>
            <div class="chat-input-row">
                <input type="text" id="input-texto-chat-${p.id}" placeholder="Escreva uma mensagem segura...">
                <button onclick="enviarMensagemInterna('${p.id}')">Enviar</button>
            </div>
        </div>
    `;

    document.getElementById("modal-perfil-detalhe").style.display = "flex";
    atualizarEcraChat(p);
}

// 5. Atualizar o Ecrã de Chat
function atualizarEcraChat(p) {
    const listaMsg = document.getElementById(`chat-mensagens-${p.id}`);
    if (!listaMsg) return;

    listaMsg.innerHTML = p.mensagens.map(m => `
        <div class="chat-msg ${m.remetente}">${m.texto}</div>
    `).join('');
    listaMsg.scrollTop = listaMsg.scrollHeight;
}

// 6. Enviar Mensagem no Chat Interno
window.enviarMensagemInterna = function(idPrestador) {
    const input = document.getElementById(`input-texto-chat-${idPrestador}`);
    if (!input || !input.value.trim()) return;

    const textoUser = input.value.trim();
    const prestador = prestadoresCloud.find(x => x.id === idPrestador);

    if (prestador) {
        if (!prestador.mensagens) prestador.mensagens = [];
        
        prestador.mensagens.push({ remetente: "enviada", texto: textoUser });
        input.value = "";
        atualizarEcraChat(prestador);

        // Resposta simulada automática do prestador
        setTimeout(() => {
            prestador.mensagens.push({ remetente: "recebida", texto: "Mensagem registada com sucesso na plataforma Huambo Plus!" });
            atualizarEcraChat(prestador);
        }, 1000);
    }
};

// 7. Renderizar a Grelha de Cartões
function renderizarPrestadores(lista) {
    const container = document.getElementById("container-cards");
    if (!container) return;
    
    container.innerHTML = "";

    if (!lista || lista.length === 0) {
        container.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 20px;">Nenhum prestador encontrado.</p>`;
        return;
    }

    lista.forEach(p => {
        const badgeHtml = p.is_piloto ? `<span class="badge-piloto"><i class="fa-solid fa-star"></i> Perfil Piloto / Exemplo</span>` : '';
        
        const card = document.createElement("div");
        card.className = "form-box";
        card.style.cursor = "pointer";
        card.innerHTML = `
            ${badgeHtml}
            <h3 style="font-size: 1rem; font-weight: 700;">${p.nome}</h3>
            <p style="font-size: 0.85rem; color: var(--primary-color);"><strong>${p.categoria}</strong> • ${p.municipio}</p>
            <p style="font-size: 0.85rem; margin-top: 4px;">💰 Taxa: ${p.taxa || 0} Kz</p>
        `;

        card.addEventListener("click", () => abrirPerfilPrestador(p));
        container.appendChild(card);
    });
}

// 8. Inicialização Geral ao Carregar a Página
document.addEventListener("DOMContentLoaded", () => {
    carregarPrestadoresDaNuvem();

    const btnPesquisar = document.getElementById("btn-executar-busca");
    const campoBusca = document.getElementById("campo-busca");
    const filtroMunicipio = document.getElementById("filtro-municipio");

    if (btnPesquisar) {
        btnPesquisar.addEventListener("click", () => {
            const termo = campoBusca.value.toLowerCase().trim();
            const municipioSelecionado = filtroMunicipio.value;

            const resultados = prestadoresCloud.filter(p => {
                const matchTexto = (p.nome && p.nome.toLowerCase().includes(termo)) || 
                                   (p.categoria && p.categoria.toLowerCase().includes(termo));
                const matchMunicipio = municipioSelecionado === "" || p.municipio === municipioSelecionado;
                return matchTexto && matchMunicipio;
            });

            renderizarPrestadores(resultados);
        });
    }

    // Navegação inferior por abas
    const navButtons = document.querySelectorAll(".nav-btn");
    navButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            navButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            const tabId = btn.getAttribute("data-tab");
            document.querySelectorAll(".tab-content").forEach(tab => {
                tab.classList.remove("active");
            });
            const abaAlvo = document.getElementById(`aba-${tabId}`);
            if (abaAlvo) abaAlvo.classList.add("active");
        });
    });
});
