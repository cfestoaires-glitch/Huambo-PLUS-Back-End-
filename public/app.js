// ==========================================
// 1. CONFIGURAÇÃO DO SUPABASE
// ==========================================
const supabaseUrl = 'https://vpukkvxnlwyhoqpgckzh.supabase.co';
const supabaseKey = 'sb_publishable_XawUI3JjNpCjETe4tEAXwQ_QkgkVlul';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

let prestadoresCloud = [];

// ==========================================
// 2. CARREGAR PRESTADORES APROVADOS
// ==========================================
async function carregarPrestadoresDaNuvem() {
    const container = document.getElementById("container-cards");
    if (!container) return;
    
    container.innerHTML = '<p style="text-align: center; padding: 20px; color: var(--text-muted);">A carregar prestadores...</p>';

    try {
        const { data: prestadores, error } = await supabase
            .from('prestadores')
            .select('*')
            .eq('status', 'aprovado')
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
// 3. MODAL DE PERFIL E CHAT
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

async function abrirPerfilPrestador(p) {
    garantirModalPerfil();
    const containerModal = document.getElementById("conteudo-perfil-modal");
    
    containerModal.innerHTML = `
        <h2 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 2px;">${p.nome}</h2>
        <p style="font-size: 0.8rem; color: var(--primary-color); margin-bottom: 8px;"><strong>${p.categoria}</strong> • ${p.municipio}</p>
        
        <p style="font-size: 0.8rem; margin-bottom: 2px;">📞 <strong>Contacto:</strong> ${p.telefone || 'Não especificado'}</p>
        <p style="font-size: 0.8rem; margin-bottom: 8px;">💰 <strong>Taxa de Deslocação:</strong> ${p.taxa || 0} Kz</p>
        
        <h3 style="font-size: 0.85rem; font-weight: 600; margin-top: 12px;">Chat com o Prestador</h3>
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
                { prestador_id: idPrestador, remetente: 'recebida', texto: 'Olá! Como posso ajudar?' }
            ]);
            return carregarMensagensDaNuvem(idPrestador);
        }

        listaMsg.innerHTML = mensagens.map(m => `<div class="chat-msg ${m.remetente}">${m.texto}</div>`).join('');
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
        await supabase.from('mensagens_chat').insert([{ prestador_id: idPrestador, remetente: 'enviada', texto: textoUser }]);
        await carregarMensagensDaNuvem(idPrestador);
    } catch (error) {
        console.error("Erro ao enviar:", error.message);
    }
};

// ==========================================
// 4. GESTÃO DE ABAS E ESCOLHA DE PERFIL
// ==========================================
function configurarEcraRegistoEEntrada() {
    const abaRegistar = document.getElementById("aba-registar");
    if (!abaRegistar) return;

    abaRegistar.innerHTML = `
        <div style="max-width: 450px; margin: 15px auto; padding: 15px; background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <h2 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 6px; color: #0f172a; text-align: center;">Bem-vindo ao Huambo Plus</h2>
            <p style="font-size: 0.78rem; color: #64748b; margin-bottom: 16px; text-align: center;">Selecione o tipo de conta que deseja aceder ou criar:</p>
            
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <button onclick="mostrarRegistoCliente()" style="padding: 12px; background: #2563eb; color: white; border: none; border-radius: 8px; font-weight: 600; font-size: 0.85rem; cursor: pointer;">
                    👤 Entrar / Registar como Cliente
                </button>
                <button onclick="mostrarRegistoPrestador()" style="padding: 12px; background: #0f172a; color: white; border: none; border-radius: 8px; font-weight: 600; font-size: 0.85rem; cursor: pointer;">
                    🛠️ Registar como Prestador (com Selfie e BI)
                </button>
                <button onclick="abrirPainelAdmin()" style="padding: 12px; background: #475569; color: white; border: none; border-radius: 8px; font-weight: 600; font-size: 0.85rem; cursor: pointer;">
                    ⚙️ Painel de Administração
                </button>
            </div>
            
            <div id="sub-conteudo-registo" style="margin-top: 15px;"></div>
        </div>
    `;
}

window.mostrarRegistoCliente = function() {
    const sub = document.getElementById("sub-conteudo-registo");
    sub.innerHTML = `
        <div style="border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 12px;">
            <h3 style="font-size: 0.9rem; font-weight: 700; margin-bottom: 8px;">Área de Cliente</h3>
            <p style="font-size: 0.75rem; color: #64748b; margin-bottom: 10px;">Como cliente, pode pesquisar serviços e contactar prestadores livremente.</p>
            <button onclick="alert('Sessão de cliente ativa! Pode navegar pelos serviços na aba Buscar.')" style="width: 100%; padding: 8px; background: #16a34a; color: white; border: none; border-radius: 6px; font-size: 0.8rem; cursor: pointer; font-weight: 600;">Continuar como Cliente</button>
        </div>
    `;
};

window.mostrarRegistoPrestador = function() {
    const sub = document.getElementById("sub-conteudo-registo");
    sub.innerHTML = `
        <div style="border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 12px;">
            <h3 style="font-size: 0.9rem; font-weight: 700; margin-bottom: 8px;">Registo de Prestador</h3>
            <form id="form-registo-prestador-real">
                <input type="text" id="reg-nome" placeholder="Nome Completo" required style="width:100%; padding:8px; margin-bottom:8px; border:1px solid #cbd5e1; border-radius:6px; font-size:0.8rem;">
                <input type="text" id="reg-categoria" placeholder="Categoria (Ex: Eletricista)" required style="width:100%; padding:8px; margin-bottom:8px; border:1px solid #cbd5e1; border-radius:6px; font-size:0.8rem;">
                <select id="reg-municipio" style="width:100%; padding:8px; margin-bottom:8px; border:1px solid #cbd5e1; border-radius:6px; font-size:0.8rem;">
                    <option value="Huambo">Huambo</option>
                    <option value="Caála">Caála</option>
                    <option value="Bailundo">Bailundo</option>
                </select>
                <input type="text" id="reg-telefone" placeholder="Telefone / WhatsApp" required style="width:100%; padding:8px; margin-bottom:8px; border:1px solid #cbd5e1; border-radius:6px; font-size:0.8rem;">
                <input type="number" id="reg-taxa" placeholder="Taxa de Deslocação (Kz)" style="width:100%; padding:8px; margin-bottom:8px; border:1px solid #cbd5e1; border-radius:6px; font-size:0.8rem;">
                
                <label style="font-size:0.75rem; display:block; margin-bottom:2px;">Foto Selfie:</label>
                <input type="file" id="reg-file-selfie" accept="image/*" required style="width:100%; font-size:0.75rem; margin-bottom:8px;">
                
                <label style="font-size:0.75rem; display:block; margin-bottom:2px;">Foto do BI:</label>
                <input type="file" id="reg-file-bi" accept="image/*" required style="width:100%; font-size:0.75rem; margin-bottom:12px;">

                <button type="submit" id="btn-submeter" style="width:100%; background:#2563eb; color:white; border:none; padding:10px; border-radius:6px; font-weight:600; font-size:0.8rem; cursor:pointer;">Submeter Registo</button>
            </form>
        </div>
    `;

    document.getElementById("form-registo-prestador-real").addEventListener("submit", async (e) => {
        e.preventDefault();
        const btn = document.getElementById("btn-submeter");
        btn.disabled = true;
        btn.innerText = "A enviar dados...";

        try {
            const nome = document.getElementById("reg-nome").value;
            const categoria = document.getElementById("reg-categoria").value;
            const municipio = document.getElementById("reg-municipio").value;
            const telefone = document.getElementById("reg-telefone").value;
            const taxa = document.getElementById("reg-taxa").value || 0;
            
            const fileSelfie = document.getElementById("reg-file-selfie").files[0];
            const fileBi = document.getElementById("reg-file-bi").files[0];

            const nomeSelfie = `selfie_${Date.now()}_${fileSelfie.name}`;
            const nomeBi = `bi_${Date.now()}_${fileBi.name}`;

            await supabase.storage.from('documentos-prestadores').upload(nomeSelfie, fileSelfie);
            await supabase.storage.from('documentos-prestadores').upload(nomeBi, fileBi);

            const urlSelfie = supabase.storage.from('documentos-prestadores').getPublicUrl(nomeSelfie).data.publicUrl;
            const urlBi = supabase.storage.from('documentos-prestadores').getPublicUrl(nomeBi).data.publicUrl;

            const { error } = await supabase.from('prestadores').insert([{
                nome, categoria, municipio, telefone, taxa: Number(taxa),
                status: 'pendente', foto_selfie: urlSelfie, foto_bi: urlBi
            }]);

            if (error) throw error;
            alert("Registo submetido com sucesso! Aguarda aprovação do administrador.");
            configurarEcraRegistoEEntrada();
        } catch (err) {
            alert("Erro ao submeter: " + err.message);
        } finally {
            btn.disabled = false;
            btn.innerText = "Submeter Registo";
        }
    });
};

// ==========================================
// 5. PAINEL DE ADMINISTRAÇÃO
// ==========================================
window.abrirPainelAdmin = async function() {
    garantirModalPerfil();
    const containerModal = document.getElementById("conteudo-perfil-modal");

    containerModal.innerHTML = `
        <h2 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 4px;">Painel de Administração</h2>
        <p style="font-size: 0.8rem; color: #64748b; margin-bottom: 12px;">Aprova ou rejeita novos prestadores pendentes.</p>
        <div id="lista-pendentes-admin"><p style="text-align: center; color: #64748b;">A carregar...</p></div>
    `;

    document.getElementById("modal-perfil-detalhe").style.display = "flex";

    try {
        const { data: pendentes, error } = await supabase
            .from('prestadores')
            .select('*')
            .eq('status', 'pendente');

        if (error) throw error;

        const listaDiv = document.getElementById("lista-pendentes-admin");
        if (!pendentes || pendentes.length === 0) {
            listaDiv.innerHTML = `<p style="text-align: center; padding: 15px; color: #64748b; font-size: 0.8rem;">Sem prestadores pendentes neste momento.</p>`;
            return;
        }

        listaDiv.innerHTML = pendentes.map(p => `
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin-bottom: 10px;">
                <h3 style="font-size: 0.9rem; font-weight: 700;">${p.nome}</h3>
                <p style="font-size: 0.75rem; margin: 2px 0;"><strong>Profissão:</strong> ${p.categoria} | <strong>Município:</strong> ${p.municipio}</p>
                <p style="font-size: 0.75rem; margin: 2px 0;"><strong>Contacto:</strong> ${p.telefone} | <strong>Taxa:</strong> ${p.taxa} Kz</p>
                
                <div style="display: flex; gap: 8px; margin: 8px 0;">
                    <div style="flex:1; text-align:center;"><span style="font-size:0.65rem;">Selfie</span><a href="${p.foto_selfie}" target="_blank"><img src="${p.foto_selfie}" style="width:100%; height:60px; object-fit:cover; border-radius:4px;"></a></div>
                    <div style="flex:1; text-align:center;"><span style="font-size:0.65rem;">BI</span><a href="${p.foto_bi}" target="_blank"><img src="${p.foto_bi}" style="width:100%; height:60px; object-fit:cover; border-radius:4px;"></a></div>
                </div>

                <div style="display: flex; gap: 6px;">
                    <button onclick="alterarEstadoPrestador('${p.id}', 'aprovado')" style="flex:1; background:#16a34a; color:white; border:none; padding:6px; border-radius:4px; font-size:0.75rem; font-weight:600; cursor:pointer;">Aprovar</button>
                    <button onclick="alterarEstadoPrestador('${p.id}', 'rejeitado')" style="flex:1; background:#dc2626; color:white; border:none; padding:6px; border-radius:4px; font-size:0.75rem; font-weight:600; cursor:pointer;">Rejeitar</button>
                </div>
            </div>
        `).join('');
    } catch (err) {
        document.getElementById("lista-pendentes-admin").innerHTML = `<p style="color:red; text-align:center; font-size:0.8rem;">Erro ao carregar painel.</p>`;
    }
};

window.alterarEstadoPrestador = async function(id, estado) {
    try {
        await supabase.from('prestadores').update({ status: estado }).eq('id', id);
        alert(`Prestador ${estado} com sucesso!`);
        abrirPainelAdmin();
        carregarPrestadoresDaNuvem();
    } catch (err) {
        alert("Erro ao alterar estado.");
    }
};

// ==========================================
// 6. RENDERIZAÇÃO PÚBLICA
// ==========================================
function renderizarPrestadores(lista) {
    const container = document.getElementById("container-cards");
    if (!container) return;
    
    container.innerHTML = "";
    if (!lista || lista.length === 0) {
        container.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 20px; font-size: 0.85rem;">Nenhum prestador aprovado encontrado.</p>`;
        return;
    }

    lista.forEach(p => {
        const card = document.createElement("div");
        card.className = "form-box";
        card.style.cursor = "pointer";
        card.innerHTML = `
            <h3 style="font-size: 0.95rem; font-weight: 700;">${p.nome}</h3>
            <p style="font-size: 0.8rem; color: var(--primary-color);"><strong>${p.categoria}</strong> • ${p.municipio}</p>
            <p style="font-size: 0.8rem; margin-top: 4px;">💰 Taxa: ${p.taxa || 0} Kz</p>
        `;
        card.addEventListener("click", () => abrirPerfilPrestador(p));
        container.appendChild(card);
    });
}

// ==========================================
// 7. INICIALIZAÇÃO
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    carregarPrestadoresDaNuvem();
    configurarEcraRegistoEEntrada();

    const navButtons = document.querySelectorAll(".nav-btn");
    navButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            navButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            const tabId = btn.getAttribute("data-tab");
            document.querySelectorAll(".tab-content").forEach(tab => tab.classList.remove("active"));
            const abaAlvo = document.getElementById(`aba-${tabId}`);
            if (abaAlvo) abaAlvo.classList.add("active");
        });
    });
});
