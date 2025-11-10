// Variáveis globais
let transacoes = JSON.parse(localStorage.getItem('financas')) || [];
let metas = JSON.parse(localStorage.getItem('metas')) || [];
let chartGastos, chartCategorias;
let transacaoEditando = null;

// Dicas rotativas
const dicas = [
    "💡 Dica do Finanças+: 'A cada R$100 que você economiza, está comprando liberdade para o futuro.'",
    "💡 Dica do Finanças+: 'Revise seus gastos mensais e identifique onde pode economizar.'",
    "💡 Dica do Finanças+: 'Estabeleça metas realistas para seus objetivos financeiros.'",
    "💡 Dica do Finanças+: 'Mantenha um fundo de emergência equivalente a 3-6 meses de despesas.'",
    "💡 Dica do Finanças+: 'Evite dívidas com juros altos, priorize o pagamento delas.'"
];

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    // Configurar data atual como padrão
    document.getElementById('data').valueAsDate = new Date();
    
    // Configurar eventos
    document.getElementById('form-transacao').addEventListener('submit', adicionar);
    document.getElementById('form-edicao').addEventListener('submit', salvarEdicao);
    document.getElementById('form-meta').addEventListener('submit', adicionarMeta);
    document.getElementById('filtro-tipo').addEventListener('change', aplicarFiltros);
    document.getElementById('filtro-categoria').addEventListener('change', aplicarFiltros);
    document.getElementById('filtro-mes').addEventListener('change', aplicarFiltros);
    
    // Inicializar a aplicação
    atualizarTudo();
    
    // Rotacionar dicas
    rotacionarDicas();
    setInterval(rotacionarDicas, 8000);
});

function rotacionarDicas() {
    const tips = document.querySelectorAll('.tip');
    let visibleIndex = -1;
    
    // Encontrar a dica visível atual
    tips.forEach((tip, index) => {
        if (tip.style.display !== 'none') {
            visibleIndex = index;
            tip.style.display = 'none';
        }
    });
    
    // Mostrar próxima dica
    const nextIndex = (visibleIndex + 1) % tips.length;
    tips[nextIndex].style.display = 'block';
}

function adicionar(event) {
    event.preventDefault();
    
    const descricao = document.getElementById('descricao').value.trim();
    const valor = parseFloat(document.getElementById('valor').value);
    const tipo = document.getElementById('tipo').value;
    const categoria = document.getElementById('categoria').value || "Outros";
    const data = document.getElementById('data').value;
    const notas = document.getElementById('notas').value.trim();

    if (!descricao || isNaN(valor) || valor <= 0) {
        alert("Por favor, preencha todos os campos corretamente!");
        return;
    }

    const novaTransacao = {
        id: Date.now(),
        descricao,
        valor,
        tipo,
        categoria,
        data,
        notas
    };
    
    transacoes.push(novaTransacao);
    localStorage.setItem('financas', JSON.stringify(transacoes));

    // Limpar formulário
    document.getElementById('form-transacao').reset();
    document.getElementById('data').valueAsDate = new Date();
    
    atualizarTudo();
    
    // Feedback visual
    const btn = document.querySelector('#form-transacao button');
    const originalText = btn.textContent;
    btn.textContent = '✓ Adicionado!';
    btn.style.background = '#22c55e';
    
    setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
    }, 1500);
}

function atualizarTabela() {
    const corpo = document.querySelector("#tabela tbody");
    corpo.innerHTML = "";
    
    // Ordenar por data (mais recente primeiro)
    transacoes.sort((a,b) => new Date(b.data) - new Date(a.data));
    
    // Aplicar filtros
    const tipoFiltro = document.getElementById('filtro-tipo').value;
    const categoriaFiltro = document.getElementById('filtro-categoria').value;
    const mesFiltro = document.getElementById('filtro-mes').value;
    
    const transacoesFiltradas = transacoes.filter(t => {
        // Filtro por tipo
        if (tipoFiltro !== 'todos' && t.tipo !== tipoFiltro) return false;
        
        // Filtro por categoria
        if (categoriaFiltro !== 'todos' && t.categoria !== categoriaFiltro) return false;
        
        // Filtro por mês
        if (mesFiltro !== 'todos') {
            const transacaoMes = new Date(t.data).toISOString().substring(0, 7);
            if (transacaoMes !== mesFiltro) return false;
        }
        
        return true;
    });
    
    if (transacoesFiltradas.length === 0) {
        corpo.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <div class="empty-icon">📝</div>
                    <p>Nenhuma transação encontrada</p>
                    <p>Tente ajustar os filtros ou adicione uma nova transação</p>
                </td>
            </tr>
        `;
        return;
    }
    
    transacoesFiltradas.forEach(t => {
        const tr = document.createElement("tr");
        const classe = t.tipo === 'renda' ? 'positivo' : 'negativo';
        const badgeClasse = t.tipo === 'renda' ? 'badge-renda' : 'badge-despesa';
        
        tr.innerHTML = `
            <td>${formatarData(t.data)}</td>
            <td>
                <div>${t.descricao}</div>
                ${t.notas ? `<small style="color:var(--text-light)">${t.notas}</small>` : ''}
            </td>
            <td>${t.categoria}</td>
            <td><span class="status-badge ${badgeClasse}">${t.tipo === 'renda' ? 'Renda' : 'Despesa'}</span></td>
            <td class="${classe}">${t.tipo === 'renda' ? '+' : '-'} R$ ${t.valor.toFixed(2)}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn" onclick="editarTransacao(${t.id})" title="Editar">✏️</button>
                    <button class="action-btn" onclick="excluirTransacao(${t.id})" title="Excluir">🗑️</button>
                </div>
            </td>
        `;
        corpo.appendChild(tr);
    });
}

function aplicarFiltros() {
    atualizarTabela();
}

function atualizarFiltros() {
    // Atualizar opções de categoria
    const categorias = [...new Set(transacoes.map(t => t.categoria))];
    const selectCategoria = document.getElementById('filtro-categoria');
    const selectCategoriaEdicao = document.getElementById('edicao-categoria');
    
    // Limpar opções exceto a primeira
    while (selectCategoria.children.length > 1) {
        selectCategoria.removeChild(selectCategoria.lastChild);
    }
    
    while (selectCategoriaEdicao.children.length > 0) {
        selectCategoriaEdicao.removeChild(selectCategoriaEdicao.lastChild);
    }
    
    // Adicionar categorias
    categorias.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        selectCategoria.appendChild(option);
        
        const optionEdicao = document.createElement('option');
        optionEdicao.value = cat;
        optionEdicao.textContent = cat;
        selectCategoriaEdicao.appendChild(optionEdicao);
    });
    
    // Atualizar opções de mês
    const meses = [...new Set(transacoes.map(t => new Date(t.data).toISOString().substring(0, 7)))].sort().reverse();
    const selectMes = document.getElementById('filtro-mes');
    
    // Limpar opções exceto a primeira
    while (selectMes.children.length > 1) {
        selectMes.removeChild(selectMes.lastChild);
    }
    
    // Adicionar meses
    meses.forEach(mes => {
        const option = document.createElement('option');
        option.value = mes;
        const data = new Date(mes + '-01');
        option.textContent = data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        selectMes.appendChild(option);
    });
}

function formatarData(dataStr) {
    const data = new Date(dataStr);
    return data.toLocaleDateString('pt-BR');
}

function editarTransacao(id) {
    const transacao = transacoes.find(t => t.id === id);
    if (!transacao) return;
    
    transacaoEditando = id;
    
    // Preencher formulário de edição
    document.getElementById('edicao-id').value = id;
    document.getElementById('edicao-descricao').value = transacao.descricao;
    document.getElementById('edicao-valor').value = transacao.valor;
    document.getElementById('edicao-tipo').value = transacao.tipo;
    document.getElementById('edicao-categoria').value = transacao.categoria;
    document.getElementById('edicao-data').value = transacao.data;
    document.getElementById('edicao-notas').value = transacao.notas || '';
    
    // Mostrar modal
    document.getElementById('modal-edicao').style.display = 'flex';
}

function fecharModal() {
    document.getElementById('modal-edicao').style.display = 'none';
    transacaoEditando = null;
}

function salvarEdicao(event) {
    event.preventDefault();
    
    const id = parseInt(document.getElementById('edicao-id').value);
    const descricao = document.getElementById('edicao-descricao').value.trim();
    const valor = parseFloat(document.getElementById('edicao-valor').value);
    const tipo = document.getElementById('edicao-tipo').value;
    const categoria = document.getElementById('edicao-categoria').value;
    const data = document.getElementById('edicao-data').value;
    const notas = document.getElementById('edicao-notas').value.trim();

    if (!descricao || isNaN(valor) || valor <= 0) {
        alert("Por favor, preencha todos os campos corretamente!");
        return;
    }

    const index = transacoes.findIndex(t => t.id === id);
    if (index !== -1) {
        transacoes[index] = {
            ...transacoes[index],
            descricao,
            valor,
            tipo,
            categoria,
            data,
            notas
        };
        
        localStorage.setItem('financas', JSON.stringify(transacoes));
        fecharModal();
        atualizarTudo();
    }
}

function excluirTransacao(id) {
    if (confirm("Tem certeza que deseja excluir esta transação?")) {
        transacoes = transacoes.filter(t => t.id !== id);
        localStorage.setItem('financas', JSON.stringify(transacoes));
        atualizarTudo();
    }
}

function atualizarResumo() {
    if (transacoes.length === 0) {
        document.getElementById('resumo').innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📊</div>
                <p>Nenhuma transação registrada</p>
                <p>Adicione sua primeira transação para ver o resumo</p>
            </div>
        `;
        document.getElementById('insight-text').textContent = "Adicione suas primeiras transações para receber insights personalizados.";
        return;
    }

    const totalRenda = transacoes.filter(t => t.tipo === "renda").reduce((a, b) => a + b.valor, 0);
    const totalDespesa = transacoes.filter(t => t.tipo === "despesa").reduce((a, b) => a + b.valor, 0);
    const saldo = totalRenda - totalDespesa;
    
    // Calcular variação do mês anterior (simulação)
    const variacao = Math.random() * 20 - 10; // Entre -10% e +10%
    const variacaoTexto = variacao >= 0 ? `+${variacao.toFixed(1)}%` : `${variacao.toFixed(1)}%`;
    const variacaoClasse = variacao >= 0 ? 'positivo' : 'negativo';

    let insight = "";
    if (saldo > 0) {
        insight = "Excelente! Você terminou no azul. Continue poupando para suas metas!";
    } else if (saldo < 0) {
        insight = "Cuidado! Seu saldo está negativo. Vamos revisar gastos e reequilibrar?";
    } else {
        insight = "Você fechou o mês no zero. Boa hora para definir uma meta de economia.";
    }

    document.getElementById("resumo").innerHTML = `
        <div class="resumo-card">
            <div class="resumo-desc">Renda Total</div>
            <div class="resumo-valor positivo">R$ ${totalRenda.toFixed(2)}</div>
        </div>
        <div class="resumo-card">
            <div class="resumo-desc">Despesas Totais</div>
            <div class="resumo-valor negativo">R$ ${totalDespesa.toFixed(2)}</div>
        </div>
        <div class="resumo-card">
            <div class="resumo-desc">Saldo Atual</div>
            <div class="resumo-valor ${saldo >= 0 ? 'positivo' : 'negativo'}">R$ ${saldo.toFixed(2)}</div>
        </div>
        <div class="resumo-card">
            <div class="resumo-desc">Variação</div>
            <div class="resumo-valor ${variacaoClasse}">${variacaoTexto}</div>
        </div>
    `;

    document.getElementById("insight-text").textContent = insight;

    atualizarGraficos(totalRenda, totalDespesa);
}

function atualizarGraficos(renda, despesa) {
    const ctx1 = document.getElementById('graficoGastos');
    const ctx2 = document.getElementById('graficoCategorias');

    if (chartGastos) chartGastos.destroy();
    if (chartCategorias) chartCategorias.destroy();

    // Gráfico de barras - Renda vs Despesas
    chartGastos = new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: ['Renda', 'Despesas'],
            datasets: [{
                label: 'Resumo Geral',
                data: [renda, despesa],
                backgroundColor: ['#22c55e', '#ef4444'],
                borderColor: ['#16a34a', '#dc2626'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `R$ ${context.raw.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                y: { 
                    beginAtZero: true, 
                    ticks: { 
                        color: '#f8fafc',
                        callback: function(value) {
                            return 'R$ ' + value.toFixed(2);
                        }
                    } 
                },
                x: { 
                    ticks: { color: '#f8fafc' } 
                }
            }
        }
    });

    // Gráfico de pizza - Distribuição por categoria
    const categorias = {};
    transacoes.forEach(t => {
        if (t.tipo === 'despesa') {
            categorias[t.categoria] = (categorias[t.categoria] || 0) + t.valor;
        }
    });

    // Se não há despesas, mostrar mensagem
    if (Object.keys(categorias).length === 0) {
        ctx2.getContext('2d').clearRect(0, 0, ctx2.width, ctx2.height);
        ctx2.getContext('2d').fillStyle = '#94a3b8';
        ctx2.getContext('2d').font = '16px Arial';
        ctx2.getContext('2d').textAlign = 'center';
        ctx2.getContext('2d').fillText('Sem dados de despesas', ctx2.width/2, ctx2.height/2);
        return;
    }

    chartCategorias = new Chart(ctx2, {
        type: 'pie',
        data: {
            labels: Object.keys(categorias),
            datasets: [{
                data: Object.values(categorias),
                backgroundColor: [
                    '#38bdf8','#facc15','#ef4444','#22c55e',
                    '#a855f7','#fb923c','#f87171','#3b82f6','#64748b'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { 
                    position: 'right',
                    labels: { 
                        color: '#f8fafc',
                        usePointStyle: true,
                        padding: 15
                    } 
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${context.label}: R$ ${value.toFixed(2)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function atualizarMetas() {
    const container = document.getElementById('metas-container');
    
    if (metas.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🎯</div>
                <p>Nenhuma meta definida</p>
                <p>Crie sua primeira meta financeira</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    metas.forEach(meta => {
        // Calcular progresso (simulação)
        const progresso = Math.min(Math.random() * 100, 100);
        const progressoClasse = progresso >= 100 ? 'positivo' : 
                               progresso >= 50 ? 'warning' : 'negativo';
        
        // Calcular dias restantes
        const hoje = new Date();
        const prazo = new Date(meta.prazo);
        const diffTime = prazo - hoje;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const diasTexto = diffDays > 0 ? `${diffDays} dias restantes` : 'Prazo expirado';
        
        html += `
            <div class="meta-item" style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid var(--gray);">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <strong>${meta.descricao}</strong>
                    <span style="font-size: 0.9rem; color: var(--text-light);">${meta.categoria}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span>R$ ${meta.valor.toFixed(2)}</span>
                    <span class="${diffDays > 0 ? '' : 'negativo'}">${diasTexto}</span>
                </div>
                <div style="background: var(--dark); border-radius: 10px; height: 10px; overflow: hidden;">
                    <div style="background: var(--primary); height: 100%; width: ${progresso}%;"></div>
                </div>
                <div style="display: flex; justify-content: space-between; margin-top: 5px; font-size: 0.8rem;">
                    <span>Progresso: ${progresso.toFixed(1)}%</span>
                    <button class="action-btn" onclick="excluirMeta(${meta.id})" title="Excluir meta">🗑️</button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function abrirModalMeta() {
    document.getElementById('modal-meta').style.display = 'flex';
    document.getElementById('meta-prazo').valueAsDate = new Date(new Date().setMonth(new Date().getMonth() + 3));
}

function fecharModalMeta() {
    document.getElementById('modal-meta').style.display = 'none';
}

function adicionarMeta(event) {
    event.preventDefault();
    
    const descricao = document.getElementById('meta-descricao').value.trim();
    const valor = parseFloat(document.getElementById('meta-valor').value);
    const prazo = document.getElementById('meta-prazo').value;
    const categoria = document.getElementById('meta-categoria').value;

    if (!descricao || isNaN(valor) || valor <= 0) {
        alert("Por favor, preencha todos os campos corretamente!");
        return;
    }

    const novaMeta = {
        id: Date.now(),
        descricao,
        valor,
        prazo,
        categoria
    };
    
    metas.push(novaMeta);
    localStorage.setItem('metas', JSON.stringify(metas));

    document.getElementById('form-meta').reset();
    fecharModalMeta();
    atualizarMetas();
}

function excluirMeta(id) {
    if (confirm("Tem certeza que deseja excluir esta meta?")) {
        metas = metas.filter(m => m.id !== id);
        localStorage.setItem('metas', JSON.stringify(metas));
        atualizarMetas();
    }
}

function exportarDados() {
    if (transacoes.length === 0) {
        alert("Não há dados para exportar.");
        return;
    }
    
    // Criar CSV
    let csv = 'Data,Descrição,Categoria,Tipo,Valor,Notas\n';
    transacoes.forEach(t => {
        csv += `"${t.data}","${t.descricao}","${t.categoria}","${t.tipo}","${t.valor}","${t.notas || ''}"\n`;
    });
    
    // Criar arquivo e fazer download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financas_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function limparTudo() {
    if (confirm("Tem certeza que deseja limpar TODOS os dados? Esta ação não pode ser desfeita.")) {
        transacoes = [];
        localStorage.setItem('financas', JSON.stringify(transacoes));
        atualizarTudo();
    }
}

function atualizarTudo() {
    atualizarTabela();
    atualizarFiltros();
    atualizarResumo();
    atualizarMetas();
}
