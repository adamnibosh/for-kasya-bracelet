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
    this.textureLoader = new THREE.TextureLoader();
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
    this.camera.position.set(0, 3.2, 8.5);
    this.camera.lookAt(0, 0.2, 0);

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
    this.textureCache.forEach((tex) => tex.dispose());
    this.textureCache.clear();
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

    this.braceletGroup.scale.setScalar(1.28);
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

    const url = assetUrl(getCharmImageUrl(charm.id));
    const tex = this.textureLoader.load(url);
    tex.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
    this.textureCache.set(charm.id, tex);
    return tex;
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
      const t = performance.now() * 0.001;
      this.linkMeshes.forEach((mesh, i) => {
        const dangle = mesh.children.find((c) => c.position.y < -0.3);
        if (dangle) dangle.rotation.z = Math.sin(t * 2 + i) * 0.12;
      });
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