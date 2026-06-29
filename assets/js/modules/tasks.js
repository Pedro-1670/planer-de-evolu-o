const Tasks = {
  currentFilter: 'all',
  currentCategory: 'all',
  sortableInstances: {},

  getAll() {
    const tasks = Storage.get(Storage.KEYS.TASKS) || [];
    return this.processRecurringTasks(tasks);
  },

  getHistory() {
    return Storage.get(Storage.KEYS.HISTORY) || [];
  },

  moveToHistory(taskId) {
    const tasks = this.getAllRaw();
    const index = tasks.findIndex(t => t.id === taskId);
    if (index === -1) return;
    
    const task = tasks[index];
    const isRecurring = task.recurrence && task.recurrence !== 'once';
    
    if (isRecurring) {
      task.completed = true;
      task.completedAt = new Date().toISOString();
      task.recurrenceId = task.recurrenceId || task.id;
      
      const history = this.getHistory();
      history.push(task);
      Storage.set(Storage.KEYS.HISTORY, history);
      
      tasks.splice(index, 1);
      Storage.set(Storage.KEYS.TASKS, tasks);
      
      const nextOccurrence = this.generateNextOccurrence(task);
      if (nextOccurrence) {
        const newTask = {
          id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          scope: task.scope,
          period: task.period,
          title: task.title,
          categoryId: task.categoryId,
          category: task.category,
          notes: task.notes || task.description,
          description: task.notes || task.description,
          priority: task.priority,
          dueDate: nextOccurrence.dueDate,
          completed: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          recurrence: task.recurrence,
          recurrenceId: task.id,
          recurrenceStartDate: task.recurrenceStartDate || task.createdAt
        };
        tasks.push(newTask);
        Storage.set(Storage.KEYS.TASKS, tasks);
      }
    } else {
      task.completed = true;
      task.completedAt = new Date().toISOString();
      
      const history = this.getHistory();
      history.push(task);
      Storage.set(Storage.KEYS.HISTORY, history);
      
      tasks.splice(index, 1);
      Storage.set(Storage.KEYS.TASKS, tasks);
    }
  },

  processRecurringTasks(tasks) {
    const today = UI.getToday();
    const todayDate = new Date(today + 'T00:00:00');

    tasks.forEach(task => {
      if (task.recurrenceTemplate) return;

      if (task.recurrence && task.recurrence !== 'once' && !task.completed) {
        const due = task.dueDate ? new Date(task.dueDate + 'T00:00:00') : null;

        if (due && due < todayDate) {
          const nextOccurrence = this.generateNextOccurrence(task);
          if (nextOccurrence) {
            const existingNew = tasks.find(t => t.recurrenceId === task.id && t.dueDate === nextOccurrence.dueDate && !t.recurrenceTemplate);
            if (!existingNew) {
              const newTask = {
                id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                scope: task.scope,
                period: task.period,
                title: task.title,
                categoryId: task.categoryId,
                category: task.category,
                notes: task.notes || task.description,
                description: task.notes || task.description,
                priority: task.priority,
                dueDate: nextOccurrence.dueDate,
                completed: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                recurrence: task.recurrence,
                recurrenceId: task.id,
                recurrenceStartDate: task.recurrenceStartDate || task.createdAt
              };
              tasks.push(newTask);
            }
          }
        }
      }
    });

    const hasNew = tasks.some(t => t.recurrenceId);
    if (hasNew) {
      Storage.set(Storage.KEYS.TASKS, tasks);
    }

    return tasks;
  },

  generateNextOccurrence(task) {
    const today = UI.getToday();
    const todayDate = new Date(today + 'T00:00:00');
    const startDate = task.recurrenceStartDate ? new Date(task.recurrenceStartDate + 'T00:00:00') : todayDate;

    let nextDate;

    switch (task.recurrence) {
      case 'daily':
        nextDate = new Date(startDate);
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case 'weekdays':
        nextDate = new Date(startDate);
        nextDate.setDate(nextDate.getDate() + 1);
        while (nextDate.getDay() === 0 || nextDate.getDay() === 6) {
          nextDate.setDate(nextDate.getDate() + 1);
        }
        break;
      case 'weekly':
        nextDate = new Date(startDate);
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'monthly':
        nextDate = new Date(startDate);
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'custom':
        const interval = parseInt(task.recurrenceInterval) || 1;
        nextDate = new Date(startDate);
        nextDate.setDate(nextDate.getDate() + interval);
        break;
      default:
        return null;
    }

    if (nextDate < todayDate) {
      return null;
    }

    return {
      dueDate: nextDate.toISOString().split('T')[0]
    };
  },

  resetCompletedRecurringTasks() {
    const tasks = this.getAllRaw().slice();
    const today = UI.getToday();

    tasks.forEach(task => {
      if (task.recurrence && task.recurrence !== 'once' && task.completed) {
        const due = task.dueDate ? new Date(task.dueDate + 'T00:00:00') : null;
        const todayDate = new Date(today + 'T00:00:00');

        if (due && due < todayDate) {
          task.completed = false;
          task.updatedAt = new Date().toISOString();
        }
      }
    });

    Storage.set(Storage.KEYS.TASKS, tasks);
  },

  getAllRaw() {
    return Storage.get(Storage.KEYS.TASKS) || [];
  },

  getById(id) {
    const tasks = this.getAll().map(t => this.normalizeTask(t));
    return tasks.find(t => t.id === id);
  },

  scopeToPeriod(scope) {
    const value = String(scope || 'diario').toLowerCase();
    if (value === 'semanal' || value === 'weekly') return 'weekly';
    if (value === 'mensal' || value === 'monthly') return 'monthly';
    return 'daily';
  },

  periodToScope(period) {
    const value = String(period || 'daily').toLowerCase();
    if (value === 'weekly' || value === 'semanal') return 'semanal';
    if (value === 'monthly' || value === 'mensal') return 'mensal';
    return 'diario';
  },

  normalizeTask(task) {
    if (!task) return task;
    const normalized = { ...task };
    if (!normalized.scope) normalized.scope = this.periodToScope(normalized.period);
    if (!normalized.period) normalized.period = this.scopeToPeriod(normalized.scope);
    return normalized;
  },

  getByScope(scope) {
    const expectedScope = this.periodToScope(scope);
    const expectedPeriod = this.scopeToPeriod(scope);
    return this.getAll().map(t => this.normalizeTask(t)).filter(t => t.scope === expectedScope || t.period === expectedPeriod);
  },

  saveAll(tasks) {
    Storage.set(Storage.KEYS.TASKS, tasks);
  },

  saveAllRaw(tasks) {
    Storage.set(Storage.KEYS.TASKS, tasks);
  },

  getFiltered() {
    let tasks = this.getAll().map(t => this.normalizeTask(t));
    tasks = tasks.filter(t => !t.completed);
    
    if (this.currentCategory !== 'all') {
      tasks = tasks.filter(t => t.categoryId === this.currentCategory);
    }

    if (this.currentFilter === 'today') {
      tasks = tasks.filter(t => t.dueDate && UI.isToday(t.dueDate));
    } else if (this.currentFilter === 'week') {
      tasks = tasks.filter(t => t.dueDate && UI.isThisWeek(t.dueDate));
    } else if (this.currentFilter === 'month') {
      const month = UI.getToday().substring(0, 7);
      tasks = tasks.filter(t => t.dueDate && t.dueDate.startsWith(month));
    } else if (this.currentFilter === 'overdue') {
      tasks = tasks.filter(t => t.dueDate && UI.isOverdue(t.dueDate));
    } else if (this.currentFilter === 'high') {
      tasks = tasks.filter(t => t.priority === 'alta');
    }

    tasks.sort((a, b) => {
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return 0;
    });

    return tasks;
  },

  render(containerId, filter = 'all', categoryId = 'all', onToggle = null, scope = null) {
    this.currentFilter = filter;
    this.currentCategory = categoryId;
    const container = document.getElementById(containerId);

    let tasks = this.getFiltered();
    if (scope) {
      const expectedScope = this.periodToScope(scope);
      const expectedPeriod = this.scopeToPeriod(scope);
      tasks = tasks.filter(t => {
        const normalized = this.normalizeTask(t);
        return normalized.scope === expectedScope || normalized.period === expectedPeriod;
      });
    }

    const pendingTasks = tasks.filter(t => !t.completed);
    const completedTasks = tasks.filter(t => t.completed);

    if (pendingTasks.length === 0 && completedTasks.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><path d="M8 12h8"></path></svg>
          </div>
          <p class="empty-title">Nenhuma tarefa</p>
          <p class="empty-text">Clique em "Nova Tarefa" para começar</p>
        </div>
      `;
      return;
    }

    const categories = Categories.getAll();
    
    const renderTaskList = (taskList, emptyMsg) => {
      if (taskList.length === 0) {
        return `<div class="empty-text" style="padding:1rem;text-align:center;">${emptyMsg}</div>`;
      }
      
      const tasksByCat = taskList.reduce((acc, task) => {
        const key = task.category || task.categoryId || 'none';
        if (!acc[key]) acc[key] = [];
        acc[key].push(task);
        return acc;
      }, {});

      const catOrder = Object.keys(tasksByCat).sort((a, b) => {
        if (a === 'none') return 1;
        if (b === 'none') return -1;
        const ca = categories.find(c => c.id === a);
        const cb = categories.find(c => c.id === b);
        const na = ca ? ca.name : '';
        const nb = cb ? cb.name : '';
        return na.localeCompare(nb);
      });

      return catOrder.map(catId => {
        const bucket = tasksByCat[catId] || [];
        const category = categories.find(c => c.id === catId || c.name === catId);
        const catColor = category ? category.color : '#6b7280';
        const catName = category ? category.name : (catId === 'none' ? 'Sem categoria' : catId);

        return `
          <div class="category-section" data-category="${catId}">
            <div class="category-section-header" style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin:14px 0 10px;">
              <div style="display:flex;align-items:center;gap:10px;">
                <span class="task-category" style="background:${catColor}20;color:${catColor};padding:4px 10px;border-radius:999px;font-weight:600;">
                  ${category ? `${category.icon} ${UI.escapeHtml(catName)}` : UI.escapeHtml(catName)}
                </span>
                <span style="color:var(--text-muted);font-size:12px;">${bucket.length} tarefa${bucket.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
            <div class="category-section-list" style="display:flex;flex-direction:column;gap:10px;">
              ${bucket.map(task => {
                const statusLabel = UI.getDueStatusLabel(task.dueDate);
                const isFocus = App.focusTaskId === task.id;

                return `
                  <div class="task-item ${isFocus ? 'focus' : ''}" 
                       data-id="${task.id}" 
                       onclick="App.viewTask('${task.id}')">
                    <div class="task-checkbox" 
                         onclick="event.stopPropagation(); App.toggleTask('${task.id}')">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    <div class="task-content">
                      <div class="task-title">${UI.escapeHtml(task.title)}</div>
                      ${task.notes || task.description ? `<div class="task-description">${UI.escapeHtml(task.notes || task.description)}</div>` : ''}
                      <div class="task-meta">
                        <span class="task-category" style="background:${catColor}20; color:${catColor}">${UI.escapeHtml(catName)}</span>
                        ${task.dueDate ? `<span class="task-due">${statusLabel}</span>` : ''}
                        ${task.priority ? `<span class="task-priority ${task.priority}">${task.priority}</span>` : ''}
                      </div>
                    </div>
                    <div class="task-actions">
                      <button class="task-action-btn" onclick="event.stopPropagation(); App.editTask('${task.id}')" title="Editar">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      </button>
                      <button class="task-action-btn delete" onclick="event.stopPropagation(); App.confirmDeleteTask('${task.id}')" title="Excluir">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `;
      }).join('');
    };

    container.innerHTML = `
      <div class="pending-section">
        <h3 class="pending-label">Pendentes</h3>
        ${renderTaskList(pendingTasks, 'Nenhuma tarefa pendente')}
      </div>
      ${completedTasks.length > 0 ? `
      <div class="completed-section" style="margin-top:2rem;">
        <h3 class="completed-label">Concluídas</h3>
        ${renderTaskList(completedTasks, 'Nenhuma tarefa concluída')}
      </div>
      ` : ''}
    `;

    this.initSortable(containerId);
  },

  initSortable(containerId) {
    if (this.sortableInstances[containerId]) {
      this.sortableInstances[containerId].destroy();
    }

    const container = document.getElementById(containerId);
    if (!container || container.querySelectorAll('.task-item').length === 0) return;

    this.sortableInstances[containerId] = new Sortable(container, {
      animation: 150,
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      handle: '.task-item',
      onEnd: (evt) => {
        const tasks = this.getAllRaw();
        const itemEl = evt.item;
        const newIndex = evt.newIndex;
        const oldIndex = evt.oldIndex;
        
        if (newIndex !== oldIndex) {
          const taskId = itemEl.dataset.id;
          const taskIndex = tasks.findIndex(t => t.id === taskId);
          const [movedTask] = tasks.splice(taskIndex, 1);
          
          const visibleTasks = this.getFiltered();
          const targetTaskId = newIndex < visibleTasks.length ? visibleTasks[newIndex].id : null;
          
          if (targetTaskId && targetTaskId !== taskId) {
            const targetIndex = tasks.findIndex(t => t.id === targetTaskId);
            tasks.splice(targetIndex, 0, movedTask);
          } else {
            tasks.push(movedTask);
          }
          
          this.saveAllRaw(tasks);
          App.showToast('Tarefa movida', 'success');
        }
      }
    });
  },

  create(data) {
    const tasks = this.getAllRaw();
    const scope = data.scope || this.periodToScope(data.period) || 'diario';
    const period = data.period || this.scopeToPeriod(scope);
    const categoryId = data.categoryId || null;
    const category = data.category || (categoryId && typeof Categories !== 'undefined' ? (Categories.getById(categoryId)?.name || '') : '');

    const newTask = {
      id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      scope,
      period,
      title: data.title,
      categoryId,
      category,
      status: data.status || 'A iniciar',
      notes: data.notes || data.description || '',
      description: data.notes || data.description || '',
      priority: data.priority || 'media',
      dueDate: (() => {
        if (data.dueDate) return data.dueDate;
        const sc = data.scope || 'diario';
        if (sc === 'semanal') return UI.getWeekRange().end;
        if (sc === 'mensal') {
          const d = new Date();
          return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
        }
        return null;
      })(),
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      recurrence: data.recurrence || 'once',
      recurrenceStartDate: data.startDate || new Date().toISOString().split('T')[0]
    };
    tasks.unshift(newTask);
    this.saveAllRaw(tasks);
    return newTask;
  },

  update(id, data) {
    const tasks = this.getAllRaw();
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) return null;
    tasks[index] = { ...tasks[index], ...data, updatedAt: new Date().toISOString() };
    this.saveAllRaw(tasks);
    return tasks[index];
  },

  toggle(id) {
    this.moveToHistory(id);
    return true;
  },

  delete(id) {
    const tasks = this.getAllRaw().filter(t => t.id !== id);
    this.saveAllRaw(tasks);
  }
};