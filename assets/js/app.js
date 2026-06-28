(function () {
  'use strict';

  const STORAGE_KEY = 'charm-atelier-design';
  const APPROVAL_KEY = 'charm-atelier-approved';

  let bracelet = [...DEFAULT_BRACELET];
  let selectedIndex = null;
  let activeCategory = 'letters';

  let main3d = null;
  let review3d = null;

  const $ = (sel) => document.querySelector(sel);
  const charmGrid = $('#charm-grid');
  const categoryTabs = $('#category-tabs');
  const linkCountEl = $('#link-count');
  const shoppingList = $('#shopping-list');
  const reviewModal = $('#review-modal');
  const toast = $('#toast');
  const linkControls = $('#link-controls');

  function encodeDesign(ids) {
    return btoa(unescape(encodeURIComponent(JSON.stringify(ids))));
  }

  function decodeDesign(hash) {
    try {
      const raw = hash.replace(/^#/, '');
      if (!raw) return null;
      const json = decodeURIComponent(escape(atob(raw)));
      const parsed = JSON.parse(json);
      if (!Array.isArray(parsed) || parsed.length < 1) return null;
      return parsed.filter((id) => CHARM_MAP[id]);
    } catch {
      return null;
    }
  }

  function getShareUrl() {
    const base = window.location.href.split('#')[0].split('?')[0];
    const params = new URLSearchParams(window.location.search);
    if (params.has('for')) params.set('for', params.get('for'));
    const qs = params.toString();
    return `${base}${qs ? `?${qs}` : ''}#${encodeDesign(bracelet)}`;
  }

  function loadFromUrl() {
    const fromHash = decodeDesign(window.location.hash);
    if (fromHash) { bracelet = fromHash; return true; }
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.every((id) => CHARM_MAP[id])) {
          bracelet = parsed;
          return true;
        }
      } catch { /* ignore */ }
    }
    return false;
  }

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bracelet));
    const url = new URL(window.location.href);
    url.hash = encodeDesign(bracelet);
    history.replaceState(null, '', url);
  }

  function createCharmThumb(charm) {
    const face = document.createElement('div');
    face.className = 'charm-face silver-link';
    CharmRender.mount(charm, face);
    return face;
  }

  function updateSelectionUI() {
    const hint = $('#chain-hint');
    const controls = linkControls;

    if (selectedIndex !== null) {
      const charm = CHARM_MAP[bracelet[selectedIndex]];
      hint.innerHTML = `<strong>Link ${selectedIndex + 1} selected</strong> — choose a charm to swap, or use arrows to reorder`;
      hint.classList.add('hint-active');
      controls.hidden = false;
      $('#selected-charm-name').textContent = charm?.name || '';
    } else {
      hint.textContent = 'Drag to rotate · Click a charm to select · Pick from library to add or swap';
      hint.classList.remove('hint-active');
      controls.hidden = true;
    }

    main3d?.setSelectedIndex(selectedIndex);
  }

  function renderBracelet3D() {
    linkCountEl.textContent = bracelet.length;
    if (main3d && main3d._ready) main3d.setBracelet(bracelet);
    updateSelectionUI();
  }

  function renderPalette() {
    const query = ($('#charm-search').value || '').toLowerCase().trim();
    charmGrid.innerHTML = '';

    CHARMS.filter((c) => {
      const matchCat = activeCategory === 'all' || c.category === activeCategory;
      const hay = `${c.name} ${c.shopLabel || ''} ${c.hint || ''} ${c.letter || ''}`.toLowerCase();
      return matchCat && (!query || hay.includes(query));
    }).forEach((charm) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'palette-charm';
      btn.setAttribute('role', 'option');
      btn.setAttribute('aria-label', charm.name);
      btn.appendChild(createCharmThumb(charm));

      const label = document.createElement('span');
      label.className = 'palette-charm-name';
      label.textContent = charm.name;
      btn.appendChild(label);

      btn.addEventListener('click', () => addCharm(charm.id));
      charmGrid.appendChild(btn);
    });
  }

  function renderCategories() {
    categoryTabs.innerHTML = '';
    [{ id: 'all', label: 'All' }, ...CHARM_CATEGORIES].forEach((cat) => {
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'category-tab' + (activeCategory === cat.id ? ' active' : '');
      tab.textContent = cat.label;
      tab.addEventListener('click', () => {
        activeCategory = cat.id;
        renderCategories();
        renderPalette();
      });
      categoryTabs.appendChild(tab);
    });
  }

  function renderShoppingList() {
    shoppingList.innerHTML = '';
    const counts = {};
    bracelet.forEach((id) => { counts[id] = (counts[id] || 0) + 1; });
    Object.entries(counts).forEach(([id, count]) => {
      const charm = CHARM_MAP[id];
      const li = document.createElement('li');
      li.innerHTML = `<span class="shop-qty">${count}×</span><span class="shop-detail"><strong>${charm.shopLabel || charm.name}</strong></span>`;
      shoppingList.appendChild(li);
    });
  }

  function render() {
    renderBracelet3D();
    renderPalette();
    renderShoppingList();
    persist();
    checkApprovalState();
  }

  function addCharm(charmId) {
    const swapped = selectedIndex !== null;
    if (swapped) {
      bracelet[selectedIndex] = charmId;
      selectedIndex = null;
    } else {
      bracelet.push(charmId);
    }
    render();
    showToast(swapped ? 'Charm swapped' : 'Charm added');
  }

  function moveLink(dir) {
    if (selectedIndex === null) return;
    const next = selectedIndex + dir;
    if (next < 0 || next >= bracelet.length) return;
    [bracelet[selectedIndex], bracelet[next]] = [bracelet[next], bracelet[selectedIndex]];
    selectedIndex = next;
    render();
  }

  function removeSelected() {
    if (selectedIndex === null) return;
    if (bracelet.length <= 1) { showToast('Keep at least one link'); return; }
    bracelet.splice(selectedIndex, 1);
    selectedIndex = null;
    render();
  }

  function showToast(message, duration = 2800) {
    toast.textContent = message;
    toast.hidden = false;
    toast.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => { toast.hidden = true; }, 350);
    }, duration);
  }

  function launchConfetti() {
    const container = $('#confetti');
    container.hidden = false;
    container.innerHTML = '';
    const colors = ['#c5cdd6', '#e8a0b4', '#64b5f6', '#f4f6f8'];
    for (let i = 0; i < 50; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDuration = `${1.5 + Math.random() * 2}s`;
      container.appendChild(piece);
    }
    setTimeout(() => { container.hidden = true; container.innerHTML = ''; }, 4000);
  }

  function approveDesign() {
    const shareUrl = getShareUrl();
    localStorage.setItem(APPROVAL_KEY, JSON.stringify({ bracelet: [...bracelet], approvedAt: new Date().toISOString(), shareUrl }));
    document.querySelector('.bracelet-panel').classList.add('approved');
    let badge = document.querySelector('.approved-badge');
    if (!badge) {
      badge = document.createElement('div');
      badge.className = 'approved-badge';
      document.querySelector('.bracelet-panel .panel-header').prepend(badge);
    }
    badge.innerHTML = '♥ Approved — share the link with Muhammad';
    launchConfetti();
    copyText(shareUrl).then(() => showToast('Link copied! Send it to Muhammad 💕', 4500));
    if (reviewModal.open) reviewModal.close();
  }

  function checkApprovalState() {
    const approved = localStorage.getItem(APPROVAL_KEY);
    if (!approved) return;
    try {
      const data = JSON.parse(approved);
      if (JSON.stringify(data.bracelet) === JSON.stringify(bracelet)) {
        document.querySelector('.bracelet-panel').classList.add('approved');
      }
    } catch { /* ignore */ }
  }

  function setupGiftMode() {
    const params = new URLSearchParams(window.location.search);
    const gifter = params.get('view') === 'gifter';
    const herName = params.get('for') || 'Kasya';

    $('#gift-message').textContent = `${herName}, design your silver charm bracelet`;
    $('.hero-sub').textContent = 'Build your bracelet in 3D — pick silver links, letters, hearts and charms, then preview and approve when it feels perfect.';

    if (gifter) {
      document.body.classList.add('gifter-mode');
      $('.hero-eyebrow').textContent = 'Approved design';
      $('#gift-message').textContent = `${herName}'s bracelet design`;
      $('.hero-sub').textContent = 'Order these 9mm silver Italian charm links from the list below.';
    }
  }

  function copyText(text) {
    if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    return Promise.resolve();
  }

  function openReview() {
    reviewModal.showModal();
    if (!review3d) {
      review3d = new Bracelet3D($('#bracelet-3d-review'), { autoRotate: true, onSelect: () => {} });
    }
    requestAnimationFrame(() => {
      review3d.resize();
      review3d.setBracelet(bracelet);
    });
    $('#review-count').textContent = `${bracelet.length} links · ${new Set(bracelet).size} unique charms`;
  }

  function init3D() {
    main3d = new Bracelet3D($('#bracelet-3d-main'), {
      autoRotate: true,
      onSelect: (idx) => {
        selectedIndex = idx;
        updateSelectionUI();
      },
    });
    requestAnimationFrame(() => {
      main3d?.resize();
      main3d?.setBracelet(bracelet);
    });
  }

  $('#btn-more').addEventListener('click', () => { bracelet.push('blank-silver'); render(); });
  $('#btn-less').addEventListener('click', () => {
    if (bracelet.length <= 1) { showToast('Keep at least one link'); return; }
    bracelet.pop();
    render();
  });
  $('#btn-reset').addEventListener('click', () => {
    if (!confirm('Start over?')) return;
    bracelet = [...DEFAULT_BRACELET];
    selectedIndex = null;
    localStorage.removeItem(APPROVAL_KEY);
    document.querySelector('.bracelet-panel').classList.remove('approved');
    document.querySelector('.approved-badge')?.remove();
    render();
  });
  $('#btn-move-left').addEventListener('click', () => moveLink(-1));
  $('#btn-move-right').addEventListener('click', () => moveLink(1));
  $('#btn-remove-link').addEventListener('click', removeSelected);
  $('#btn-approve').addEventListener('click', approveDesign);
  $('#review-approve').addEventListener('click', approveDesign);
  $('#btn-review').addEventListener('click', openReview);
  $('#review-close').addEventListener('click', () => reviewModal.close());
  $('#review-back').addEventListener('click', () => reviewModal.close());
  reviewModal.addEventListener('click', (e) => { if (e.target === reviewModal) reviewModal.close(); });
  $('#btn-share').addEventListener('click', () => copyText(getShareUrl()).then(() => showToast('Link copied!')));
  $('#btn-copy-list').addEventListener('click', () => {
    const lines = ['Silver Italian Charm Bracelet', `Links: ${bracelet.length}`, ''];
    const counts = {};
    bracelet.forEach((id) => { counts[id] = (counts[id] || 0) + 1; });
    Object.entries(counts).forEach(([id, c]) => lines.push(`${c}× ${CHARM_MAP[id].shopLabel || CHARM_MAP[id].name}`));
    copyText(lines.join('\n')).then(() => showToast('Shopping list copied'));
  });
  $('#charm-search').addEventListener('input', renderPalette);

  setupGiftMode();
  loadFromUrl();
  renderCategories();
  init3D();
  renderPalette();
  renderShoppingList();
  persist();
  checkApprovalState();
})();