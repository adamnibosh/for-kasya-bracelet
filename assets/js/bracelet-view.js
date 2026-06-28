/**
 * Premium bracelet viewer — HD transparent charms in a draggable 3D arc
 */
const BraceletView = (function () {
  let rotateY = 0;
  let dragState = null;
  let autoSpinId = null;
  let boundContainer = null;
  let suppressClick = false;

  function linkHtml(charmId, index, selected) {
    const charm = CHARM_MAP[charmId] || CHARMS[0];
    const url = assetUrl(getCharmImageUrl(charmId));
    const dangle = charm.dangling ? ' is-dangle' : '';
    return `
      <div class="bv-link${selected ? ' is-selected' : ''}${dangle}" data-index="${index}" data-id="${charmId}" role="listitem"
           aria-label="${charm.name}, link ${index + 1}" title="${charm.name}">
        <button type="button" class="bv-remove" aria-label="Remove ${charm.name}">×</button>
        <div class="bv-face">
          <img src="${url}" alt="${charm.name}" draggable="false" loading="eager">
        </div>
        <span class="bv-index">${index + 1}</span>
      </div>`;
  }

  function layoutTransforms(n, baseRotate) {
    const mid = (n - 1) / 2;
    return Array.from({ length: n }, (_, i) => {
      const offset = i - mid;
      const arc = offset * 9 + baseRotate * 0.12;
      const translateZ = Math.max(0, 56 - Math.abs(offset) * 14);
      const translateY = Math.abs(offset) * 2.5;
      return { arc, translateZ, translateY, offset };
    });
  }

  function applyArcRotation(container, baseRotate) {
    const track = container.querySelector('.bv-track');
    if (!track) return;
    const wraps = track.querySelectorAll('.bv-link-wrap');
    const transforms = layoutTransforms(wraps.length, baseRotate);
    wraps.forEach((wrap, i) => {
      const t = transforms[i];
      wrap.style.setProperty('--ry', `${t.arc}deg`);
      wrap.style.setProperty('--tz', `${t.translateZ}px`);
      wrap.style.setProperty('--ty', `${t.translateY}px`);
    });
    const stage = container.querySelector('.bv-stage');
    if (stage) stage.style.setProperty('--bracelet-rotate', `${baseRotate}deg`);
  }

  function stopAutoSpin() {
    if (autoSpinId) {
      cancelAnimationFrame(autoSpinId);
      autoSpinId = null;
    }
  }

  function startAutoSpin(container) {
    stopAutoSpin();
    let last = performance.now();
    const tick = (now) => {
      if (dragState) {
        autoSpinId = requestAnimationFrame(tick);
        return;
      }
      const dt = now - last;
      last = now;
      rotateY += dt * 0.008;
      applyArcRotation(container, rotateY);
      autoSpinId = requestAnimationFrame(tick);
    };
    autoSpinId = requestAnimationFrame(tick);
  }

  function bindRotate(container) {
    const viewport = container.querySelector('.bv-viewport');
    const stage = container.querySelector('.bv-stage');
    if (!viewport || !stage || viewport.dataset.rotateBound) return;
    viewport.dataset.rotateBound = '1';

    let pointer = null;

    const onDown = (clientX, target) => {
      if (target?.closest('.bv-remove')) return;
      pointer = { startX: clientX, startRot: rotateY, moved: false };
      stopAutoSpin();
      stage.classList.add('is-dragging-arc');
    };

    const onMove = (clientX) => {
      if (!pointer) return;
      const dx = clientX - pointer.startX;
      if (Math.abs(dx) > 6) pointer.moved = true;
      rotateY = pointer.startRot + dx * 0.4;
      applyArcRotation(container, rotateY);
    };

    const onUp = () => {
      if (!pointer) return;
      suppressClick = pointer.moved;
      pointer = null;
      stage.classList.remove('is-dragging-arc');
      startAutoSpin(container);
      if (suppressClick) {
        setTimeout(() => { suppressClick = false; }, 0);
      }
    };

    viewport.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      onDown(e.clientX, e.target);
    });
    window.addEventListener('mousemove', (e) => onMove(e.clientX));
    window.addEventListener('mouseup', () => onUp());

    viewport.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1) return;
      onDown(e.touches[0].clientX, e.target);
    }, { passive: true });
    viewport.addEventListener('touchmove', (e) => {
      if (!pointer || e.touches.length !== 1) return;
      onMove(e.touches[0].clientX);
    }, { passive: true });
    viewport.addEventListener('touchend', () => onUp());
  }

  function render(container, charmIds, selectedIndex) {
    const n = charmIds.length;
    const transforms = layoutTransforms(n, rotateY);

    const links = charmIds.map((id, i) => {
      const t = transforms[i];
      const sel = i === selectedIndex;
      return `<div class="bv-link-wrap" style="--ry:${t.arc}deg;--tz:${t.translateZ}px;--ty:${t.translateY}px">${linkHtml(id, i, sel)}</div>`;
    }).join('');

    container.innerHTML = `
      <div class="bv-viewport">
        <div class="bv-stage" style="--bracelet-rotate:${rotateY}deg">
          <div class="bv-clasp bv-clasp-l" aria-hidden="true"></div>
          <div class="bv-track" role="list" aria-label="Your bracelet">${links}</div>
          <div class="bv-clasp bv-clasp-r" aria-hidden="true"></div>
        </div>
      </div>
      <p class="bv-drag-hint">Drag bracelet to spin · Drag links to reorder · Tap to select</p>`;

    boundContainer = container;
    bindRotate(container);
    if (!autoSpinId) startAutoSpin(container);
  }

  function bind(container, handlers) {
    const track = container.querySelector('.bv-track');
    if (!track) return;

    let dragIdx = null;

    track.querySelectorAll('.bv-link').forEach((el) => {
      const idx = Number(el.dataset.index);

      el.addEventListener('click', (e) => {
        if (suppressClick || e.target.closest('.bv-remove')) return;
        handlers.onSelect(handlers.selectedIndex === idx ? null : idx);
      });

      el.querySelector('.bv-remove')?.addEventListener('click', (e) => {
        e.stopPropagation();
        handlers.onRemove(idx);
      });

      el.draggable = true;
      el.addEventListener('dragstart', (e) => {
        dragIdx = idx;
        el.classList.add('is-dragging');
        stopAutoSpin();
        e.dataTransfer.effectAllowed = 'move';
      });
      el.addEventListener('dragend', () => {
        dragIdx = null;
        el.classList.remove('is-dragging');
        track.querySelectorAll('.drag-over').forEach((x) => x.classList.remove('drag-over'));
        if (boundContainer) startAutoSpin(boundContainer);
      });
      el.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (dragIdx !== null && dragIdx !== idx) el.classList.add('drag-over');
      });
      el.addEventListener('dragleave', () => el.classList.remove('drag-over'));
      el.addEventListener('drop', (e) => {
        e.preventDefault();
        el.classList.remove('drag-over');
        if (dragIdx === null || dragIdx === idx) return;
        handlers.onReorder(dragIdx, idx);
      });
    });
  }

  return { render, bind };
})();