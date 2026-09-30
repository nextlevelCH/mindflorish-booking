// Poster-Button startet das Video und gibt die nativen Controls frei
(function () {
  var box = document.getElementById('video');
  var video = box.querySelector('video');
  var poster = box.querySelector('.poster');
  // Poster erst ausblenden, wenn das Video wirklich läuft
  poster.addEventListener('click', function () {
    video.play().then(function () { video.focus(); }).catch(function () {});
  });
  video.addEventListener('playing', function () { box.classList.add('is-playing'); });
  video.addEventListener('ended', function () { box.classList.remove('is-playing'); });
})();
