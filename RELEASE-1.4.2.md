# LangSpot 1.4.2 — Student preview fidelity

## Correções
- A visualização como aluno agora busca o perfil real diretamente em `profiles`.
- Aulas, tarefas, materiais, metas, diário, solicitações e flashcards são carregados pelo ID real do estudante.
- Erros de permissão ou carregamento deixam de ser silenciosos e aparecem na interface.
- A política de flashcards usa a relação real em `student_records`, inclusive para baralhos antigos sem `teacher_id`.
- Ações de escrita são bloqueadas no modo de visualização.
- Os cards do dashboard foram reorganizados com hierarquia consistente, datas compactas e textos sem vazamento.

## Publicação
```bash
npm install
npm run check
npx supabase db push
git add .
git commit -m "Release LangSpot 1.4.2 student preview fixes"
git push
```
