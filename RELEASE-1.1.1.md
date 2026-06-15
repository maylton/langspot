# LangSpot 1.1.1

## Correções
- Idade e observações agora são persistidas no cadastro manual.
- A primeira aula opcional é criada como uma aula real na tabela `lessons`.
- A próxima aula é recalculada a partir da agenda ao recarregar o painel.
- Professor pode editar nome, idade, nível, objetivo, status e observações do aluno.
- Aluno pode editar nome, idade e objetivo no próprio painel de perfil.
- Nível, observações internas e habilidades continuam sob controle do professor.

## Publicação
```bash
npm install
npm run check
npx supabase db push
npx supabase functions deploy invite-student
git add .
git commit -m "Release LangSpot 1.1.1 student profile editing"
git push
```
