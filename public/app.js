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

            // Remove classe ativa de todos os botões e abas
            navButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(tab => tab.classList.remove('active'));

            // Ativa o botão e a aba selecionada
            button.classList.add('active');
            const activeSection = document.getElementById(`aba-${targetTab}`);
            if (activeSection) {
                activeSection.classList.add('active');
            }
        });
    });

    // ------------------------------------------------------------------
    // 2. CONTROLE DO MODAL DE LOGIN
    // ------------------------------------------------------------------
    const modalLogin = document.getElementById('modal-login');
    const btnAbrirModal = document.getElementById('btn-login-modal');
    const btnFecharModal = document.getElementById('btn-fechar-modal');

    if (btnAbrirModal && modalLogin) {
        btnAbrirModal.addEventListener('click', (e) => {
            e.preventDefault();
            modalLogin.style.display = 'flex';
        });
    }

    if (btnFecharModal && modalLogin) {
        btnFecharModal.addEventListener('click', () => {
            modalLogin.style.display = 'none';
        });
    }

    // Fechar ao clicar fora do caixa de login
    window.addEventListener('click', (event) => {
        if (event.target === modalLogin) {
            modalLogin.style.display = 'none';
        }
    });

    // ------------------------------------------------------------------
    // 3. SUBMISSÃO DE CANDIDATURA DE PRESTADOR
    // ------------------------------------------------------------------
    const formPrestador = document.getElementById('form-prestador');
    if (formPrestador) {
        formPrestador.addEventListener('submit', async (e) => {
            e.preventDefault();

            const dados = {
                nome: document.getElementById('reg-nome').value,
                nif: document.getElementById('reg-nif').value,
                categoria: document.getElementById('reg-categoria').value,
                municipio: document.getElementById('reg-municipio').value,
                telefone: document.getElementById('reg-telefone').value,
                taxa: document.getElementById('reg-taxa').value
            };

            try {
                const response = await fetch('/api/prestadores', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dados)
                });

                if (response.ok) {
                    alert('Candidatura submetida com sucesso!');
                    formPrestador.reset();
                } else {
                    alert('Erro ao submeter candidatura. Verifique os dados.');
                }
            } catch (err) {
                console.error(err);
                alert('Erro de conexão ao servidor.');
            }
        });
    }

    // ------------------------------------------------------------------
    // 4. SUBMISSÃO DE LOGIN
    // ------------------------------------------------------------------
    const formLogin = document.getElementById('form-login');
    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const senha = document.getElementById('login-senha').value;

            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, senha })
                });

                if (response.ok) {
                    alert('Login efetuado com sucesso!');
                    modalLogin.style.display = 'none';
                    formLogin.reset();
                } else {
                    alert('Email ou senha incorretos.');
                }
            } catch (err) {
                console.error(err);
                alert('Erro ao autenticar.');
            }
        });
    }
});
            
