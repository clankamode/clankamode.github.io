// Browser-side init script: replaces Audio and requestAnimationFrame
// with controllable mocks before audio-player.js runs.

window.__mockAudio = null;

class MockAudio extends EventTarget {
  constructor(src) {
    super();
    this.src = src;
    this.paused = true;
    this.currentTime = 0;
    this.duration = 120;
    this.playbackRate = 1;
    this.crossOrigin = null;
    this.preload = null;
    window.__mockAudio = this;
  }
  play() { this.paused = false; return Promise.resolve(); }
  pause() { this.paused = true; }
}

window.Audio = MockAudio;

// rAF mock — callbacks queue up; call window.__tickRAF() to flush one batch.
window.__rAFCallbacks = [];
window.requestAnimationFrame = (cb) => {
  window.__rAFCallbacks.push(cb);
  return window.__rAFCallbacks.length;
};
window.cancelAnimationFrame = () => {};
window.__tickRAF = () => {
  const cbs = window.__rAFCallbacks.splice(0);
  cbs.forEach(cb => cb(performance.now()));
};
