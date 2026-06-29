 const App = {
  focusTaskId: null,
  selectedColor: '#6366f1',
  currentEditingTaskId: null,
  currentEditingGoalId: null,
  currentEditingCategoryId: null,
  currentEditingHabitId: null,
  currentEditingNoteId: null,
  currentEditingTemplateId: null,

  init() {
    this.loadFocusTask();
    Profile.ensureDefault();
    this.renderUserProfile();
    this.setupNavigation();
    this.setupSidebar();
    this.setupModals();
    this.setupColorPicker();
    this.applyTheme();

    // Garante que a página correta seja renderizada ao abrir com hash.
    this.syncRouteFromHash();

    this.renderAll();
    this.updateGreeting();

    setInterval(() => this.updateGreeting(), 60000);
  },


  loadFocusTask() {
    this.focusTaskId = Storage.get(Storage.KEYS.FOCUS);
  },

  setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const page = item.dataset.page;
        this.navigateTo(page);
        // Mantém o hash sincronizado para refresh/back funcionar.
        if (typeof page === 'string') {
          window.location.hash = `#${page}`;
        }
      });
    });

    // Suporte a abrir a URL diretamente com hash.
    window.addEventListener('hashchange', () => {
      this.syncRouteFromHash();
    });
  },


  navigateTo(page) {
    // Não quebra se o elemento ainda não existir.
    const navItem = document.querySelector(`.nav-item[data-page="${page}"]`);
    if (navItem) {
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      navItem.classList.add('active');
    }

    const targetPage = document.getElementById(`page-${page}`);
    if (targetPage) {
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      targetPage.classList.add('active');
    }

    this.renderPage(page);
    this.closeMobileSidebar();
  },


  renderPage(page) {
    switch(page) {
      case 'dashboard':
        this.renderDashboard();
        break;

      case 'diario':
        Tasks.render('todayTasks', 'all', 'all', null, 'diario');
        document.getElementById('todayDate').textContent = UI.formatDate(UI.getToday());
        break;

      case 'semana': {
        // Semanal agora é um ambiente independente (scope fixo), sem compartilhar tarefas do Diário/Mensal.
        Tasks.render('weekTasks', 'all', 'all', null, 'semanal');
        const range = UI.getWeekRange();
        document.getElementById('weekDate').textContent =
          `${UI.formatDate(range.start)} — ${UI.formatDate(range.end)}`;
        break;
      }

      case 'mensal': {
        // Mensal agora é um ambiente independente (scope fixo), sem compartilhar tarefas do Diário/Semanal.
        const monthStr = new Date().toISOString().substring(0, 7);
        const monthDate = new Date(monthStr + '-01');
        document.getElementById('monthDate').textContent = monthDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        Tasks.render('monthTasks', 'all', 'all', null, 'mensal');
        break;
      }

      // legado (compatibilidade antiga)
      case 'hoje':
        Tasks.render('todayTasks', 'today');
        document.getElementById('todayDate').textContent = UI.formatDate(UI.getToday());
        break;

      case 'metas':
        Goals.render();
        break;
      case 'categorias':
        Categories.render();
        break;
      case 'habitos':
        Habits.render();
        break;
      case 'notas':
        Notes.render();
        break;
      case 'configuracoes':
        Themes.render();
        break;
      case 'templates':
        Templates.render();
        break;
      case 'historico':
        this.renderHistory();
        break;
    }
  },

  syncRouteFromHash() {
    const hash = (window.location.hash || '').replace('#', '').trim();
    if (!hash) return;

    const validPages = ['dashboard','diario','semana','mensal','metas','notas','configuracoes','categorias','habitos','templates','historico'];
    const page = validPages.includes(hash) ? hash : null;
    if (!page) return;

    // Se a página não existir, não quebra a navegação.
    const target = document.getElementById(`page-${page}`);
    if (!target) return;

    this.navigateTo(page);
  },

  renderAll() {
    this.renderDashboard();
  },


  renderDashboard() {
    const profile = Profile.get() || Storage.get(Storage.KEYS.PROFILE) || { name: 'Visitante' };
    const userName = profile && profile.name ? profile.name : 'Visitante';

    const greeting = document.getElementById('greeting');
    if (greeting) greeting.textContent = `${UI.getGreeting()}, ${userName} 👋`;

    const now = new Date();
    const dateDisplay = document.getElementById('dateDisplay');
    if (dateDisplay) {
      dateDisplay.textContent =
        now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }

    const task = this.getFocusTask();
    const focusTask = document.getElementById('focusTask');
    if (focusTask) focusTask.textContent = task ? task.title : 'Nenhuma tarefa definida como foco';

    if (task) {
      const focusCategory = document.getElementById('focusCategory');
      const focusDeadline = document.getElementById('focusDeadline');
      const focusStatus = document.getElementById('focusStatus');
      const focusMeta = document.getElementById('focusMeta');
      
      if (focusCategory) {
        const categories = Categories.getAll();
        const cat = categories.find(c => c.id === task.categoryId);
        focusCategory.textContent = cat ? `${cat.icon} ${cat.name}` : (task.category || 'Sem categoria');
        focusCategory.style.color = cat ? cat.color : 'var(--text-secondary)';
      }
      if (focusDeadline) focusDeadline.textContent = task.dueDate ? UI.formatShortDate(task.dueDate) : '';
      if (focusStatus) {
        focusStatus.textContent = task.status || 'A iniciar';
        focusStatus.className = 'focus-status';
        if (task.status === 'Concluída') {
          focusStatus.classList.add('completed');
        } else if (task.status === 'Atrasada') {
          focusStatus.classList.add('overdue');
        } else {
          focusStatus.classList.add('pending');
        }
      }
      if (focusMeta) focusMeta.style.display = 'flex';
    } else {
      const focusMeta = document.getElementById('focusMeta');
      if (focusMeta) focusMeta.style.display = 'none';
    }

    const allTasks = Tasks.getAll().map(t => Tasks.normalizeTask(t));
    const scopeToPeriod = (scope) => {
      const value = String(scope || 'diario').toLowerCase();
      if (value === 'semanal' || value === 'weekly') return 'weekly';
      if (value === 'mensal' || value === 'monthly') return 'monthly';
      return 'daily';
    };
    const periodToScope = (period) => {
      const value = String(period || 'daily').toLowerCase();
      if (value === 'weekly' || value === 'semanal') return 'semanal';
      if (value === 'monthly' || value === 'mensal') return 'mensal';
      return 'diario';
    };
    const taskMatchesPeriod = (task, period) => {
      const normalized = Tasks.normalizeTask(task);
      const taskPeriod = String(normalized.period || scopeToPeriod(normalized.scope)).toLowerCase();
      return taskPeriod === period;
    };
    const calcPct = (items) => {
      const total = items.length;
      if (total === 0) return 0;
      return Math.round((items.filter(t => t.completed).length / total) * 100);
    };
    const setMetricCard = (id, title, total, completed, pct) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.innerHTML = `
        <div class="card-label">${title}</div>
        <div class="overview-value">${total}</div>
        <span class="progress-label">${completed} concluída${completed !== 1 ? 's' : ''} • ${pct}%</span>
      `;
    };

    const dailyTasks = allTasks.filter(t => taskMatchesPeriod(t, 'daily'));
    const weeklyTasks = allTasks.filter(t => taskMatchesPeriod(t, 'weekly'));
    const monthlyTasks = allTasks.filter(t => taskMatchesPeriod(t, 'monthly'));

    const dailyTotal = dailyTasks.length;
    const weeklyTotal = weeklyTasks.length;
    const monthlyTotal = monthlyTasks.length;
    const dailyCompleted = dailyTasks.filter(t => t.completed).length;
    const weeklyCompleted = weeklyTasks.filter(t => t.completed).length;
    const monthlyCompleted = monthlyTasks.filter(t => t.completed).length;
    const dailyPct = calcPct(dailyTasks);
    const weeklyPct = calcPct(weeklyTasks);
    const monthlyPct = calcPct(monthlyTasks);
    const totalTasks = allTasks.length;
    const completed = allTasks.filter(t => t.completed).length;
    const overallPct = calcPct(allTasks);

    const statsContainer = document.getElementById('dashboardStats');
    if (statsContainer) {
      statsContainer.innerHTML = `
        <div class="stat-item">
          <div class="stat-value">${dailyTotal}</div>
          <div class="stat-label">Diário (${dailyPct}%)</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${weeklyTotal}</div>
          <div class="stat-label">Semanal (${weeklyPct}%)</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${monthlyTotal}</div>
          <div class="stat-label">Mensal (${monthlyPct}%)</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${completed}/${totalTasks}</div>
          <div class="stat-label">Concluídas (${overallPct}%)</div>
        </div>
      `;
    }

    const goalPctEl = document.getElementById('goalPercent');
    const goalProgressEl = document.getElementById('goalProgress');
    const goalTextEl = document.getElementById('goalText');
    const goalTaskInfoEl = document.getElementById('goalTaskInfo');

    const currentMonth = new Date().toISOString().substring(0, 7);
    const mainGoal = Goals.getAll().find(g => (g.month || currentMonth) === currentMonth);
    const autoMonthlyPct = monthlyTotal > 0 ? monthlyPct : null;
    const goalPct = autoMonthlyPct !== null ? autoMonthlyPct : (mainGoal ? mainGoal.progress || 0 : 0);

    if (goalProgressEl) goalProgressEl.style.width = goalPct + '%';
    if (goalPctEl) goalPctEl.textContent = goalPct + '%';
    if (goalTextEl) {
      if (mainGoal) {
        const deadline = mainGoal.deadline ? ` • Prazo: ${UI.formatShortDate(mainGoal.deadline)}` : '';
        goalTextEl.textContent = `${mainGoal.title}${deadline}`;
      } else {
        goalTextEl.textContent = `Mensal: ${monthlyPct}% concluído`;
      }
    }
    if (goalTaskInfoEl) {
      if (mainGoal && mainGoal.taskIds && mainGoal.taskIds.length > 0) {
        const linkedTasks = allTasks.filter(t => mainGoal.taskIds.includes(t.id));
        const completedLinked = linkedTasks.filter(t => t.completed).length;
        goalTaskInfoEl.innerHTML = `
          <div class="goal-task-count" style="color:var(--text-muted);">
            ${completedLinked}/${mainGoal.taskIds.length} tarefas vinculadas concluídas
          </div>
        `;
      } else {
        goalTaskInfoEl.innerHTML = '';
      }
    }

    const focusCard = document.querySelector('.focus-card');
    if (focusCard) {
      let container = focusCard.querySelector('.scope-progress-extra');
      if (!container) {
        container = document.createElement('div');
        container.className = 'scope-progress-extra';
        container.style.marginTop = '10px';
        container.innerHTML = `
          <div class="progress-label">Diário</div>
          <div class="progress-bar" style="margin-top:4px;">
            <div class="progress-fill" id="diarioProgress" style="width: 0%"></div>
          </div>
          <span class="progress-label" id="diarioPercent">0%</span>
          <div class="progress-label" style="margin-top:8px;">Semanal</div>
          <div class="progress-bar" style="margin-top:4px;">
            <div class="progress-fill" id="semanalProgress" style="width: 0%"></div>
          </div>
          <span class="progress-label" id="semanalPercent">0%</span>
        `;
        focusCard.appendChild(container);
      }

      const diarioProgressEl = document.getElementById('diarioProgress');
      const semanalProgressEl = document.getElementById('semanalProgress');
      const diarioPercentEl = document.getElementById('diarioPercent');
      const semanalPercentEl = document.getElementById('semanalPercent');

      if (diarioProgressEl) diarioProgressEl.style.width = dailyPct + '%';
      if (semanalProgressEl) semanalProgressEl.style.width = weeklyPct + '%';
      if (diarioPercentEl) diarioPercentEl.textContent = dailyPct + '%';
      if (semanalPercentEl) semanalPercentEl.textContent = weeklyPct + '%';
    }

    const categories = Categories.getAll();
    const pendingTasks = allTasks.filter(t => !t.completed);
    const byCat = pendingTasks.reduce((acc, t) => {
      const key = t.category || t.categoryId || 'none';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const topCats = Object.entries(byCat)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const topCatsContainer = document.getElementById('dashboardTopCategories');
    if (topCatsContainer) {
      topCatsContainer.innerHTML = topCats.map(([catId, count]) => {
        const cat = categories.find(c => c.id === catId || c.name === catId);
        const label = cat ? `${cat.icon} ${UI.escapeHtml(cat.name)}` : 'Sem categoria';
        const color = cat ? cat.color : '#6b7280';
        return `<div class="small-cat" style="display:flex;align-items:center;gap:8px;justify-content:space-between; padding:10px 12px; border:1px solid var(--border-color); border-radius:12px; margin-bottom:8px; background:rgba(255,255,255,0.02);">
          <span style="display:flex;align-items:center;gap:8px;">
            <span style="width:10px;height:10px;border-radius:999px;background:${color};display:inline-block;"></span>
            <span>${label}</span>
          </span>
          <span style="color:var(--text-muted);">${count}</span>
        </div>`;
      }).join('');
      if (topCats.length === 0) topCatsContainer.innerHTML = '<div class="empty-text">Sem tarefas pendentes</div>';
    }

    const upcoming = pendingTasks
      .filter(t => t.dueDate)
      .sort((a, b) => {
        const priorityOrder = { 'alta': 0, 'media': 1, 'baixa': 2 };
        const aPrio = priorityOrder[a.priority] ?? 1;
        const bPrio = priorityOrder[b.priority] ?? 1;
        if (aPrio !== bPrio) return aPrio - bPrio;
        return a.dueDate.localeCompare(b.dueDate);
      })
      .slice(0, 5);

    const nextEl = document.getElementById('dashboardNextTasks');
    if (nextEl) {
      nextEl.innerHTML = upcoming.map(t => {
        const cat = categories.find(c => c.id === t.categoryId || c.name === t.category);
        const color = cat ? cat.color : '#6b7280';
        const due = t.dueDate ? UI.formatShortDate(t.dueDate) : '';
        const overdue = t.dueDate && UI.isOverdue(t.dueDate);
        return `<div class="next-task" style="display:flex;align-items:center;justify-content:space-between;gap:12px; padding:10px 12px; border:1px solid var(--border-color); border-radius:12px; margin-bottom:8px; background:rgba(255,255,255,0.02);">
          <div style="display:flex;flex-direction:column;gap:4px;min-width:0;">
            <div style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${UI.escapeHtml(t.title)}</div>
            <div style="display:flex;gap:8px;align-items:center;">
              ${cat ? `<span class="task-category" style="background:${color}20;color:${color}; padding:4px 8px; border-radius:999px; font-size:12px;">${cat.icon} ${UI.escapeHtml(cat.name)}</span>` : ''}
              <span style="color:var(--text-muted); font-size:12px;">${overdue ? 'Atrasada: ' : 'Vence: '}${due}</span>
            </div>
          </div>
          <button class="task-action-btn" style="flex:0 0 auto;" onclick="event.stopPropagation(); App.viewTask('${t.id}')" title="Ver">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"></path><circle cx="12" cy="12" r="3"></circle></svg>
          </button>
        </div>`;
      }).join('');
      if (upcoming.length === 0) nextEl.innerHTML = '<div class="empty-text">Sem tarefas com vencimento</div>';
    }

    const weekRange = UI.getWeekRange();
    const weekTasks = pendingTasks.filter(t => taskMatchesPeriod(t, 'weekly'));
    const byDay = weekTasks.reduce((acc, t) => {
      const due = t.dueDate || weekRange.start;
      acc[due] = (acc[due] || 0) + 1;
      return acc;
    }, {});

    const weekQuick = document.getElementById('dashboardWeekQuick');
    if (weekQuick) {
      const labels = [];
      let cur = new Date(weekRange.start + 'T00:00:00');
      const end = new Date(weekRange.end + 'T00:00:00');
      while (cur <= end) {
        const iso = cur.toISOString().slice(0,10);
        labels.push({ iso, d: cur.toLocaleDateString('pt-BR', { weekday: 'short' }), count: byDay[iso] || 0 });
        cur.setDate(cur.getDate() + 1);
      }
      weekQuick.innerHTML = labels.map(x => `<div class="week-day" style="display:flex;flex-direction:column;align-items:center;gap:6px;padding:10px 8px;border:1px solid var(--border-color);border-radius:12px;background:rgba(255,255,255,0.02);min-width:72px;">
        <div style="color:var(--text-muted);font-size:12px;">${UI.escapeHtml(x.d)}</div>
        <div style="font-weight:700;">${x.count}</div>
      </div>`).join('');
      if (labels.every(l => l.count === 0)) weekQuick.innerHTML = '<div class="empty-text">Semana sem tarefas pendentes</div>';
    }
  },

  getFocusTask() {
    if (!this.focusTaskId) return null;
    const tasks = Tasks.getAll();
    return tasks.find(t => t.id === this.focusTaskId);
  },

  setFocusTask() {
    const tasks = Tasks.getFiltered();
    const todayTasks = Tasks.getAll().filter(t => !t.completed).slice(0, 5);
    
    if (todayTasks.length === 0) {
      this.showToast('Nenhuma tarefa disponível para definir como foco', 'info');
      return;
    }

    const options = todayTasks.map(t => ({ label: t.title, value: t.id }));
    const selected = prompt('Digite o número da tarefa para definir como foco:\n\n' + 
      todayTasks.map((t, i) => `${i + 1}. ${t.title}`).join('\n') + '\n\nOu deixe vazio para remover:');
    
    if (selected === null || selected === '') {
      this.focusTaskId = null;
      Storage.remove(Storage.KEYS.FOCUS);
      this.renderDashboard();
      this.showToast('Foco removido', 'info');
    } else if (todayTasks[parseInt(selected) - 1]) {
      this.focusTaskId = todayTasks[parseInt(selected) - 1].id;
      Storage.set(Storage.KEYS.FOCUS, this.focusTaskId);
      this.renderDashboard();
      this.showToast('Foco definido!', 'success');
    }
  },

  updateGreeting() {
    const profile = Profile.get() || Storage.get(Storage.KEYS.PROFILE) || { name: 'Visitante' };
    const greeting = document.getElementById('greeting');
    if (greeting) greeting.textContent = `${UI.getGreeting()}, ${profile.name || 'Visitante'} 👋`;
  },

  setupSidebar() {
    document.getElementById('collapseBtn').addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('collapsed');
    });
  },

  closeMobileSidebar() {
    if (window.innerWidth <= 768) {
      document.getElementById('sidebar').classList.remove('mobile-open');
    }
  },

  setupModals() {
    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.style.display = 'none';
          document.body.style.overflow = '';
        }
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay').forEach(m => {
          m.style.display = 'none';
        });
        document.body.style.overflow = '';
      }
    });
  },

  setupColorPicker() {
    document.querySelectorAll('.color-option').forEach(opt => {
      opt.addEventListener('click', () => {
        document.querySelectorAll('.color-option').forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        this.selectedColor = opt.dataset.color;
      });
    });
  },

  renderUserProfile() {
    const profile = Profile.get() || Storage.get(Storage.KEYS.PROFILE) || { name: 'Visitante', avatar: 'U', agendaName: 'Minha Agenda' };

    const logoEl = document.querySelector('.logo-text');
    const agendaName = profile.agendaName || 'Minha Agenda';
    if (logoEl) logoEl.textContent = agendaName;
    document.title = agendaName;

    const avatarEl = document.querySelector('.sidebar .user-info .avatar');
    const nameEl = document.querySelector('.sidebar .user-info .user-name');
    if (avatarEl) avatarEl.textContent = profile.avatar || 'U';
    if (nameEl) nameEl.textContent = profile.name || 'Visitante';

    // Mantém também o texto “user-plan” (se existir)
    const planEl = document.querySelector('.sidebar .user-info .user-plan');
    if (planEl && !planEl.textContent) planEl.textContent = 'Personal';
  },

  applyTheme() {
    const theme = Themes.getCurrent();
    document.documentElement.setAttribute('data-theme', theme);
    this.selectedColor = '#6366f1';
  },

  // TASK CRUD
  openTaskModal(context = 'hoje', taskId = null) {
    this.currentTaskModalScope = (context === 'semana' ? 'semanal' : context === 'mensal' ? 'mensal' : 'diario');
    this.currentEditingTaskId = taskId;
    const categories = Categories.getAll();
    const catSelect = document.getElementById('taskCategory');
    
    catSelect.innerHTML = '<option value="">Sem categoria</option>' + 
      categories.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('');

    if (taskId) {
      const task = Tasks.getById(taskId);
      this.currentTaskModalScope = task && task.scope ? task.scope : this.currentTaskModalScope;

      document.getElementById('taskModalTitle').textContent = 'Editar Tarefa';
      document.getElementById('taskId').value = task.id;
      document.getElementById('taskTitle').value = task.title;
      document.getElementById('taskCategory').value = task.categoryId || '';
      if (!document.getElementById('taskCategory').value && task.category) {
        const categoryByName = categories.find(c => c.name === task.category);
        document.getElementById('taskCategory').value = categoryByName ? categoryByName.id : '';
      }
      document.getElementById('taskPriority').value = task.priority || 'media';
      document.getElementById('taskStatus').value = task.status || 'A iniciar';
      document.getElementById('taskDueDate').value = task.dueDate || '';
      const taskNotesEl = document.getElementById('taskNotes');
      const taskDescriptionEl = document.getElementById('taskDescription');
      if (taskNotesEl) taskNotesEl.value = task.notes || task.description || '';
      if (taskDescriptionEl) taskDescriptionEl.value = task.notes || task.description || '';
      document.getElementById('taskRecurrence').value = task.recurrence || 'once';
      document.getElementById('taskDeleteBtn').style.display = 'flex';
    } else {
      document.getElementById('taskModalTitle').textContent = 'Nova Tarefa';
      document.getElementById('taskId').value = '';
      document.getElementById('taskTitle').value = '';
      document.getElementById('taskCategory').value = '';
      document.getElementById('taskPriority').value = 'media';
      document.getElementById('taskStatus').value = 'A iniciar';
      const isDiario = context === 'diario' || context === 'hoje';
      document.getElementById('taskDueDate').value = isDiario ? UI.getToday() : '';
      const taskNotesEl = document.getElementById('taskNotes');
      const taskDescriptionEl = document.getElementById('taskDescription');
      if (taskNotesEl) taskNotesEl.value = '';
      if (taskDescriptionEl) taskDescriptionEl.value = '';
      document.getElementById('taskDeleteBtn').style.display = 'none';
    }

    UI.openModal('taskModal');
    setTimeout(() => document.getElementById('taskTitle').focus(), 100);
  },

  closeTaskModal() {
    UI.closeModal('taskModal');
    this.currentEditingTaskId = null;
  },

  saveTask(e) {
    e.preventDefault();
    const taskDueDateEl = document.getElementById('taskDueDate');
    const taskStartDateEl = document.getElementById('taskStartDate');
    const taskCategoryId = document.getElementById('taskCategory').value || null;
    const taskStatusEl = document.getElementById('taskStatus');
    const taskNotesEl = document.getElementById('taskNotes');
    const taskDescriptionEl = document.getElementById('taskDescription');
    const taskRecurrenceEl = document.getElementById('taskRecurrence');
    const category = taskCategoryId ? (Categories.getById(taskCategoryId)?.name || '') : '';
    const scope = this.currentTaskModalScope || 'diario';
    const scopeToPeriod = (value) => {
      const normalized = String(value || 'diario').toLowerCase();
      if (normalized === 'semanal' || normalized === 'weekly') return 'weekly';
      if (normalized === 'mensal' || normalized === 'monthly') return 'monthly';
      return 'daily';
    };
    const notesOrDesc = (taskNotesEl?.value || taskDescriptionEl?.value || '').trim();
    const data = {
      title: document.getElementById('taskTitle').value.trim(),
      categoryId: taskCategoryId,
      category,
      status: taskStatusEl ? taskStatusEl.value : 'A iniciar',
      period: scopeToPeriod(scope),
      priority: document.getElementById('taskPriority').value,
      dueDate: taskDueDateEl ? taskDueDateEl.value : null,
      startDate: taskStartDateEl ? taskStartDateEl.value : null,
      recurrence: taskRecurrenceEl ? taskRecurrenceEl.value : 'once',
      notes: notesOrDesc,
      description: notesOrDesc,
      scope
    };

    if (!data.title) return;

    if (this.currentEditingTaskId) {
      Tasks.update(this.currentEditingTaskId, data);
      this.showToast('Tarefa atualizada', 'success');
    } else {
      Tasks.create(data);
      this.showToast('Tarefa criada', 'success');
    }

    this.closeTaskModal();
    this.refreshCurrentPage();
  },

  editTask(id) {
    // preserva legado mas abre modal sem forçar dueDate
    this.openTaskModal('diario', id);
  },


  editTaskFromView() {
    const id = document.getElementById('taskViewId').value;
    this.closeTaskViewModal();
    setTimeout(() => this.editTask(id), 200);
  },

  toggleTask(id) {
    Tasks.toggle(id);

    // Atualiza widgets da página ativa sem depender apenas do refresh do DOM.
    if (document.querySelector('.page.active')?.id === 'page-dashboard') {
      this.renderDashboard();
    }

    this.refreshCurrentPage();
    const tasks = Tasks.getAll();
    const task = tasks.find(t => t.id === id);
    this.showToast(task.completed ? 'Tarefa concluída!' : 'Tarefa reaberta', task.completed ? 'success' : 'info');
  },


  confirmDeleteTask(id) {
    document.getElementById('confirmText').textContent = 'Tem certeza que deseja excluir esta tarefa?';
    document.getElementById('confirmAction').onclick = () => {
      Tasks.delete(id);
      this.closeConfirm();
      this.refreshCurrentPage();
      this.showToast('Tarefa excluída', 'success');
    };
    UI.openModal('confirmModal');
  },

  deleteTask() {
    if (this.currentEditingTaskId) {
      Tasks.delete(this.currentEditingTaskId);
      this.closeTaskModal();
      this.refreshCurrentPage();
      this.showToast('Tarefa excluída', 'success');
    }
  },

  viewTask(id) {
    const task = Tasks.getById(id);
    if (!task) return;

    const categories = Categories.getAll();
    const category = categories.find(c => c.id === task.categoryId);

    document.getElementById('taskViewId').value = task.id;
    document.getElementById('taskViewTitle').textContent = task.title;
    
    document.getElementById('taskViewContent').innerHTML = `
      <div class="task-view-meta">
        ${category ? `<span class="task-category" style="background:${category.color}20; color:${category.color}">${category.icon} ${UI.escapeHtml(category.name)}</span>` : ''}
        ${task.priority ? `<span class="task-priority ${task.priority}">${task.priority}</span>` : ''}
        ${task.status ? `<span class="task-priority">${UI.escapeHtml(task.status)}</span>` : ''}
        ${task.dueDate ? `<span class="task-due ${UI.isOverdue(task.dueDate) && !task.completed ? 'overdue' : ''}">${UI.formatDate(task.dueDate)}</span>` : ''}
        <span class="task-due">${task.completed ? 'Concluída' : 'Pendente'}</span>
      </div>
      ${task.description ? `<div class="task-view-description">${UI.escapeHtml(task.description)}</div>` : ''}
      <div class="task-view-date">Criada em ${UI.formatDate(task.createdAt)}</div>
    `;

    UI.openModal('taskViewModal');
  },

  closeTaskViewModal() {
    UI.closeModal('taskViewModal');
  },

  // GOAL CRUD
  openGoalModal(goalId = null) {
    this.currentEditingGoalId = goalId;
    if (goalId) {
      const goal = Goals.getById(goalId);
      document.getElementById('goalModalTitle').textContent = 'Editar Meta';
      document.getElementById('goalId').value = goal.id;
      document.getElementById('goalTitle').value = goal.title;
      document.getElementById('goalProgressValue').value = goal.progress;
      document.getElementById('goalMonth').value = goal.month || '';
      document.getElementById('goalDeadline').value = goal.deadline || '';
      document.getElementById('goalDeleteBtn').style.display = 'flex';
    } else {
      document.getElementById('goalModalTitle').textContent = 'Nova Meta';
      document.getElementById('goalId').value = '';
      document.getElementById('goalTitle').value = '';
      document.getElementById('goalProgressValue').value = 0;
      document.getElementById('goalMonth').value = new Date().toISOString().substring(0, 7);
      document.getElementById('goalDeadline').value = '';
      document.getElementById('goalDeleteBtn').style.display = 'none';
    }
    UI.openModal('goalModal');
    setTimeout(() => document.getElementById('goalTitle').focus(), 100);
  },

  closeGoalModal() {
    UI.closeModal('goalModal');
    this.currentEditingGoalId = null;
  },

  saveGoal(e) {
    e.preventDefault();
    const data = {
      title: document.getElementById('goalTitle').value.trim(),
      progress: parseInt(document.getElementById('goalProgressValue').value) || 0,
      month: document.getElementById('goalMonth').value,
      deadline: document.getElementById('goalDeadline').value
    };

    if (!data.title) return;

    if (this.currentEditingGoalId) {
      Goals.update(this.currentEditingGoalId, data);
      this.showToast('Meta atualizada', 'success');
    } else {
      Goals.create(data);
      this.showToast('Meta criada', 'success');
    }

    this.closeGoalModal();
    this.refreshCurrentPage();
  },

  editGoal(id) {
    this.openGoalModal(id);
  },

  confirmDeleteGoal(id) {
    document.getElementById('confirmText').textContent = 'Tem certeza que deseja excluir esta meta?';
    document.getElementById('confirmAction').onclick = () => {
      Goals.delete(id);
      this.closeConfirm();
      this.refreshCurrentPage();
      this.showToast('Meta excluída', 'success');
    };
    UI.openModal('confirmModal');
  },

  deleteGoal() {
    if (this.currentEditingGoalId) {
      Goals.delete(this.currentEditingGoalId);
      this.closeGoalModal();
      this.refreshCurrentPage();
      this.showToast('Meta excluída', 'success');
    }
  },

  // CATEGORY CRUD
  openCategoryModal(categoryId = null) {
    this.currentEditingCategoryId = categoryId;
    this.selectedColor = '#6366f1';
    
    if (categoryId) {
      const cat = Categories.getById(categoryId);
      document.getElementById('categoryModalTitle').textContent = 'Editar Categoria';
      document.getElementById('categoryId').value = cat.id;
      document.getElementById('categoryName').value = cat.name;
      document.getElementById('categoryIcon').value = cat.icon || '📁';
      document.getElementById('categoryDeleteBtn').style.display = 'flex';
      document.querySelectorAll('.color-option').forEach(o => {
        o.classList.toggle('active', o.dataset.color === cat.color);
        if (o.dataset.color === cat.color) this.selectedColor = cat.color;
      });
    } else {
      document.getElementById('categoryModalTitle').textContent = 'Nova Categoria';
      document.getElementById('categoryId').value = '';
      document.getElementById('categoryName').value = '';
      document.getElementById('categoryIcon').value = '📁';
      document.getElementById('categoryDeleteBtn').style.display = 'none';
      document.querySelectorAll('.color-option').forEach(o => o.classList.remove('active'));
      document.querySelector('[data-color="#6366f1"]').classList.add('active');
      this.selectedColor = '#6366f1';
    }
    UI.openModal('categoryModal');
    setTimeout(() => document.getElementById('categoryName').focus(), 100);
  },

  closeCategoryModal() {
    UI.closeModal('categoryModal');
    this.currentEditingCategoryId = null;
  },

  saveCategory(e) {
    e.preventDefault();
    const data = {
      name: document.getElementById('categoryName').value.trim(),
      color: this.selectedColor,
      icon: document.getElementById('categoryIcon').value
    };

    if (!data.name) return;

    if (this.currentEditingCategoryId) {
      Categories.update(this.currentEditingCategoryId, data);
      this.showToast('Categoria atualizada', 'success');
    } else {
      Categories.create(data);
      this.showToast('Categoria criada', 'success');
    }

    this.closeCategoryModal();
    this.refreshCurrentPage();
  },

  editCategory(id) {
    this.openCategoryModal(id);
  },

  filterByCategory(categoryId) {
    this.navigateTo('diario');
    Tasks.currentCategory = categoryId;
    Tasks.render('todayTasks', 'all', categoryId);
    this.showToast('Filtrando por categoria', 'info');
  },

  confirmDeleteCategory(id) {
    const count = Tasks.getAll().map(t => Tasks.normalizeTask(t)).filter(t => t.categoryId === id || t.category === id).length;
    const msg = count > 0 
      ? `Esta categoria tem ${count} tarefa(s). Tem certeza que deseja excluir?`
      : 'Tem certeza que deseja excluir esta categoria?';
    
    document.getElementById('confirmText').textContent = msg;
    document.getElementById('confirmAction').onclick = () => {
      Categories.delete(id);
      this.closeConfirm();
      this.refreshCurrentPage();
      this.showToast('Categoria excluída', 'success');
    };
    UI.openModal('confirmModal');
  },

  deleteCategory() {
    if (this.currentEditingCategoryId) {
      Categories.delete(this.currentEditingCategoryId);
      this.closeCategoryModal();
      this.refreshCurrentPage();
      this.showToast('Categoria excluída', 'success');
    }
  },

  // HABIT CRUD
  openHabitModal(habitId = null) {
    this.currentEditingHabitId = habitId;
    if (habitId) {
      const habit = Habits.getById(habitId);
      document.getElementById('habitModalTitle').textContent = 'Editar Hábito';
      document.getElementById('habitId').value = habit.id;
      document.getElementById('habitName').value = habit.name;
      document.getElementById('habitFrequency').value = habit.frequency;
      document.getElementById('habitNotes').value = habit.notes || '';
      document.getElementById('habitDeleteBtn').style.display = 'flex';
    } else {
      document.getElementById('habitModalTitle').textContent = 'Novo Hábito';
      document.getElementById('habitId').value = '';
      document.getElementById('habitName').value = '';
      document.getElementById('habitFrequency').value = 'daily';
      document.getElementById('habitNotes').value = '';
      document.getElementById('habitDeleteBtn').style.display = 'none';
    }
    UI.openModal('habitModal');
    setTimeout(() => document.getElementById('habitName').focus(), 100);
  },

  closeHabitModal() {
    UI.closeModal('habitModal');
    this.currentEditingHabitId = null;
  },

  saveHabit(e) {
    e.preventDefault();
    const data = {
      name: document.getElementById('habitName').value.trim(),
      frequency: document.getElementById('habitFrequency').value,
      notes: document.getElementById('habitNotes').value.trim()
    };

    if (!data.name) return;

    if (this.currentEditingHabitId) {
      Habits.update(this.currentEditingHabitId, data);
      this.showToast('Hábito atualizado', 'success');
    } else {
      Habits.create(data);
      this.showToast('Hábito criado', 'success');
    }

    this.closeHabitModal();
    this.refreshCurrentPage();
  },

  editHabit(id) {
    this.openHabitModal(id);
  },

  toggleHabitDay(habitId, dayIndex) {
    Habits.toggleWeek(habitId, dayIndex);
    Habits.render();
    this.showToast('Progresso atualizado', 'success');
  },

  confirmDeleteHabit(id) {
    document.getElementById('confirmText').textContent = 'Tem certeza que deseja excluir este hábito?';
    document.getElementById('confirmAction').onclick = () => {
      Habits.delete(id);
      this.closeConfirm();
      this.refreshCurrentPage();
      this.showToast('Hábito excluído', 'success');
    };
    UI.openModal('confirmModal');
  },

  deleteHabit() {
    if (this.currentEditingHabitId) {
      Habits.delete(this.currentEditingHabitId);
      this.closeHabitModal();
      this.refreshCurrentPage();
      this.showToast('Hábito excluído', 'success');
    }
  },

  // NOTE CRUD
  openNoteModal(noteId = null) {
    this.currentEditingNoteId = noteId;
    if (noteId) {
      const note = Notes.getById(noteId);
      document.getElementById('noteModalTitle').textContent = 'Editar Nota';
      document.getElementById('noteId').value = note.id;
      document.getElementById('noteTitle').value = note.title;
      document.getElementById('noteContent').value = note.content;
      document.getElementById('noteDeleteBtn').style.display = 'flex';
    } else {
      document.getElementById('noteModalTitle').textContent = 'Nova Nota';
      document.getElementById('noteId').value = '';
      document.getElementById('noteTitle').value = '';
      document.getElementById('noteContent').value = '';
      document.getElementById('noteDeleteBtn').style.display = 'none';
    }
    UI.openModal('noteModal');
    setTimeout(() => document.getElementById('noteTitle').focus(), 100);
  },

  closeNoteModal() {
    UI.closeModal('noteModal');
    this.currentEditingNoteId = null;
  },

  saveNote(e) {
    e.preventDefault();
    const data = {
      title: document.getElementById('noteTitle').value.trim(),
      content: document.getElementById('noteContent').value.trim()
    };

    if (!data.title) return;

    if (this.currentEditingNoteId) {
      Notes.update(this.currentEditingNoteId, data);
      this.showToast('Nota atualizada', 'success');
    } else {
      Notes.create(data);
      this.showToast('Nota criada', 'success');
    }

    this.closeNoteModal();
    this.refreshCurrentPage();
  },

  editNote(id) {
    this.openNoteModal(id);
  },

  viewNote(id) {
    const note = Notes.getById(id);
    if (!note) return;

    document.getElementById('noteViewId').value = note.id;
    document.getElementById('noteViewTitle').textContent = note.title;
    document.getElementById('noteViewContent').textContent = note.content;
    UI.openModal('noteViewModal');
  },

  closeNoteViewModal() {
    UI.closeModal('noteViewModal');
  },

  confirmDeleteNote(id) {
    document.getElementById('confirmText').textContent = 'Tem certeza que deseja excluir esta nota?';
    document.getElementById('confirmAction').onclick = () => {
      Notes.delete(id);
      this.closeConfirm();
      this.refreshCurrentPage();
      this.showToast('Nota excluída', 'success');
    };
    UI.openModal('confirmModal');
  },

  deleteNote() {
    if (this.currentEditingNoteId) {
      Notes.delete(this.currentEditingNoteId);
      this.closeNoteModal();
      this.refreshCurrentPage();
      this.showToast('Nota excluída', 'success');
    }
  },

  // TEMPLATE CRUD
  openTemplateModal(templateId = null) {
    this.currentEditingTemplateId = templateId;
    if (templateId) {
      const tpl = Templates.getById(templateId);
      document.getElementById('templateModalTitle').textContent = 'Editar Template';
      document.getElementById('templateId').value = tpl.id;
      document.getElementById('templateName').value = tpl.name;
      document.getElementById('templateDescription').value = tpl.description || '';
      document.getElementById('templateTasks').value = tpl.tasks ? tpl.tasks.join('\n') : '';
      document.getElementById('templateDeleteBtn').style.display = 'flex';
    } else {
      document.getElementById('templateModalTitle').textContent = 'Novo Template';
      document.getElementById('templateId').value = '';
      document.getElementById('templateName').value = '';
      document.getElementById('templateDescription').value = '';
      document.getElementById('templateTasks').value = '';
      document.getElementById('templateDeleteBtn').style.display = 'none';
    }
    UI.openModal('templateModal');
    setTimeout(() => document.getElementById('templateName').focus(), 100);
  },

  closeTemplateModal() {
    UI.closeModal('templateModal');
    this.currentEditingTemplateId = null;
  },

  saveTemplate(e) {
    e.preventDefault();
    const tasksStr = document.getElementById('templateTasks').value;
    const data = {
      name: document.getElementById('templateName').value.trim(),
      description: document.getElementById('templateDescription').value.trim(),
      tasks: tasksStr
    };

    if (!data.name) return;

    if (this.currentEditingTemplateId) {
      Templates.update(this.currentEditingTemplateId, data);
      this.showToast('Template atualizado', 'success');
    } else {
      Templates.create(data);
      this.showToast('Template criado', 'success');
    }

    this.closeTemplateModal();
    this.refreshCurrentPage();
  },

  confirmDeleteTemplate(id) {
    document.getElementById('confirmText').textContent = 'Tem certeza que deseja excluir este template?';
    document.getElementById('confirmAction').onclick = () => {
      Templates.delete(id);
      this.closeConfirm();
      this.refreshCurrentPage();
      this.showToast('Template excluído', 'success');
    };
    UI.openModal('confirmModal');
  },

  deleteTemplate() {
    if (this.currentEditingTemplateId) {
      Templates.delete(this.currentEditingTemplateId);
      this.closeTemplateModal();
      this.refreshCurrentPage();
      this.showToast('Template excluído', 'success');
    }
  },

  // HISTÓRICO
  renderHistory() {
    const container = document.getElementById('historyTasks');
    if (!container) return;
    const history = Tasks.getHistory();

    if (!history || history.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><path d="M8 12h8"></path></svg>
          </div>
          <p class="empty-title">Nenhuma tarefa no histórico</p>
          <p class="empty-text">Tarefas concluídas aparecerão aqui</p>
        </div>`;
      return;
    }

    const sorted = [...history].sort((a, b) =>
      (b.completedAt || '').localeCompare(a.completedAt || ''));

    const scopeLabel = { diario: 'Diário', semanal: 'Semanal', mensal: 'Mensal' };

    container.innerHTML = sorted.map(task => {
      const dateStr = task.completedAt
        ? new Date(task.completedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : '';
      const scope = scopeLabel[task.scope] || task.scope || 'Diário';
      return `
        <div class="task-item" style="opacity:0.75;">
          <div class="task-check completed">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          <div class="task-content">
            <span class="task-title" style="text-decoration:line-through;">${UI.escapeHtml(task.title)}</span>
            <div class="task-meta" style="margin-top:2px;font-size:0.75rem;color:var(--text-muted);">
              ${dateStr ? '✓ ' + dateStr : ''} ${scope ? '· ' + scope : ''}
              ${task.category ? '· ' + UI.escapeHtml(task.category) : ''}
            </div>
          </div>
        </div>`;
    }).join('');
  },

  restoreAllCompleted() {
    const history = Tasks.getHistory();
    if (!history || history.length === 0) {
      this.showToast('Nenhuma tarefa para restaurar', 'info');
      return;
    }
    const tasks = Tasks.getAllRaw();
    history.forEach(task => {
      tasks.unshift({ ...task, completed: false, completedAt: null, updatedAt: new Date().toISOString() });
    });
    Storage.set(Storage.KEYS.TASKS, tasks);
    Storage.set(Storage.KEYS.HISTORY, []);
    this.renderHistory();
    this.showToast(history.length + ' tarefa(s) restaurada(s)', 'success');
  },

  // CONFIRM
  closeConfirm() {
    UI.closeModal('confirmModal');
  },

  // UTILITY
  refreshCurrentPage() {
    const activePage = document.querySelector('.page.active');
    if (activePage) {
      const page = activePage.id.replace('page-', '');
      this.renderPage(page);
    }
  },

  editAgendaName() {
    const profile = Profile.get() || Storage.get(Storage.KEYS.PROFILE) || {};
    const current = profile.agendaName || 'Minha Agenda';
    const agendaName = prompt('Qual nome você quer dar para sua agenda?', current);

    if (agendaName === null) return;

    Profile.update({ agendaName: agendaName.trim() || 'Minha Agenda' });
    this.renderUserProfile();
    this.showToast('Nome da agenda atualizado', 'success');
  },

  showToast(message, type = 'info') {
    UI.showToast(message, type);
  },

  clearAllData() {
    if (confirm('Tem certeza que deseja limpar TODOS os dados? Esta ação não pode ser desfeita.')) {
      Storage.clear();
      this.focusTaskId = null;
      location.reload();
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

window.App = App;
