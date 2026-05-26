(() => {
  // ===========================
  // Scroll reveal
  // ===========================
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(el => io.observe(el));
  }

  // ===========================
  // Main track-list player
  // ===========================
  const trackItems      = document.querySelectorAll('.track-item');
  const titleEl         = document.querySelector('.tracklist-title');
  const progressFill    = document.querySelector('.track-progress-fill');
  const progressBar     = document.querySelector('.track-progress-bar');
  const timerEl         = document.querySelector('.track-timer');
  const vinylWrap       = document.querySelector('.vinyl-wrap');

  if (!titleEl || !progressFill || !timerEl || !vinylWrap) return;

  let currentAudio = null;
  let currentBtn   = null;
  let currentItem  = null;
  let currentScale = 1;

  // Web Audio API — one MediaElementSource per <audio> element
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 256;
  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  const connected = new WeakMap();

  analyser.connect(ctx.destination);

  function getSource(audio) {
    if (connected.has(audio)) return connected.get(audio);
    const src = ctx.createMediaElementSource(audio);
    src.connect(analyser);
    connected.set(audio, src);
    return src;
  }

  function fmt(t) {
    return `${Math.floor(t / 60)}:${('0' + (t % 60 | 0)).slice(-2)}`;
  }

  function animate() {
    if (!currentAudio || currentAudio.paused) return;
    requestAnimationFrame(animate);
    analyser.getByteFrequencyData(dataArray);
    const bass = dataArray.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
    let target = 1 + bass / 5000;
    if (target > 1.05) target = 1.05;
    currentScale += (target - currentScale) * 0.15;
    vinylWrap.style.transform = `scale(${currentScale})`;
  }

  function updateTitle(name) {
    titleEl.innerHTML = '';
    const span = document.createElement('span');
    span.textContent = name;
    titleEl.appendChild(span);
    requestAnimationFrame(() => {
      span.classList.toggle('scrolling', span.scrollWidth > titleEl.clientWidth);
    });
  }

  function stopCurrent() {
    if (!currentAudio) return;
    currentAudio.pause();
    if (currentBtn) currentBtn.textContent = '►';
    if (currentItem) currentItem.classList.remove('playing');
    progressFill.style.width = '0%';
    timerEl.textContent = '0:00 / 0:00';
    vinylWrap.style.transform = 'scale(1)';
    currentAudio = currentBtn = currentItem = null;
  }

  // ===========================
  // Header standalone player
  // ===========================
  const audio2    = document.getElementById('audio');
  const playBtn2  = document.querySelector('.play-btn');
  const progress2 = document.querySelector('.progress');
  const progCont2 = document.querySelector('.progress-container');
  const time2     = document.querySelector('.time');

  // Track-list events
  trackItems.forEach(item => {
    const btn   = item.querySelector('.play-btn-track');
    const audio = item.querySelector('audio');
    if (!btn || !audio) return;

    btn.addEventListener('click', () => {
      const name = item.querySelector('.track-name')?.textContent?.trim() || 'Unknown';

      if (audio2 && !audio2.paused) {
        audio2.pause();
        if (playBtn2) playBtn2.textContent = '►';
      }

      if (currentAudio && currentAudio !== audio) stopCurrent();

      if (audio.paused) {
        ctx.resume();
        audio.play();
        btn.textContent = '❚❚';
        item.classList.add('playing');
        updateTitle(name);
        currentAudio = audio;
        currentBtn   = btn;
        currentItem  = item;
        getSource(audio);
        animate();
      } else {
        audio.pause();
        btn.textContent = '►';
        item.classList.remove('playing');
        updateTitle('Last tracks');
        vinylWrap.style.transform = 'scale(1)';
      }
    });

    audio.addEventListener('timeupdate', () => {
      if (audio !== currentAudio || !audio.duration) return;
      const pct = (audio.currentTime / audio.duration) * 100;
      progressFill.style.width = pct + '%';
      timerEl.textContent = `${fmt(audio.currentTime)} / ${fmt(audio.duration)}`;
    });

    audio.addEventListener('ended', () => {
      stopCurrent();
      updateTitle('Last tracks');
    });
  });

  // Click + drag to seek on main progress bar
  if (progressBar) {
    let seeking = false;

    function seekTo(clientX) {
      if (!currentAudio?.duration) return;
      const r = progressBar.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
      currentAudio.currentTime = pct * currentAudio.duration;
      progressFill.style.width = (pct * 100) + '%';
    }

    progressBar.addEventListener('mousedown', e => { seeking = true; seekTo(e.clientX); });
    document.addEventListener('mousemove', e => { if (seeking) seekTo(e.clientX); });
    document.addEventListener('mouseup', () => { seeking = false; });

    progressBar.addEventListener('touchstart', e => { seeking = true; seekTo(e.touches[0].clientX); }, { passive: true });
    document.addEventListener('touchmove', e => { if (seeking) seekTo(e.touches[0].clientX); }, { passive: true });
    document.addEventListener('touchend', () => { seeking = false; });
  }

  // ===========================
  // Header player events
  // ===========================
  if (audio2 && playBtn2 && progress2 && progCont2 && time2) {
    playBtn2.addEventListener('click', () => {
      stopCurrent();
      if (audio2.paused) {
        audio2.play();
        playBtn2.textContent = '❚❚';
      } else {
        audio2.pause();
        playBtn2.textContent = '►';
      }
    });

    audio2.addEventListener('timeupdate', () => {
      if (!audio2.duration) return;
      progress2.style.width = `${(audio2.currentTime / audio2.duration) * 100}%`;
      time2.textContent = `${fmt(audio2.currentTime)} / ${fmt(audio2.duration)}`;
    });

    let seeking2 = false;

    function seekTo2(clientX) {
      if (!audio2.duration) return;
      const r = progCont2.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
      audio2.currentTime = pct * audio2.duration;
      progress2.style.width = (pct * 100) + '%';
    }

    progCont2.addEventListener('mousedown', e => { seeking2 = true; seekTo2(e.clientX); });
    document.addEventListener('mousemove', e => { if (seeking2) seekTo2(e.clientX); });
    document.addEventListener('mouseup', () => { seeking2 = false; });

    progCont2.addEventListener('touchstart', e => { seeking2 = true; seekTo2(e.touches[0].clientX); }, { passive: true });
    document.addEventListener('touchmove', e => { if (seeking2) seekTo2(e.touches[0].clientX); }, { passive: true });
    document.addEventListener('touchend', () => { seeking2 = false; });

    audio2.addEventListener('ended', () => {
      playBtn2.textContent = '►';
      progress2.style.width = '0%';
      time2.textContent = '0:00 / 0:00';
    });
  }
})();
