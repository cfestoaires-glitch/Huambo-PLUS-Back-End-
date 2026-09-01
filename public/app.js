// Dados Piloto / Exemplo para Prestadores e Empresas
const dadosPiloto = [
    {
        id: "piloto-1",
        nome: "António Canalizador (Exemplo)",
        categoria: "Canalizador",
        municipio: "Huambo",
        telefone: "+244 923 000 001",
        taxa: 2000,
        isPiloto: true,
        avaliacoes: [
            { nota: 5, comentario: "Excelente profissional, resolveu a fuga de água muito rápido!" },
            { nota: 4, comentario: "Bom atendimento e pontualidade." }
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
        avaliacoes: [
            { nota: 5, comentario: "Instalou o quadro elétrico perfeitamente." },
            { nota: 5, comentario: "Muito honesto e competente." }
        ]
    },
    {
        id: "piloto-3",
        nome: "Prof. Manuel - Explicações (Exemplo)",
        categoria: "Educação - Explicações",
        municipio: "Huambo",
        telefone: "+244 931 000 003",
        taxa: 0,
        isPiloto: true,
        avaliacoes: [
            { nota: 5, comentario: "Salvou o meu filho a Matemática, recomendo muito!" },
            { nota: 4, comentario: "Explica com muita calma e clareza." }
        ]
    },
    {
        id: "piloto-4",
        nome: "TechHuambo Informática (Exemplo)",
        categoria: "Tecnologia - Informática",
        municipio: "Huambo",
        telefone: "+244 945 000 004",
        taxa: 1500,
        isPiloto: true,
        avaliacoes: [
            { nota: 5, comentario: "Formatou o meu portátil e deixou a voar." },
            { nota: 4, comentario: "Bom serviço de reparação e assistência." }
        ]
    }
];

// Função para renderizar os cartões no ecrã
function renderizarPrestadores(lista) {
    const container = document.getElementById("container-cards");
    if (!container) return;
    
    container.innerHTML = "";

    // Se a base de dados estiver vazia, combinamos ou exibimos os pilotos por defeito
    const itensParaExibir = (!lista || lista.length === 0) ? dadosPiloto : [...dadosPiloto, ...lista];

    itensParaExibir.forEach(p => {
        const badgeHtml = p.isPiloto ? `<span class="badge-piloto"><i class="fa-solid fa-star"></i> Perfil Piloto / Exemplo</span>` : '';
        
        let avaliacoesHtml = '';
        if (p.avaliacoes && p.avaliacoes.length > 0) {
            avaliacoesHtml = `<div style="margin-top: 8px; font-size: 0.8rem; border-top: 1px solid var(--border-color); padding-top: 6px;">
                <strong>Avaliações (${p.avaliacoes.length}):</strong>
                <ul style="padding-left: 15px; margin-top: 4px; color: var(--text-muted);">
                    ${p.avaliacoes.map(a => `<li>⭐ ${a.nota}/5 - "${a.comentario}"</li>`).join('')}
                </ul>
            </div>`;
        }

        const card = document.createElement("div");
        card.className = "form-box";
        card.innerHTML = `
            ${badgeHtml}
            <h3 style="font-size: 1rem; font-weight: 700;">${p.nome}</h3>
            <p style="font-size: 0.85rem; color: var(--primary-color);"><strong>${p.categoria}</strong> • ${p.municipio}</p>
            <p style="font-size: 0.85rem;">📞 ${p.telefone}</p>
            <p style="font-size: 0.85rem;">💰 Taxa: ${p.taxa || 0} Kz</p>
            ${avaliacoesHtml}
        `;
        container.appendChild(card);
    });
}

// Eventos básicos de navegação entre abas e filtros
document.addEventListener("DOMContentLoaded", () => {
    // Renderizar dados iniciais de demonstração
    renderizarPrestadores([]);

    // Alternar abas na barra inferior
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

    // Filtro por categorias populares ao clicar nos cards de categoria
    document.querySelectorAll(".cat-card").forEach(card => {
        card.addEventListener("click", () => {
            const cat = card.getAttribute("data-cat");
            document.getElementById("filtro-categoria").value = cat;
            
            // Simular filtro na lista de exibição piloto/real
            const filtrados = dadosPiloto.filter(p => p.categoria.toLowerCase().includes(cat.toLowerCase()));
            renderizarPrestadores(filtrados);
        });
    });
});
