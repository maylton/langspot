# LangSpot para Linux

Aplicativo **nativo** do LangSpot para professores, em GTK4 + libadwaita (Python). Usa o mesmo backend
(Supabase) do site, então tudo o que você faz aqui aparece no site e no app do aluno, e vice-versa.

## O que tem na versão 0.1

| Área | O que faz |
|---|---|
| **Agenda** | Aulas por dia (próximas e anteriores), botão **Entrar** na sala online, detalhes da aula, cancelar aula, **Nova aula** com calendário |
| **Alunos** | Busca, perfil, contato (copiar e-mail, abrir WhatsApp), habilidades, próxima aula e histórico de avaliações com o nível CEFR |
| **Correção** | Fila de Writing, Speaking e Mediation: enunciado, texto-fonte, resposta com contagem de palavras, **player de áudio**, gravações apagadas pelo aluno, **rubrica por nível CEFR**, comentário, excluir tarefa sem resposta, **ver a correção e concluir a revisão** |
| **Ao vivo** | Alunos fazendo prova agora (presença, progresso), etapas, o que falta, a questão que está na tela do aluno e sinais de integridade; atualiza a cada 10 s |
| **Notificações** | Lista, marcar como lida, marcar todas; ao clicar, abre a área relacionada |
| **No sistema** | Notificações do desktop quando chega uma notificação nova ou um aluno começa uma prova; contadores na barra lateral; sessão guardada no chaveiro (libsecret); opção de continuar em segundo plano ao fechar a janela |
| **No site** | Avaliações (construtor de provas), materiais, tarefas e quiz, financeiro e relatórios abrem no navegador |

## Instalar

```bash
./install.sh
```

O instalador:
- confere as dependências (GTK4, libadwaita, libsecret, GStreamer com Opus/WebM);
- cria `~/.config/langspot/config.json` a partir do `.env` do projeto (endereço e chave pública do Supabase);
- instala o lançador `langspot-linux`, a entrada **LangSpot** no menu e o ícone;
- renomeia o app Tauri para **LangSpot (Web)** no menu.

`./install.sh --reconfigure` refaz a configuração; `./install.sh --uninstall` remove o app.

## Desenvolvimento

```bash
python3 -m langspot_linux                      # rodar a partir do código
python3 -m unittest tests.test_model tests.test_supabase
xvfb-run -a python3 -m tests.test_ui_flow       # fluxo completo da interface (Supabase falso)
xvfb-run -a python3 -m tests.screenshots /tmp/telas [--dark]
```

`tests/fake_supabase.py` é um Supabase falso com dados fictícios (login `professor@exemplo.com` / `demo123`).
Para usar o app com ele:

```bash
python3 -m tests.fake_supabase 54321 &
LANGSPOT_SUPABASE_URL=http://127.0.0.1:54321 LANGSPOT_SUPABASE_ANON_KEY=demo LANGSPOT_DISABLE_KEYRING=1 python3 -m langspot_linux
```

### Estrutura

- `langspot_linux/supabase.py`: cliente Supabase (Auth, PostgREST, RPC, Storage) só com a biblioteca padrão; renova a sessão sozinho.
- `langspot_linux/model.py`: lógica sem interface (escala CEFR, nota da rubrica, etapas da prova ao vivo), igual à do site.
- `langspot_linux/ui/`: aplicativo, janela, login e uma página por área (`ui/pages/`).

As funções e tabelas usadas são as mesmas do site: `student_records`, `lessons`, `notifications`, `profiles`,
`list_assessment_review_queue`, `get_assessment_result`, `review_assessment_response`, `exclude_assessment_response`,
`finalize_assessment_review`, `list_active_teacher_attempts`, `get_attempt_live_status` e `get_assessment_progress`.
Ao mudar uma delas no banco, atualize o app e o `tests/fake_supabase.py`.
