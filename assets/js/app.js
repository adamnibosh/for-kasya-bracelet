(function () {
  'use strict';

  const STORAGE_KEY = 'charm-atelier-design';
  const APPROVAL_KEY = 'charm-atelier-approved';

  let bracelet = [...DEFAULT_BRACELET];
  let selectedIndex = null;
  let activeCategory = 'letters';
  let dragIndex = null;

  const $ = (sel) => document.querySelector(sel);
  const chainEl = $('#bracelet-chain');
  const charmGrid = $('#charm-grid');
  const categoryTabs = $('#category-tabs');
  const linkCountEl = $('#link-count');
  const shoppingList = $('#shopping-list');
  const reviewModal = $('#review-modal');
  const reviewBracelet = $('#review-bracelet');
  const toast = $('#toast');

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
    if (fromHash) {
      bracelet = fromHash;
      return true;
    }
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

  function createCharmFace(charm) {
    const face = document.createElement('div');
    face.className = 'charm-face silver-link';
    CharmRender.mount(charm, face);
    return face;
  }

  function renderChainLink(charmId, index, interactive) {
    const charm = CHARM_MAP[charmId] || CHARMS[0];
    const link = document.createElement('div');
    link.className = 'charm-link';
    link.dataset.index = index;
    link.dataset.charmId = charmId;
    link.setAttribute('role', interactive ? 'listitem' : 'presentation');
    link.setAttribute('aria-label', `${charm.name}, position ${index + 1}`);
    link.title = charm.hint || charm.shopLabel || charm.name;

    if (interactive && selectedIndex === index) link.classList.add('selected');
    if (charm.dangling) link.classList.add('has-dangle');

    link.appendChild(createCharmFace(charm));

    if (interactive) {
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'remove-btn';
      removeBtn.setAttribute('aria-label', `Remove ${charm.name}`);
      removeBtn.textContent = '×';
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (bracelet.length <= 1) {
          showToast('Keep at least one charm link');
          return;
        }
        bracelet.splice(index, 1);
        selectedIndex = null;
        render();
      });
      link.appendChild(removeBtn);

      link.addEventListener('click', () => {
        selectedIndex = selectedIndex === index ? null : index;
        renderChain();
        updateSelectionHint();
      });

      link.draggable = true;
      link.addEventListener('dragstart', (e) => {
        dragIndex = index;
        link.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });
      link.addEventListener('dragend', () => {
        dragIndex = null;
        link.classList.remove('dragging');
        document.querySelectorAll('.drag-over').forEach((el) => el.classList.remove('drag-over'));
      });
      link.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (dragIndex !== null && dragIndex !== index) link.classList.add('drag-over');
      });
      link.addEventListener('dragleave', () => link.classList.remove('drag-over'));
      link.addEventListener('drop', (e) => {
        e.preventDefault();
        link.classList.remove('drag-over');
        if (dragIndex === null || dragIndex === index) return;
        const [moved] = bracelet.splice(dragIndex, 1);
        bracelet.splice(index, 0, moved);
        selectedIndex = index;
        dragIndex = null;
        render();
      });
    }

    return link;
  }

  function updateSelectionHint() {
    const hint = $('#chain-hint');
    if (selectedIndex !== null) {
      const charm = CHARM_MAP[bracelet[selectedIndex]];
      hint.innerHTML = `<strong>Link ${selectedIndex + 1} selected</strong> — pick a charm below to swap · ${charm?.hint || ''}`;
      hint.classList.add('hint-active');
    } else {
      hint.textContent = 'Click a link to swap or remove · Drag to reorder';
      hint.classList.remove('hint-active');
    }
  }

  function renderChain() {
    chainEl.innerHTML = '';
    bracelet.forEach((id, i) => chainEl.appendChild(renderChainLink(id, i, true)));
    linkCountEl.textContent = bracelet.length;
    updateSelectionHint();
  }

  function renderPalette() {
    const query = ($('#charm-search').value || '').toLowerCase().trim();
    charmGrid.innerHTML = '';

    const filtered = CHARMS.filter((c) => {
      const matchCat = activeCategory === 'all' || c.category === activeCategory;
      const hay = `${c.name} ${c.shopLabel || ''} ${c.hint || ''} ${c.letter || ''}`.toLowerCase();
      const matchSearch = !query || hay.includes(query);
      return matchCat && matchSearch;
    });

    filtered.forEach((charm) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'palette-charm';
      btn.setAttribute('role', 'option');
      btn.setAttribute('aria-label', charm.name);
      btn.title = charm.hint || '';

      btn.appendChild(createCharmFace(charm));

      const label = document.createElement('span');
      label.className = 'palette-charm-name';
      label.textContent = charm.name;
      btn.appendChild(label);

      if (charm.ref) {
        const badge = document.createElement('span');
        badge.className = 'palette-ref-badge';
        badge.textContent = 'in example';
        btn.appendChild(badge);
      }

      if (charm.hint) {
        const desc = document.createElement('span');
        desc.className = 'palette-charm-hint';
        desc.textContent = charm.hint;
        btn.appendChild(desc);
      }

      btn.addEventListener('click', () => addCharm(charm.id));
      charmGrid.appendChild(btn);
    });
  }

  function renderCategories() {
    categoryTabs.innerHTML = '';
    [{ id: 'all', label: 'All Silver' }, ...CHARM_CATEGORIES].forEach((cat) => {
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'category-tab' + (activeCategory === cat.id ? ' active' : '');
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-selected', activeCategory === cat.id);
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
    bracelet.forEach((id) => {
      counts[id] = (counts[id] || 0) + 1;
    });

    Object.entries(counts).forEach(([id, count]) => {
      const charm = CHARM_MAP[id];
      const li = document.createElement('li');
      li.innerHTML = `
        <span class="shop-qty">${count}×</span>
        <span class="shop-detail">
          <strong>${charm.shopLabel || charm.name}</strong>
          ${charm.hint ? `<em>${charm.hint}</em>` : ''}
        </span>`;
      shoppingList.appendChild(li);
    });
  }

  function renderReferenceGuide() {
    const container = $('#reference-guide');
    if (!container || typeof REFERENCE_GUIDE === 'undefined') return;
    container.innerHTML = '';

    REFERENCE_GUIDE.forEach((guide) => {
      const card = document.createElement('article');
      card.className = 'ref-card';

      const fig = document.createElement('figure');
      fig.className = 'ref-figure';

      const wrap = document.createElement('div');
      wrap.className = 'ref-image-wrap';

      const img = document.createElement('img');
      img.src = guide.image;
      img.alt = guide.title;
      img.loading = 'lazy';
      wrap.appendChild(img);

      guide.markers.forEach((m) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'ref-marker';
        dot.style.left = `${m.x}%`;
        dot.style.top = `${m.y}%`;
        dot.title = m.label;
        dot.setAttribute('aria-label', `Find charm: ${m.label}`);
        dot.innerHTML = `<span class="ref-marker-label">${m.label}</span>`;
        dot.addEventListener('click', () => highlightCharmByRef(m.ref, m.label));
        wrap.appendChild(dot);
      });

      fig.appendChild(wrap);
      card.innerHTML = `<h3>${guide.title}</h3><p class="ref-caption">${guide.caption}</p>`;
      card.appendChild(fig);
      container.appendChild(card);
    });
  }

  function highlightCharmByRef(refId, label) {
    const charm = CHARMS.find((c) => c.ref === refId);
    if (charm) {
      activeCategory = charm.category;
      renderCategories();
      renderPalette();
      showToast(`Look for "${charm.name}" in the library — matches: ${label}`);
      $('#charm-search').value = '';
      document.querySelector('.palette-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => {
        const match = document.querySelector(`.palette-charm[aria-label="${charm.name}"]`);
        match?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        match?.classList.add('highlight-flash');
        setTimeout(() => match?.classList.remove('highlight-flash'), 2000);
      }, 400);
    } else {
      showToast(label);
    }
  }

  function renderReview() {
    reviewBracelet.innerHTML = '';
    bracelet.forEach((id, i) => reviewBracelet.appendChild(renderChainLink(id, i, false)));
    $('#review-count').textContent = `${bracelet.length} silver charm links · ${Object.keys(
      bracelet.reduce((a, id) => ({ ...a, [id]: 1 }), {})
    ).length} unique designs`;
  }

  function render() {
    renderChain();
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
    showToast(swapped ? 'Charm swapped' : 'Charm added to bracelet');
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
    const colors = ['#c5cdd6', '#e8a0b4', '#64b5f6', '#f4f6f8', '#a67c6d'];
    for (let i = 0; i < 60; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDuration = `${1.5 + Math.random() * 2}s`;
      piece.style.animationDelay = `${Math.random() * 0.5}s`;
      piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
      container.appendChild(piece);
    }
    setTimeout(() => {
      container.hidden = true;
      container.innerHTML = '';
    }, 4000);
  }

  function approveDesign() {
    const shareUrl = getShareUrl();
    const approval = { bracelet: [...bracelet], approvedAt: new Date().toISOString(), shareUrl };
    localStorage.setItem(APPROVAL_KEY, JSON.stringify(approval));
    document.querySelector('.bracelet-panel').classList.add('approved');

    let badge = document.querySelector('.approved-badge');
    if (!badge) {
      badge = document.createElement('div');
      badge.className = 'approved-badge';
      document.querySelector('.bracelet-panel .panel-header').prepend(badge);
    }
    badge.innerHTML = '♥ Approved! Send him the share link so he can order it.';

    launchConfetti();
    copyText(shareUrl).then(() => {
      showToast('Link copied — send it to Muhammad so he can order your bracelet! 💕', 4500);
    });

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
    const name = params.get('for');
    const gifter = params.get('view') === 'gifter';
    const herName = name || 'Kasya';

    $('#gift-message').textContent = `${herName}, design your silver Italian charm bracelet`;
    $('.hero-sub').textContent = 'Silver base with small color accents — just like your example. Pick letters, hearts, animals & symbols, then tap "This is perfect!"';

    if (gifter) {
      document.body.classList.add('gifter-mode');
      $('.hero-eyebrow').textContent = 'Her approved design';
      $('#gift-message').textContent = `Here is the silver bracelet ${herName} designed`;
      $('.hero-sub').textContent = 'Order these exact 9mm silver Italian charm links from the shopping list below.';
    }
  }

  function copyText(text) {
    if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    return Promise.resolve();
  }

  $('#btn-more').addEventListener('click', () => { bracelet.push('blank-silver'); render(); });
  $('#btn-less').addEventListener('click', () => {
    if (bracelet.length <= 1) { showToast('Keep at least one charm link'); return; }
    bracelet.pop();
    render();
  });

  $('#btn-reset').addEventListener('click', () => {
    if (!confirm('Start over with the default KASYA silver bracelet?')) return;
    bracelet = [...DEFAULT_BRACELET];
    selectedIndex = null;
    localStorage.removeItem(APPROVAL_KEY);
    document.querySelector('.bracelet-panel').classList.remove('approved');
    document.querySelector('.approved-badge')?.remove();
    render();
  });

  $('#btn-approve').addEventListener('click', approveDesign);
  $('#review-approve').addEventListener('click', approveDesign);
  $('#btn-review').addEventListener('click', () => { renderReview(); reviewModal.showModal(); });
  $('#review-close').addEventListener('click', () => reviewModal.close());
  $('#review-back').addEventListener('click', () => reviewModal.close());
  reviewModal.addEventListener('click', (e) => { if (e.target === reviewModal) reviewModal.close(); });

  $('#btn-share').addEventListener('click', () => {
    copyText(getShareUrl()).then(() => showToast('Link copied — send it to him!'));
  });

  $('#btn-copy-list').addEventListener('click', () => {
    const lines = ['Silver Italian Charm Bracelet — Shopping List', `Total links: ${bracelet.length}`, ''];
    const counts = {};
    bracelet.forEach((id) => { counts[id] = (counts[id] || 0) + 1; });
    Object.entries(counts).forEach(([id, count]) => {
      const c = CHARM_MAP[id];
      lines.push(`${count}× ${c.shopLabel || c.name}`);
    });
    lines.push('', 'Style: Silver 9mm modular links (Nomination-compatible)', 'Reference: Custom Lala / Italian charm bracelet');
    copyText(lines.join('\n')).then(() => showToast('Shopping list copied'));
  });

  $('#charm-search').addEventListener('input', renderPalette);

  $('#btn-load-example').addEventListener('click', () => {
    bracelet = [
      'heart-magnetic', 'kitten', 'checkered-red', 'cherry',
      'bmw', 'letter-a', 'letter-m', 'butterfly', 'bow-blue',
      'jellyfish', 'enamel-blue', 'cat-black',
    ];
    selectedIndex = null;
    render();
    showToast('Loaded charms from your example board!');
    document.querySelector('.bracelet-panel')?.scrollIntoView({ behavior: 'smooth' });
  });

  setupGiftMode();
  loadFromUrl();
  renderCategories();
  renderReferenceGuide();
  render();
})();