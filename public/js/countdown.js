var countdownNumberEl = document.createElement('div');
countdownNumberEl.setAttribute('id', 'countdown-number');
var countdown = 20;
var countdownBox = document.getElementById('countdown');
var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
var circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
circle.setAttribute("r", "18");
circle.setAttribute("cx", "20");
circle.setAttribute("cy", "20");

svg.appendChild(circle);


var timer;

function gameCountdownON(){
	countdownNumberEl.innerHTML = countdown;
	countdownBox.appendChild(countdownNumberEl);
	countdownBox.appendChild(svg);
	timer = setInterval(function() {
  				countdown = --countdown <= 0 ? 20 : countdown;

 		 		countdownNumberEl.textContent = countdown;
			}, 1000);
	countdownBox.style.display = '';
}

function gameCountdownOFF(){
	//clear number and circle
	while (countdownBox.firstChild) {
    	countdownBox.removeChild(countdownBox.firstChild);
	}
	countdown = 20; //reset countdown
	clearInterval(timer);	//reset countdown timer
	countdownBox.style.display = 'none';
}