const Habits = {
  days: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],

  getAll() {
    return Storage.get(Storage.KEYS.HABITS) || [];
  },

  saveAll(habits) {
    Storage.set(Storage.KEYS.HABITS, habits);
  },

  getById(id) {
    return this.getAll().find(h => h.id === id);
  },

  toggleWeek(habitId, dayIndex) {
    const habits = this.getAll();
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;
    
    if (!habit.weekProgress) {
      habit.weekProgress = Array(7).fill(false);
    }
    
    const today = new Date();
    const dayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1;
    
    if (dayIndex !== dayOfWeek) return;
    
    habit.weekProgress[dayIndex] = !habit.weekProgress[dayIndex];
    habit.updatedAt = new Date().toISOString();
    this.saveAll(habits);
  },

  create(data) {
    const habits = this.getAll();
    const today = new Date();
    const dayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1;
    
    const newHabit = {
      id: 'habit_' + Date.now(),
      name: data.name,
      frequency: data.frequency || 'daily',
      notes: data.notes || '',
      weekProgress: Array(7).fill(false),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    habits.push(newHabit);
    this.saveAll(habits);
    return newHabit;
  },

  update(id, data) {
    const habits = this.getAll();
    const index = habits.findIndex(h => h.id === id);
    if (index === -1) return null;
    habits[index] = { ...habits[index], ...data, updatedAt: new Date().toISOString() };
    this.saveAll(habits);
    return habits[index];
  },

  delete(id) {
    const habits = this.getAll().filter(h => h.id !== id);
    this.saveAll(habits);
  },

  render() {
    const container = document.getElementById('habitsList');
    const habits = this.getAll();

    if (habits.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>
          </div>
          <p class="empty-title">Nenhum hábito</p>
          <p class="empty-text">Crie seu primeiro hábito para começar</p>
        </div>
      `;
      return;
    }

    const today = new Date();
    const dayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1;

    container.innerHTML = habits.map(habit => {
      const week = habit.weekProgress || Array(7).fill(false);
      const completedDays = week.filter(Boolean).length;
      
      return `
        <div class="habit-card">
          <div class="habit-header">
            <div>
              <div class="habit-name">${UI.escapeHtml(habit.name)}</div>
              <div class="habit-frequency">${habit.frequency === 'daily' ? 'Diário' : habit.frequency === 'weekly' ? 'Semanal' : 'Mensal'} • ${completedDays}/7 esta semana</div>
            </div>
            <div class="habit-card-actions">
              <button class="task-action-btn" onclick="App.editHabit('${habit.id}')" title="Editar">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              </button>
              <button class="task-action-btn delete" onclick="App.confirmDeleteHabit('${habit.id}')" title="Excluir">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </div>
          </div>
          <div class="habit-week">
            ${this.days.map((day, i) => `
              <div class="habit-day ${week[i] ? 'done' : ''} ${i === dayOfWeek ? 'current' : ''}" 
                   onclick="App.toggleHabitDay('${habit.id}', ${i})"
                   title="${day}">
                ${day.substring(0, 1)}
              </div>
            `).join('')}
          </div>
          ${habit.notes ? `<div class="habit-notes">${UI.escapeHtml(habit.notes)}</div>` : ''}
        </div>
      `;
    }).join('');
  }
};
