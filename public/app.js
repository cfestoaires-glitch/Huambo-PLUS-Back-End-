// ==========================================
// CÓDIGO DE DIAGNÓSTICO E TESTE RÁPIDO
// ==========================================

console.log("O script app.js começou a carregar...");

// Função para mostrar mensagens diretamente no ecrã e na consola
function mostrarErroCritico(mensagem) {
    console.error(mensagem);
    document.body.innerHTML = `
        <div style="padding: 20px; font-family: sans-serif; background: #fee2e2; color: #991b1b; border: 2px solid #ef4444; margin: 20px; border-radius: 8px;">
            <h2>⚠️ Erro Crítico Detetado no App.js</h2>
            <p>${mensagem}</p>
            <p style="font-size: 0.8rem; margin-top: 10px;">Abre a consola do navegador (F12) para mais detalhes.</p>
        </div>
    `;
}

try {
    // 1. Verificar se o Supabase existe
    if (typeof window.supabase === 'undefined') {
        throw new Error("A biblioteca do Supabase (supabase-js) não foi encontrada no HTML! Certifica-te de que o <script> do CDN está no index.html antes do app.js.");
    }

    console.log("Biblioteca Supabase detetada com sucesso.");

    const supabaseUrl = 'https://vpukkvxnlwyhoqpgckzh.supabase.co';
    const supabaseKey = 'sb_publishable_XawUI3JjNpCjETe4tEAXwQ_QkgkVlul';
    const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

    document.addEventListener("DOMContentLoaded", () => {
        console.log("DOMContentLoaded disparado com sucesso!");
        
        // Vamos escrever uma mensagem no primeiro container que encontrarmos para provar que o JS está vivo
        const container = document.getElementById("container-cards") || document.getElementById("aba-registar");
        if (container) {
            container.innerHTML = `
                <div style="padding: 20px; background: #dcfce7; color: #166534; border: 1px solid #22c55e; border-radius: 8px; text-align: center;">
                    <h3>✅ O JavaScript está a funcionar!</h3>
                    <p>O script carregou e ligou-se com sucesso ao DOM.</p>
                </div>
            `;
        } else {
            console.warn("Aviso: Não encontrei #container-cards nem #aba-registar no HTML.");
        }
    });

} catch (err) {
    mostrarErroCritico(err.message);
}
