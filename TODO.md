# TODO - Plano de Correção e Evolução (sem quebrar o que funciona)

- [x] 1) Corrigir navegação: checar mismatch `data-page` da sidebar vs `section.page` id e vs `renderPage()`.
- [x] 2) Corrigir hashchange: garantir que ao abrir/clicar com hash, a página correta é ativada e `renderPage()` executa.
- [x] 3) Implementar sistema de recorrência automática (daily, weekdays, weekly, monthly)
- [x] 4) Implementar alertas visuais de status (🟢🟡🔴) nas tarefas
- [x] 5) Separar tarefas Pendentes e Concluídas nas views
- [x] 6) Adicionar data de início e campo observações no formulário de tarefas
- [x] 7) Adicionar descrição às metas
- [x] 8) Editar perfil (nome/avatar) nas Configurações
- [x] 9) Tornar categoria obrigatória para tarefas
- [x] 10) Testar navegação e renderização após mudanças
- [x] 11) Corrigir campo de observações (taskNotes vs taskDescription) no modal de tarefas
- [x] 12) Corrigir dueDate não sendo setado para contexto 'diario'
- [x] 13) Reorganizar dashboard: saudação → data → métricas
- [x] 14) Adicionar mini-cards de métricas no dashboard
- [x] 15] Adicionar "Regra Final" e "Nova Nota" nas ações rápidas
- [x] 16) Ordenar próximos vencimentos por prioridade e data
- [x] 17) Exibir tarefas vinculadas na meta principal
- [x] 18) Adicionar funções de template CRUD (openTemplateModal, saveTemplate, deleteTemplate)