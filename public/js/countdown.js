var countdownNumberEl = document.getElementById('countdown-number');
var countdown = 20;

countdownNumberEl.textContent = countdown;

setInterval(function() {
  countdown = --countdown <= 0 ? 20 : countdown;

  countdownNumberEl.textContent = countdown;
}, 1000);