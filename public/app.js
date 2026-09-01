// Dados Piloto com Portfólio, Avaliações e Chat Interno
const dadosPiloto = [
    {
        id: "piloto-1",
        nome: "António Canalizador (Exemplo)",
        categoria: "Canalizador",
        municipio: "Huambo",
        telefone: "+244 923 000 001",
        taxa: 2000,
        isPiloto: true,
        portfolio: [
            "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=300",
            "https://images.unsplash.com/photo-1542013936697-07464cf03bb9?w=300"
        ],
        avaliacoes: [
            { nota: 5, comentario: "Excelente profissional, resolveu a fuga de água muito rápido!" },
            { nota: 4, comentario: "Bom atendimento e pontualidade." }
        ],
        mensagens: [
            { remetente: "recebida", texto: "Olá! Como posso ajudar com a sua canalização hoje?" }
        ]
    },
    {
        id: "piloto-2",
        nome: "Joaquim Eletricista (Exemplo)",
        categoria: "Eletricista",
        municipio: "Caála",
        telefone: "+244 912 000 002",
        taxa: 2500,
        isPiloto: true,
        portfolio: [
            "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=300"
        ],
        avaliacoes: [
            { nota: 5, comentario: "Instalou o quadro elétrico perfeitamente." }
        ],
        mensagens: [
            { remetente: "recebida", texto: "Boa tarde, faço instalações e reparações elétricas. Em que zona está?" }
        ]
    }
];

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

function abrirPerfilPrestador(p) {
    garantirModalPerfil();
    const containerModal = document.getElementById("conteudo-perfil-modal");
    
    const badgeHtml = p.isPiloto ? `<span class="badge-piloto"><i class="fa-solid fa-star"></i> Perfil Piloto / Exemplo</span><br>` : '';
    
    let portfolioHtml = '<p style="color: var(--text-muted); font-size: 0.8rem;">Sem fotos de portfólio registadas.</p>';
    if (p.portfolio && p.portfolio.length > 0) {
        portfolioHtml = `<div class="portfolio-grid">
            ${p.portfolio.map(img => `<img src="${img}" class="portfolio-thumb" alt="Trabalho realizado">`).join('')}
        </div>`;
    }

    let avaliacoesHtml = '<p style="color: var(--text-muted); font-size: 0.8rem;">Ainda sem avaliações.</p>';
    if (p.avaliacoes && p.avaliacoes.length > 0) {
        avaliacoesHtml = p.avaliacoes.map(a => `
            <div style="background: var(--bg-color); padding: 6px 8px; border-radius: 4px; margin-bottom: 4px; border: 1px solid var(--border-color);">
                <div style="color: #f59e0b; font-size: 0.75rem;">${'⭐'.repeat(a.nota)}</div>
                <p style="font-size: 0.75rem; color: var(--text-color);">"${a.comentario}"</p>
            </div>
        `).join('');
    }

    containerModal.innerHTML = `
        ${badgeHtml}
        <h2 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 2px;">${p.nome}</h2>
        <p style="font-size: 0.8rem; color: var(--primary-color); margin-bottom: 8px;"><strong>${p.categoria}</strong> • ${p.municipio}</p>
        
        <p style="font-size: 0.8rem; margin-bottom: 4px;">💰 <strong>Taxa de Deslocação:</strong> ${p.taxa || 0} Kz</p>
        
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

        <h3 style="font-size: 0.85rem; font-weight: 600; margin-top: 8px;">Avaliações (${p.avaliacoes ? p.avaliacoes.length : 0})</h3>
        <div style="max-height: 100px; overflow-y: auto; margin-top: 4px;">
            ${avaliacoesHtml}
        </div>
    `;

    document.getElementById("modal-perfil-detalhe").style.display = "flex";
    atualizarEcraChat(p);
}

function atualizarEcraChat(p) {
    const listaMsg = document.getElementById(`chat-mensagens-${p.id}`);
    if (!listaMsg) return;

    listaMsg.innerHTML = p.mensagens.map(m => `
        <div class="chat-msg ${m.remetente}">${m.texto}</div>
    `).join('');
    listaMsg.scrollTop = listaMsg.scrollHeight;
}

window.enviarMensagemInterna = function(idPrestador) {
    const input = document.getElementById(`input-texto-chat-${idPrestador}`);
    if (!input || !input.value.trim()) return;

    const textoUser = input.value.trim();
    const prestador = dadosPiloto.find(x => x.id === idPrestador);

    if (prestador) {
        prestador.mensagens.push({ remetente: "enviada", texto: textoUser });
        input.value = "";
        atualizarEcraChat(prestador);

        setTimeout(() => {
            prestador.mensagens.push({ remetente: "recebida", texto: "Mensagem recebida com sucesso na plataforma Huambo Plus!" });
            atualizarEcraChat(prestador);
        }, 1000);
    }
};

function renderizarPrestadores(lista) {
    const container = document.getElementById("container-cards");
    if (!container) return;
    
    container.innerHTML = "";

    if (!lista || lista.length === 0) {
        container.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 20px;">Nenhum prestador encontrado.</p>`;
        return;
    }

    lista.forEach(p => {
        const badgeHtml = p.isPiloto ? `<span class="badge-piloto"><i class="fa-solid fa-star"></i> Perfil Piloto / Exemplo</span>` : '';
        
        let mediaAvaliacao = '';
        if (p.avaliacoes && p.avaliacoes.length > 0) {
            const media = (p.avaliacoes.reduce((acc, curr) => acc + curr.nota, 0) / p.avaliacoes.length).toFixed(1);
            mediaAvaliacao = `<span style="font-size: 0.8rem; color: #f59e0b;">⭐ ${media}</span>`;
        }

        const card = document.createElement("div");
        card.className = "form-box";
        card.style.cursor = "pointer";
        card.innerHTML = `
            ${badgeHtml}
            <h3 style="font-size: 1rem; font-weight: 700;">${p.nome}</h3>
            <p style="font-size: 0.85rem; color: var(--primary-color);"><strong>${p.categoria}</strong> • ${p.municipio}</p>
            <p style="font-size: 0.85rem; display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
                <span>💰 Taxa: ${p.taxa || 0} Kz</span>
                ${mediaAvaliacao}
            </p>
        `;

        card.addEventListener("click", () => abrirPerfilPrestador(p));
        container.appendChild(card);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    renderizarPrestadores(dadosPiloto);

    const btnPesquisar = document.getElementById("btn-executar-busca");
    const campoBusca = document.getElementById("campo-busca");
    const filtroMunicipio = document.getElementById("filtro-municipio");

    if (btnPesquisar) {
        btnPesquisar.addEventListener("click", () => {
            const termo = campoBusca.value.toLowerCase().trim();
            const municipioSelecionado = filtroMunicipio.value;

            const resultados = dadosPiloto.filter(p => {
                const matchTexto = p.nome.toLowerCase().includes(termo) || 
                                   p.categoria.toLowerCase().includes(termo);
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
            document.getElementById(`aba-${tabId}`).classList.add("active");
        });
    });
});
