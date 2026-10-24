// Einheitliche Eingabe: Tastatur, Touch (virtueller Stick + Buttons + Kamera-Wischen) und Gamepad.
// Alle Abfragen laufen über input.move (x,y in -1..1), input.cam (x,y), input.pressed('jump'|'act'|'sniff'|'spin'|'bark'|'pause')
// sowie input.held(name). Für den Runner-Modus liefert input.swipe() einmalige Richtungen.

export class Input {
  constructor() {
    this.move = { x: 0, y: 0 };
    this.cam = { x: 0, y: 0 };
    this.keys = new Set();
    this._held = { jump: false, act: false, sniff: false, spin: false, bark: false, pause: false, left: false, right: false, up: false, down: false };
    this._prev = { ...this._held };
    this._pressedThisFrame = {};
    this._swipe = null;
    this.gamepadIndex = null;
    this.touch = false;
    this._setupKeyboard();
    this._setupTouch();
    this._setupGamepad();
  }

  _setupKeyboard() {
    const map = {
      Space: 'jump', ShiftLeft: 'act', ShiftRight: 'act', KeyE: 'act', KeyF: 'sniff', KeyC: 'spin', KeyX: 'spin', KeyV: 'bark', KeyB: 'bark', Escape: 'pause', Enter: 'jump',
      ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down'
    };
    window.addEventListener('keydown', e => {
      if (e.repeat) return;
      this.keys.add(e.code);
      if (map[e.code]) this._held[map[e.code]] = true;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    });
    window.addEventListener('keyup', e => {
      this.keys.delete(e.code);
      if (map[e.code]) this._held[map[e.code]] = false;
    });
    window.addEventListener('blur', () => { this.keys.clear(); for (const k in this._held) this._held[k] = false; });
  }

  _setupTouch() {
    const stick = document.getElementById('stick');
    const knob = document.getElementById('knob');
    const camZone = document.getElementById('camZone');
    const enableTouch = () => { if (!this.touch) { this.touch = true; document.body.classList.add('touch'); } };
    window.addEventListener('touchstart', enableTouch, { passive: true, once: true });
    if (window.matchMedia('(pointer: coarse)').matches) enableTouch();

    // Virtueller Stick
    let stickId = null, cx = 0, cy = 0;
    const R = 50;
    stick.addEventListener('pointerdown', e => {
      stickId = e.pointerId; stick.setPointerCapture(e.pointerId);
      const r = stick.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2;
      moveStick(e);
    });
    const moveStick = e => {
      if (e.pointerId !== stickId) return;
      let dx = e.clientX - cx, dy = e.clientY - cy;
      const len = Math.hypot(dx, dy);
      if (len > R) { dx = dx / len * R; dy = dy / len * R; }
      knob.style.transform = `translate(${dx}px,${dy}px)`;
      this.move.x = dx / R; this.move.y = -dy / R;
    };
    stick.addEventListener('pointermove', moveStick);
    const endStick = e => {
      if (e.pointerId !== stickId) return;
      stickId = null; knob.style.transform = ''; this.move.x = 0; this.move.y = 0;
    };
    stick.addEventListener('pointerup', endStick);
    stick.addEventListener('pointercancel', endStick);

    // Kamera-Wischen + Swipe-Erkennung (Runner)
    let camId = null, lx = 0, ly = 0, sx = 0, sy = 0, swiped = false;
    camZone.addEventListener('pointerdown', e => { camId = e.pointerId; camZone.setPointerCapture(e.pointerId); lx = sx = e.clientX; ly = sy = e.clientY; swiped = false; });
    camZone.addEventListener('pointermove', e => {
      if (e.pointerId !== camId) return;
      this.cam.x += (e.clientX - lx) * 0.006; this.cam.y += (e.clientY - ly) * 0.006; lx = e.clientX; ly = e.clientY;
      if (!swiped) {
        const dx = e.clientX - sx, dy = e.clientY - sy;
        if (Math.abs(dx) > 40 || Math.abs(dy) > 40) {
          swiped = true;
          this._swipe = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy < 0 ? 'up' : 'down');
        }
      }
    });
    const endCam = e => { if (e.pointerId === camId) camId = null; };
    camZone.addEventListener('pointerup', endCam); camZone.addEventListener('pointercancel', endCam);
    // Swipe auch auf dem Stick-freien Bereich links (Runner: ganzer Screen)
    window.addEventListener('pointerdown', e => { if (e.target === document.body || e.target.id === 'game') { camId = e.pointerId; lx = sx = e.clientX; ly = sy = e.clientY; swiped = false; } });
    window.addEventListener('pointermove', e => {
      if (e.pointerId !== camId || e.target.id !== 'game') return;
      if (!swiped) {
        const dx = e.clientX - sx, dy = e.clientY - sy;
        if (Math.abs(dx) > 40 || Math.abs(dy) > 40) {
          swiped = true;
          this._swipe = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy < 0 ? 'up' : 'down');
        }
      }
    });

    const bind = (id, name) => {
      const el = document.getElementById(id);
      el.addEventListener('pointerdown', e => { e.preventDefault(); this._held[name] = true; el.classList.add('on'); });
      const up = () => { this._held[name] = false; el.classList.remove('on'); };
      el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('pointerleave', up);
    };
    bind('bJump', 'jump'); bind('bAct', 'act'); bind('bSniff', 'sniff'); bind('bSpin', 'spin'); bind('bBark', 'bark'); bind('bPause', 'pause');
  }

  _setupGamepad() {
    window.addEventListener('gamepadconnected', e => { this.gamepadIndex = e.gamepad.index; });
    window.addEventListener('gamepaddisconnected', () => { this.gamepadIndex = null; });
  }

  _pollGamepad() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    let gp = null;
    for (const p of pads) if (p && p.connected) { gp = p; break; }
    if (!gp) return;
    const dz = v => Math.abs(v) < 0.18 ? 0 : v;
    const mx = dz(gp.axes[0] || 0), my = -dz(gp.axes[1] || 0);
    if (mx || my) { this.move.x = mx; this.move.y = my; }
    const cx = dz(gp.axes[2] || 0), cy = dz(gp.axes[3] || 0);
    this.cam.x += cx * 0.05; this.cam.y += cy * (this.invertY ? -0.05 : 0.05); // vertikal invertierbar (Optionen)
    const b = i => !!(gp.buttons[i] && gp.buttons[i].pressed);
    this._gp = {
      jump: b(0), act: b(2), sniff: b(3) || b(4), spin: b(1) || b(7), bark: b(5) || b(6), pause: b(9),
      left: b(14) || mx < -0.6, right: b(15) || mx > 0.6, up: b(12) || my > 0.6, down: b(13) || my < -0.6
    };
  }

  // Einmal pro Frame aufrufen, bevor abgefragt wird.
  update() {
    // Tastatur-Bewegung
    let kx = 0, ky = 0;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) kx -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) kx += 1;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) ky += 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) ky -= 1;
    if (kx || ky) { const l = Math.hypot(kx, ky); this.move.x = kx / l; this.move.y = ky / l; }
    else if (!this.touch) { this.move.x = 0; this.move.y = 0; }
    if (this.keys.has('KeyQ')) this.cam.x -= 0.04;
    if (this.keys.has('KeyR')) this.cam.x += 0.04;

    this._gp = null;
    this._pollGamepad();
    // Tastatur/Touch-Werte aus _held, Gamepad überlagert
    const cur = {};
    for (const k in this._held) cur[k] = this._held[k] || (this._gp ? this._gp[k] : false);
    this._pressedThisFrame = {};
    for (const k in cur) this._pressedThisFrame[k] = cur[k] && !this._prev[k];
    this._prev = cur;
    // Tastatur-Stick-Swipe für Runner
    if (this._pressedThisFrame.left) this._swipe = 'left';
    if (this._pressedThisFrame.right) this._swipe = 'right';
    if (this._pressedThisFrame.up || this._pressedThisFrame.jump) this._swipe = this._swipe || 'up';
    if (this.keys.has('KeyA') && !this._kA) this._swipe = 'left'; this._kA = this.keys.has('KeyA');
    if (this.keys.has('KeyD') && !this._kD) this._swipe = 'right'; this._kD = this.keys.has('KeyD');
    if (this._gp && (this._gp.left && !this._gL)) this._swipe = 'left'; this._gL = this._gp ? this._gp.left : false;
    if (this._gp && (this._gp.right && !this._gR)) this._swipe = 'right'; this._gR = this._gp ? this._gp.right : false;
  }

  pressed(name) { return !!this._pressedThisFrame[name]; }
  held(name) { return !!this._prev[name]; }
  swipe() { const s = this._swipe; this._swipe = null; return s; }
  consumeCam() { const c = { x: this.cam.x, y: this.cam.y }; this.cam.x = 0; this.cam.y = 0; return c; }
  anyPressed() { return this.pressed('jump') || this.pressed('act') || this.keys.has('Enter'); }
  vibrate(ms = 80) {
    if (this.noVibrate) return;
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const p of pads) if (p && p.vibrationActuator) { try { p.vibrationActuator.playEffect('dual-rumble', { duration: ms, strongMagnitude: 0.6, weakMagnitude: 0.3 }); } catch (e) { } }
    if (this.touch && navigator.vibrate) { try { navigator.vibrate(ms / 2); } catch (e) { } }
  }
}
