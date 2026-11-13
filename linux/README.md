# LangSpot para Linux

Aplicativo **nativo** do LangSpot para professores, em GTK4 + libadwaita (Python). Usa o mesmo backend
(Supabase) do site, então tudo o que você faz aqui aparece no site e no app do aluno, e vice-versa.

## O que tem na versão 0.3

Todas as áreas do painel do professor do site estão no app; só o PDF dos relatórios de período continua no site.

| Área | O que faz |
|---|---|
| **Visão geral** | Página inicial: números do momento, o que precisa de atenção agora (provas ao vivo, correções, tarefas entregues, pedidos de cancelamento, cobranças atrasadas, notificações), próximas aulas com **Entrar** e seus alunos |
| **Agenda** | Calendário por **semana**, **mês** ou **lista**, filtros, nova aula, editar, cancelar, **concluir com o registro** (presença, resumo, pontos fortes, a melhorar, tarefa de casa, habilidades), **pedidos de cancelamento**, sala online e Google Agenda |
| **Alunos** | **Cadastrar com senha temporária** (com primeira aula opcional e o tutorial de acesso para copiar) ou **convidar por e-mail**; perfil com contato, sequência de estudos e conquistas, **habilidades editáveis**, histórico de aulas (registrar, editar, excluir), avaliações (abre o relatório); editar e excluir o aluno |
| **Tarefas** | Para corrigir, aguardando, corrigidas; **comentários por trecho** do texto do aluno, nota e feedback; nova tarefa com material |
| **Quiz** | Quizzes interativos: resultado e tentativas do aluno, prévia com gabarito, **novo quiz** (banco de questões, **geração com IA**, questões manuais), **banco de questões** com metadados |
| **Avaliações** | **Provas atribuídas** (quem recebeu cada prova e a situação, inclusive quem não começou; alterar datas e tentativas ou cancelar antes do início), provas prontas de nível para um aluno (evitando o que ele já viu), **editor completo** (seções, banco, questões manuais, ao vivo, áudio de Listening, validação, publicação, prévia), atribuir com aviso do que o aluno já viu, **aplicar ao vivo** (cronômetro e rubrica), **resultados** (perfil CEFR, revisão do nível, integridade, correção, comentário para o aluno e **PDF**), Evolução com confirmação de nível, Analytics |
| **Correção** | Fila de Writing, Speaking e Mediation com rubrica CEFR, áudio e conclusão da revisão |
| **Ao vivo** | Alunos fazendo prova agora, etapas e a questão na tela do aluno |
| **Materiais** | Biblioteca, enviar arquivo ou link, compartilhar com alunos |
| **Financeiro** | Totais, cobranças, marcar como paga, lembrete pelo WhatsApp |
| **Progresso** | Média da turma, destaques, habilidades, alunos por nível e progresso de cada aluno |
| **Relatórios** | Resumo do período e relatório individual |
| **Notificações** | Lista, marcar como lida, abrir a área relacionada |
| **Configurações** | Perfil com foto, status da conta, padrões das aulas, tema, segundo plano, calendário do sistema, **backup**; para o administrador, **convidar e gerenciar professores** |

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
python3 -m unittest tests.test_model tests.test_supabase tests.test_calendar_sync tests.test_assessments
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
- `langspot_linux/assessments.py`: regras das avaliações portadas do site (rascunhos, validação, exposição, relatório, atribuições).
- `langspot_linux/calendar_sync.py`: arquivo `.ics` das aulas e ligação com o GNOME (EDS) e o KDE (Akonadi).
- `langspot_linux/ui/`: aplicativo, janela, login e uma página por área (`ui/pages/`).

As funções e tabelas usadas são as mesmas do site: `student_records`, `lessons`, `cancellation_requests`, `assignments`,
`materials`, `material_assignments`, `payments`, `notifications`, `profiles`, os buckets `materials` e `assignment-submissions`,
`list_assessment_review_queue`, `get_assessment_result`, `review_assessment_response`, `exclude_assessment_response`,
`finalize_assessment_review`, `list_active_teacher_attempts`, `get_attempt_live_status` e `get_assessment_progress`.
Ao mudar uma delas no banco, atualize o app e o `tests/fake_supabase.py`.
