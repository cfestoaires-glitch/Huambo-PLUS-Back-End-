const SUPABASE_URL = 'https://vpukkvxnlwyhoqpgckzh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_XawUI3JjNpCjETe4tEAXwQ_QkgkVlul';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', () => {
    const userRoleSelect = document.getElementById('userRole');
    const providerFields = document.getElementById('providerFields');
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');

    const authSection = document.getElementById('authSection');
    const clientPanel = document.getElementById('clientPanel');
    const providerPanel = document.getElementById('providerPanel');
    const adminPanel = document.getElementById('adminPanel');

    // Mostrar ou ocultar campos de documentos se for prestador
    userRoleSelect.addEventListener('change', (e) => {
        if (e.target.value === 'provider') {
            providerFields.classList.remove('hidden');
        } else {
            providerFields.classList.add('hidden');
        }
    });

    // Lógica de Registo de Nova Conta
    signupBtn.addEventListener('click', async () => {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const role = userRoleSelect.value;

        if (!email || !password) {
            alert('Por favor, preencha o e-mail e a palavra-passe.');
            return;
        }

        let selfieUrl = '';
        let biUrl = '';

        if (role === 'provider') {
            const selfieInput = document.getElementById('selfieFile');
            const biInput = document.getElementById('biFile');

            if (selfieInput.files.length === 0 || biInput.files.length === 0) {
                alert('Prestadores devem enviar a Selfie e a foto do BI para validação.');
                return;
            }

            try {
                const selfieFile = selfieInput.files[0];
                const biFile = biInput.files[0];
                
                const selfiePath = `documents/selfie_${Date.now()}_${selfieFile.name}`;
                const biPath = `documents/bi_${Date.now()}_${biFile.name}`;

                const uploadSelfie = await supabaseClient.storage.from('documentos-prestadores').upload(selfiePath, selfieFile);
                if (uploadSelfie.error) throw uploadSelfie.error;
                selfieUrl = uploadSelfie.data.path;

                const uploadBi = await supabaseClient.storage.from('documentos-prestadores').upload(biPath, biFile);
                if (uploadBi.error) throw uploadBi.error;
                biUrl = uploadBi.data.path;

            } catch (err) {
                alert('Erro ao enviar documentos: ' + err.message);
                return;
            }
        }

        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
                data: { 
                    role: role,
                    status: role === 'provider' ? 'pending' : 'active',
                    selfie: selfieUrl,
                    bi: biUrl
                }
            }
        });

        if (error) {
            alert('Erro no registo: ' + error.message);
        } else {
            alert('Conta criada com sucesso! Faça login para aceder.');
        }
    });

    // Lógica de Login
    loginBtn.addEventListener('click', async () => {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        if (!email || !password) {
            alert('Insira o e-mail e a palavra-passe.');
            return;
        }

        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            alert('Erro ao entrar: ' + error.message);
        } else {
            verificarSessaoEredirecionar(data.user);
        }
    });

    // Direcionar para o painel correspondente ao papel do utilizador
    function verificarSessaoEredirecionar(user) {
        authSection.classList.add('hidden');
        
        const role = user.user_metadata ? user.user_metadata.role : 'client';
        const email = user.email || '';

        if (role === 'admin' || email.includes('admin')) {
            adminPanel.classList.remove('hidden');
        } else if (role === 'provider') {
            providerPanel.classList.remove('hidden');
        } else {
            clientPanel.classList.remove('hidden');
        }
    }

    // Terminar Sessão em qualquer painel
    ['logoutClient', 'logoutProvider', 'logoutAdmin'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('click', async () => {
                await supabaseClient.auth.signOut();
                location.reload();
            });
        }
    });
});
