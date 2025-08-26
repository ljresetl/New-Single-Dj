(() => {
  // ===========================
  // Основний плеєр зі списком треків
  // ===========================
  const trackListItems = document.querySelectorAll('.track-item');
  const title = document.querySelector('.text-content-h-music');
  const progressBar = document.querySelector('.progress-music');
  const timeDisplay = document.querySelector('.timer');
  const wrapper = document.querySelector('.image-wrapper');

  if (!title || !progressBar || !timeDisplay || !wrapper) return;

  // Поточні треки для синхронізації
  let currentAudio = null;
  let currentBtn = null;
  let currentItem = null;
  let currentScale = 1;

  // ===========================
  // Web Audio API
  // ===========================
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  let src = null;
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 256;
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  function updateTrackTitle(name) {
    title.innerHTML = '';
    const span = document.createElement('span');
    span.textContent = name;
    title.appendChild(span);

    requestAnimationFrame(() => {
      if (span.scrollWidth > title.clientWidth) {
        span.classList.add('scrolling');
      } else {
        span.classList.remove('scrolling');
      }
    });
  }

  function animate() {
    if (!currentAudio || currentAudio.paused) return;
    requestAnimationFrame(animate);

    analyser.getByteFrequencyData(dataArray);
    let bass = dataArray.slice(0, 10).reduce((a, b) => a + b, 0) / 10;

    let targetScale = 1 + bass / 5000;
    if (targetScale > 1.05) targetScale = 1.05;
    currentScale += (targetScale - currentScale) * 0.15;
    wrapper.style.transform = `scale(${currentScale})`;
  }

  // ===========================
  // Окремий аудіо-плеєр
  // ===========================
  const audio2 = document.getElementById("audio");
  const playBtn2 = document.querySelector(".play-btn");
  const progress2 = document.querySelector(".progress");
  const progressContainer2 = document.querySelector(".progress-container");
  const timeDisplay2 = document.querySelector(".time");

  // ===========================
  // Функція зупинки поточного аудіо (для синхронізації)
  // ===========================
  function pauseCurrentAudio() {
    if (currentAudio) {
      currentAudio.pause();
      if (currentBtn) currentBtn.textContent = '►';
      if (currentItem) currentItem.classList.remove('playing');
      progressBar.style.width = '0%';
      timeDisplay.textContent = '0:00 / 0:00';
      wrapper.style.transform = 'scale(1)';

      currentAudio = null;
      currentBtn = null;
      currentItem = null;
    }
  }

  // ===========================
  // Події для треків списку
  // ===========================
  trackListItems.forEach(item => {
    const playBtn = item.querySelector('.play-btn-track');
    const audio = item.querySelector('audio');
    if (!playBtn || !audio) return;

    playBtn.addEventListener('click', () => {
      const trackName = item.querySelector('.track-name')?.textContent || 'Unknown Track';

      // Зупиняємо другий плеєр, якщо грає
      if (audio2 && !audio2.paused) audio2.pause();

      if (currentAudio && currentAudio !== audio) {
        pauseCurrentAudio();
      }

      if (audio.paused) {
        audio.play();
        playBtn.textContent = '❚❚';
        item.classList.add('playing');
        updateTrackTitle(trackName);

        currentAudio = audio;
        currentBtn = playBtn;
        currentItem = item;

        if (src) src.disconnect();
        src = ctx.createMediaElementSource(audio);
        src.connect(analyser);
        analyser.connect(ctx.destination);

        ctx.resume();
        animate();
      } else {
        audio.pause();
        playBtn.textContent = '►';
        item.classList.remove('playing');
        updateTrackTitle('Last tracks');
      }
    });

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

    audio.addEventListener('ended', () => pauseCurrentAudio());
  });

  // ===========================
  // Події для окремого плеєра
  // ===========================
  if (audio2 && playBtn2 && progress2 && progressContainer2 && timeDisplay2) {
    playBtn2.addEventListener("click", () => {
      // Зупиняємо треки списку, якщо грають
      pauseCurrentAudio();

      if (audio2.paused) {
        audio2.play();
        playBtn2.textContent = "❚❚";
      } else {
        audio2.pause();
        playBtn2.textContent = "►";
      }
    });

    function formatTime(seconds) {
      const min = Math.floor(seconds / 60);
      const sec = Math.floor(seconds % 60);
      return `${min}:${sec < 10 ? "0" : ""}${sec}`;
    }

    audio2.addEventListener("timeupdate", () => {
      const progressPercent = (audio2.currentTime / audio2.duration) * 100;
      progress2.style.width = `${progressPercent}%`;
      timeDisplay2.textContent = `${formatTime(audio2.currentTime)} / ${formatTime(audio2.duration)}`;
    });

    progressContainer2.addEventListener("click", (e) => {
      const width = progressContainer2.clientWidth;
      const clickX = e.offsetX;
      audio2.currentTime = (clickX / width) * audio2.duration;
    });
  }
})();
