/** HD transparent charms from bracelet.zip example */
const IMAGE_VERSION = 'v6-3d-circle';

const CHARM_IMAGE_MAP = {
  "blank-silver": "assets/charms-hd/blank-silver.png",
  "bmw": "assets/charms-hd/bmw.png",
  "bow-blue": "assets/charms-hd/bow-blue.png",
  "bow-pink": "assets/charms-hd/bow-pink.png",
  "butterfly": "assets/charms-hd/butterfly.png",
  "cat-black": "assets/charms-hd/cat-black.png",
  "checkered-red": "assets/charms-hd/checkered-red.png",
  "cherry": "assets/charms-hd/cherry.png",
  "enamel-blue": "assets/charms-hd/enamel-blue.png",
  "enamel-pink": "assets/charms-hd/enamel-pink.png",
  "flower": "assets/charms-hd/flower.png",
  "heart-magnetic": "assets/charms-hd/heart-magnetic.png",
  "heart-pink": "assets/charms-hd/heart-pink.png",
  "heart-silver": "assets/charms-hd/heart-silver.png",
  "i-love-u": "assets/charms-hd/i-love-u.png",
  "infinity": "assets/charms-hd/infinity.png",
  "jellyfish": "assets/charms-hd/jellyfish.png",
  "kitten": "assets/charms-hd/kitten.png",
  "letter-a": "assets/charms-hd/letter-a.png",
  "letter-b": "assets/charms-hd/letter-b.png",
  "letter-c": "assets/charms-hd/letter-c.png",
  "letter-d": "assets/charms-hd/letter-d.png",
  "letter-e": "assets/charms-hd/letter-e.png",
  "letter-f": "assets/charms-hd/letter-f.png",
  "letter-g": "assets/charms-hd/letter-g.png",
  "letter-h": "assets/charms-hd/letter-h.png",
  "letter-i": "assets/charms-hd/letter-i.png",
  "letter-j": "assets/charms-hd/letter-j.png",
  "letter-k": "assets/charms-hd/letter-k.png",
  "letter-l": "assets/charms-hd/letter-l.png",
  "letter-m": "assets/charms-hd/letter-m.png",
  "letter-n": "assets/charms-hd/letter-n.png",
  "letter-o": "assets/charms-hd/letter-o.png",
  "letter-p": "assets/charms-hd/letter-p.png",
  "letter-q": "assets/charms-hd/letter-q.png",
  "letter-r": "assets/charms-hd/letter-r.png",
  "letter-s": "assets/charms-hd/letter-s.png",
  "letter-t": "assets/charms-hd/letter-t.png",
  "letter-u": "assets/charms-hd/letter-u.png",
  "letter-v": "assets/charms-hd/letter-v.png",
  "letter-w": "assets/charms-hd/letter-w.png",
  "letter-x": "assets/charms-hd/letter-x.png",
  "letter-y": "assets/charms-hd/letter-y.png",
  "letter-z": "assets/charms-hd/letter-z.png",
  "moon": "assets/charms-hd/moon.png",
  "nameplate": "assets/charms-hd/nameplate.png",
  "star": "assets/charms-hd/star.png",
};

function getCharmImageUrl(charmId) {
  return CHARM_IMAGE_MAP[charmId] || CHARM_IMAGE_MAP['blank-silver'];
}

/** Resolve path for GitHub Pages subfolder or local dev */
function assetUrl(path) {
  if (typeof document === 'undefined') return path;
  const base = document.querySelector('meta[name="base-path"]')?.content || '';
  if (!path || path.startsWith('http') || path.startsWith('data:')) return path;
  const clean = path.replace(/^\//, '');
  const withBase = (!base || location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? clean
    : `${base.replace(/\/$/, '')}/${clean}`;
  const sep = withBase.includes('?') ? '&' : '?';
  return `${withBase}${sep}v=${IMAGE_VERSION}`;
}
