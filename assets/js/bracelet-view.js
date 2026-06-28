/**
 * Premium bracelet viewer — real product photos in a curved 3D arc
 */
const BraceletView = (function () {
  function linkHtml(charmId, index, selected) {
    const charm = CHARM_MAP[charmId] || CHARMS[0];
    const url = assetUrl(getCharmImageUrl(charmId));
    return `
      <div class="bv-link${selected ? ' is-selected' : ''}" data-index="${index}" data-id="${charmId}" role="listitem"
           aria-label="${charm.name}, link ${index + 1}" title="${charm.name}">
        <button type="button" class="bv-remove" aria-label="Remove ${charm.name}">×</button>
        <div class="bv-face">
          <img src="${url}" alt="${charm.name}" draggable="false" loading="eager">
        </div>
        <span class="bv-index">${index + 1}</span>
      </div>`;
  }

  function render(container, charmIds, selectedIndex) {
    const n = charmIds.length;
    const mid = (n - 1) / 2;

    const links = charmIds.map((id, i) => {
      const offset = i - mid;
      const rotateY = offset * 9;
      const translateZ = Math.max(0, 48 - Math.abs(offset) * 14);
      const translateY = Math.abs(offset) * 2;
      const sel = i === selectedIndex;
      return `<div class="bv-link-wrap" style="--ry:${rotateY}deg;--tz:${translateZ}px;--ty:${translateY}px">${linkHtml(id, i, sel)}</div>`;
    }).join('');

    container.innerHTML = `
      <div class="bv-stage">
        <div class="bv-clasp bv-clasp-l" aria-hidden="true"></div>
        <div class="bv-track" role="list" aria-label="Your bracelet">${links}</div>
        <div class="bv-clasp bv-clasp-r" aria-hidden="true"></div>
      </div>
      <p class="bv-drag-hint">Drag to reorder · Tap to select</p>`;
  }

  function bind(container, handlers) {
    const track = container.querySelector('.bv-track');
    if (!track) return;

    let dragIdx = null;

    track.querySelectorAll('.bv-link').forEach((el) => {
      const idx = Number(el.dataset.index);

      el.addEventListener('click', (e) => {
        if (e.target.closest('.bv-remove')) return;
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
        e.dataTransfer.effectAllowed = 'move';
      });
      el.addEventListener('dragend', () => {
        dragIdx = null;
        el.classList.remove('is-dragging');
        track.querySelectorAll('.drag-over').forEach((x) => x.classList.remove('drag-over'));
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