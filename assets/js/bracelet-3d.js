/**
 * 3D Italian charm bracelet — curved silver links, PBR metal, live animation
 */
class Bracelet3D {
  constructor(container, options = {}) {
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
    this._building = false;

    this._init();
  }

  _init() {
    const w = Math.max(this.container.clientWidth, 300);
    const h = Math.max(this.container.clientHeight, 300);

    this.scene = new THREE.Scene();
    this.scene.background = null;

    this.camera = new THREE.PerspectiveCamera(36, w / h, 0.1, 80);
    this.camera.position.set(0, 1.6, 8.5);
    this.camera.lookAt(0, 0.1, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.className = 'bracelet-3d-canvas';
    this.container.appendChild(this.renderer.domElement);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x9aa8b8, 0.55);
    this.scene.add(hemi);

    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(6, 10, 8);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    this.scene.add(key);

    const fill = new THREE.DirectionalLight(0xb8c8d8, 0.55);
    fill.position.set(-8, 4, 5);
    this.scene.add(fill);

    const rim = new THREE.DirectionalLight(0xffffff, 0.9);
    rim.position.set(0, 6, -10);
    this.scene.add(rim);

    const spot = new THREE.SpotLight(0xffffff, 0.4);
    spot.position.set(0, 12, 2);
    this.scene.add(spot);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 40),
      new THREE.MeshStandardMaterial({ color: 0xe4e8ec, metalness: 0.55, roughness: 0.75 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    this.braceletGroup = new THREE.Group();
    this.scene.add(this.braceletGroup);

    this.silverMat = new THREE.MeshPhysicalMaterial({
      color: 0xdce2e8,
      metalness: 1,
      roughness: 0.18,
      reflectivity: 1,
      clearcoat: 0.35,
      clearcoatRoughness: 0.15,
    });

    this.silverBezelMat = new THREE.MeshPhysicalMaterial({
      color: 0xa8b2bc,
      metalness: 1,
      roughness: 0.12,
      reflectivity: 1,
    });

    this.selectMat = new THREE.MeshBasicMaterial({
      color: 0x5b9bd5,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    });

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

  async setBracelet(charmIds) {
    if (this._building) return;
    this._building = true;
    this.charmIds = [...charmIds];

    this._clearGroup(this.braceletGroup);
    this.linkMeshes = [];

    const n = charmIds.length;
    const linkW = 0.9;
    const arc = Math.min(Math.PI * 1.5, Math.max(0.8, n * 0.17));
    const radius = Math.max(3.8, (n * linkW * 0.5) / Math.sin(arc / 2));
    const start = -arc / 2 + Math.PI / 2;

    const links = await Promise.all(
      charmIds.map((id, i) => this._createLink(CHARM_MAP[id] || CHARMS[0], i))
    );

    links.forEach((linkGroup, i) => {
      const t = n === 1 ? 0.5 : i / (n - 1);
      const angle = start + t * arc;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius * 0.35 - 1.2;
      const y = -Math.sin(angle) * 0.15 + Math.sin(t * Math.PI) * 0.12;

      linkGroup.position.set(x, y, z);
      linkGroup.rotation.y = -angle + Math.PI / 2;
      linkGroup.rotation.z = Math.sin(angle) * 0.06;
      linkGroup.rotation.x = 0.08;

      this.braceletGroup.add(linkGroup);
      this.linkMeshes.push(linkGroup);
    });

    const claspL = this._createClasp();
    const claspR = this._createClasp(true);
    const aL = start - 0.06;
    const aR = start + arc + 0.06;
    claspL.position.set(Math.cos(aL) * radius, 0, Math.sin(aL) * radius * 0.35 - 1.2);
    claspL.rotation.y = -aL + Math.PI / 2;
    claspR.position.set(Math.cos(aR) * radius, 0, Math.sin(aR) * radius * 0.35 - 1.2);
    claspR.rotation.y = -aR + Math.PI / 2;
    this.braceletGroup.add(claspL, claspR);

    this.braceletGroup.position.y = 0.2;
    this.setSelectedIndex(this.selectedIndex);
    this._building = false;
  }

  _clearGroup(group) {
    while (group.children.length) {
      const child = group.children[0];
      group.remove(child);
      child.traverse((obj) => {
        if (obj.geometry && !obj.geometry._shared) obj.geometry.dispose();
        if (obj.material && obj.material !== this.silverMat && obj.material !== this.silverBezelMat && obj.material !== this.selectMat) {
          if (obj.material.map && !this.textureCache.has(obj.material.map._charmId)) {
            obj.material.map.dispose();
          }
          obj.material.dispose();
        }
      });
    }
  }

  async _createLink(charm, index) {
    const group = new THREE.Group();
    group.userData = { index, charmId: charm.id, type: 'link' };

    const size = 0.84;
    const depth = 0.16;

    const bezel = new THREE.Mesh(
      new THREE.BoxGeometry(size + 0.1, size + 0.1, depth + 0.06),
      this.silverBezelMat
    );
    bezel.castShadow = true;
    group.add(bezel);

    const body = new THREE.Mesh(new THREE.BoxGeometry(size, size, depth), this.silverMat);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    const tex = await this._getTexture(charm);
    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(size * 0.86, size * 0.86),
      new THREE.MeshPhysicalMaterial({
        map: tex,
        metalness: 0.25,
        roughness: 0.38,
        clearcoat: 0.2,
      })
    );
    face.position.z = depth / 2 + 0.008;
    face.castShadow = true;
    group.add(face);

    const loopShape = new THREE.TorusGeometry(0.075, 0.022, 8, 14, Math.PI * 1.1);
    const loopL = new THREE.Mesh(loopShape, this.silverBezelMat);
    loopL.rotation.y = Math.PI / 2;
    loopL.position.set(-size / 2 - 0.04, 0, 0);
    const loopR = loopL.clone();
    loopR.position.x = size / 2 + 0.04;
    loopR.rotation.y = -Math.PI / 2;
    group.add(loopL, loopR);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(size * 0.58, 0.028, 10, 40),
      this.selectMat
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.z = depth / 2 + 0.12;
    ring.name = 'selectRing';
    ring.visible = false;
    group.add(ring);

    if (charm.dangling) {
      group.add(this._createDangle(charm));
    }

    return group;
  }

  _createDangle(charm) {
    const g = new THREE.Group();
    g.position.set(0, -0.48, 0.1);

    const link1 = new THREE.Mesh(
      new THREE.TorusGeometry(0.05, 0.012, 6, 10, Math.PI),
      this.silverBezelMat
    );
    link1.rotation.x = Math.PI / 2;
    g.add(link1);

    const chain = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.32, 8),
      this.silverBezelMat
    );
    chain.position.y = -0.2;
    g.add(chain);

    const colors = {
      kitten: 0xf0c0d0, butterfly: 0x64b5f6, jellyfish: 0xf8bbd0,
      'bow-pink': 0xf48fb1, 'bow-blue': 0x64b5f6, 'heart-magnetic': 0xe8a0b8, moon: 0xc5cdd6,
    };
    const color = colors[charm.render] || colors[charm.id] || 0xd0d8e0;

    const pendant = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 20, 20),
      new THREE.MeshPhysicalMaterial({ color, metalness: 0.85, roughness: 0.2, clearcoat: 0.5 })
    );
    pendant.position.y = -0.42;
    pendant.castShadow = true;
    g.add(pendant);

    return g;
  }

  _createClasp(isHook) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.42, 0.14),
      this.silverBezelMat
    );
    body.castShadow = true;
    g.add(body);
    if (isHook) {
      const hook = new THREE.Mesh(
        new THREE.TorusGeometry(0.08, 0.025, 8, 16, Math.PI * 1.2),
        this.silverBezelMat
      );
      hook.rotation.z = Math.PI / 2;
      hook.position.set(0, 0.22, 0.04);
      g.add(hook);
    }
    return g;
  }

  async _getTexture(charm) {
    if (this.textureCache.has(charm.id)) return this.textureCache.get(charm.id);

    const svg = CharmRender.render(charm);
    const texture = await new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      img.onload = () => {
        const grad = ctx.createLinearGradient(0, 0, 512, 512);
        grad.addColorStop(0, '#eef2f6');
        grad.addColorStop(1, '#d4dae2');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 512, 512);
        ctx.drawImage(img, 0, 0, 512, 512);
        URL.revokeObjectURL(url);
        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
        tex._charmId = charm.id;
        resolve(tex);
      };
      img.src = url;
    });

    this.textureCache.set(charm.id, texture);
    return texture;
  }

  setSelectedIndex(index) {
    this.selectedIndex = index;
    this.linkMeshes.forEach((mesh, i) => {
      const ring = mesh.getObjectByName('selectRing');
      const selected = i === index;
      if (ring) ring.visible = selected;
      mesh.scale.setScalar(selected ? 1.1 : 1);
    });
  }

  _onPointerDown(e) {
    this.isDragging = true;
    this.lastPointerX = e.clientX;
  }

  _onPointerMove(e) {
    if (!this.isDragging) return;
    const dx = e.clientX - this.lastPointerX;
    this.lastPointerX = e.clientX;
    this.targetRotateY += dx * 0.008;
  }

  _onClick(e) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.linkMeshes, true);

    if (hits.length) {
      let obj = hits[0].object;
      while (obj.parent && obj.userData.type !== 'link') obj = obj.parent;
      if (obj.userData.type === 'link') {
        const idx = obj.userData.index;
        const newIdx = this.selectedIndex === idx ? null : idx;
        this.setSelectedIndex(newIdx);
        this.onSelect(newIdx);
      }
    }
  }

  resize() {
    const w = Math.max(this.container.clientWidth, 1);
    const h = Math.max(this.container.clientHeight, 1);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  _animate() {
    requestAnimationFrame(() => this._animate());
    const dt = this.clock.getDelta();

    if (this.autoRotate && !this.isDragging) {
      this.targetRotateY += dt * 0.4;
    }
    this.rotateY += (this.targetRotateY - this.rotateY) * 0.06;
    this.braceletGroup.rotation.y = this.rotateY;
    this.braceletGroup.position.y = 0.2 + Math.sin(performance.now() * 0.0012) * 0.05;

    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    this._resizeObserver?.disconnect();
    this.renderer.dispose();
    this.container.innerHTML = '';
  }
}

window.Bracelet3D = Bracelet3D;