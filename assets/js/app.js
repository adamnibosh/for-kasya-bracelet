(function () {
  'use strict';

  const STORAGE_KEY = 'charm-atelier-v2';
  const APPROVAL_KEY = 'charm-atelier-approved';

  let bracelet = [...DEFAULT_BRACELET];
  let selectedIndex = null;
  let activeCategory = 'letters';

  const $ = (s) => document.querySelector(s);
  const viewEl = $('#bracelet-view');
  const reviewEl = $('#review-view');
  const toast = $('#toast');
  const loadingEl = $('#bracelet-loading');

  const handlers = {
    selectedIndex: null,
    onSelect(idx) {
      selectedIndex = idx;
      handlers.selectedIndex = idx;
      refreshBracelet();
      updateSelectionBar();
      renderLibrary();
    },
    onRemove(idx) {
      if (bracelet.length <= 1) { showToast('Keep at least one link'); return; }
      bracelet.splice(idx, 1);
      selectedIndex = null;
      handlers.selectedIndex = null;
      fullRefresh();
    },
    onReorder(from, to) {
      const [moved] = bracelet.splice(from, 1);
      bracelet.splice(to, 0, moved);
      selectedIndex = to;
      handlers.selectedIndex = to;
      fullRefresh();
    },
  };

  function encodeDesign(ids) {
    return btoa(unescape(encodeURIComponent(JSON.stringify(ids))));
  }

  function decodeDesign(hash) {
    try {
      const raw = hash.replace(/^#/, '');
      if (!raw) return null;
      const parsed = JSON.parse(decodeURIComponent(escape(atob(raw))));
      if (Array.isArray(parsed) && parsed.length) return parsed.filter((id) => CHARM_MAP[id]);
    } catch { /* */ }
    return null;
  }

  function getShareUrl() {
    const base = location.href.split('#')[0].split('?')[0];
    const q = new URLSearchParams(location.search).toString();
    return `${base}${q ? `?${q}` : ''}#${encodeDesign(bracelet)}`;
  }

  function loadState() {
    const fromHash = decodeDesign(location.hash);
    if (fromHash) { bracelet = fromHash; return; }
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '');
      if (Array.isArray(saved) && saved.every((id) => CHARM_MAP[id])) bracelet = saved;
    } catch { /* */ }
  }

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bracelet));
    const u = new URL(location.href);
    u.hash = encodeDesign(bracelet);
    history.replaceState(null, '', u);
  }

  function hideLoading() {
    if (loadingEl) loadingEl.remove();
  }

  function refreshBracelet() {
    $('#link-count').textContent = bracelet.length;
    BraceletView.render(viewEl, bracelet, selectedIndex);
    BraceletView.bind(viewEl, handlers);
    hideLoading();
    if ($('#review-modal').open) {
      BraceletView.render(reviewEl, bracelet, null);
    }
  }

  function fullRefresh() {
    refreshBracelet();
    renderShoppingList();
    renderLibrary();
    persist();
    checkApproved();
  }

  function updateSelectionBar() {
    const bar = $('#link-controls');
    const hint = $('#chain-hint');
    const libDesc = $('#library-desc');
    if (selectedIndex !== null) {
      const c = CHARM_MAP[bracelet[selectedIndex]];
      bar.hidden = false;
      $('#selected-charm-name').textContent = c?.name || '';
      hint.textContent = `Link ${selectedIndex + 1} selected — tap a library charm to swap, or use arrows to move`;
      hint.classList.add('is-active');
      if (libDesc) libDesc.textContent = 'Tap any charm below to replace your selected link';
    } else {
      bar.hidden = true;
      hint.textContent = 'Tap a charm to select · Pick from the library below to add or swap';
      hint.classList.remove('is-active');
      if (libDesc) libDesc.textContent = 'Real Nomination-style 9mm silver links — tap to add to your bracelet';
    }
  }

  function charmImgHtml(charmId, size) {
    const url = assetUrl(getCharmImageUrl(charmId));
    return `<img src="${url}" alt="" loading="lazy" width="${size}" height="${size}" onerror="this.src='${assetUrl(getCharmImageUrl('blank-silver'))}'">`;
  }

  function renderCategories() {
    const tabs = $('#category-tabs');
    tabs.innerHTML = '';
    [{ id: 'all', label: 'All', icon: '✦' }, ...CHARM_CATEGORIES].forEach((cat) => {
      const count = cat.id === 'all'
        ? CHARMS.length
        : CHARMS.filter((c) => c.category === cat.id).length;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cat-tab' + (activeCategory === cat.id ? ' is-active' : '');
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', activeCategory === cat.id ? 'true' : 'false');
      btn.innerHTML = `<span class="cat-icon">${cat.icon || '◆'}</span>${cat.label} <span class="cat-count">${count}</span>`;
      btn.addEventListener('click', () => {
        activeCategory = cat.id;
        renderCategories();
        renderLibrary();
      });
      tabs.appendChild(btn);
    });

    const strip = $('#letter-strip');
    const grid = $('#letter-strip-grid');
    const showLetters = activeCategory === 'letters' || activeCategory === 'all';
    strip.hidden = !showLetters;
    if (showLetters && grid) {
      grid.innerHTML = '';
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach((L) => {
        const id = `letter-${L.toLowerCase()}`;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'letter-chip';
        btn.title = `Silver letter ${L}`;
        btn.innerHTML = `
          <span class="letter-chip-photo">${charmImgHtml(id, 28)}</span>
          <span class="letter-chip-char">${L}</span>`;
        btn.addEventListener('click', () => addCharm(id));
        grid.appendChild(btn);
      });
    }
  }

  function getFilteredCharms() {
    const q = ($('#charm-search').value || '').toLowerCase().trim();
    return CHARMS.filter((c) => {
      const catOk = activeCategory === 'all' || c.category === activeCategory;
      const hay = `${c.name} ${c.shopLabel || ''} ${c.letter || ''} ${c.hint || ''}`.toLowerCase();
      return catOk && (!q || hay.includes(q));
    });
  }

  function renderLibrary() {
    const items = getFilteredCharms();
    const grid = $('#charm-grid');
    const countEl = $('#library-count');
    grid.innerHTML = '';

    if (countEl) {
      countEl.textContent = `${items.length} charm${items.length === 1 ? '' : 's'}`;
    }

    if (!items.length) {
      grid.innerHTML = '<p class="grid-empty">No charms match your search — try another word or category</p>';
      return;
    }

    const selectedId = selectedIndex !== null ? bracelet[selectedIndex] : null;

    items.forEach((charm, i) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'charm-card';
      card.style.animationDelay = `${Math.min(i * 0.02, 0.4)}s`;
      if (selectedId === charm.id) card.classList.add('is-on-bracelet');
      card.setAttribute('aria-label', charm.name);
      card.innerHTML = `
        <div class="charm-card-photo">
          ${charmImgHtml(charm.id, 120)}
          <span class="charm-card-shine" aria-hidden="true"></span>
        </div>
        <span class="charm-card-name">${charm.name}</span>
        <span class="charm-card-sub">${charm.hint || charm.shopLabel || ''}</span>
        ${charm.dangling ? '<span class="charm-card-tag">Dangle</span>' : ''}
        ${selectedId === charm.id ? '<span class="charm-card-tag is-selected-tag">On bracelet</span>' : ''}`;
      card.addEventListener('click', () => addCharm(charm.id));
      grid.appendChild(card);
    });
  }

  function renderShoppingList() {
    const list = $('#shopping-list');
    list.innerHTML = '';
    const counts = {};
    bracelet.forEach((id) => { counts[id] = (counts[id] || 0) + 1; });
    Object.entries(counts).forEach(([id, n]) => {
      const c = CHARM_MAP[id];
      const li = document.createElement('li');
      li.innerHTML = `
        <span class="shop-thumb">${charmImgHtml(id, 40)}</span>
        <span class="shop-qty">${n}×</span>
        <span class="shop-name">${c.shopLabel || c.name}</span>`;
      list.appendChild(li);
    });
  }

  function addCharm(id) {
    const swap = selectedIndex !== null;
    if (swap) {
      bracelet[selectedIndex] = id;
      selectedIndex = null;
      handlers.selectedIndex = null;
    } else {
      bracelet.push(id);
    }
    fullRefresh();
    updateSelectionBar();
    showToast(swap ? 'Charm swapped ✓' : 'Added to your bracelet ✓');
    viewEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function moveLink(d) {
    if (selectedIndex === null) return;
    const next = selectedIndex + d;
    if (next < 0 || next >= bracelet.length) return;
    [bracelet[selectedIndex], bracelet[next]] = [bracelet[next], bracelet[selectedIndex]];
    selectedIndex = next;
    handlers.selectedIndex = next;
    fullRefresh();
    updateSelectionBar();
  }

  function showToast(msg, ms = 3000) {
    toast.textContent = msg;
    toast.hidden = false;
    toast.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => { toast.hidden = true; }, 300);
    }, ms);
  }

  function launchConfetti() {
    const box = $('#confetti');
    box.hidden = false;
    box.innerHTML = '';
    const colors = ['#c9a87c', '#e8b4b8', '#d4dce4', '#fff', '#b8956b'];
    for (let j = 0; j < 60; j++) {
      const p = document.createElement('i');
      p.style.cssText = `left:${Math.random() * 100}%;background:${colors[j % colors.length]};width:${6 + Math.random() * 6}px;height:${6 + Math.random() * 6}px;animation-duration:${1.2 + Math.random() * 1.5}s;animation-delay:${Math.random() * 0.4}s`;
      box.appendChild(p);
    }
    setTimeout(() => { box.hidden = true; box.innerHTML = ''; }, 4500);
  }

  function approve() {
    const url = getShareUrl();
    localStorage.setItem(APPROVAL_KEY, JSON.stringify({ bracelet: [...bracelet], at: Date.now(), url }));
    setApprovedUI(true);
    launchConfetti();
    copyText(url).then(() => showToast('Link copied — send it to Muhammad! 💕', 5000));
    if ($('#review-modal').open) $('#review-modal').close();
  }

  function setApprovedUI(on) {
    $('.bracelet-panel').classList.toggle('is-approved', on);
    const ribbon = $('#approved-ribbon');
    if (ribbon) ribbon.hidden = !on;
  }

  function checkApproved() {
    try {
      const d = JSON.parse(localStorage.getItem(APPROVAL_KEY) || '');
      setApprovedUI(JSON.stringify(d.bracelet) === JSON.stringify(bracelet));
    } catch { /* */ }
  }

  function preloadBraceletImages() {
    const ids = [...new Set([...bracelet, ...CHARMS.slice(0, 12).map((c) => c.id)])];
    ids.forEach((id) => {
      const img = new Image();
      img.src = assetUrl(getCharmImageUrl(id));
    });
  }

  function setupGift() {
    const p = new URLSearchParams(location.search);
    const name = p.get('for') || 'Kasya';
    const gifter = p.get('view') === 'gifter';
    document.title = gifter ? `${name}'s Bracelet — Charm Atelier` : `For ${name} — Charm Atelier`;
    $('#gift-message').textContent = `${name}, design your silver charm bracelet`;
    if (gifter) {
      document.body.classList.add('gifter-mode');
      $('#hero-eyebrow').textContent = 'Her approved design';
      $('#gift-message').textContent = `${name}'s bracelet design`;
      $('#hero-sub').textContent = 'Order these exact silver Italian charm links below.';
      $('#hero-note').hidden = true;
    } else {
      $('#hero-sub').textContent = `${name}, every link below is a real Nomination charm photo. Tap to select, browse the library, preview, then say yes when it feels perfect.`;
      $('#hero-note').textContent = 'With love, from Muhammad';
    }
  }

  function copyText(t) {
    return navigator.clipboard?.writeText(t) || new Promise((res) => {
      const a = document.createElement('textarea');
      a.value = t;
      document.body.appendChild(a);
      a.select();
      document.execCommand('copy');
      a.remove();
      res();
    });
  }

  const reviewModal = $('#review-modal');

  $('#btn-more').onclick = () => { bracelet.push('blank-silver'); fullRefresh(); };
  $('#btn-less').onclick = () => {
    if (bracelet.length <= 1) return showToast('Keep at least one link');
    bracelet.pop();
    fullRefresh();
  };
  $('#btn-reset').onclick = () => {
    if (!confirm('Start over with a fresh bracelet?')) return;
    bracelet = [...DEFAULT_BRACELET];
    selectedIndex = null;
    handlers.selectedIndex = null;
    localStorage.removeItem(APPROVAL_KEY);
    setApprovedUI(false);
    fullRefresh();
    updateSelectionBar();
  };
  $('#btn-move-left').onclick = () => moveLink(-1);
  $('#btn-move-right').onclick = () => moveLink(1);
  $('#btn-remove-link').onclick = () => handlers.onRemove(selectedIndex);
  $('#btn-approve').onclick = approve;
  $('#review-approve').onclick = approve;
  $('#btn-review').onclick = () => {
    BraceletView.render(reviewEl, bracelet, null);
    $('#review-count').textContent = `${bracelet.length} links · ${new Set(bracelet).size} unique charms`;
    reviewModal.showModal();
  };
  $('#review-close').onclick = () => reviewModal.close();
  $('#review-back').onclick = () => reviewModal.close();
  reviewModal.onclick = (e) => { if (e.target === reviewModal) reviewModal.close(); };
  $('#btn-share').onclick = () => copyText(getShareUrl()).then(() => showToast('Link copied!'));
  $('#btn-copy-list').onclick = () => {
    const lines = ['Kasya — Silver Italian Charm Bracelet', `Total: ${bracelet.length} links`, ''];
    const c = {};
    bracelet.forEach((id) => { c[id] = (c[id] || 0) + 1; });
    Object.entries(c).forEach(([id, n]) => lines.push(`${n}× ${CHARM_MAP[id].shopLabel}`));
    copyText(lines.join('\n')).then(() => showToast('Order list copied'));
  };
  $('#charm-search').oninput = renderLibrary;

  try {
    setupGift();
    loadState();
    preloadBraceletImages();
    renderCategories();
    refreshBracelet();
    renderLibrary();
    renderShoppingList();
    updateSelectionBar();
    persist();
    checkApproved();
  } catch (err) {
    console.error(err);
    hideLoading();
    showToast('Something went wrong — try refreshing the page');
  }
})();