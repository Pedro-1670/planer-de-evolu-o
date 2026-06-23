const Goals = {
  getAll() {
    return Storage.get(Storage.KEYS.GOALS) || [];
  },

  saveAll(goals) {
    Storage.set(Storage.KEYS.GOALS, goals);
  },

  getById(id) {
    return this.getAll().find(g => g.id === id);
  },

  getGoalProgress(goalId) {
    const goal = this.getById(goalId);
    if (!goal) return 0;
    
    const linkedTaskIds = goal.taskIds || [];
    if (linkedTaskIds.length === 0) {
      return goal.progress || 0;
    }
    
    const tasks = Tasks.getAll().map(t => Tasks.normalizeTask(t));
    const linkedTasks = tasks.filter(t => linkedTaskIds.includes(t.id));
    const total = linkedTasks.length;
    if (total === 0) return goal.progress || 0;
    const completed = linkedTasks.filter(t => t.completed).length;
    return Math.round((completed / total) * 100);
  },

  getMonthlyProgress(categoryId) {
    const currentMonth = new Date().toISOString().substring(0, 7);
    const tasks = Tasks.getAll().map(t => Tasks.normalizeTask(t));
    const monthlyTasks = tasks.filter(t => {
      const period = String(t.period || '').toLowerCase();
      const scope = String(t.scope || '').toLowerCase();
      const inMonth = !t.dueDate || t.dueDate.startsWith(currentMonth);
      return (period === 'monthly' || scope === 'mensal') && inMonth;
    });
    const scoped = categoryId ? monthlyTasks.filter(t => t.categoryId === categoryId || t.category === categoryId) : monthlyTasks;
    const total = scoped.length;
    if (total === 0) return 0;
    const completed = scoped.filter(t => t.completed).length;
    return Math.round((completed / total) * 100);
  },

  getMonthlyGoal() {
    const currentMonth = new Date().toISOString().substring(0, 7);
    return this.getAll().find(g => (g.month || currentMonth) === currentMonth) || null;
  },

  create(data) {
    const goals = this.getAll();
    const newGoal = {
      id: 'goal_' + Date.now(),
      title: data.title,
      description: data.description || '',
      progress: parseInt(data.progress) || 0,
      month: data.month || new Date().toISOString().substring(0, 7),
      deadline: data.deadline || '',
      taskIds: data.taskIds || [],
      createdAt: new Date().toISOString()
    };
    goals.unshift(newGoal);
    this.saveAll(goals);
    return newGoal;
  },

  update(id, data) {
    const goals = this.getAll();
    const index = goals.findIndex(g => g.id === id);
    if (index === -1) return null;
    goals[index] = { ...goals[index], ...data };
    this.saveAll(goals);
    return goals[index];
  },

  delete(id) {
    const goals = this.getAll().filter(g => g.id !== id);
    this.saveAll(goals);
  },

  render() {
    const container = document.getElementById('goalsGrid');
    const goals = this.getAll();
    const currentMonth = new Date().toISOString().substring(0, 7);

    if (goals.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1;">
          <p class="empty-title">Nenhuma meta</p>
          <p class="empty-text">Defina seus objetivos mensais</p>
        </div>
      `;
      return;
    }

    container.innerHTML = goals.map(goal => {
      const monthLabel = goal.month ? new Date(goal.month + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : '';
      const isCurrentMonth = goal.month === currentMonth;
      const progress = this.getGoalProgress(goal.id);
      const deadline = goal.deadline ? ` • Prazo: ${UI.formatShortDate(goal.deadline)}` : '';
      const taskCount = goal.taskIds ? goal.taskIds.length : 0;
      return `
        <div class="goal-card">
          <div class="goal-card-title">${UI.escapeHtml(goal.title)}</div>
          ${goal.description ? `<div class="goal-card-desc">${UI.escapeHtml(goal.description)}</div>` : ''}
          <div class="goal-card-month">${isCurrentMonth ? 'Este mês' : monthLabel}${deadline} • ${taskCount} tarefa${taskCount !== 1 ? 's' : ''}</div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${progress}%"></div>
          </div>
          <span class="progress-label">${progress}%</span>
          <div class="goal-card-actions">
            <button class="task-action-btn" onclick="App.editGoal('${goal.id}')" title="Editar">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button class="task-action-btn delete" onclick="App.confirmDeleteGoal('${goal.id}')" title="Excluir">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }
};