(() => {
  const trackListItems = document.querySelectorAll('.track-item');
  const title = document.querySelector('.text-content-h-music'); // <-- новий клас
  const progressBar = document.querySelector('.progress-music');
  const timeDisplay = document.querySelector('.timer');
  if (!title || !progressBar || !timeDisplay) return;

  let currentAudio = null;
  let currentBtn = null;
  let currentItem = null;

  trackListItems.forEach(item => {
    const playBtn = item.querySelector('.play-btn-track');
    const audio = item.querySelector('audio');
    if (!playBtn || !audio) return;

    playBtn.addEventListener('click', () => {
      const trackName = item.querySelector('.track-name')?.textContent || 'Unknown Track';

      if (currentAudio && currentAudio !== audio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        if (currentBtn) currentBtn.textContent = '►';
        if (currentItem) currentItem.classList.remove('playing');
        progressBar.style.width = '0%';
        timeDisplay.textContent = '0:00 / 0:00';
      }

      if (audio.paused) {
        audio.play();
        playBtn.textContent = '❚❚';
        item.classList.add('playing');
        title.textContent = trackName; // <-- назва вставляється сюди

        currentAudio = audio;
        currentBtn = playBtn;
        currentItem = item;
      } else {
        audio.pause();
        playBtn.textContent = '►';
        item.classList.remove('playing');
        title.textContent = 'Last tracks';
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

    audio.addEventListener('ended', () => {
      playBtn.textContent = '►';
      item.classList.remove('playing');
      progressBar.style.width = '0%';
      timeDisplay.textContent = '0:00 / 0:00';
      title.textContent = 'Last tracks'; // <-- повертаємо початковий текст
      if (currentAudio === audio) {
        currentAudio = null;
        currentBtn = null;
        currentItem = null;
      }
    });
  });
})();
