const enderecoApi = "http://127.0.0.1:5001";

const estado = {
  colunas: [],
  tarefas: [],
  filtroPrioridade: "",
  filtroConcluida: "",
};

const elementos = {};

document.addEventListener("DOMContentLoaded", iniciarAplicacao);

function iniciarAplicacao() {
  mapearElementos();
  configurarEventos();
  carregarDados();
}

function mapearElementos() {
  elementos.marcadorApi = document.querySelector("#marcador-api");
  elementos.textoApi = document.querySelector("#texto-api");
  elementos.enderecoApi = document.querySelector("#endereco-api");
  elementos.avisoAplicacao = document.querySelector("#aviso-aplicacao");
  elementos.botaoAtualizar = document.querySelector("#botao-atualizar");
  elementos.totalTarefas = document.querySelector("#total-tarefas");
  elementos.tarefasAbertas = document.querySelector("#tarefas-abertas");
  elementos.tarefasConcluidas = document.querySelector("#tarefas-concluidas");
  elementos.tarefasAtrasadas = document.querySelector("#tarefas-atrasadas");
  elementos.formularioTarefa = document.querySelector("#formulario-tarefa");
  elementos.tituloTarefa = document.querySelector("#titulo-tarefa");
  elementos.descricaoTarefa = document.querySelector("#descricao-tarefa");
  elementos.prioridadeTarefa = document.querySelector("#prioridade-tarefa");
  elementos.prazoTarefa = document.querySelector("#prazo-tarefa");
  elementos.colunaTarefa = document.querySelector("#coluna-tarefa");
  elementos.filtroPrioridade = document.querySelector("#filtro-prioridade");
  elementos.filtroConcluida = document.querySelector("#filtro-concluida");
  elementos.quadroColunas = document.querySelector("#quadro-colunas");
  elementos.formularioEdicao = document.querySelector("#formulario-edicao");
  elementos.modalEdicao = document.querySelector("#modal-edicao");
  elementos.edicaoId = document.querySelector("#edicao-id");
  elementos.edicaoTitulo = document.querySelector("#edicao-titulo");
  elementos.edicaoDescricao = document.querySelector("#edicao-descricao");
  elementos.edicaoPrioridade = document.querySelector("#edicao-prioridade");
  elementos.edicaoPrazo = document.querySelector("#edicao-prazo");
  elementos.edicaoColuna = document.querySelector("#edicao-coluna");
  elementos.edicaoConcluida = document.querySelector("#edicao-concluida");
  elementos.botaoSalvarEdicao = document.querySelector("#botao-salvar-edicao");
  elementos.botaoCancelarEdicao = document.querySelector("#botao-cancelar-edicao");
  elementos.botaoFecharEdicao = document.querySelector("#botao-fechar-edicao");
}

function configurarEventos() {
  elementos.botaoAtualizar.addEventListener("click", carregarDados);
  elementos.formularioTarefa.addEventListener("submit", cadastrarTarefa);
  elementos.formularioEdicao.addEventListener("submit", salvarEdicao);
  elementos.botaoCancelarEdicao.addEventListener("click", limparEdicao);
  elementos.botaoFecharEdicao.addEventListener("click", limparEdicao);
  elementos.edicaoColuna.addEventListener("change", sincronizarConclusaoPelaColuna);
  elementos.modalEdicao.addEventListener("click", fecharModalPeloFundo);
  document.addEventListener("keydown", fecharModalPeloTeclado);

  elementos.filtroPrioridade.addEventListener("change", () => {
    estado.filtroPrioridade = elementos.filtroPrioridade.value;
    carregarTarefas();
  });

  elementos.filtroConcluida.addEventListener("change", () => {
    estado.filtroConcluida = elementos.filtroConcluida.value;
    carregarTarefas();
  });

  elementos.quadroColunas.addEventListener("click", tratarCliqueNoQuadro);
  elementos.quadroColunas.addEventListener("change", tratarMudancaNoQuadro);
}

async function carregarDados() {
  try {
    await Promise.all([carregarColunas(), carregarTarefas(), carregarResumo()]);
    mostrarAviso("Dados atualizados.", "sucesso");
  } catch (erro) {
    mostrarAviso(erro.message, "erro");
  }
}

async function carregarColunas() {
  const colunas = await chamarApi("/colunas");
  estado.colunas = ordenarColunas(colunas || []);
  renderizarOpcoesColuna();
  renderizarQuadro();
}

async function carregarTarefas() {
  const parametros = new URLSearchParams();

  if (estado.filtroPrioridade) {
    parametros.set("prioridade", estado.filtroPrioridade);
  }

  if (estado.filtroConcluida) {
    parametros.set("concluida", estado.filtroConcluida);
  }

  const consulta = parametros.toString();
  const rota = consulta ? `/tarefas?${consulta}` : "/tarefas";
  const tarefas = await chamarApi(rota);
  estado.tarefas = tarefas || [];
  renderizarQuadro();
}

async function carregarResumo() {
  const resumo = await chamarApi("/relatorios/resumo");
  renderizarResumo(resumo);
}

async function cadastrarTarefa(evento) {
  evento.preventDefault();

  const dados = {
    titulo: elementos.tituloTarefa.value.trim(),
    descricao: elementos.descricaoTarefa.value.trim(),
    prioridade: elementos.prioridadeTarefa.value,
    prazo: elementos.prazoTarefa.value || "",
  };

  if (elementos.colunaTarefa.value) {
    dados.coluna_id = Number(elementos.colunaTarefa.value);
  }

  try {
    const tarefa = await chamarApi("/tarefas", {
      method: "POST",
      body: JSON.stringify(dados),
    });

    if (colunaEstaConcluida(tarefa.coluna?.id || dados.coluna_id)) {
      await chamarApi(`/tarefas/${tarefa.id}`, {
        method: "PUT",
        body: JSON.stringify({ concluida: true }),
      });
    }

    elementos.formularioTarefa.reset();
    elementos.prioridadeTarefa.value = "media";
    selecionarPrimeiraColuna();
    mostrarAviso("Tarefa cadastrada.", "sucesso");
    await carregarDados();
  } catch (erro) {
    mostrarAviso(erro.message, "erro");
  }
}

async function abrirEdicao(tarefaId) {
  try {
    const tarefa = await chamarApi(`/tarefas/${tarefaId}`);
    preencherEdicao(tarefa);
    mostrarAviso("Tarefa carregada para edicao.", "sucesso");
  } catch (erro) {
    mostrarAviso(erro.message, "erro");
  }
}

async function salvarEdicao(evento) {
  evento.preventDefault();

  const tarefaId = elementos.edicaoId.value;
  if (!tarefaId) {
    return;
  }

  const dados = {
    titulo: elementos.edicaoTitulo.value.trim(),
    descricao: elementos.edicaoDescricao.value.trim(),
    prioridade: elementos.edicaoPrioridade.value,
    prazo: elementos.edicaoPrazo.value || "",
    concluida: colunaEstaConcluida(elementos.edicaoColuna.value),
    coluna_id: Number(elementos.edicaoColuna.value),
  };

  try {
    await chamarApi(`/tarefas/${tarefaId}`, {
      method: "PUT",
      body: JSON.stringify(dados),
    });
    limparEdicao();
    mostrarAviso("Tarefa atualizada.", "sucesso");
    await carregarDados();
  } catch (erro) {
    mostrarAviso(erro.message, "erro");
  }
}

async function excluirTarefa(tarefaId) {
  try {
    await chamarApi(`/tarefas/${tarefaId}`, { method: "DELETE" });
    limparEdicao();
    mostrarAviso("Tarefa removida.", "sucesso");
    await carregarDados();
  } catch (erro) {
    mostrarAviso(erro.message, "erro");
  }
}

async function moverTarefa(tarefaId, colunaId) {
  if (!colunaId) {
    return;
  }

  try {
    await chamarApi(`/tarefas/${tarefaId}/mover`, {
      method: "PATCH",
      body: JSON.stringify({ coluna_id: Number(colunaId) }),
    });
    limparEdicao();
    mostrarAviso("Tarefa movida.", "sucesso");
    await carregarDados();
  } catch (erro) {
    mostrarAviso(erro.message, "erro");
  }
}

async function chamarApi(rota, opcoes = {}) {
  try {
    const resposta = await fetch(`${enderecoApi}${rota}`, {
      headers: {
        "Content-Type": "application/json",
        ...(opcoes.headers || {}),
      },
      ...opcoes,
    });

    const dados = await lerResposta(resposta);
    atualizarEstadoApi(true);

    if (!resposta.ok) {
      const erroHttp = new Error(obterMensagemErro(dados, resposta.status));
      erroHttp.respostaRecebida = true;
      throw erroHttp;
    }

    return dados;
  } catch (erro) {
    if (!erro.respostaRecebida) {
      atualizarEstadoApi(false);
    }
    throw erro;
  }
}

async function lerResposta(resposta) {
  const texto = await resposta.text();
  if (!texto) {
    return null;
  }

  try {
    return JSON.parse(texto);
  } catch (erro) {
    return texto;
  }
}

function obterMensagemErro(dados, status) {
  if (dados && typeof dados === "object" && dados.message) {
    return dados.message;
  }

  return `A API retornou erro ${status}.`;
}

function renderizarResumo(resumo) {
  elementos.totalTarefas.textContent = resumo?.total_tarefas ?? 0;
  elementos.tarefasAbertas.textContent = resumo?.tarefas_abertas ?? 0;
  elementos.tarefasConcluidas.textContent = resumo?.tarefas_concluidas ?? 0;
  elementos.tarefasAtrasadas.textContent = resumo?.tarefas_atrasadas ?? 0;
}

function renderizarOpcoesColuna() {
  preencherSelectColunas(elementos.colunaTarefa, "");
  preencherSelectColunas(elementos.edicaoColuna, "");
  selecionarPrimeiraColuna();
}

function preencherSelectColunas(select, valorAtual) {
  select.innerHTML = "";

  if (!estado.colunas.length) {
    const opcao = document.createElement("option");
    opcao.value = "";
    opcao.textContent = "Sem colunas";
    select.appendChild(opcao);
    return;
  }

  estado.colunas.forEach((coluna) => {
    const opcao = document.createElement("option");
    opcao.value = coluna.id;
    opcao.textContent = coluna.nome;
    select.appendChild(opcao);
  });

  if (valorAtual) {
    select.value = valorAtual;
  }
}

function selecionarPrimeiraColuna() {
  if (estado.colunas.length && !elementos.colunaTarefa.value) {
    elementos.colunaTarefa.value = estado.colunas[0].id;
  }
}

function renderizarQuadro() {
  elementos.quadroColunas.innerHTML = "";

  if (!estado.colunas.length) {
    elementos.quadroColunas.appendChild(criarMensagemVazia("Nenhuma coluna carregada."));
    return;
  }

  estado.colunas.forEach((coluna) => {
    const tarefasDaColuna = estado.tarefas.filter((tarefa) => tarefa.coluna?.id === coluna.id);
    const artigo = document.createElement("article");
    artigo.className = "coluna-kanban";
    artigo.innerHTML = `
      <div class="cabecalho-coluna">
        <h3>${escaparTexto(coluna.nome)}</h3>
        <span class="contador-coluna">${tarefasDaColuna.length}</span>
      </div>
      <div class="lista-tarefas"></div>
    `;

    const lista = artigo.querySelector(".lista-tarefas");
    if (!tarefasDaColuna.length) {
      lista.appendChild(criarMensagemVazia("Sem tarefas nesta coluna."));
    } else {
      tarefasDaColuna.forEach((tarefa) => lista.appendChild(criarCartaoTarefa(tarefa)));
    }

    elementos.quadroColunas.appendChild(artigo);
  });
}

function criarCartaoTarefa(tarefa) {
  const cartao = document.createElement("article");
  const prioridade = tarefa.prioridade || "media";
  const prazo = tarefa.prazo ? formatarData(tarefa.prazo) : "Sem prazo";
  const estaAtrasada = verificarAtraso(tarefa);
  cartao.className = `cartao-tarefa prioridade-${prioridade}`;

  cartao.innerHTML = `
    <div>
      <h4>${escaparTexto(tarefa.titulo)}</h4>
      <p>${escaparTexto(tarefa.descricao || "Sem descricao.")}</p>
    </div>
    <div class="metadados-tarefa">
      <span class="etiqueta ${prioridade}">${formatarPrioridade(prioridade)}</span>
      <span class="etiqueta">${prazo}</span>
      ${tarefa.concluida ? '<span class="etiqueta baixa">Concluida</span>' : ""}
      ${estaAtrasada ? '<span class="etiqueta atrasada">Atrasada</span>' : ""}
    </div>
    <div class="acoes-tarefa">
      <button class="botao-neutro" type="button" data-acao="editar" data-id="${tarefa.id}">Editar</button>
      <button class="botao-perigo" type="button" data-acao="excluir" data-id="${tarefa.id}">Excluir</button>
    </div>
    <div class="movimento-tarefa">
      <label for="mover-${tarefa.id}">Mover</label>
      <select id="mover-${tarefa.id}" data-acao="mover" data-id="${tarefa.id}">
        <option value="">Escolha</option>
        ${criarOpcoesMovimento(tarefa.coluna?.id)}
      </select>
    </div>
  `;

  return cartao;
}

function criarOpcoesMovimento(colunaAtualId) {
  return estado.colunas
    .filter((coluna) => coluna.id !== colunaAtualId)
    .map((coluna) => `<option value="${coluna.id}">${escaparTexto(coluna.nome)}</option>`)
    .join("");
}

function tratarCliqueNoQuadro(evento) {
  const botao = evento.target.closest("button[data-acao]");
  if (!botao) {
    return;
  }

  const tarefaId = botao.dataset.id;
  if (botao.dataset.acao === "editar") {
    abrirEdicao(tarefaId);
  }

  if (botao.dataset.acao === "excluir") {
    excluirTarefa(tarefaId);
  }
}

function tratarMudancaNoQuadro(evento) {
  const select = evento.target.closest("select[data-acao='mover']");
  if (!select) {
    return;
  }

  moverTarefa(select.dataset.id, select.value);
  select.value = "";
}

function preencherEdicao(tarefa) {
  elementos.edicaoId.value = tarefa.id;
  elementos.edicaoTitulo.value = tarefa.titulo || "";
  elementos.edicaoDescricao.value = tarefa.descricao || "";
  elementos.edicaoPrioridade.value = tarefa.prioridade || "media";
  elementos.edicaoPrazo.value = tarefa.prazo || "";
  preencherSelectColunas(elementos.edicaoColuna, String(tarefa.coluna?.id || ""));
  sincronizarConclusaoPelaColuna();
  abrirModalEdicao();
}

function sincronizarConclusaoPelaColuna() {
  elementos.edicaoConcluida.checked = colunaEstaConcluida(elementos.edicaoColuna.value);
}

function colunaEstaConcluida(colunaId) {
  const coluna = estado.colunas.find((item) => item.id === Number(colunaId));
  return Number(colunaId) === 3 || coluna?.nome?.toLowerCase() === "concluido";
}

function limparEdicao() {
  elementos.formularioEdicao.reset();
  elementos.edicaoId.value = "";
  fecharModalEdicao();
}

function abrirModalEdicao() {
  elementos.modalEdicao.hidden = false;
  document.body.classList.add("modal-aberto");
  elementos.edicaoTitulo.focus();
}

function fecharModalEdicao() {
  elementos.modalEdicao.hidden = true;
  document.body.classList.remove("modal-aberto");
}

function fecharModalPeloFundo(evento) {
  if (evento.target === elementos.modalEdicao) {
    limparEdicao();
  }
}

function fecharModalPeloTeclado(evento) {
  if (evento.key === "Escape" && !elementos.modalEdicao.hidden) {
    limparEdicao();
  }
}

function atualizarEstadoApi(online) {
  elementos.marcadorApi.classList.toggle("online", online);
  elementos.marcadorApi.classList.toggle("offline", !online);
  elementos.marcadorApi.classList.remove("aguardando");
  elementos.textoApi.textContent = online ? "API conectada" : "API indisponivel";
  elementos.enderecoApi.textContent = enderecoApi;
}

function mostrarAviso(texto, tipo) {
  elementos.avisoAplicacao.textContent = texto;
  elementos.avisoAplicacao.className = `aviso-aplicacao visivel ${tipo === "erro" ? "erro" : ""}`;

  window.clearTimeout(mostrarAviso.tempo);
  mostrarAviso.tempo = window.setTimeout(() => {
    elementos.avisoAplicacao.classList.remove("visivel");
  }, 3600);
}

function criarMensagemVazia(texto) {
  const mensagem = document.createElement("div");
  mensagem.className = "mensagem-vazia";
  mensagem.textContent = texto;
  return mensagem;
}

function ordenarColunas(colunas) {
  return [...colunas].sort((a, b) => a.ordem - b.ordem);
}

function formatarPrioridade(prioridade) {
  const nomes = {
    baixa: "Baixa",
    media: "Media",
    alta: "Alta",
  };

  return nomes[prioridade] || prioridade;
}

function formatarData(valor) {
  const [ano, mes, dia] = valor.split("-");
  return `${dia}/${mes}/${ano}`;
}

function verificarAtraso(tarefa) {
  if (!tarefa.prazo || tarefa.concluida) {
    return false;
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const prazo = new Date(`${tarefa.prazo}T00:00:00`);
  return prazo < hoje;
}

function escaparTexto(valor) {
  return String(valor)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
