const audio = document.getElementById("audio");
const playBtn = document.querySelector(".play-btn");
const progress = document.querySelector(".progress");
const progressContainer = document.querySelector(".progress-container");
const timeDisplay = document.querySelector(".time");

playBtn.addEventListener("click", () => {
  if (audio.paused) {
    audio.play();
    playBtn.textContent = "❚❚"; // пауза
  } else {
    audio.pause();
    playBtn.textContent = "►"; // play
  }
});

// Формат часу у mm:ss
function formatTime(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min}:${sec < 10 ? "0" : ""}${sec}`;
}

// Оновлення прогресу та часу
audio.addEventListener("timeupdate", () => {
  const progressPercent = (audio.currentTime / audio.duration) * 100;
  progress.style.width = `${progressPercent}%`;

  timeDisplay.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
});

// Клік по лінії для перемотки
progressContainer.addEventListener("click", (e) => {
  const width = progressContainer.clientWidth;
  const clickX = e.offsetX;
  audio.currentTime = (clickX / width) * audio.duration;
});
