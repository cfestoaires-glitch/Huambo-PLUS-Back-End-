/**
 * Huambo Plus — Aplicação Principal (Cliente API)
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

// Estados globais da aplicação
let listaPrestadores = [];
let listaGritos = [];
let posicaoUsuario = null;
let mapaInstancia = null;
let marcadoresMapa = [];

// --- Inicialização ---
document.addEventListener("DOMContentLoaded", () => {
    popularSelects();
    carregarPrestadores();
    carregarGritos();
    configurarEventos();
    obterGeolocalizacao();
});

// --- Preenchimento Dinâmico dos Selects ---
function popularSelects() {
    const selectMunFiltro = document.getElementById("filtro-municipio");
    const selectMunRegisto = document.getElementById("reg-municipio");
    const selectCatFiltro = document.getElementById("filtro-categoria");
    const selectCatRegisto = document.getElementById("reg-categoria");

    if (selectMunFiltro && selectMunRegisto) {
        MUNICIPIOS.forEach(m => {
            selectMunFiltro.appendChild(new Option(m, m));
            selectMunRegisto.appendChild(new Option(m, m));
        });
    }

    if (selectCatFiltro && selectCatRegisto) {
        Object.keys(CATEGORIAS).forEach(cat => {
            selectCatFiltro.appendChild(new Option(cat, cat));
            CATEGORIAS[cat].forEach(sub => {
                selectCatRegisto.appendChild(new Option(`${cat} - ${sub}`, sub));
            });
        });
    }
}

// --- Chamadas à API (Fetch Backend/Supabase) ---

// 1. Carregar Prestadores
async function carregarPrestadores() {
    try {
        const resposta = await fetch('/api/prestadores');
        if (!resposta.ok) throw new Error("Erro na requisição dos prestadores");
        
        listaPrestadores = await resposta.json();
        renderizarPrestadores(listaPrestadores);
    } catch (erro) {
        console.error("Erro ao carregar prestadores:", erro);
    }
}

// 2. Carregar Gritos
async function carregarGritos() {
    try {
        const resposta = await fetch('/api/gritos');
        if (!resposta.ok) throw new Error("Erro na requisição dos gritos");
        
        listaGritos = await resposta.json();
        renderizarGritos(listaGritos);
    } catch (erro) {
        console.error("Erro ao carregar gritos:", erro);
    }
}

// 3. Cadastrar Prestador
async function cadastrarPrestador(dadosForm) {
    try {
        const resposta = await fetch('/api/prestadores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosForm)
        });

        const resultado = await resposta.json();
        if (!resposta.ok) throw new Error(resultado.error || "Erro ao efetuar registo");

        alert("Candidatura submetida com sucesso!");
        document.getElementById("form-prestador").reset();
        carregarPrestadores();
    } catch (erro) {
        alert(`Falha no registo: ${erro.message}`);
    }
}

// --- Renderização de Componentes ---

function renderizarPrestadores(lista) {
    const container = document.getElementById("container-cards");
    if (!container) return;

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
            <p><i class="fa-solid fa-money-bill"></i> Taxa: ${p.taxa_deslocacao || 0} Kz</p>
            <p><i class="fa-solid fa-phone"></i> ${p.telefone}</p>
        `;
        container.appendChild(card);
    });
}

function renderizarGritos(lista) {
    const container = document.getElementById("container-gritos");
    if (!container) return;

    container.innerHTML = "";

    if (lista.length === 0) {
        container.innerHTML = `<p style="text-align: center;">Nenhum pedido publicado no momento.</p>`;
        return;
    }

    lista.forEach(g => {
        const card = document.createElement("div");
        card.className = "card";
        card.style.marginBottom = "12px";
        card.innerHTML = `
            <h3>${g.titulo}</h3>
            <p>${g.descricao}</p>
            <p><strong>Município:</strong> ${g.municipio} | <strong>Orçamento:</strong> ${g.orcamento || 'A combinar'} Kz</p>
            <p><i class="fa-solid fa-phone"></i> Contacto: ${g.contacto}</p>
        `;
        container.appendChild(card);
    });
}

// --- Motor de Busca Dinâmico ---
function executarBusca() {
    const termo = document.getElementById("campo-busca").value.toLowerCase().trim();
    const municipio = document.getElementById("filtro-municipio").value;
    const categoria = document.getElementById("filtro-categoria").value;

    let termoExpanso = SINONIMOS_BUSCA[termo] || termo;

    const resultados = listaPrestadores.filter(p => {
        const correspondeTermo = !termo || p.profissao.toLowerCase().includes(termoExpanso) || p.nome.toLowerCase().includes(termoExpanso);
        const correspondeMunicipio = !municipio || p.municipio === municipio;
        const correspondeCategoria = !categoria || p.categoria === categoria || Object.keys(CATEGORIAS).some(catKey => catKey === categoria && CATEGORIAS[catKey].includes(p.profissao));

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

    atualizarMarcadoresMapa(listaPrestadores);
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
            (err) => console.warn("Aviso de geolocalização:", err.message)
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

// --- Configuração de Eventos do DOM ---
function configurarEventos() {
    // Alternância de Abas
    document.querySelectorAll(".nav-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
            document.querySelectorAll(".tab-content").forEach(tc => tc.classList.remove("active"));

            btn.classList.add("active");
            const aba = document.getElementById(`aba-${btn.dataset.tab}`);
            if (aba) aba.classList.add("active");
        });
    });

    // Alternar Visualização Cards / Mapa
    const btnCards = document.getElementById("btn-view-cards");
    const btnMap = document.getElementById("btn-view-map");
    const containerCards = document.getElementById("container-cards");
    const containerMap = document.getElementById("map-container");

    if (btnCards && btnMap) {
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
    }

    // Formulário de Registo de Prestador
    const formPrestador = document.getElementById("form-prestador");
    if (formPrestador) {
        formPrestador.addEventListener("submit", (e) => {
            e.preventDefault();
            
            const categoriaValor = document.getElementById("reg-categoria").value;
            const partesCat = categoriaValor.split(" - ");

            const dados = {
                nome: document.getElementById("reg-nome").value,
                nif: document.getElementById("reg-nif").value,
                categoria: partesCat[0] || categoriaValor,
                profissao: partesCat[1] || categoriaValor,
                municipio: document.getElementById("reg-municipio").value,
                telefone: document.getElementById("reg-telefone").value,
                taxa: parseFloat(document.getElementById("reg-taxa").value) || 0,
                lat: posicaoUsuario ? posicaoUsuario.lat : null,
                lng: posicaoUsuario ? posicaoUsuario.lng : null
            };

            cadastrarPrestador(dados);
        });
    }

    // Executar Pesquisa
    const btnPesquisar = document.getElementById("btn-executar-busca");
    if (btnPesquisar) btnPesquisar.addEventListener("click", executarBusca);

    // Idioma
    const seletorIdioma = document.getElementById("seletor-idioma");
    if (seletorIdioma) seletorIdioma.addEventListener("change", (e) => alterarIdioma(e.target.value));

    // Tema
    const btnTema = document.getElementById("btn-tema");
    if (btnTema) {
        btnTema.addEventListener("click", () => {
            const temaAtual = document.documentElement.getAttribute("data-theme");
            const novoTema = temaAtual === "dark" ? "light" : "dark";
            document.documentElement.setAttribute("data-theme", novoTema);
        });
    }

    // Modal de Login
    const modalLogin = document.getElementById("modal-login");
    const btnLoginModal = document.getElementById("btn-login-modal");
    const closeModal = document.querySelector(".close-modal");

    if (btnLoginModal && modalLogin) {
        btnLoginModal.addEventListener("click", () => modalLogin.style.display = "flex");
    }
    if (closeModal && modalLogin) {
        closeModal.addEventListener("click", () => modalLogin.style.display = "none");
    }
}
