# Kanban de Estudos - Front-end do MVP

Front-end em HTML, CSS e JavaScript puro para consumir a API Kanban do MVP Full Stack.

## Descricao

A aplicacao apresenta um quadro Kanban para cadastro, consulta, edicao, movimentacao e remocao de tarefas. A tela tambem exibe indicadores do quadro para acompanhar o andamento das atividades.

## Tecnologias

- HTML5
- CSS3 personalizado
- JavaScript puro com `fetch`

## Requisitos

Antes de abrir o front-end, rode o back-end Flask disponivel no repositorio:

https://github.com/jkeszek/puc-mvp-backend

```bash
git clone https://github.com/jkeszek/puc-mvp-backend.git
cd puc-mvp-backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
flask --app app run --port 5001
```

A API deve ficar disponivel em:

- `http://127.0.0.1:5001`
- Swagger: `http://127.0.0.1:5001/swagger`

## Execucao do front-end

Abra o arquivo `index.html` diretamente no navegador.

Tambem e possivel clicar duas vezes no arquivo `index.html` dentro da pasta do projeto.

## Rotas consumidas

O front-end consome as rotas implementadas pela API:

- `GET /colunas`
- `GET /tarefas`
- `POST /tarefas`
- `GET /tarefas/<id>`
- `PUT /tarefas/<id>`
- `DELETE /tarefas/<id>`
- `PATCH /tarefas/<id>/mover`
- `GET /relatorios/resumo`

## Estrutura

- `index.html`: estrutura da SPA.
- `styles.css`: estilos personalizados.
- `app.js`: integracao com a API e comportamento da tela.
- `README.md`: instrucoes do projeto.
