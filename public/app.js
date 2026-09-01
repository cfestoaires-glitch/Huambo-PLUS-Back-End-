// ==========================================
// TESTE DE ARRANQUE
// ==========================================
alert("O app.js arrancou!");

// ==========================================
// 1. CONFIGURAÇÃO DO SUPABASE
// ==========================================
const supabaseUrl = 'https://vpukkvxnlwyhoqpgckzh.supabase.co';
const supabaseKey = 'sb_publishable_XawUI3JjNpCjETe4tEAXwQ_QkgkVlul';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

let prestadoresCloud = [];

// ==========================================
// 2. INICIALIZAÇÃO DA APLICAÇÃO
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    configurarEcraInicial();
    carregarPrestadoresAprovados();
});

// ==========================================
// 3. MENU PRINCIPAL (OS 3 PERFIS)
// ==========================================
function configurarEcraInicial() {
    const abaRegistar = document.getElementById("aba-registar");
    if (!abaRegistar) return;

    abaRegistar.innerHTML = `
        <div style="max-width: 450px; margin: 20px auto; padding: 20px; background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
            <h2 style="font-size: 1.2rem; font-weight: 700; margin-bottom: 6px; color: #0f172a; text-align: center;">Huambo Plus</h2>
            <p style="font-size: 0.8rem; color: #64748b; margin-bottom: 20px; text-align: center;">Selecione o seu perfil para continuar:</p>
            
            <div style="display: flex; flex-direction: column; gap: 12px;">
                <button id="btn-perfil-cliente" style="padding: 14px; background: #2563eb; color: white; border: none; border-radius: 8px; font-weight: 600; font-size: 0.9rem; cursor: pointer; text-align: left; display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 1.2rem;">👤</span> 
                    <div>
                        <div>Área de Cliente</div>
                        <div style="font-size: 0.75rem; font-weight: 400; opacity: 0.9;">Pesquisar serviços e falar com prestadores</div>
                    </div>
                </button>

                <button id="btn-perfil-prestador" style="padding: 14px; background: #0f172a; color: white; border: none; border-radius: 8px; font-weight: 600; font-size: 0.9rem; cursor: pointer; text-align: left; display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 1.2rem;">🛠️</span> 
                    <div>
                        <div>Registar como Prestador</div>
                        <div style="font-size: 0.75rem; font-weight: 400; opacity: 0.9;">Criar perfil profissional com Selfie e BI</div>
                    </div>
                </button>

                <button id="btn-perfil-admin" style="padding: 14px; background: #475569; color: white; border: none; border-radius: 8px; font-weight: 600; font-size: 0.9rem; cursor: pointer; text-align: left; display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 1.2rem;">⚙️</span> 
                    <div>
                        <div>Painel de Administração</div>
                        <div style="font-size: 0.75rem; font-weight: 400; opacity: 0.9;">Aprovar prestadores e gerir a plataforma</div>
                    </div>
                </button>
            </div>
            
            <div id="conteudo-dinamico-perfil" style="margin-top: 20px;"></div>
        </div>
    `;

    // Atribuir eventos aos botões do menu
    document.getElementById("btn-perfil-cliente").addEventListener("click", mostrarSecaoCliente);
    document.getElementById("btn-perfil-prestador").addEventListener("click", mostrarSecaoPrestador);
    document.getElementById("btn-perfil-admin").addEventListener("click", mostrarSecaoAdminLogin);
}

// ==========================================
// 4. PERFIL 1: CLIENTE
// ==========================================
function mostrarSecaoCliente() {
    const container = document.getElementById("conteudo-dinamico-perfil");
    container.innerHTML = `
        <div style="border-top: 1px solid #e2e8f0; padding-top: 15px;">
            <h3 style="font-size: 0.95rem; font-weight: 700; color: #1e293b; margin-bottom: 6px;">Bem-vindo, Cliente!</h3>
            <p style="font-size: 0.8rem; color: #64748b; margin-bottom: 12px;">Pode navegar pela lista de prestadores aprovados para ver contactos e enviar mensagens.</p>
            <button id="btn-ir-para-busca" style="width: 100%; padding: 10px; background: #16a34a; color: white; border: none; border-radius: 6px; font-weight: 600; font-size: 0.85rem; cursor: pointer;">Ver Prestadores Disponíveis</button>
        </div>
    `;

    document.getElementById("btn-ir-para-busca").addEventListener("click", () => {
        alert("Consulte a aba de pesquisa ou lista de prestadores na aplicação.");
    });
}

// ==========================================
// 5. PERFIL 2: PRESTADOR (REGISTO COM FOTOS)
// ==========================================
function mostrarSecaoPrestador() {
    const container = document.getElementById("conteudo-dinamico-perfil");
    container.innerHTML = `
        <div style="border-top: 1px solid #e2e8f0; padding-top: 15px;">
            <h3 style="font-size: 0.95rem; font-weight: 700; color: #1e293b; margin-bottom: 6px;">Registo de Prestador</h3>
            <p style="font-size: 0.75rem; color: #64748b; margin-bottom: 12px;">Preencha os seus dados e envie os documentos para validação.</p>
            
            <form id="form-registo-prestador">
                <input type="text" id="reg-nome" placeholder="Nome Completo" required style="width:100%; padding:8px; margin-bottom:8px; border:1px solid #cbd5e1; border-radius:6px; font-size:0.8rem;">
                <input type="text" id="reg-categoria" placeholder="Categoria (Ex: Eletricista, Canalizador)" required style="width:100%; padding:8px; margin-bottom:8px; border:1px solid #cbd5e1; border-radius:6px; font-size:0.8rem;">
                
                <select id="reg-municipio" style="width:100%; padding:8px; margin-bottom:8px; border:1px solid #cbd5e1; border-radius:6px; font-size:0.8rem;">
                    <option value="Huambo">Huambo</option>
                    <option value="Caála">Caála</option>
                    <option value="Bailundo">Bailundo</option>
                </select>

                <input type="text" id="reg-telefone" placeholder="Telefone / WhatsApp" required style="width:100%; padding:8px; margin-bottom:8px; border:1px solid #cbd5e1; border-radius:6px; font-size:0.8rem;">
                <input type="number" id="reg-taxa" placeholder="Taxa de Deslocação (Kz)" style="width:100%; padding:8px; margin-bottom:8px; border:1px solid #cbd5e1; border-radius:6px; font-size:0.8rem;">
                
                <label style="font-size:0.75rem; font-weight:600; display:block; margin-bottom:2px;">Foto Selfie:</label>
                <input type="file" id="reg-file-selfie" accept="image/*" required style="width:100%; font-size:0.75rem; margin-bottom:8px;">
                
                <label style="font-size:0.75rem; font-weight:600; display:block; margin-bottom:2px;">Foto do BI (Bilhete de Identidade):</label>
                <input type="file" id="reg-file-bi" accept="image/*" required style="width:100%; font-size:0.75rem; margin-bottom:12px;">

                <button type="submit" id="btn-submeter-registo" style="width:100%; background:#2563eb; color:white; border:none; padding:10px; border-radius:6px; font-weight:600; font-size:0.85rem; cursor:pointer;">Submeter Registo</button>
            </form>
        </div>
    `;

    document.getElementById("form-registo-prestador").addEventListener("submit", async (e) => {
        e.preventDefault();
        const btn = document.getElementById("btn-submeter-registo");
        btn.disabled = true;
        btn.innerText = "A enviar documentos...";

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

            // Enviar ficheiros para o bucket do Supabase
            await supabase.storage.from('documentos-prestadores').upload(nomeSelfie, fileSelfie);
            await supabase.storage.from('documentos-prestadores').upload(nomeBi, fileBi);

            const urlSelfie = supabase.storage.from('documentos-prestadores').getPublicUrl(nomeSelfie).data.publicUrl;
            const urlBi = supabase.storage.from('documentos-prestadores').getPublicUrl(nomeBi).data.publicUrl;

            // Inserir na tabela prestadores com status pendente
            const { error } = await supabase.from('prestadores').insert([{
                nome, categoria, municipio, telefone, taxa: Number(taxa),
                status: 'pendente', foto_selfie: urlSelfie, foto_bi: urlBi
            }]);

            if (error) throw error;

            alert("Registo submetido com sucesso! O seu perfil ficará pendente até ser aprovado pela administração.");
            configurarEcraInicial();
        } catch (err) {
            alert("Erro ao submeter registo: " + err.message);
        } finally {
            btn.disabled = false;
            btn.innerText = "Submeter Registo";
        }
    });
}

// ==========================================
// 6. PERFIL 3: ADMINISTRADOR (LOGIN E PAINEL)
// ==========================================
function mostrarSecaoAdminLogin() {
    const container = document.getElementById("conteudo-dinamico-perfil");
    container.innerHTML = `
        <div style="border-top: 1px solid #e2e8f0; padding-top: 15px;">
            <h3 style="font-size: 0.95rem; font-weight: 700; color: #1e293b; margin-bottom: 6px;">Painel Administrativo</h3>
            <p style="font-size: 0.75rem; color: #64748b; margin-bottom: 10px;">Insira a chave de acesso de administrador:</p>
            <input type="password" id="admin-pin" placeholder="Chave de Admin" style="width:100%; padding:8px; margin-bottom:8px; border:1px solid #cbd5e1; border-radius:6px; font-size:0.8rem;">
            <button id="btn-login-admin" style="width: 100%; padding: 9px; background: #475569; color: white; border: none; border-radius: 6px; font-weight: 600; font-size: 0.8rem; cursor: pointer;">Entrar no Painel</button>
        </div>
    `;

    document.getElementById("btn-login-admin").addEventListener("click", () => {
        const pin = document.getElementById("admin-pin").value;
        if (pin === "admin123" || pin === "Huambo2026") {
            carregarPainelAdminCompleto();
        } else {
            alert("Chave de administrador incorreta!");
        }
    });
}

async function carregarPainelAdminCompleto() {
    const container = document.getElementById("conteudo-dinamico-perfil");
    container.innerHTML = `
        <div style="border-top: 1px solid #e2e8f0; padding-top: 15px;">
            <h3 style="font-size: 0.95rem; font-weight: 700; color: #1e293b; margin-bottom: 4px;">Moderação de Prestadores</h3>
            <p style="font-size: 0.75rem; color: #64748b; margin-bottom: 10px;">Lista de perfis a aguardar aprovação:</p>
            <div id="lista-pendentes-admin"><p style="text-align: center; color: #64748b; font-size: 0.8rem;">A carregar pendentes...</p></div>
        </div>
    `;

    try {
        const { data: pendentes, error } = await supabase
            .from('prestadores')
            .select('*')
            .eq('status', 'pendente');

        if (error) throw error;

        const listaDiv = document.getElementById("lista-pendentes-admin");
        if (!pendentes || pendentes.length === 0) {
            listaDiv.innerHTML = `<p style="text-align: center; padding: 10px; color: #64748b; font-size: 0.8rem;">Não há prestadores pendentes neste momento.</p>`;
            return;
        }

        listaDiv.innerHTML = pendentes.map(p => `
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin-bottom: 10px;">
                <h4 style="font-size: 0.85rem; font-weight: 700; margin-bottom: 2px;">${p.nome}</h4>
                <p style="font-size: 0.75rem; margin: 2px 0;"><strong>Profissão:</strong> ${p.categoria} | <strong>Município:</strong> ${p.municipio}</p>
                <p style="font-size: 0.75rem; margin: 2px 0;"><strong>Contacto:</strong> ${p.telefone} | <strong>Taxa:</strong> ${p.taxa} Kz</p>
                
                <div style="display: flex; gap: 8px; margin: 8px 0;">
                    <div style="flex:1; text-align:center;"><span style="font-size:0.65rem;">Selfie</span><br><a href="${p.foto_selfie}" target="_blank"><img src="${p.foto_selfie}" style="width:100%; height:55px; object-fit:cover; border-radius:4px;"></a></div>
                    <div style="flex:1; text-align:center;"><span style="font-size:0.65rem;">BI</span><br><a href="${p.foto_bi}" target="_blank"><img src="${p.foto_bi}" style="width:100%; height:55px; object-fit:cover; border-radius:4px;"></a></div>
                </div>

                <div style="display: flex; gap: 6px;">
                    <button class="btn-aprovar" data-id="${p.id}" style="flex:1; background:#16a34a; color:white; border:none; padding:6px; border-radius:4px; font-size:0.75rem; font-weight:600; cursor:pointer;">Aprovar</button>
                    <button class="btn-rejeitar" data-id="${p.id}" style="flex:1; background:#dc2626; color:white; border:none; padding:6px; border-radius:4px; font-size:0.75rem; font-weight:600; cursor:pointer;">Rejeitar</button>
                </div>
            </div>
        `).join('');

        document.querySelectorAll(".btn-aprovar").forEach(btn => {
            btn.addEventListener("click", () => alterarEstadoPrestador(btn.getAttribute("data-id"), 'aprovado'));
        });
        document.querySelectorAll(".btn-rejeitar").forEach(btn => {
            btn.addEventListener("click", () => alterarEstadoPrestador(btn.getAttribute("data-id"), 'rejeitado'));
        });

    } catch (err) {
        document.getElementById("lista-pendentes-admin").innerHTML = `<p style="color:red; text-align: center; font-size: 0.8rem;">Erro ao carregar painel.</p>`;
    }
}

async function alterarEstadoPrestador(id, estado) {
    try {
        const { error } = await supabase.from('prestadores').update({ status: estado }).eq('id', id);
        if (error) throw error;
        alert(`Prestador ${estado} com sucesso!`);
        carregarPainelAdminCompleto();
        carregarPrestadoresAprovados();
    } catch (err) {
        alert("Erro ao alterar estado do prestador.");
    }
}

// ==========================================
// 7. CARREGAR E RENDERIZAR PRESTADORES APROVADOS
// ==========================================
async function carregarPrestadoresAprovados() {
    const container = document.getElementById("container-cards");
    if (!container) return;
    
    container.innerHTML = '<p style="text-align: center; padding: 20px; color: #64748b; font-size: 0.85rem;">A carregar prestadores...</p>';

    try {
        const { data: prestadores, error } = await supabase
            .from('prestadores')
            .select('*')
            .eq('status', 'aprovado')
            .order('criado_em', { ascending: false });

        if (error) throw error;

        prestadoresCloud = prestadores || [];
        
        container.innerHTML = "";
        if (prestadoresCloud.length === 0) {
            container.innerHTML = `<p style="text-align: center; color: #64748b; padding: 20px; font-size: 0.85rem;">Nenhum prestador aprovado de momento.</p>`;
            return;
        }

        prestadoresCloud.forEach(p => {
            const card = document.createElement("div");
            card.style.background = "white";
            card.style.padding = "12px";
            card.style.marginBottom = "8px";
            card.style.borderRadius = "8px";
            card.style.boxShadow = "0 2px 4px rgba(0,0,0,0.05)";
            card.style.border = "1px solid #e2e8f0";
            
            card.innerHTML = `
                <h3 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 2px;">${p.nome}</h3>
                <p style="font-size: 0.8rem; color: #2563eb; margin-bottom: 4px;"><strong>${p.categoria}</strong> • ${p.municipio}</p>
                <p style="font-size: 0.78rem; color: #475569; margin: 2px 0;">📞 ${p.telefone || 'Sem contacto'}</p>
                <p style="font-size: 0.78rem; color: #475569; margin: 2px 0;">💰 Taxa: ${p.taxa || 0} Kz</p>
            `;
            container.appendChild(card);
        });

    } catch (error) {
        console.error("Erro ao carregar:", error.message);
        container.innerHTML = '<p style="color: red; text-align: center; font-size: 0.85rem;">Erro ao ligar à base de dados.</p>';
    }
}
