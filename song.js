(() => {
  // Беремо всі елементи списку треків
  const trackListItems = document.querySelectorAll('.track-item');

  // Основні елементи інтерфейсу
  const title = document.querySelector('.text-content-h-music'); 
  const progressBar = document.querySelector('.progress-music');
  const timeDisplay = document.querySelector('.timer');
  const wrapper = document.querySelector('.image-wrapper'); 

  // Якщо немає важливих елементів — код не запускаємо
  if (!title || !progressBar || !timeDisplay || !wrapper) return;

  // Змінні для поточного стану
  let currentAudio = null;
  let currentBtn = null;
  let currentItem = null;
  let currentScale = 1; // для плавного масштабування

  // 🎵 Web Audio API
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  let src = null;
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 256;
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  // --- Функція оновлення назви треку ---
  function updateTrackTitle(name) {
    title.innerHTML = '';
    const span = document.createElement('span');
    span.textContent = name;
    title.appendChild(span);

    requestAnimationFrame(() => {
      if (span.scrollWidth > title.clientWidth) {
        span.classList.add('scrolling'); // додати анімацію прокрутки
      } else {
        span.classList.remove('scrolling');
      }
    });
  }

  // --- Анімація під бас ---
  function animate() {
    if (!currentAudio || currentAudio.paused) return;
    requestAnimationFrame(animate);

    analyser.getByteFrequencyData(dataArray);
    let bass = dataArray.slice(0, 10).reduce((a, b) => a + b, 0) / 10;

    let targetScale = 1 + bass / 5000;
    if (targetScale > 1.05) targetScale = 1.05; // максимум +5%
    currentScale += (targetScale - currentScale) * 0.15; // плавність
    wrapper.style.transform = `scale(${currentScale})`;
  }

  // --- Події для кожного треку ---
  trackListItems.forEach(item => {
    const playBtn = item.querySelector('.play-btn-track');
    const audio = item.querySelector('audio');
    if (!playBtn || !audio) return;

    // ▶️ Play/Pause
    playBtn.addEventListener('click', () => {
      const trackName = item.querySelector('.track-name')?.textContent || 'Unknown Track';

      // Якщо вже грає інший трек — зупиняємо його
      if (currentAudio && currentAudio !== audio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        if (currentBtn) currentBtn.textContent = '►';
        if (currentItem) currentItem.classList.remove('playing');
        progressBar.style.width = '0%';
        timeDisplay.textContent = '0:00 / 0:00';
      }

      // Якщо трек на паузі — запускаємо
      if (audio.paused) {
        audio.play();
        playBtn.textContent = '❚❚';
        item.classList.add('playing');
        updateTrackTitle(trackName);

        currentAudio = audio;
        currentBtn = playBtn;
        currentItem = item;

        // Web Audio API
        if (src) src.disconnect();
        src = ctx.createMediaElementSource(audio);
        src.connect(analyser);
        analyser.connect(ctx.destination);

        ctx.resume();
        animate();
      } 
      // Якщо трек уже грає — пауза
      else {
        audio.pause();
        playBtn.textContent = '►';
        item.classList.remove('playing');
        updateTrackTitle('Last tracks');
      }
    });

    // ⏳ Прогрес і час
    audio.addEventListener('timeupdate', () => {
      if (audio === currentAudio && audio.duration) {
        const percent = (audio.currentTime / audio.duration) * 100;
        progressBar.style.width = percent + '%';

        const current = Math.floor(audio.currentTime);
        const duration = Math.floor(audio.duration);
        const formatTime = t => `${Math.floor(t/60)}:${('0'+(t%60)).slice(-2)}`;
        timeDisplay.textContent = `${formatTime(current)} / ${formatTime(duration)}`;
      }
    });

    // 🔚 Кінець треку
    audio.addEventListener('ended', () => {
      playBtn.textContent = '►';
      item.classList.remove('playing');
      progressBar.style.width = '0%';
      timeDisplay.textContent = '0:00 / 0:00';
      updateTrackTitle('Last tracks');
      wrapper.style.transform = 'scale(1)';

      if (currentAudio === audio) {
        currentAudio = null;
        currentBtn = null;
        currentItem = null;
      }
    });
  });
})();
