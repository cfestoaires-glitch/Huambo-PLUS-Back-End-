/**
 * Huambo Plus — Aplicação Principal
 */

// --- Dados Globais e Constantes ---
const MUNICIPIOS = [
    "Huambo", "Bailundo", "Caála", "Ekunha", "Ucuma", 
    "Catchiungo", "Londuimbali", "Longonjo", "Mungo", "Tchicala Tcholohanga", "Tchindjenje"
];

const CATEGORIAS = {
    "Construção & Reparos": ["Canalizador", "Eletricista", "Pedreiro", "Pintor"],
    "Tecnologia": ["Técnico de Informática", "Reparação de Celulares", "Instalação de Redes"],
    "Serviços Domésticos": ["Limpeza", "Jardinagem", "Cozinheiro"],
    "Automotivo": ["Mecânico", "Eletricista Auto", "Bate-Chapa"]
};

const SINONIMOS_BUSCA = {
    "água": "Canalizador",
    "tubo": "Canalizador",
    "luz": "Eletricista",
    "corrente": "Eletricista",
    "computador": "Técnico de Informática",
    "pc": "Técnico de Informática",
    "carro": "Mecânico"
};

const TRADUCOES = {
    PT: {
        navBusca: "Buscar",
        navGritos: "Mural de Gritos",
        navRegisto: "Registo Prestador",
        btnLogin: "Entrar",
        searchPlaceholder: "Ex: Canalizador, Eletricista...",
        todosMunicipios: "Todos os Municípios",
        todasCategorias: "Todas as Categorias",
        btnPesquisar: "Pesquisar",
        viewLista: "Lista",
        viewMapa: "Mapa",
        gritosTitulo: "Mural de Pedidos Rápidos (Gritos)",
        btnPublicarGrito: "Publicar Grito",
        registoTitulo: "Candidatura de Prestador de Serviços",
        labelNome: "Nome Completo",
        labelCategoria: "Categoria",
        labelMunicipio: "Município",
        labelTelefone: "Telefone / WhatsApp",
        labelTaxa: "Taxa de Deslocação (Kz)",
        btnSubmeter: "Submeter Candidatura",
        loginTitulo: "Acessar Conta",
        labelSenha: "Senha"
    },
    EN: {
        navBusca: "Search",
        navGritos: "Shout Board",
        navRegisto: "Register Provider",
        btnLogin: "Login",
        searchPlaceholder: "Ex: Plumber, Electrician...",
        todosMunicipios: "All Municipalities",
        todasCategorias: "All Categories",
        btnPesquisar: "Search",
        viewLista: "List",
        viewMapa: "Map",
        gritosTitulo: "Quick Requests Board",
        btnPublicarGrito: "Post Request",
        registoTitulo: "Service Provider Application",
        labelNome: "Full Name",
        labelCategoria: "Category",
        labelMunicipio: "Municipality",
        labelTelefone: "Phone / WhatsApp",
        labelTaxa: "Travel Fee (Kz)",
        btnSubmeter: "Submit Application",
        loginTitulo: "Account Login",
        labelSenha: "Password"
    },
    UMB: {
        navBusca: "Sandili",
        navGritos: "Ocila c'Ovilulu",
        navRegisto: "Lisapula Ukayi",
        btnLogin: "Iñila",
        searchPlaceholder: "Ocitangi, Ukuesoloke...",
        todosMunicipios: "Ovifuka Viukulu",
        todasCategorias: "Ovipango Viosi",
        btnPesquisar: "Sandili",
        viewLista: "Ocilomboloke",
        viewMapa: "Elivulu",
        gritosTitulo: "Mural de Pedidos Rápidos",
        btnPublicarGrito: "Tumisa Ocitangi",
        registoTitulo: "Candidatura de Prestador",
        labelNome: "Onduko Muene",
        labelCategoria: "Ocipango",
        labelMunicipio: "Ofuka",
        labelTelefone: "Uteleno",
        labelTaxa: "Ofeto y'Ekula (Kz)",
        btnSubmeter: "Tumisa",
        loginTitulo: "Iñila v'Okoña",
        labelSenha: "Omelo"
    }
};

// --- Base de Dados Simulada ---
let prestadores = [
    { id: 1, nome: "Aires Festo", profissao: "Técnico de Informática", municipio: "Huambo", taxa: 1500, lat: -12.7761, lng: 15.7392 },
    { id: 2, nome: "Manuel Silva", profissao: "Canalizador", municipio: "Caála", taxa: 2000, lat: -12.8525, lng: 15.5603 },
    { id: 3, nome: "João Pedro", profissao: "Eletricista", municipio: "Bailundo", taxa: 2500, lat: -12.1953, lng: 15.8656 }
];

let posicaoUsuario = null;
let mapaInstancia = null;
let marcadoresMapa = [];

// --- Inicialização ---
document.addEventListener("DOMContentLoaded", () => {
    popularSelects();
    renderizarPrestadores(prestadores);
    configurarEventos();
    obterGeolocalizacao();
});

// --- Preenchimento Dinâmico de Selects ---
function popularSelects() {
    const selectMunFiltro = document.getElementById("filtro-municipio");
    const selectMunRegisto = document.getElementById("reg-municipio");
    const selectCatFiltro = document.getElementById("filtro-categoria");
    const selectCatRegisto = document.getElementById("reg-categoria");

    MUNICIPIOS.forEach(m => {
        selectMunFiltro.appendChild(new Option(m, m));
        selectMunRegisto.appendChild(new Option(m, m));
    });

    Object.keys(CATEGORIAS).forEach(cat => {
        selectCatFiltro.appendChild(new Option(cat, cat));
        
        CATEGORIAS[cat].forEach(sub => {
            selectCatRegisto.appendChild(new Option(`${cat} - ${sub}`, sub));
        });
    });
}

// --- Renderização dos Cards ---
function renderizarPrestadores(lista) {
    const container = document.getElementById("container-cards");
    container.innerHTML = "";

    if (lista.length === 0) {
        container.innerHTML = `<p style="grid-column: 1/-1; text-align: center;">Nenhum prestador encontrado.</p>`;
        return;
    }

    lista.forEach(p => {
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
            <h3>${p.nome}</h3>
            <span class="card-badge">${p.profissao}</span>
            <p><i class="fa-solid fa-location-dot"></i> ${p.municipio}</p>
            <p><i class="fa-solid fa-money-bill"></i> Taxa: ${p.taxa} Kz</p>
        `;
        container.appendChild(card);
    });
}

// --- Lógica de Busca Inteligente ---
function executarBusca() {
    const termo = document.getElementById("campo-busca").value.toLowerCase().trim();
    const municipio = document.getElementById("filtro-municipio").value;
    const categoria = document.getElementById("filtro-categoria").value;

    let termoExpanso = SINONIMOS_BUSCA[termo] || termo;

    const resultados = prestadores.filter(p => {
        const correspondeTermo = !termo || p.profissao.toLowerCase().includes(termoExpanso) || p.nome.toLowerCase().includes(termoExpanso);
        const correspondeMunicipio = !municipio || p.municipio === municipio;
        const correspondeCategoria = !categoria || Object.keys(CATEGORIAS).some(catKey => catKey === categoria && CATEGORIAS[catKey].includes(p.profissao));

        return correspondeTermo && correspondeMunicipio && correspondeCategoria;
    });

    renderizarPrestadores(resultados);
    if (mapaInstancia) atualizarMarcadoresMapa(resultados);
}

// --- Integração com Leaflet (Mapa) ---
function inicializarMapa() {
    if (mapaInstancia) return;

    const latPadrao = posicaoUsuario ? posicaoUsuario.lat : -12.7761;
    const lngPadrao = posicaoUsuario ? posicaoUsuario.lng : 15.7392;

    mapaInstancia = L.map('map').setView([latPadrao, lngPadrao], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(mapaInstancia);

    atualizarMarcadoresMapa(prestadores);
}

function atualizarMarcadoresMapa(lista) {
    marcadoresMapa.forEach(m => mapaInstancia.removeLayer(m));
    marcadoresMapa = [];

    lista.forEach(p => {
        if (p.lat && p.lng) {
            const marker = L.marker([p.lat, p.lng])
                .addTo(mapaInstancia)
                .bindPopup(`<b>${p.nome}</b><br>${p.profissao}`);
            marcadoresMapa.push(marker);
        }
    });
}

// --- Geolocalização ---
function obterGeolocalizacao() {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                posicaoUsuario = {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude
                };
            },
            (err) => console.warn("Geolocalização não permitida pelo utilizador.")
        );
    }
}

// --- Alternador de Idioma (i18n) ---
function alterarIdioma(lang) {
    const dicionario = TRADUCOES[lang];
    if (!dicionario) return;

    document.querySelectorAll("[data-i18n]").forEach(el => {
        const chave = el.getAttribute("data-i18n");
        if (dicionario[chave]) el.textContent = dicionario[chave];
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
        const chave = el.getAttribute("data-i18n-placeholder");
        if (dicionario[chave]) el.placeholder = dicionario[chave];
    });
}

// --- Manipulação de Eventos ---
function configurarEventos() {
    // Navegação por Abas
    document.querySelectorAll(".nav-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
            document.querySelectorAll(".tab-content").forEach(tc => tc.classList.remove("active"));

            btn.classList.add("active");
            document.getElementById(`aba-${btn.dataset.tab}`).classList.add("active");
        });
    });

    // Alternar Visualização (Cards / Mapa)
    const btnCards = document.getElementById("btn-view-cards");
    const btnMap = document.getElementById("btn-view-map");
    const containerCards = document.getElementById("container-cards");
    const containerMap = document.getElementById("map-container");

    btnCards.addEventListener("click", () => {
        btnCards.classList.add("active");
        btnMap.classList.remove("active");
        containerCards.style.display = "grid";
        containerMap.classList.add("map-hidden");
    });

    btnMap.addEventListener("click", () => {
        btnMap.classList.add("active");
        btnCards.classList.remove("active");
        containerCards.style.display = "none";
        containerMap.classList.remove("map-hidden");
        inicializarMapa();
        setTimeout(() => mapaInstancia.invalidateSize(), 200);
    });

    // Eventos de Busca
    document.getElementById("btn-executar-busca").addEventListener("click", executarBusca);

    // Evento de Idioma
    document.getElementById("seletor-idioma").addEventListener("change", (e) => {
        alterarIdioma(e.target.value);
    });

    // Evento de Modo Escuro/Claro
    document.getElementById("btn-tema").addEventListener("click", () => {
        const temaAtual = document.documentElement.getAttribute("data-theme");
        const novoTema = temaAtual === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", novoTema);
    });

    // Controlo dos Modais
    const modalLogin = document.getElementById("modal-login");
    document.getElementById("btn-login-modal").addEventListener("click", () => modalLogin.style.display = "flex");
    document.querySelector(".close-modal").addEventListener("click", () => modalLogin.style.display = "none");
        }
        
