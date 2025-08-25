const audio = document.getElementById("audio");
const playBtn = document.querySelector(".play-btn");
const progress = document.querySelector(".progress");
const progressContainer = document.querySelector(".progress-container");

playBtn.addEventListener("click", () => {
  if (audio.paused) {
    audio.play();
    playBtn.textContent = "❚❚"; // змінюємо на паузу
  } else {
    audio.pause();
    playBtn.textContent = "►"; // змінюємо на play
  }
});

// Оновлення прогресу під час відтворення
audio.addEventListener("timeupdate", () => {
  const progressPercent = (audio.currentTime / audio.duration) * 100;
  progress.style.width = `${progressPercent}%`;
});

// Клік по лінії для перемотки
progressContainer.addEventListener("click", (e) => {
  const width = progressContainer.clientWidth;
  const clickX = e.offsetX;
  audio.currentTime = (clickX / width) * audio.duration;
});
