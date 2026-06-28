/** Real product photos — Nomination / Silvermoon Italian charm links */
const CHARM_IMAGE_MAP = {
  "heart-silver": "assets/charms/heart-silver.jpg",
  "heart-pink": "assets/charms/heart-pink.jpg",
  "heart-magnetic": "assets/charms/heart-magnetic.jpg",
  "infinity": "assets/charms/infinity.jpg",
  "i-love-u": "assets/charms/i-love-u.jpg",
  "bow-pink": "assets/charms/bow-pink.jpg",
  "bow-blue": "assets/charms/bow-blue.jpg",
  "kitten": "assets/charms/kitten.jpg",
  "cat-black": "assets/charms/cat-black.jpg",
  "butterfly": "assets/charms/butterfly.jpg",
  "jellyfish": "assets/charms/jellyfish.jpg",
  "checkered-red": "assets/charms/checkered-red.jpg",
  "cherry": "assets/charms/cherry.jpg",
  "bmw": "assets/charms/bmw.jpg",
  "enamel-blue": "assets/charms/enamel-blue.jpg",
  "enamel-pink": "assets/charms/enamel-pink.jpg",
  "moon": "assets/charms/moon.jpg",
  "flower": "assets/charms/flower.jpg",
  "star": "assets/charms/star.jpg",
  "blank-silver": "assets/charms/blank-silver.jpg",
  "nameplate": "assets/charms/nameplate.jpg",
};

'abcdefghijklmnopqrstuvwxyz'.split('').forEach((l) => {
  CHARM_IMAGE_MAP[`letter-${l}`] = `assets/charms/letter-${l}.jpg`;
});

function getCharmImageUrl(charmId) {
  return CHARM_IMAGE_MAP[charmId] || CHARM_IMAGE_MAP['blank-silver'];
}