document.addEventListener('DOMContentLoaded', () => {
    let map = null;
    let markersGroup = null;

    // ------------------------------------------------------------------
    // 1. FÓRMULA DE HAVERSINE (Cálculo preciso de distância em km)
    // ------------------------------------------------------------------
    function calcularDistanciaKm(lat1, lon1, lat2, lon2) {
        const R = 6371; // Raio da Terra em km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    function ordenarPrestadoresPorProximidade(lista, userLat, userLon) {
        return lista.map(p => {
            const pLat = parseFloat(p.lat) || -12.7761;
            const pLon = parseFloat(p.lng) || 15.7392;
            const distancia = calcularDistanciaKm(userLat, userLon, pLat, pLon);
            return { ...p, distancia };
        }).sort((a, b) => a.distancia - b.distancia);
    }

    // ------------------------------------------------------------------
    // 2. INICIALIZAÇÃO DO LEAFLET (OPENSTREETMAP)
    // ------------------------------------------------------------------
    function inicializarMapa() {
        const mapDiv = document.getElementById('map');
        if (mapDiv && typeof L !== 'undefined' && !map) {
            map = L.map('map').setView([-12.7761, 15.7392], 13);
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '© OpenStreetMap'
            }).addTo(map);

            markersGroup = L.layerGroup().addTo(map);
        }
    }

    function adicionarMarcadoresLeaflet(lista) {
        if (!map) inicializarMapa();
        if (!markersGroup) return;

        markersGroup.clearLayers();
        if (!Array.isArray(lista)) return;

        lista.forEach(p => {
            const lat = parseFloat(p.lat) || -12.7761;
            const lng = parseFloat(p.lng) || 15.7392;

            const marker = L.marker([lat, lng]);
            marker.bindPopup(`
                <div style="color: #000; padding: 2px;">
                    <strong>${p.nome}</strong><br>
                    <span>${p.categoria}</span><br>
                    <small>${p.municipio} ${p.distancia !== undefined ? `(${p.distancia.toFixed(1)} km)` : ''}</small>
                </div>
            `);
            markersGroup.addLayer(marker);
        });
    }

    // ------------------------------------------------------------------
    // 3. ALTERNÂNCIA DE ABAS
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

            if (targetTab === 'gritos') {
                carregarGritos();
            }
        });
    });

    // ------------------------------------------------------------------
    // 4. ALTERNADOR DE VISUALIZAÇÃO (LISTA / MAPA)
    // ------------------------------------------------------------------
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
            
            inicializarMapa();
            if (map) {
                setTimeout(() => map.invalidateSize(), 200);
            }
        });
    }

    // ------------------------------------------------------------------
    // 5. MODAL DE LOGIN E TEMAS
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
    // 6. PESQUISA COM ORDENAÇÃO GPS AUTOMÁTICA
    // ------------------------------------------------------------------
    const btnBusca = document.getElementById('btn-executar-busca');
    
    async function buscarPrestadoresComGPS() {
        const q = document.getElementById('campo-busca').value;
        const municipio = document.getElementById('filtro-municipio').value;
        const categoria = document.getElementById('filtro-categoria').value;

        const url = `/api/prestadores?q=${encodeURIComponent(q)}&municipio=${encodeURIComponent(municipio)}&categoria=${encodeURIComponent(categoria)}`;

        try {
            const res = await fetch(url);
            let prestadores = await res.json();

            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const userLat = position.coords.latitude;
                        const userLon = position.coords.longitude;
                        prestadores = ordenarPrestadoresPorProximidade(prestadores, userLat, userLon);
                        renderizarPrestadores(prestadores);
                    },
                    () => {
                        renderizarPrestadores(prestadores);
                    },
                    { timeout: 7000, enableHighAccuracy: true }
                );
            } else {
                renderizarPrestadores(prestadores);
            }
        } catch (err) {
            console.error("Erro ao carregar prestadores:", err);
        }
    }

    function renderizarPrestadores(lista) {
        containerCards.innerHTML = '';

        if (!Array.isArray(lista) || lista.length === 0) {
            containerCards.innerHTML = '<p style="grid-column: 1/-1; text-align: center; opacity: 0.7;">Nenhum prestador encontrado.</p>';
            if (markersGroup) markersGroup.clearLayers();
            return;
        }

        lista.forEach(p => {
            const card = document.createElement('div');
            card.className = 'card-prestador';
            const distanciaTexto = p.distancia !== undefined ? `<p><strong><i class="fa-solid fa-route"></i> Distância:</strong> ${p.distancia.toFixed(1)} km</p>` : '';
            
            card.innerHTML = `
                <div>
                    <h3>${p.nome}</h3>
                    <p><strong><i class="fa-solid fa-briefcase"></i> Profissão:</strong> ${p.categoria}</p>
                    <p><strong><i class="fa-solid fa-location-dot"></i> Município:</strong> ${p.municipio}</p>
                    ${distanciaTexto}
                    <p><strong><i class="fa-solid fa-tag"></i> Deslocação:</strong> ${p.taxa_deslocacao || p.taxa || 0} Kz</p>
                </div>
                <a href="https://wa.me/${p.telefone ? p.telefone.replace(/\D/g,'') : ''}" target="_blank" class="btn-primary" style="display: block; margin-top: 15px; text-decoration: none; text-align: center;">
                    <i class="fa-brands fa-whatsapp"></i> Contactar
                </a>
            `;
            containerCards.appendChild(card);
        });

        adicionarMarcadoresLeaflet(lista);
    }

    if (btnBusca) btnBusca.addEventListener('click', buscarPrestadoresComGPS);
    
    inicializarMapa();
    buscarPrestadoresComGPS();

    // ------------------------------------------------------------------
    // 7. MURAL DE GRITOS
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
    // 8. REGISTO DE PRESTADOR COM CAPTURA AUTOMÁTICA DE GPS
    // ------------------------------------------------------------------
    const formPrestador = document.getElementById('form-prestador');
    if (formPrestador) {
        formPrestador.addEventListener('submit', (e) => {
            e.preventDefault();

            const enviarRegisto = (lat, lng) => {
                const payload = {
                    nome: document.getElementById('reg-nome').value,
                    nif: document.getElementById('reg-nif').value,
                    categoria: document.getElementById('reg-categoria').value,
                    municipio: document.getElementById('reg-municipio').value,
                    telefone: document.getElementById('reg-telefone').value,
                    taxa: document.getElementById('reg-taxa').value,
                    lat: lat,
                    lng: lng
                };

                fetch('/api/prestadores', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
                .then(res => {
                    if (res.ok) {
                        alert('Candidatura submetida com sucesso com coordenadas GPS!');
                        formPrestador.reset();
                        buscarPrestadoresComGPS();
                    } else {
                        alert('Erro ao guardar no servidor.');
                    }
                })
                .catch(() => alert('Erro de conexão ao servidor.'));
            };

            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        enviarRegisto(position.coords.latitude, position.coords.longitude);
                    },
                    () => {
                        enviarRegisto(-12.7761, 15.7392); // Coordenada padrão de fallback
                    },
                    { enableHighAccuracy: true, timeout: 7000 }
                );
            } else {
                enviarRegisto(-12.7761, 15.7392);
            }
        });
    }

    // ------------------------------------------------------------------
    // 9. LOGIN (COMUM E ADMINISTRADOR)
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
