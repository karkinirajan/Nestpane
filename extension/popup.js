'use strict';

function init() {
  const el = id => document.getElementById(id);
  const CHECK_SVG = `<svg class="combo-item-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20,6 9,17 4,12"/></svg>`;

  let currentUrl = '';
  let currentTitle = '';
  let quickAccess = [];
  let folders = [];
  let importedBookmarks = [];
  let destMode = 'quick';
  let creatingNewFolder = false;
  let selectedFolder = null;

  // ── Combobox factory ──────────────────────────────────────────────────────
  function makeCombo({ triggerId, valId, dropId, listId, placeholder, onSelect }) {
    const trigger = el(triggerId);
    const valEl = el(valId);
    const drop = el(dropId);
    const list = el(listId);
    let selected = null;

    if (!trigger || !valEl || !drop || !list) {
      return { setItems() { }, getValue() { return null; }, reset() { }, close() { } };
    }

    const open = () => { trigger.classList.add('open'); drop.classList.add('open'); };
    const close = () => { trigger.classList.remove('open'); drop.classList.remove('open'); };
    const isOpen = () => drop.classList.contains('open');

    trigger.addEventListener('click', e => { e.stopPropagation(); isOpen() ? close() : open(); });
    document.addEventListener('click', e => {
      if (!trigger.contains(e.target) && !drop.contains(e.target)) close();
    });

    function setItems(items) {
      list.innerHTML = '';
      if (!items.length) {
        list.innerHTML = '<div class="combo-empty">No options</div>';
        return;
      }
      items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'combo-item' + (selected === item.value ? ' selected' : '');
        div.innerHTML = `
          ${item.emoji ? `<span class="combo-item-emoji">${item.emoji}</span>` : ''}
          <span class="combo-item-label">${item.label}</span>
          ${CHECK_SVG}
        `;
        div.addEventListener('click', () => {
          selected = item.value;
          valEl.textContent = (item.emoji ? item.emoji + ' ' : '') + item.label;
          valEl.classList.remove('placeholder');
          list.querySelectorAll('.combo-item').forEach(d => d.classList.remove('selected'));
          div.classList.add('selected');
          close();
          onSelect(item.value, item);
        });
        list.appendChild(div);
      });
    }

    const getValue = () => selected;

    function reset() {
      selected = null;
      valEl.textContent = placeholder;
      valEl.classList.add('placeholder');
      list.innerHTML = '';
    }

    return { setItems, getValue, reset, close };
  }

  // ── Init combos ───────────────────────────────────────────────────────────
  const folderCombo = makeCombo({
    triggerId: 'folderTrigger', valId: 'folderVal', dropId: 'folderDrop', listId: 'folderList',
    placeholder: 'Select folder…',
    onSelect: name => { selectedFolder = name; }
  });

  // ── Toast ─────────────────────────────────────────────────────────────────
  function showToast(msg, type) {
    const t = el('toast');
    if (!t) return;
    t.textContent = msg;
    t.className = 'toast ' + type + ' show';
  }

  // ── Populate folder combobox ──────────────────────────────────────────────
  function populateFolders() {
    const named = folders.map(f => f.name || f);
    const fromBm = importedBookmarks.map(b => b.folderName).filter(Boolean);
    const all = [...new Set([...named, ...fromBm])];
    folderCombo.setItems(all.map(name => ({ value: name, label: name })));
  }

  // ── Mini dashboard ────────────────────────────────────────────────────────
  function _fmtTimer(secs) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  chrome.storage.local.get(['kanban', 'habits', '_timerState'], (st) => {
    const today = new Date().toISOString().slice(0, 10);
    // Tasks (Nestodo board)
    const kb = st.kanban || {};
    const doneTasks = (kb.done || []).length;
    const totalTasks = doneTasks + (kb.todo || []).length + (kb.doing || []).length;
    const tasksEl = el('dashTasksVal');
    const tasksSub = el('dashTasksSub');
    if (tasksEl) tasksEl.textContent = `${doneTasks}/${totalTasks}`;
    if (tasksSub) tasksSub.textContent = totalTasks ? `${Math.round(doneTasks / totalTasks * 100)}% done` : 'no tasks';

    // Habits
    const habits = st.habits || [];
    const habitDone = habits.filter(h => (h.days || {})[today]).length;
    const habitsEl = el('dashHabitsVal');
    const habitsSub = el('dashHabitsSub');
    if (habitsEl) habitsEl.textContent = `${habitDone}/${habits.length}`;
    if (habitsSub) habitsSub.textContent = habits.length ? (habitDone === habits.length ? '🎉 all done' : 'today') : 'no habits';

    // Timer (stored separately by main page via storage)
    const ts = st._timerState || {};
    const timerEl = el('dashTimerVal');
    const timerSub = el('dashTimerSub');
    const timerCard = el('dashTimer');
    if (timerEl) {
      if (ts.running && ts.remaining != null) {
        timerEl.textContent = _fmtTimer(ts.remaining);
        if (timerSub) timerSub.textContent = 'running';
        if (timerCard) timerCard.classList.add('mini-timer-running');
      } else if (ts.remaining != null) {
        timerEl.textContent = _fmtTimer(ts.remaining);
        if (timerSub) timerSub.textContent = 'paused';
      } else {
        timerEl.textContent = '25:00';
        if (timerSub) timerSub.textContent = 'idle';
      }
    }
  });

  // ── Load tab + storage ────────────────────────────────────────────────────
  Promise.all([
    new Promise(res => chrome.tabs.query({ active: true, currentWindow: true }, res)),
    new Promise(res => chrome.storage.local.get(['quickAccess', 'folders', 'importedBookmarks'], res)),
  ]).then(([[tab], stored]) => {
    const mainForm = el('mainForm');
    const pageTitle = el('pageTitle');
    const pageUrl = el('pageUrl');
    const titleInput = el('titleInput');
    const pageFav = el('pageFavicon');
    const saveBtn = el('saveBtn');

    // Guard: if popup closed before promise resolved
    if (!mainForm) return;

    if (tab) {
      currentUrl = tab.url || '';
      currentTitle = tab.title || currentUrl;
      if (pageTitle) pageTitle.textContent = currentTitle;
      if (pageUrl) pageUrl.textContent = currentUrl;
      if (titleInput) titleInput.value = currentTitle;

      if (tab.favIconUrl && pageFav) {
        const img = document.createElement('img');
        img.src = tab.favIconUrl;
        img.onerror = () => img.remove();
        pageFav.innerHTML = '';
        pageFav.appendChild(img);
      }

      if (currentUrl.startsWith('chrome://') || currentUrl.startsWith('chrome-extension://')) {
        showToast("This page can't be bookmarked.", 'err');
        if (saveBtn) saveBtn.disabled = true;
      }
    }

    quickAccess = stored.quickAccess || [];
    folders = stored.folders || [];
    importedBookmarks = stored.importedBookmarks || [];
    populateFolders();
  }).catch(err => {
    console.warn('Nestpane popup load error:', err);
  });

  // ── Destination toggle ────────────────────────────────────────────────────
  const destQuick = el('destQuick');
  const destFolder = el('destFolder');
  const folderRow = el('folderRow');
  const newFolderRow = el('newFolderRow');
  const newFolderBtn = el('newFolderBtn');

  if (destQuick) destQuick.addEventListener('click', () => {
    destMode = 'quick';
    destQuick.classList.add('active');
    if (destFolder) destFolder.classList.remove('active');
    if (folderRow) folderRow.style.display = 'none';
    if (newFolderRow) newFolderRow.style.display = 'none';
    creatingNewFolder = false;
    if (newFolderBtn) { newFolderBtn.textContent = '+'; newFolderBtn.classList.remove('active'); }
  });

  if (destFolder) destFolder.addEventListener('click', () => {
    destMode = 'folder';
    destFolder.classList.add('active');
    if (destQuick) destQuick.classList.remove('active');
    if (folderRow) folderRow.style.display = 'flex';
  });

  // ── New folder toggle ─────────────────────────────────────────────────────
  if (newFolderBtn) newFolderBtn.addEventListener('click', () => {
    creatingNewFolder = !creatingNewFolder;
    if (newFolderRow) newFolderRow.style.display = creatingNewFolder ? 'block' : 'none';
    newFolderBtn.textContent = creatingNewFolder ? '×' : '+';
    newFolderBtn.classList.toggle('active', creatingNewFolder);
    const inp = el('newFolderInput');
    if (creatingNewFolder && inp) inp.focus();
  });

  // ── Save ──────────────────────────────────────────────────────────────────
  const saveBtn = el('saveBtn');
  if (saveBtn) saveBtn.addEventListener('click', async () => {
    const titleInput = el('titleInput');
    const title = (titleInput ? titleInput.value.trim() : '') || currentTitle;

    if (!title || !currentUrl) { showToast('Missing title or URL.', 'err'); return; }
    if (currentUrl.startsWith('chrome://') || currentUrl.startsWith('chrome-extension://')) {
      showToast("This page can't be bookmarked.", 'err'); return;
    }

    if (destMode === 'quick') {
      if (quickAccess.some(b => b.url === currentUrl)) {
        showToast('Already in Quick Access.', 'err'); return;
      }
      quickAccess.push({ id: Date.now(), name: title, url: currentUrl });
    } else {
      let folderName;
      if (creatingNewFolder) {
        const inp = el('newFolderInput');
        folderName = inp ? inp.value.trim() : '';
        if (!folderName) { showToast('Enter a folder name.', 'err'); return; }
        if (!folders.some(f => (f.name || f) === folderName)) {
          folders.push({ name: folderName });
        }
      } else {
        folderName = selectedFolder;
        if (!folderName) { showToast('Select a folder.', 'err'); return; }
      }
      if (importedBookmarks.some(b => b.url === currentUrl && b.folderName === folderName)) {
        showToast('Already in that folder.', 'err'); return;
      }
      importedBookmarks.push({ id: 'p_' + Date.now(), title, url: currentUrl, folderName });
    }

    saveBtn.disabled = true;
    try {
      await new Promise((res, rej) => {
        chrome.storage.local.set({ quickAccess, folders, importedBookmarks }, () => {
          chrome.runtime.lastError ? rej(chrome.runtime.lastError) : res();
        });
      });
      showToast('Bookmark saved!', 'ok');
      setTimeout(() => window.close(), 900);
    } catch {
      saveBtn.disabled = false;
      showToast('Save failed. Try again.', 'err');
    }
  });
}

// Script runs after full HTML parse (defer attribute on script tag)
init();
