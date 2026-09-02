// Configuração do Supabase (Substitui com as tuas chaves reais)
const SUPABASE_URL = 'O_TEU_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'O_TEU_SUPABASE_ANON_KEY';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const uploadSection = document.getElementById('uploadSection');
    const uploadBtn = document.getElementById('uploadBtn');

    signupBtn.addEventListener('click', async () => {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const role = document.getElementById('userRole').value;

        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
                data: { role: role }
            }
        });

        if (error) {
            alert('Erro no registo: ' + error.message);
        } else {
            alert('Registo efetuado com sucesso! Verifique o e-mail se necessário.');
            uploadSection.style.display = 'block';
        }
    });

    loginBtn.addEventListener('click', async () => {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            alert('Erro ao entrar: ' + error.message);
        } else {
            alert('Login efetuado com sucesso!');
            uploadSection.style.display = 'block';
        }
    });

    uploadBtn.addEventListener('click', async () => {
        const fileInput = document.getElementById('imageFile');
        const status = document.getElementById('uploadStatus');

        if (fileInput.files.length === 0) {
            alert('Selecione uma imagem primeiro.');
            return;
        }

        const file = fileInput.files[0];
        const fileName = `${Date.now()}_${file.name}`;

        status.textContent = 'A enviar imagem...';

        const { data, error } = await supabaseClient.storage
            .from('images') // Nome do bucket no Supabase
            .upload(fileName, file);

        if (error) {
            status.textContent = 'Erro no upload: ' + error.message;
        } else {
            status.textContent = 'Upload efetuado com sucesso!';
        }
    });
});

