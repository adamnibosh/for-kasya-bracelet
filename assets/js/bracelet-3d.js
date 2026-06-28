/**
 * 3D Italian charm bracelet — curved silver links, live animation
 */
class Bracelet3D {
  constructor(container, options = {}) {
    if (typeof THREE === 'undefined') {
      console.error('Three.js failed to load');
      container.innerHTML = '<p class="bracelet-3d-error">3D preview unavailable — please refresh the page.</p>';
      return;
    }

    this.container = container;
    this.onSelect = options.onSelect || (() => {});
    this.autoRotate = options.autoRotate !== false;
    this.linkMeshes = [];
    this.selectedIndex = null;
    this.charmIds = [];
    this.textureCache = new Map();
    this.rotateY = 0;
    this.targetRotateY = 0;
    this.isDragging = false;
    this.lastPointerX = 0;
    this._ready = false;

    this._init();
    this._ready = true;
  }

  _init() {
    const w = Math.max(this.container.clientWidth, 320);
    const h = Math.max(this.container.clientHeight, 320);

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
    this.camera.position.set(0, 2.8, 7);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    if (THREE.SRGBColorSpace) this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.renderer.shadowMap.enabled = true;
    this.renderer.domElement.className = 'bracelet-3d-canvas';
    this.container.appendChild(this.renderer.domElement);

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.45));
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x8899aa, 0.5));

    const key = new THREE.DirectionalLight(0xffffff, 1.8);
    key.position.set(5, 12, 8);
    key.castShadow = true;
    this.scene.add(key);

    const fill = new THREE.DirectionalLight(0xd0e0f0, 0.7);
    fill.position.set(-6, 4, 6);
    this.scene.add(fill);

    const rim = new THREE.DirectionalLight(0xffffff, 0.6);
    rim.position.set(0, 2, -10);
    this.scene.add(rim);

    this.silverMat = new THREE.MeshStandardMaterial({
      color: 0xd0d8e0,
      metalness: 0.92,
      roughness: 0.28,
    });

    this.silverBezelMat = new THREE.MeshStandardMaterial({
      color: 0x98a4b0,
      metalness: 0.95,
      roughness: 0.22,
    });

    this.selectMat = new THREE.MeshBasicMaterial({
      color: 0x4a90d9,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });

    this.braceletGroup = new THREE.Group();
    this.scene.add(this.braceletGroup);

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.clock = new THREE.Clock();

    const el = this.renderer.domElement;
    el.addEventListener('pointerdown', (e) => this._onPointerDown(e));
    el.addEventListener('pointermove', (e) => this._onPointerMove(e));
    el.addEventListener('pointerup', () => { this.isDragging = false; });
    el.addEventListener('pointerleave', () => { this.isDragging = false; });
    el.addEventListener('click', (e) => this._onClick(e));

    this._resizeObserver = new ResizeObserver(() => this.resize());
    this._resizeObserver.observe(this.container);
    this._animate();
  }

  setBracelet(charmIds) {
    if (!this._ready) return;
    this.charmIds = [...charmIds];
    this._clearGroup(this.braceletGroup);
    this.linkMeshes = [];

    const n = charmIds.length;
    const arc = Math.min(Math.PI * 1.35, Math.max(0.9, n * 0.14));
    const radius = Math.max(2.8, (n * 0.42) / Math.max(arc, 0.5));
    const start = Math.PI * 0.5 - arc / 2;

    charmIds.forEach((id, i) => {
      const charm = CHARM_MAP[id] || CHARMS[0];
      const linkGroup = this._createLink(charm, i);
      const t = n === 1 ? 0.5 : i / (n - 1);
      const angle = start + t * arc;

      linkGroup.position.set(
        Math.cos(angle) * radius,
        Math.sin(t * Math.PI) * 0.15,
        Math.sin(angle) * radius * 0.55
      );
      linkGroup.rotation.y = -angle;
      linkGroup.rotation.x = 0.15;
      linkGroup.rotation.z = Math.sin(angle) * 0.04;

      this.braceletGroup.add(linkGroup);
      this.linkMeshes.push(linkGroup);
    });

    const claspL = this._createClasp();
    const claspR = this._createClasp(true);
    const aL = start - 0.05;
    const aR = start + arc + 0.05;
    claspL.position.set(Math.cos(aL) * radius, 0, Math.sin(aL) * radius * 0.55);
    claspL.rotation.y = -aL;
    claspR.position.set(Math.cos(aR) * radius, 0, Math.sin(aR) * radius * 0.55);
    claspR.rotation.y = -aR;
    this.braceletGroup.add(claspL, claspR);

    this.braceletGroup.scale.setScalar(1.15);
    this.setSelectedIndex(this.selectedIndex);
  }

  _clearGroup(group) {
    while (group.children.length) {
      group.remove(group.children[0]);
    }
  }

  _createLink(charm, index) {
    const group = new THREE.Group();
    group.userData = { index, charmId: charm.id, type: 'link' };

    const size = 0.72;
    const depth = 0.14;

    const bezel = new THREE.Mesh(
      new THREE.BoxGeometry(size + 0.08, size + 0.08, depth + 0.05),
      this.silverBezelMat
    );
    bezel.castShadow = true;
    group.add(bezel);

    const body = new THREE.Mesh(new THREE.BoxGeometry(size, size, depth), this.silverMat);
    body.castShadow = true;
    group.add(body);

    const tex = this._getTexture(charm);
    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(size * 0.84, size * 0.84),
      new THREE.MeshStandardMaterial({ map: tex, metalness: 0.3, roughness: 0.45 })
    );
    face.position.z = depth / 2 + 0.01;
    group.add(face);

    const loopGeo = new THREE.TorusGeometry(0.06, 0.018, 6, 12, Math.PI);
    const loopL = new THREE.Mesh(loopGeo, this.silverBezelMat);
    loopL.rotation.y = Math.PI / 2;
    loopL.position.set(-size / 2 - 0.03, 0, 0);
    const loopR = loopL.clone();
    loopR.position.x = size / 2 + 0.03;
    loopR.rotation.y = -Math.PI / 2;
    group.add(loopL, loopR);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(size * 0.55, 0.025, 8, 32),
      this.selectMat
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.z = depth / 2 + 0.1;
    ring.name = 'selectRing';
    ring.visible = false;
    group.add(ring);

    if (charm.dangling) group.add(this._createDangle(charm));

    return group;
  }

  _createDangle(charm) {
    const g = new THREE.Group();
    g.position.set(0, -0.4, 0.08);

    const chain = new THREE.Mesh(
      new THREE.CylinderGeometry(0.01, 0.01, 0.28, 6),
      this.silverBezelMat
    );
    chain.position.y = -0.18;
    g.add(chain);

    const colors = {
      kitten: 0xf0b0c8, butterfly: 0x5ba3e8, jellyfish: 0xf0a0c0,
      'bow-pink': 0xf070a0, 'bow-blue': 0x5090d8, 'heart-magnetic': 0xe890a8, moon: 0xb0bcc8,
    };
    const color = colors[charm.render] || 0xc0c8d0;

    const pendant = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 16, 16),
      new THREE.MeshStandardMaterial({ color, metalness: 0.7, roughness: 0.25 })
    );
    pendant.position.y = -0.36;
    g.add(pendant);
    return g;
  }

  _createClasp(isHook) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.36, 0.12), this.silverBezelMat);
    g.add(body);
    if (isHook) {
      const hook = new THREE.Mesh(
        new THREE.TorusGeometry(0.07, 0.02, 6, 14, Math.PI * 1.1),
        this.silverBezelMat
      );
      hook.rotation.z = Math.PI / 2;
      hook.position.set(0, 0.2, 0.03);
      g.add(hook);
    }
    return g;
  }

  _getTexture(charm) {
    if (this.textureCache.has(charm.id)) return this.textureCache.get(charm.id);

    const S = 256;
    const canvas = document.createElement('canvas');
    canvas.width = S;
    canvas.height = S;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, S, S);
    grad.addColorStop(0, '#f0f4f8');
    grad.addColorStop(1, '#c8d0d8');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, S, S);

    ctx.strokeStyle = '#8a939e';
    ctx.lineWidth = 3;
    ctx.strokeRect(8, 8, S - 16, S - 16);

    this._paintCharm(ctx, charm, S);

    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
    this.textureCache.set(charm.id, tex);
    return tex;
  }

  _paintCharm(ctx, charm, S) {
    const cx = S / 2;
    const cy = S / 2;
    const r = charm.render || '';

    if (r === 'letter' || charm.letter) {
      ctx.fillStyle = '#4a5560';
      ctx.font = `bold ${S * 0.48}px Georgia, serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(charm.letter || '?', cx, cy + 4);
      return;
    }

    if (r === 'heart-silver') {
      ctx.strokeStyle = '#5a6570';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(cx, cy + 50);
      ctx.bezierCurveTo(cx - 70, cy - 10, cx - 50, cy - 60, cx, cy - 20);
      ctx.bezierCurveTo(cx + 50, cy - 60, cx + 70, cy - 10, cx, cy + 50);
      ctx.stroke();
      return;
    }

    if (r === 'heart-pink' || r === 'heart-magnetic') {
      ctx.fillStyle = '#e8a0b8';
      ctx.beginPath();
      ctx.moveTo(cx, cy + 40);
      ctx.bezierCurveTo(cx - 55, cy, cx - 40, cy - 45, cx, cy - 15);
      ctx.bezierCurveTo(cx + 40, cy - 45, cx + 55, cy, cx, cy + 40);
      ctx.fill();
      return;
    }

    if (r === 'blank') {
      ctx.fillStyle = 'rgba(200,210,220,0.4)';
      ctx.fillRect(40, 40, S - 80, S - 80);
      return;
    }

    if (r === 'checkered-red') {
      const sz = 28;
      for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 6; col++) {
          ctx.fillStyle = (row + col) % 2 ? '#fff' : '#c62828';
          ctx.fillRect(40 + col * sz, 40 + row * sz, sz, sz);
        }
      }
      return;
    }

    if (r === 'cherry') {
      ctx.fillStyle = '#d32f2f';
      ctx.beginPath(); ctx.arc(cx - 30, cy + 20, 28, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + 30, cy + 10, 28, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#2e7d32'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(cx, cy - 50); ctx.quadraticCurveTo(cx - 20, cy, cx - 30, cy + 20); ctx.stroke();
      return;
    }

    if (r === 'bmw') {
      ctx.fillStyle = '#1565c0';
      ctx.beginPath(); ctx.arc(cx, cy, 70, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(cx, cy, 48, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1565c0';
      ctx.fillRect(cx - 48, cy - 6, 96, 12);
      ctx.beginPath(); ctx.arc(cx, cy, 48, Math.PI * 0.5, Math.PI * 1.5); ctx.fill();
      return;
    }

    if (r === 'enamel-blue') {
      ctx.fillStyle = '#42a5f5';
      ctx.fillRect(40, 40, S - 80, S - 80);
      return;
    }

    if (r === 'enamel-pink') {
      ctx.fillStyle = '#f48fb1';
      ctx.fillRect(40, 40, S - 80, S - 80);
      return;
    }

    if (r === 'cat-black') {
      ctx.fillStyle = '#1a1a22';
      ctx.beginPath();
      ctx.moveTo(cx - 40, cy - 30);
      ctx.lineTo(cx - 50, cy - 60);
      ctx.lineTo(cx - 15, cy - 35);
      ctx.moveTo(cx + 40, cy - 30);
      ctx.lineTo(cx + 50, cy - 60);
      ctx.lineTo(cx + 15, cy - 35);
      ctx.arc(cx, cy + 10, 45, 0, Math.PI, false);
      ctx.fill();
      return;
    }

    if (r === 'kitten') {
      ctx.fillStyle = '#f0c0d0';
      ctx.beginPath(); ctx.ellipse(cx, cy, 55, 40, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#333';
      ctx.beginPath(); ctx.arc(cx - 20, cy - 5, 6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + 20, cy - 5, 6, 0, Math.PI * 2); ctx.fill();
      return;
    }

    if (r === 'butterfly') {
      ctx.fillStyle = '#64b5f6';
      ctx.beginPath(); ctx.ellipse(cx - 35, cy, 40, 55, -0.3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx + 35, cy, 40, 55, 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#5a6570';
      ctx.fillRect(cx - 4, cy - 50, 8, 100);
      return;
    }

    if (r === 'infinity') {
      ctx.strokeStyle = '#5a6570';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(cx - 60, cy);
      ctx.bezierCurveTo(cx - 60, cy - 40, cx - 10, cy - 40, cx, cy);
      ctx.bezierCurveTo(cx + 10, cy + 40, cx + 60, cy + 40, cx + 60, cy);
      ctx.bezierCurveTo(cx + 60, cy - 40, cx + 10, cy - 40, cx, cy);
      ctx.bezierCurveTo(cx - 10, cy + 40, cx - 60, cy + 40, cx - 60, cy);
      ctx.stroke();
      return;
    }

    if (r === 'flower') {
      const petals = 5;
      for (let i = 0; i < petals; i++) {
        const a = (i / petals) * Math.PI * 2;
        ctx.fillStyle = '#f48fb1';
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * 35, cy + Math.sin(a) * 35, 22, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#f8bbd0';
      ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI * 2); ctx.fill();
      return;
    }

    if (r === 'star') {
      ctx.strokeStyle = '#5a6570';
      ctx.lineWidth = 4;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
        const x = cx + Math.cos(a) * 60;
        const y = cy + Math.sin(a) * 60;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        const a2 = a + Math.PI / 5;
        ctx.lineTo(cx + Math.cos(a2) * 25, cy + Math.sin(a2) * 25);
      }
      ctx.closePath();
      ctx.stroke();
      return;
    }

    if (r === 'moon') {
      ctx.fillStyle = '#b0bcc8';
      ctx.beginPath();
      ctx.arc(cx + 10, cy, 55, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e8ecf0';
      ctx.beginPath();
      ctx.arc(cx - 15, cy, 45, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    if (r === 'nameplate') {
      ctx.fillStyle = '#d8e0e8';
      ctx.fillRect(50, 100, S - 100, 56);
      ctx.strokeStyle = '#6a7580';
      ctx.lineWidth = 2;
      ctx.strokeRect(50, 100, S - 100, 56);
      ctx.fillStyle = '#333';
      ctx.font = `italic ${S * 0.14}px Georgia, serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Kasya', cx, 128);
      return;
    }

    if (r === 'i-love-u') {
      ctx.fillStyle = '#4a5560';
      ctx.font = `bold ${S * 0.18}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText('I', cx, cy - 40);
      ctx.fillStyle = '#e53935';
      ctx.beginPath();
      ctx.moveTo(cx, cy + 20);
      ctx.bezierCurveTo(cx - 30, cy - 20, cx - 30, cy - 50, cx, cy - 30);
      ctx.bezierCurveTo(cx + 30, cy - 50, cx + 30, cy - 20, cx, cy + 20);
      ctx.fill();
      ctx.fillStyle = '#4a5560';
      ctx.fillText('U', cx, cy + 55);
      return;
    }

    // bow, jellyfish, default
    if (r.includes('bow')) {
      ctx.fillStyle = r.includes('blue') ? '#64b5f6' : '#f48fb1';
      ctx.beginPath();
      ctx.moveTo(cx - 55, cy - 10);
      ctx.lineTo(cx, cy - 40);
      ctx.lineTo(cx + 55, cy - 10);
      ctx.lineTo(cx, cy + 10);
      ctx.closePath();
      ctx.fill();
      return;
    }

    if (r === 'jellyfish') {
      ctx.fillStyle = '#f8bbd0';
      ctx.beginPath();
      ctx.arc(cx, cy - 20, 45, Math.PI, 0);
      ctx.fill();
      ctx.strokeStyle = '#f48fb1';
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(cx + i * 18, cy + 10);
        ctx.lineTo(cx + i * 18 + 5, cy + 55);
        ctx.stroke();
      }
      return;
    }

    ctx.fillStyle = '#8a939e';
    ctx.font = `${S * 0.2}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✦', cx, cy);
  }

  setSelectedIndex(index) {
    this.selectedIndex = index;
    this.linkMeshes.forEach((mesh, i) => {
      const ring = mesh.getObjectByName('selectRing');
      const sel = i === index;
      if (ring) ring.visible = sel;
      mesh.scale.setScalar(sel ? 1.12 : 1);
    });
  }

  _onPointerDown(e) {
    this.isDragging = true;
    this.lastPointerX = e.clientX;
  }

  _onPointerMove(e) {
    if (!this.isDragging) return;
    this.targetRotateY += (e.clientX - this.lastPointerX) * 0.01;
    this.lastPointerX = e.clientX;
  }

  _onClick(e) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.linkMeshes, true);
    if (!hits.length) return;
    let obj = hits[0].object;
    while (obj.parent && obj.userData.type !== 'link') obj = obj.parent;
    if (obj.userData.type === 'link') {
      const idx = obj.userData.index;
      const next = this.selectedIndex === idx ? null : idx;
      this.setSelectedIndex(next);
      this.onSelect(next);
    }
  }

  resize() {
    if (!this.renderer) return;
    const w = Math.max(this.container.clientWidth, 1);
    const h = Math.max(this.container.clientHeight, 1);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  _animate() {
    requestAnimationFrame(() => this._animate());
    if (!this.renderer) return;
    const dt = this.clock.getDelta();
    if (this.autoRotate && !this.isDragging) this.targetRotateY += dt * 0.45;
    this.rotateY += (this.targetRotateY - this.rotateY) * 0.07;
    if (this.braceletGroup) {
      this.braceletGroup.rotation.y = this.rotateY;
      this.braceletGroup.position.y = Math.sin(performance.now() * 0.001) * 0.06;
    }
    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    this._resizeObserver?.disconnect();
    this.renderer?.dispose();
    this.container.innerHTML = '';
  }
}

window.Bracelet3D = Bracelet3D;