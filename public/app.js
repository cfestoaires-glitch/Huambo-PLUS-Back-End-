document.addEventListener('DOMContentLoaded', () => {
    // ------------------------------------------------------------------
    // 1. ALTERNÂNCIA DE ABAS
    // ------------------------------------------------------------------
    const navButtons = document.querySelectorAll('.nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    navButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTab = button.getAttribute('data-tab');

            navButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(tab => tab.classList.remove('active'));

            button.classList.add('active');
            const activeSection = document.getElementById(`aba-${targetTab}`);
            if (activeSection) {
                activeSection.classList.add('active');
            }

            if (targetTab === 'busca' && map) {
                setTimeout(() => map.invalidateSize(), 200);
            }
            if (targetTab === 'gritos') {
                carregarGritos();
            }
        });
    });

    // ------------------------------------------------------------------
    // 2. MODAL DE LOGIN E TEMAS
    // ------------------------------------------------------------------
    const modalLogin = document.getElementById('modal-login');
    const btnAbrirModal = document.getElementById('btn-login-modal');
    const btnFecharModal = document.getElementById('btn-fechar-modal');

    if (btnAbrirModal && modalLogin) {
        btnAbrirModal.addEventListener('click', () => modalLogin.style.display = 'flex');
    }
    if (btnFecharModal && modalLogin) {
        btnFecharModal.addEventListener('click', () => modalLogin.style.display = 'none');
    }
    window.addEventListener('click', (e) => {
        if (e.target === modalLogin) modalLogin.style.display = 'none';
    });

    const btnTema = document.getElementById('btn-tema');
    if (btnTema) {
        btnTema.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            btnTema.innerHTML = newTheme === 'dark' ? '<i class="fa-solid fa-moon"></i>' : '<i class="fa-solid fa-sun"></i>';
        });
    }

    // ------------------------------------------------------------------
    // 3. MAPA INTERATIVO LEAFLET
    // ------------------------------------------------------------------
    let map = null;
    let markersGroup = null;
    const mapDiv = document.getElementById('map');
    
    if (mapDiv && typeof L !== 'undefined') {
        map = L.map('map').setView([-12.7761, 15.7392], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(map);
        markersGroup = L.layerGroup().addTo(map);
    }

    const btnViewCards = document.getElementById('btn-view-cards');
    const btnViewMap = document.getElementById('btn-view-map');
    const containerCards = document.getElementById('container-cards');
    const containerMap = document.getElementById('map-container');

    if (btnViewCards && btnViewMap) {
        btnViewCards.addEventListener('click', () => {
            btnViewCards.classList.add('active');
            btnViewMap.classList.remove('active');
            containerCards.style.display = 'grid';
            containerMap.classList.add('map-hidden');
        });

        btnViewMap.addEventListener('click', () => {
            btnViewMap.classList.add('active');
            btnViewCards.classList.remove('active');
            containerCards.style.display = 'none';
            containerMap.classList.remove('map-hidden');
            if (map) setTimeout(() => map.invalidateSize(), 200);
        });
    }

    // ------------------------------------------------------------------
    // 4. PESQUISA E RENDERING DE PRESTADORES
    // ------------------------------------------------------------------
    const btnBusca = document.getElementById('btn-executar-busca');
    
    async function buscarPrestadores() {
        const q = document.getElementById('campo-busca').value;
        const municipio = document.getElementById('filtro-municipio').value;
        const categoria = document.getElementById('filtro-categoria').value;

        const url = `/api/prestadores?q=${encodeURIComponent(q)}&municipio=${encodeURIComponent(municipio)}&categoria=${encodeURIComponent(categoria)}`;

        try {
            const res = await fetch(url);
            const prestadores = await res.json();
            renderizarPrestadores(prestadores);
        } catch (err) {
            console.error("Erro ao carregar prestadores:", err);
        }
    }

    function renderizarPrestadores(lista) {
        containerCards.innerHTML = '';
        if (markersGroup) markersGroup.clearLayers();

        if (!Array.isArray(lista) || lista.length === 0) {
            containerCards.innerHTML = '<p style="grid-column: 1/-1; text-align: center; opacity: 0.7;">Nenhum prestador encontrado.</p>';
            return;
        }

        lista.forEach(p => {
            const card = document.createElement('div');
            card.className = 'card-prestador';
            card.innerHTML = `
                <div>
                    <h3>${p.nome}</h3>
                    <p><strong><i class="fa-solid fa-briefcase"></i> Profissão:</strong> ${p.categoria}</p>
                    <p><strong><i class="fa-solid fa-location-dot"></i> Município:</strong> ${p.municipio}</p>
                    <p><strong><i class="fa-solid fa-tag"></i> Deslocação:</strong> ${p.taxa_deslocacao || p.taxa || 0} Kz</p>
                </div>
                <a href="https://wa.me/${p.telefone ? p.telefone.replace(/\D/g,'') : ''}" target="_blank" class="btn-primary" style="display: block; margin-top: 15px; text-decoration: none; text-align: center;">
                    <i class="fa-brands fa-whatsapp"></i> Contactar
                </a>
            `;
            containerCards.appendChild(card);

            if (map && markersGroup) {
                const lat = p.lat || (-12.7761 + (Math.random() - 0.5) * 0.04);
                const lng = p.lng || (15.7392 + (Math.random() - 0.5) * 0.04);
                L.marker([lat, lng])
                    .bindPopup(`<b>${p.nome}</b><br>${p.categoria}<br>${p.municipio}`)
                    .addTo(markersGroup);
            }
        });
    }

    if (btnBusca) btnBusca.addEventListener('click', buscarPrestadores);
    buscarPrestadores();

    // ------------------------------------------------------------------
    // 5. MURAL DE GRITOS
    // ------------------------------------------------------------------
    const btnNovoGrito = document.getElementById('btn-novo-grito');
    const formNovoGrito = document.getElementById('form-novo-grito');
    const containerGritos = document.getElementById('container-gritos');

    if (btnNovoGrito && formNovoGrito) {
        btnNovoGrito.addEventListener('click', () => {
            formNovoGrito.style.display = formNovoGrito.style.display === 'none' ? 'flex' : 'none';
        });
    }

    async function carregarGritos() {
        try {
            const res = await fetch('/api/gritos');
            const gritos = await res.json();
            
            containerGritos.innerHTML = '';
            if (!Array.isArray(gritos) || gritos.length === 0) {
                containerGritos.innerHTML = '<p style="text-align: center; opacity: 0.7;">Nenhum pedido de serviço ativo.</p>';
                return;
            }

            gritos.forEach(g => {
                const item = document.createElement('div');
                item.className = 'grito-card';
                item.style.cssText = "background: var(--card-bg); padding: 15px; border-radius: var(--radius); margin-bottom: 15px; box-shadow: var(--shadow); border: 1px solid var(--border-color);";
                item.innerHTML = `
                    <h3>${g.titulo}</h3>
                    <p style="margin: 5px 0; color: var(--text-muted);"><i class="fa-solid fa-location-dot"></i> ${g.municipio}</p>
                    <p style="margin-bottom: 12px;">${g.descricao}</p>
                    <a href="https://wa.me/${g.telefone ? g.telefone.replace(/\D/g,'') : ''}" target="_blank" class="btn-primary" style="display: inline-block; text-decoration: none; font-size: 0.85rem;">
                        <i class="fa-brands fa-whatsapp"></i> Responder ao Grito
                    </a>
                `;
                containerGritos.appendChild(item);
            });
        } catch (err) {
            console.error("Erro ao carregar gritos:", err);
        }
    }

    if (formNovoGrito) {
        formNovoGrito.addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = {
                titulo: document.getElementById('grito-titulo').value,
                municipio: document.getElementById('grito-municipio').value,
                descricao: document.getElementById('grito-descricao').value,
                telefone: document.getElementById('grito-telefone').value
            };

            try {
                const res = await fetch('/api/gritos', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (res.ok) {
                    alert('Grito publicado com sucesso!');
                    formNovoGrito.reset();
                    formNovoGrito.style.display = 'none';
                    carregarGritos();
                } else {
                    alert('Erro ao publicar pedido.');
                }
            } catch (err) {
                alert('Erro de conexão.');
            }
        });
    }

    // ------------------------------------------------------------------
    // 6. REGISTO DE PRESTADOR
    // ------------------------------------------------------------------
    const formPrestador = document.getElementById('form-prestador');
    if (formPrestador) {
        formPrestador.addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = {
                nome: document.getElementById('reg-nome').value,
                nif: document.getElementById('reg-nif').value,
                categoria: document.getElementById('reg-categoria').value,
                municipio: document.getElementById('reg-municipio').value,
                telefone: document.getElementById('reg-telefone').value,
                taxa: document.getElementById('reg-taxa').value
            };

            try {
                const res = await fetch('/api/prestadores', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (res.ok) {
                    alert('Candidatura submetida com sucesso!');
                    formPrestador.reset();
                    buscarPrestadores();
                } else {
                    alert('Erro ao guardar no servidor.');
                }
            } catch (err) {
                alert('Erro de conexão ao servidor.');
            }
        });
    }

    // ------------------------------------------------------------------
    // 7. LOGIN (COMUM E ADMINISTRADOR)
    // ------------------------------------------------------------------
    const formLogin = document.getElementById('form-login');
    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const tipo = document.getElementById('login-tipo').value;
            const email = document.getElementById('login-email').value;
            const senha = document.getElementById('login-senha').value;

            try {
                const res = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, senha, tipo })
                });

                const data = await res.json();

                if (res.ok) {
                    localStorage.setItem('usuario_logado', JSON.stringify(data.usuario || { email, tipo }));

                    if (tipo === 'admin') {
                        alert('Sessão iniciada como ADMINISTRADOR com sucesso!');
                        document.body.classList.add('modo-admin');
                    } else {
                        alert('Login efetuado com sucesso!');
                    }

                    modalLogin.style.display = 'none';
                    formLogin.reset();
                    
                    const areaAuth = document.getElementById('area-auth');
                    if (areaAuth) {
                        areaAuth.innerHTML = `<span style="font-size:0.85rem; font-weight:600; color:var(--primary-color);">${email} (${tipo.toUpperCase()})</span>`;
                    }
                } else {
                    alert(data.erro || 'Email ou senha incorretos.');
                }
            } catch (err) {
                console.error("Erro no login:", err);
                alert('Erro ao ligar ao servidor de autenticação.');
            }
        });
    }
});
