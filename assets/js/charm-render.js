/** SVG renderer — Nomination-style 9mm silver Italian charm links */
const CharmRender = (function () {
  const SILVER = {
    light: '#f4f6f8',
    mid: '#c5cdd6',
    dark: '#8a939e',
    edge: '#6b7580',
    shine: '#ffffff',
  };

  function frame() {
    return `
      <defs>
        <linearGradient id="sf" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${SILVER.shine}" stop-opacity="0.9"/>
          <stop offset="35%" stop-color="${SILVER.mid}"/>
          <stop offset="100%" stop-color="${SILVER.dark}"/>
        </linearGradient>
        <linearGradient id="sbevel" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#fff" stop-opacity="0.55"/>
          <stop offset="100%" stop-color="#000" stop-opacity="0.18"/>
        </linearGradient>
      </defs>
      <rect x="1.5" y="1.5" width="33" height="33" rx="2.5" fill="url(#sf)" stroke="${SILVER.edge}" stroke-width="1.2"/>
      <rect x="3" y="3" width="30" height="30" rx="2" fill="none" stroke="url(#sbevel)" stroke-width="0.8" opacity="0.7"/>
    `;
  }

  function svg(content, dangling) {
    const dang = dangling
      ? `<g transform="translate(18,34)"><line x1="0" y1="0" x2="0" y2="5" stroke="${SILVER.dark}" stroke-width="1"/><circle cx="0" cy="7" r="2.2" fill="${SILVER.mid}" stroke="${SILVER.edge}" stroke-width="0.6"/></g>`
      : '';
    return `<svg viewBox="0 0 36 ${dangling ? 42 : 36}" xmlns="http://www.w3.org/2000/svg" class="charm-svg" aria-hidden="true">${frame()}${content}${dang}</svg>`;
  }

  const renders = {
    letter(charm) {
      const l = charm.letter || charm.glyph || '?';
      return svg(`<text x="18" y="23" text-anchor="middle" font-family="Georgia,serif" font-size="17" font-weight="700" fill="${SILVER.edge}" stroke="#fff" stroke-width="0.4">${l}</text>`);
    },

    'heart-silver'() {
      return svg(`<path d="M18 28 C10 20 7 16 7 12.5 C7 9.5 9.2 7.5 12 7.5 C14 7.5 16 8.8 18 11 C20 8.8 22 7.5 24 7.5 C26.8 7.5 29 9.5 29 12.5 C29 16 26 20 18 28Z" fill="none" stroke="${SILVER.edge}" stroke-width="1.8"/>`);
    },

    'heart-pink'() {
      return svg(`<rect x="5" y="5" width="26" height="26" rx="1.5" fill="#f8e8ee"/><path d="M18 26 C12 20 9.5 17 9.5 13.5 C9.5 11 11.2 9 13.5 9 C15.2 9 16.8 10 18 11.8 C19.2 10 20.8 9 22.5 9 C24.8 9 26.5 11 26.5 13.5 C26.5 17 24 20 18 26Z" fill="#e8a0b8" stroke="#c77d96" stroke-width="0.8"/>`);
    },

    'heart-magnetic'() {
      return svg(`<path d="M18 24 C13 19 11 16 11 13 C11 10.5 12.8 9 15 9 C16.5 9 17.8 9.8 18 11 C18.2 9.8 19.5 9 21 9 C23.2 9 25 10.5 25 13 C25 16 23 19 18 24Z" fill="#e8a0b8" stroke="${SILVER.edge}" stroke-width="0.8"/>`, true);
    },

    kitten() {
      return svg(`<ellipse cx="18" cy="20" rx="9" ry="7" fill="#f0d0dc" stroke="${SILVER.edge}" stroke-width="0.8"/><path d="M12 14 L10 9 L15 13 M24 14 L26 9 L21 13" fill="#f0d0dc" stroke="${SILVER.edge}" stroke-width="0.7"/><circle cx="15" cy="19" r="1.2" fill="#333"/><circle cx="21" cy="19" r="1.2" fill="#333"/><path d="M16 22 Q18 24 20 22" fill="none" stroke="#c77d96" stroke-width="0.7"/>`, true);
    },

    'cat-black'() {
      return svg(`<rect x="5" y="5" width="26" height="26" rx="1.5" fill="#eceff2"/><path d="M12 12 L10 8 L14 11 M24 12 L26 8 L22 11 M11 18 Q18 26 25 18 Q18 22 11 18Z" fill="#1a1a22"/><circle cx="15" cy="17" r="1" fill="#fff"/><circle cx="21" cy="17" r="1" fill="#fff"/>`);
    },

    'checkered-red'() {
      const cells = [];
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          const fill = (r + c) % 2 ? '#fff' : '#c62828';
          cells.push(`<rect x="${5 + c * 6.5}" y="${5 + r * 6.5}" width="6.5" height="6.5" fill="${fill}"/>`);
        }
      }
      return svg(cells.join(''));
    },

    cherry() {
      return svg(`<path d="M18 8 C16 12 14 14 12 16 C10 18 10 20 12 21 C14 22 16 20 17 17" fill="none" stroke="#2e7d32" stroke-width="1"/><circle cx="11" cy="22" r="4" fill="#d32f2f" stroke="#9a0007" stroke-width="0.6"/><circle cx="22" cy="20" r="4" fill="#e53935" stroke="#9a0007" stroke-width="0.6"/><path d="M18 8 L22 6" fill="none" stroke="#2e7d32" stroke-width="0.8"/>`);
    },

    'bow-pink'() {
      return svg(`<path d="M18 14 L10 10 L12 18 L18 16 L24 18 L26 10 Z" fill="#f48fb1" stroke="#c2185b" stroke-width="0.7"/><circle cx="18" cy="16" r="2" fill="#ec407a"/>`, true);
    },

    'bow-blue'() {
      return svg(`<path d="M18 14 L10 10 L12 18 L18 16 L24 18 L26 10 Z" fill="#64b5f6" stroke="#1565c0" stroke-width="0.7"/><circle cx="18" cy="16" r="2" fill="#1976d2"/>`, true);
    },

    bmw() {
      return svg(`<circle cx="18" cy="18" r="11" fill="#1565c0" stroke="${SILVER.edge}" stroke-width="1"/><circle cx="18" cy="18" r="8" fill="#fff"/><path d="M18 10 A8 8 0 0 0 18 26 A8 8 0 0 0 18 10 M10 18 H26" fill="#1565c0"/><path d="M18 10 A8 8 0 0 1 18 26" fill="#fff"/>`);
    },

    butterfly() {
      return svg(`<ellipse cx="13" cy="18" rx="6" ry="8" fill="#64b5f6" opacity="0.85" stroke="#1565c0" stroke-width="0.6"/><ellipse cx="23" cy="18" rx="6" ry="8" fill="#90caf9" opacity="0.85" stroke="#1565c0" stroke-width="0.6"/><ellipse cx="18" cy="18" rx="1.5" ry="7" fill="${SILVER.dark}"/>`, true);
    },

    jellyfish() {
      return svg(`<path d="M10 14 Q18 8 26 14 Q24 18 18 19 Q12 18 10 14Z" fill="#f8bbd0" stroke="#c2185b" stroke-width="0.6"/><path d="M14 19 L13 26 M18 19 L18 27 M22 19 L23 26" fill="none" stroke="#f48fb1" stroke-width="0.8"/>`, true);
    },

    'enamel-blue'() {
      return svg(`<rect x="5" y="5" width="26" height="26" rx="1.5" fill="#42a5f5" stroke="${SILVER.edge}" stroke-width="0.8"/><rect x="7" y="7" width="22" height="22" rx="1" fill="#64b5f6" opacity="0.5"/>`);
    },

    'enamel-pink'() {
      return svg(`<rect x="5" y="5" width="26" height="26" rx="1.5" fill="#f48fb1" stroke="${SILVER.edge}" stroke-width="0.8"/>`);
    },

    moon() {
      return svg(`<path d="M22 10 A9 9 0 1 1 14 28 A7 7 0 0 0 22 10Z" fill="${SILVER.mid}" stroke="${SILVER.edge}" stroke-width="0.8"/><circle cx="24" cy="12" r="1" fill="${SILVER.edge}"/><circle cx="26" cy="16" r="0.7" fill="${SILVER.edge}"/><circle cx="25" cy="20" r="0.5" fill="${SILVER.edge}"/>`, true);
    },

    infinity() {
      return svg(`<path d="M11 18 C11 14 14 12 18 12 C20 12 21 13 22 14 C23 13 24 12 26 12 C30 12 33 14 33 18 C33 22 30 24 26 24 C24 24 23 23 22 22 C21 23 20 24 18 24 C14 24 11 22 11 18Z" fill="none" stroke="${SILVER.edge}" stroke-width="1.6"/>`);
    },

    'i-love-u'() {
      return svg(`<text x="18" y="14" text-anchor="middle" font-family="Arial,sans-serif" font-size="6" font-weight="700" fill="${SILVER.edge}">I</text><path d="M18 16 C16 14 14 14 14 16 C14 18 18 21 18 21 C18 21 22 18 22 16 C22 14 20 14 18 16Z" fill="#e53935" transform="translate(0,-1) scale(0.7) translate(5,4)"/><text x="18" y="26" text-anchor="middle" font-family="Arial,sans-serif" font-size="6" font-weight="700" fill="${SILVER.edge}">U</text>`);
    },

    flower() {
      return svg(`<circle cx="18" cy="18" r="3" fill="#f8bbd0"/><circle cx="18" cy="12" r="3" fill="#f48fb1"/><circle cx="18" cy="24" r="3" fill="#f48fb1"/><circle cx="12" cy="18" r="3" fill="#f48fb1"/><circle cx="24" cy="18" r="3" fill="#f48fb1"/><rect x="17" y="24" width="2" height="6" fill="#66bb6a"/>`);
    },

    star() {
      return svg(`<polygon points="18,8 20.5,15 28,15 22,19.5 24.5,27 18,22.5 11.5,27 14,19.5 8,15 15.5,15" fill="none" stroke="${SILVER.edge}" stroke-width="1.4" stroke-linejoin="round"/>`);
    },

    blank() {
      return svg(`<rect x="6" y="6" width="24" height="24" rx="1" fill="${SILVER.light}" stroke="${SILVER.mid}" stroke-width="0.5" opacity="0.6"/>`);
    },

    nameplate() {
      return svg(`<rect x="4" y="10" width="28" height="16" rx="2" fill="${SILVER.light}" stroke="${SILVER.edge}" stroke-width="1"/><text x="18" y="21" text-anchor="middle" font-family="cursive" font-size="7" fill="#333">Lala</text>`);
    },
  };

  function render(charm) {
    const type = charm.render || 'blank';
    const fn = renders[type];
    if (fn) return fn(charm);
    if (charm.letter || charm.glyph?.length === 1) return renders.letter(charm);
    return renders.blank(charm);
  }

  function mount(charm, el) {
    el.innerHTML = render(charm);
    if (charm.dangling) el.classList.add('has-dangle');
    else el.classList.remove('has-dangle');
  }

  return { render, mount, renders };
})();