# LangSpot para Linux

Aplicativo **nativo** do LangSpot para professores, em GTK4 + libadwaita (Python). Usa o mesmo backend
(Supabase) do site, então tudo o que você faz aqui aparece no site e no app do aluno, e vice-versa.

## O que tem na versão 0.2

| Área | O que faz |
|---|---|
| **Agenda** | Calendário por **semana**, **mês** ou **lista** (como no site), filtros por aluno e situação, **Nova aula** (inclusive pelo **+** de cada dia), editar, cancelar, **concluir a aula com o registro** (presença, resumo, pontos fortes, a melhorar, tarefa de casa e habilidades, que também atualizam o perfil do aluno), editar ou excluir o registro, **pedidos de cancelamento** dos alunos (aprovar ou recusar com resposta), entrar na sala online e adicionar ao Google Agenda |
| **Alunos** | Busca, perfil, contato (copiar e-mail, abrir WhatsApp), habilidades, próxima aula e histórico de avaliações com o nível CEFR |
| **Tarefas** | Para corrigir, aguardando o aluno e corrigidas; entrega em texto ou arquivo, comentários feitos no site, **nota (0 a 100) e comentário**, **nova tarefa** com prazo e material (o material é compartilhado com o aluno), excluir |
| **Correção** | Fila de Writing, Speaking e Mediation: enunciado, texto-fonte, resposta com contagem de palavras, **player de áudio**, gravações apagadas pelo aluno, **rubrica por nível CEFR**, comentário, excluir tarefa sem resposta, **ver a correção e concluir a revisão** |
| **Ao vivo** | Alunos fazendo prova agora (presença, progresso), etapas, o que falta, a questão que está na tela do aluno e sinais de integridade; atualiza a cada 10 s |
| **Materiais** | Biblioteca com busca e filtros (tipo e nível), abrir, **enviar arquivo** (PDF, DOCX, PPTX ou imagem até 10 MB) ou **salvar link**, **compartilhar com alunos**, excluir |
| **Financeiro** | Recebido, a receber e atrasado; cobranças a receber, pagas ou todas; **nova cobrança**, marcar como paga ou pendente, **lembrete pelo WhatsApp**, excluir |
| **Relatórios** | **Resumo do período** (aulas, conclusão, frequência, entrega e média das tarefas, tempo de aula, atividade por aluno) e **relatório individual**, com períodos rápidos ou datas; copiar o resumo ou enviar pelo WhatsApp |
| **Notificações** | Lista, marcar como lida, marcar todas; ao clicar, abre a área relacionada |
| **No sistema** | Notificações do desktop quando chega uma notificação nova, um aluno começa uma prova ou entrega uma tarefa; contadores na barra lateral; sessão guardada no chaveiro (libsecret); opção de continuar em segundo plano ao fechar a janela; **aulas no calendário do sistema** (abaixo) |
| **No site** | Construtor de provas, quiz interativo, PDF dos relatórios e configurações da conta abrem no navegador |

### Aulas no calendário do sistema

No menu principal, **Mostrar as aulas no calendário do sistema**. O app passa a manter o arquivo
`~/.local/share/calendars/langspot/aulas.ics` (aulas agendadas e concluídas dos últimos 60 dias em diante;
canceladas saem) e o atualiza quando a agenda carrega e a cada 5 minutos. Depois liga o arquivo ao que encontrar:

- **GNOME**: cria uma agenda do Evolution Data Server (`~/.config/evolution/sources/langspot-aulas.source`).
  As aulas aparecem no relógio do GNOME Shell, no GNOME Agenda e no Evolution.
- **KDE Plasma**: cria um recurso iCal do Akonadi que acompanha o arquivo. As aulas aparecem no Merkuro/KOrganizer e,
  com o plugin **Eventos PIM** ligado nas configurações do relógio, no calendário da barra.
- **Caelestia**: o calendário do dashboard mostra os eventos de todos os `.ics` em `~/.local/share/calendars`.
- **Outros**: qualquer app de calendário que importe ou assine um arquivo `.ics` pode usar o mesmo arquivo.

O calendário é só leitura: as aulas continuam sendo editadas no LangSpot. Desligar a opção remove o arquivo e as
agendas criadas; sair da conta deixa o calendário vazio.

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
python3 -m unittest tests.test_model tests.test_supabase tests.test_calendar_sync
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
- `langspot_linux/model.py`: lógica sem interface (escala CEFR, nota da rubrica, etapas da prova ao vivo, calendário,
  financeiro, relatórios), igual à do site.
- `langspot_linux/calendar_sync.py`: arquivo `.ics` das aulas e ligação com o GNOME (EDS) e o KDE (Akonadi).
- `langspot_linux/ui/`: aplicativo, janela, login e uma página por área (`ui/pages/`).

As funções e tabelas usadas são as mesmas do site: `student_records`, `lessons`, `cancellation_requests`, `assignments`,
`materials`, `material_assignments`, `payments`, `notifications`, `profiles`, os buckets `materials` e `assignment-submissions`,
`list_assessment_review_queue`, `get_assessment_result`, `review_assessment_response`, `exclude_assessment_response`,
`finalize_assessment_review`, `list_active_teacher_attempts`, `get_attempt_live_status` e `get_assessment_progress`.
Ao mudar uma delas no banco, atualize o app e o `tests/fake_supabase.py`.
