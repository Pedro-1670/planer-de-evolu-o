# TODO - Plano de Correção e Evolução (sem quebrar o que funciona)

- [x] 1) Corrigir navegação: checar mismatch `data-page` da sidebar vs `section.page` id e vs `renderPage()`.
- [x] 2) Corrigir hashchange: garantir que ao abrir/clicar com hash, a página correta é ativada e `renderPage()` executa.
- [ ] 3) Revalidar atualização em tempo real do Dashboard após correção de navegação.

- [ ] 4) Só depois: implementar estrutura real de categorias por período (daily/weekly/monthly) mantendo compatibilidade com dados antigos.
- [ ] 5) Implementar progresso automático da meta do mês com base nas tarefas concluídas (sem dados estáticos) mantendo UI atual.
- [ ] 6) Implementar primeiro acesso (Nome/Avatar) e greeting no Dashboard.

