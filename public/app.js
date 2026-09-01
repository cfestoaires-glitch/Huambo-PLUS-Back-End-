// ==========================================
// 1. CONFIGURAÇÃO DO SUPABASE
// ==========================================
const supabaseUrl = 'https://vpukkvxnlwyhoqpgckzh.supabase.co';
const supabaseKey = 'sb_publishable_XawUI3JjNpCjETe4tEAXwQ_QkgkVlul';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

let prestadoresCloud = [];

// ==========================================
// 2. CARREGAR APENAS PRESTADORES APROVADOS
// ==========================================
async function carregarPrestadoresDaNuvem() {
    const container = document.getElementById("container-cards");
    if (!container) return;
    
    container.innerHTML = '<p style="text-align: center; padding: 20px; color: var(--text-muted);">A carregar prestadores...</p>';

    try {
        const { data: prestadores, error } = await supabase
            .from('prestadores')
            .select('*')
            .eq('status', 'aprovado') // Apenas os aprovados pelos administradores aparecem ao público
            .order('criado_em', { ascending: false });

        if (error) throw error;

        prestadoresCloud = prestadores || [];
        renderizarPrestadores(prestadoresCloud);
    } catch (error) {
        console.error("Erro ao carregar dados:", error.message);
        container.innerHTML = '<p style="color: red; text-align: center;">Erro ao ligar à base de dados.</p>';
    }
}

// ==========================================
// 3. GERAR MODAL DE PERFIL E CHAT NA DOM
// ==========================================
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

// ==========================================
// 4. ABRIR PERFIL DO PRESTADOR COM CHAT
// ==========================================
async function abrirPerfilPrestador(p) {
    garantirModalPerfil();
    const containerModal = document.getElementById("conteudo-perfil-modal");
    
    let portfolioHtml = '<p style="color: var(--text-muted); font-size: 0.8rem;">Sem fotos de portfólio registadas.</p>';
    if (p.portfolio && p.portfolio.length > 0) {
        portfolioHtml = `<div class="portfolio-grid">
            ${p.portfolio.map(img => `<img src="${img}" class="portfolio-thumb" alt="Trabalho realizado">`).join('')}
        </div>`;
    }

    containerModal.innerHTML = `
        <h2 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 2px;">${p.nome}</h2>
        <p style="font-size: 0.8rem; color: var(--primary-color); margin-bottom: 8px;"><strong>${p.categoria}</strong> • ${p.municipio}</p>
        
        <p style="font-size: 0.8rem; margin-bottom: 2px;">📞 <strong>Contacto:</strong> ${p.telefone || 'Não especificado'}</p>
        <p style="font-size: 0.8rem; margin-bottom: 8px;">💰 <strong>Taxa de Deslocação:</strong> ${p.taxa || 0} Kz</p>
        
        <h3 style="font-size: 0.85rem; font-weight: 600; margin-top: 8px;">Portfólio</h3>
        ${portfolioHtml}

        <h3 style="font-size: 0.85rem; font-weight: 600; margin-top: 8px;">Chat Interno com o Prestador</h3>
        <div class="chat-box-container">
            <div id="chat-mensagens-${p.id}" class="chat-mensagens-list">
                <p style="text-align: center; color: var(--text-muted); font-size: 0.8rem;">A carregar mensagens...</p>
            </div>
            <div class="chat-input-row">
                <input type="text" id="input-texto-chat-${p.id}" placeholder="Escreva uma mensagem...">
                <button onclick="enviarMensagemInterna('${p.id}')">Enviar</button>
            </div>
        </div>
    `;

    document.getElementById("modal-perfil-detalhe").style.display = "flex";
    await carregarMensagensDaNuvem(p.id);
}

// ==========================================
// 5. GESTÃO DO CHAT NA NUVEM
// ==========================================
async function carregarMensagensDaNuvem(idPrestador) {
    const listaMsg = document.getElementById(`chat-mensagens-${idPrestador}`);
    if (!listaMsg) return;

    try {
        const { data: mensagens, error } = await supabase
            .from('mensagens_chat')
            .select('*')
            .eq('prestador_id', idPrestador)
            .order('criado_em', { ascending: true });

        if (error) throw error;

        if (!mensagens || mensagens.length === 0) {
            await supabase.from('mensagens_chat').insert([
                { prestador_id: idPrestador, remetente: 'recebida', texto: 'Olá! Como posso ajudar com os meus serviços?' }
            ]);
            return carregarMensagensDaNuvem(idPrestador);
        }

        listaMsg.innerHTML = mensagens.map(m => `
            <div class="chat-msg ${m.remetente}">${m.texto}</div>
        `).join('');
        listaMsg.scrollTop = listaMsg.scrollHeight;
    } catch (error) {
        console.error("Erro no chat:", error.message);
    }
}

window.enviarMensagemInterna = async function(idPrestador) {
    const input = document.getElementById(`input-texto-chat-${idPrestador}`);
    if (!input || !input.value.trim()) return;

    const textoUser = input.value.trim();
    input.value = "";

    try {
        await supabase.from('mensagens_chat').insert([
            { prestador_id: idPrestador, remetente: 'enviada', texto: textoUser }
        ]);
        await carregarMensagensDaNuvem(idPrestador);

        setTimeout(async () => {
            await supabase.from('mensagens_chat').insert([
                { prestador_id: idPrestador, remetente: 'recebida', texto: 'Mensagem registada com sucesso!' }
            ]);
            await carregarMensagensDaNuvem(idPrestador);
        }, 1000);
    } catch (error) {
        console.error("Erro ao enviar:", error.message);
    }
};

// ==========================================
// 6. FORMULÁRIO DE REGISTO COM UPLOAD (Selfie & BI)
// ==========================================
function configurarFormularioRegisto() {
    const abaRegistar = document.getElementById("aba-registar");
    if (!abaRegistar) return;

    abaRegistar.innerHTML = `
        <div class="form-box" style="max-width: 500px; margin: 20px auto; padding: 20px;">
            <h2 style="font-size: 1.1rem; margin-bottom: 12px; font-weight: 700;">Registar como Prestador</h2>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 16px;">
                Preencha os dados e anexe a sua Selfie e a foto do Bilhete de Identidade (BI) para verificação dos administradores.
            </p>
            
            <form id="form-registo-prestador">
                <div style="margin-bottom: 10px;">
                    <label style="font-size: 0.8rem; display: block; margin-bottom: 4px;">Nome Completo:</label>
                    <input type="text" id="reg-nome" required style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid #cbd5e1;">
                </div>
                
                <div style="margin-bottom: 10px;">
                    <label style="font-size: 0.8rem; display: block; margin-bottom: 4px;">Categoria / Profissão:</label>
                    <input type="text" id="reg-categoria" placeholder="Ex: Eletricista, Canalizador..." required style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid #cbd5e1;">
                </div>

                <div style="margin-bottom: 10px;">
                    <label style="font-size: 0.8rem; display: block; margin-bottom: 4px;">Município:</label>
                    <select id="reg-municipio" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid #cbd5e1;">
                        <option value="Huambo">Huambo</option>
                        <option value="Caála">Caála</option>
                        <option value="Bailundo">Bailundo</option>
                        <option value="Londuimbali">Londuimbali</option>
                    </select>
                </div>

                <div style="margin-bottom: 10px;">
                    <label style="font-size: 0.8rem; display: block; margin-bottom: 4px;">Telefone / WhatsApp:</label>
                    <input type="text" id="reg-telefone" placeholder="+244 9XX XXX XXX" required style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid #cbd5e1;">
                </div>

                <div style="margin-bottom: 10px;">
                    <label style="font-size: 0.8rem; display: block; margin-bottom: 4px;">Taxa de Deslocação (Kz):</label>
                    <input type="number" id="reg-taxa" placeholder="2000" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid #cbd5e1;">
                </div>

                <div style="margin-bottom: 10px;">
                    <label style="font-size: 0.8rem; display: block; margin-bottom: 4px;">Foto Selfie (Rosto):</label>
                    <input type="file" id="reg-file-selfie" accept="image/*" required style="width: 100%; font-size: 0.8rem;">
                </div>

                <div style="margin-bottom: 16px;">
                    <label style="font-size: 0.8rem; display: block; margin-bottom: 4px;">Foto do Bilhete de Identidade (BI):</label>
                    <input type="file" id="reg-file-bi" accept="image/*" required style="width: 100%; font-size: 0.8rem;">
                </div>

                <button type="submit" id="btn-submeter-registo" style="width: 100%; background: var(--primary-color); color: white; border: none; padding: 10px; border-radius: 6px; font-weight: 600; cursor: pointer;">
                    Submeter para Aprovação
                </button>
            </form>
            
            <div style="margin-top: 20px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 12px;">
                <button onclick="abrirPainelAdmin()" style="background: #334155; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-size: 0.75rem; cursor: pointer;">
                    ⚙️ Aceder Painel de Administração
                </button>
            </div>
        </div>
    `;

    const form = document.getElementById("form-registo-prestador");
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const btn = document.getElementById("btn-submeter-registo");
        btn.disabled = true;
        btn.innerText = "A enviar documentos e a registar...";

        try {
            const nome = document.getElementById("reg-nome").value;
            const categoria = document.getElementById("reg-categoria").value;
            const municipio = document.getElementById("reg-municipio").value;
            const telefone = document.getElementById("reg-telefone").value;
            const taxa = document.getElementById("reg-taxa").value || 0;
            
            const fileSelfie = document.getElementById("reg-file-selfie").files[0];
            const fileBi = document.getElementById("reg-file-bi").files[0];

            const nomeFicheiroSelfie = `selfie_${Date.now()}_${fileSelfie.name}`;
            const nomeFicheiroBi = `bi_${Date.now()}_${fileBi.name}`;

            // Upload Selfie para o Supabase Storage
            const { error: errSelfie } = await supabase.storage
                .from('documentos-prestadores')
                .upload(nomeFicheiroSelfie, fileSelfie);
            if (errSelfie) throw errSelfie;

            // Upload BI para o Supabase Storage
            const { error: errBi } = await supabase.storage
                .from('documentos-prestadores')
                .upload(nomeFicheiroBi, fileBi);
            if (errBi) throw errBi;

            // Obter URLs públicas das imagens
            const urlSelfie = supabase.storage.from('documentos-prestadores').getPublicUrl(nomeFicheiroSelfie).data.publicUrl;
            const urlBi = supabase.storage.from('documentos-prestadores').getPublicUrl(nomeFicheiroBi).data.publicUrl;

            // Inserir na tabela prestadores com status 'pendente'
            const { error: errInsert } = await supabase.from('prestadores').insert([{
                nome,
                categoria,
                municipio,
                telefone,
                taxa: Number(taxa),
                is_piloto: false,
                status: 'pendente',
                foto_selfie: urlSelfie,
                foto_bi: urlBi
            }]);

            if (errInsert) throw errInsert;

            alert("Registo submetido com sucesso! O seu perfil aguarda aprovação dos administradores.");
            form.reset();
        } catch (error) {
            console.error("Erro no registo:", error.message);
            alert("Erro ao submeter o registo: " + error.message);
        } finally {
            btn.disabled = false;
            btn.innerText = "Submeter para Aprovação";
        }
    });
}

// ==========================================
// 7. PAINEL DE ADMINISTRAÇÃO (Aprovação de Prestadores)
// ==========================================
window.abrirPainelAdmin = async function() {
    garantirModalPerfil();
    const containerModal = document.getElementById("conteudo-perfil-modal");

    containerModal.innerHTML = `
        <h2 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 4px;">Painel de Administração</h2>
        <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 12px;">Analise os documentos e aprove ou rejeite novos prestadores.</p>
        <div id="lista-pendentes-admin"><p style="text-align: center; color: var(--text-muted);">A carregar registos pendentes...</p></div>
    `;

    document.getElementById("modal-perfil-detalhe").style.display = "flex";

    try {
        const { data: pendentes, error } = await supabase
            .from('prestadores')
            .select('*')
            .eq('status', 'pendente')
            .order('criado_em', { ascending: false });

        if (error) throw error;

        const listaDiv = document.getElementById("lista-pendentes-admin");
        if (!pendentes || pendentes.length === 0) {
            listaDiv.innerHTML = `<p style="text-align: center; padding: 20px; color: var(--text-muted);">Não há prestadores pendentes de aprovação neste momento.</p>`;
            return;
        }

        listaDiv.innerHTML = pendentes.map(p => `
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 12px;">
                <h3 style="font-size: 0.95rem; font-weight: 700; color: #0f172a;">${p.nome}</h3>
                <p style="font-size: 0.8rem; margin: 2px 0;"><strong>Profissão:</strong> ${p.categoria} | <strong>Município:</strong> ${p.municipio}</p>
                <p style="font-size: 0.8rem; margin: 2px 0;"><strong>Telefone:</strong> ${p.telefone} | <strong>Taxa:</strong> ${p.taxa} Kz</p>
                
                <div style="display: flex; gap: 10px; margin: 10px 0;">
                    <div style="flex: 1; text-align: center;">
                        <span style="font-size: 0.7rem; font-weight: 600; display: block;">Selfie</span>
                        <a href="${p.foto_selfie}" target="_blank"><img src="${p.foto_selfie}" style="width: 100%; height: 80px; object-fit: cover; border-radius: 4px; border: 1px solid #cbd5e1;"></a>
                    </div>
                    <div style="flex: 1; text-align: center;">
                        <span style="font-size: 0.7rem; font-weight: 600; display: block;">Bilhete de Identidade (BI)</span>
                        <a href="${p.foto_bi}" target="_blank"><img src="${p.foto_bi}" style="width: 100%; height: 80px; object-fit: cover; border-radius: 4px; border: 1px solid #cbd5e1;"></a>
                    </div>
                </div>

                <div style="display: flex; gap: 8px; margin-top: 10px;">
                    <button onclick="alterarEstadoPrestador('${p.id}', 'aprovado')" style="flex: 1; background: #16a34a; color: white; border: none; padding: 8px; border-radius: 4px; font-weight: 600; font-size: 0.8rem; cursor: pointer;">Aprovar</button>
                    <button onclick="alterarEstadoPrestador('${p.id}', 'rejeitado')" style="flex: 1; background: #dc2626; color: white; border: none; padding: 8px; border-radius: 4px; font-weight: 600; font-size: 0.8rem; cursor: pointer;">Rejeitar</button>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error("Erro ao carregar painel admin:", error.message);
        document.getElementById("lista-pendentes-admin").innerHTML = `<p style="color: red; text-align: center;">Erro ao carregar pendentes.</p>`;
    }
};

window.alterarEstadoPrestador = async function(id, novoEstado) {
    try {
        const { error } = await supabase
            .from('prestadores')
            .update({ status: novoEstado })
            .eq('id', id);

        if (error) throw error;

        alert(`Prestador ${novoEstado} com sucesso!`);
        abrirPainelAdmin(); // Atualiza a lista do painel
        carregarPrestadoresDaNuvem(); // Atualiza a lista pública se foi aprovado
    } catch (error) {
        console.error("Erro ao atualizar estado:", error.message);
        alert("Erro ao processar a solicitação.");
    }
};

// ==========================================
// 8. RENDERIZAR GRELHA PÚBLICA
// ==========================================
function renderizarPrestadores(lista) {
    const container = document.getElementById("container-cards");
    if (!container) return;
    
    container.innerHTML = "";

    if (!lista || lista.length === 0) {
        container.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 20px;">Nenhum prestador aprovado encontrado.</p>`;
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

// ==========================================
// 9. INICIALIZAÇÃO DA APLICAÇÃO
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    carregarPrestadoresDaNuvem();
    configurarFormularioRegisto();

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
