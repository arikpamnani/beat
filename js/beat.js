var audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Author - Arik Pamnani
function parseBin(bin) {
	/* parses an 8 digit binary number to corresponding 
	notes. 
	'00010101' -> ['F4', 'A4', 'C5'] */
	var notes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
	var array = new Array();	/* return array */
	
	for(var i=0; i<bin.length; i++) {
		if(bin[i] == '1')
			array.push(notes[i]);
	}
	return array;
}

/*console.log(parseBin('01010101'));*/

function playOctave(duration) {
	// var synth = new Tone.AMSynth().toMaster();
	var oscillator = audioContext.createOscillator();
	var oscillatorGain = audioContext.createGain();
	oscillatorGain.gain.value = 0;
	oscillator.connect(oscillatorGain);
	oscillator.type = "sine";
	oscillatorGain.connect(audioContext.destination);
	oscillator.start();

	var buttons = document.querySelectorAll("button.octave");
	buttons.forEach(function(button){
		
		// mouse events
		button.addEventListener('mousedown', function(e){
			/*synth.triggerAttack(e.target.textContent);*/
			console.log(fmap[e.target.textContent]);
			oscillator.frequency.setValueAtTime(fmap[e.target.textContent], audioContext.currentTime);
			oscillatorGain.gain.value = 10;
		});

		button.addEventListener('mouseup', function(e){
			/*synth.triggerRelease();*/
			oscillatorGain.gain.value = 0;
		});
	});
}

/* tune strategies */

var strategy_1 = {
	'A': ['C4'], 'B': ['D4'], 'C': ['E4'], 'D': ['F4'], 'E': ['G4'], 'F': ['A4'], 'G': ['B4'], 'H': ['C5'], 'I': ['G4'], 'J': ['C4'], 'K': ['D#'], 'L': ['A4'], 'M': ['E4'], 
	'N': ['F4'], 'O': ['E4'], 'P': ['G4'], 'Q': ['B4'], 'R': ['G4'], 'S': ['A4'], 'T': ['B4'], 'U': ['C4'], 'V': ['F4'], 'W': ['G4'], 'X': ['B4'], 'Y': ['C4'], 'Z': ['D4']
}

var strategy_ascii = {
	"A": "1000001",
    "B": "1000010",
    "C": "1000011",
    "D": "1000100",
    "E": "1000101",
    "F": "1000110",
    "G": "1000111",
    "H": "1001000",
    "I": "1001001",
    "J": "1001010",
    "K": "1001011",
    "L": "1001100",
    "M": "1001101",
    "N": "1001110",
    "O": "1001111",
    "P": "1010000",
    "Q": "1010001",
    "R": "1010010",
    "S": "1010011",
    "T": "1010100",
    "U": "1010101",
    "V": "1010110",
    "W": "1010111",
    "X": "1011000",
    "Y": "1011001",
    "Z": "1011010"
}

var strategy_2 = {};
for(var a in strategy_ascii) {
	strategy_2[a] = parseBin(strategy_ascii[a]);
}

function Node() {
	this.init = function(fc, modind) {
		/* ------------------------ */
		/* OSCILLATOR AND MODULATOR */
		/* oscillator/carrier */
		this.oscillator = audioContext.createOscillator();
		this.oscillatorGain = audioContext.createGain();
		this.oscillatorGain.gain.value = 1;
		this.oscillator.connect(this.oscillatorGain);
		this.oscillator.frequency.value = fc;
		this.oscillator.type = "sine";

		/* modulator */
		this.modulator = audioContext.createOscillator();
		this.modulatorGain = audioContext.createGain();
		this.modulatorGain.gain.value = modind;
		this.modulator.connect(this.modulatorGain);
		this.modulator.type = "sine";

		this.oscillator.start();
		this.modulator.start();
		/* ------------------------ */
	};
}

node = new Node();

function makeTune(strategy) {
	var text = document.querySelector("textarea").value;
	var option = document.querySelector("select#tune").value;
	var duration = Number(document.querySelector("input#duration").value);
	var delay = Number(document.querySelector("input#delay").value);
	var modind = parseInt(document.querySelector("input#modind").value);
	var fc = parseInt(document.querySelector("input#fc").value);
	/* FM or AM */
	var none = document.getElementById("none");
	var fm = document.getElementById("fm");	
	var am = document.getElementById("am");

	node.init(fc, modind);

	if(none.checked) {
		node.modulatorGain.connect(audioContext.destination);
		// oscillatorGain.connect(audioContext.destination);
	}

	else if(fm.checked) {
		// FM 
		// attach modulator gain to oscillator frequency 
		node.modulatorGain.connect(node.oscillator.frequency);
		node.oscillatorGain.connect(audioContext.destination);
	}

	else {
		// AM 
		// attach modulator gain to oscillator gain 
		node.modulatorGain.connect(node.oscillatorGain.gain);
		node.oscillatorGain.connect(audioContext.destination);
	}

	var currentTime = audioContext.currentTime;
	
	text = text.toUpperCase();	// capitalize
	text = text.replace(/ /g,'');	// remove whitespaces
	textArray = text.split('');	// create an Array of letters
	tuneArray = new Array();	// array of events for Tone.Part
	
	textArray.forEach(function(letter){
		for (let n of strategy[letter]){
			node.modulator.frequency.setValueAtTime(fmap[n], currentTime);
			currentTime = currentTime + duration + delay;
		}
		
	});

	/* STOP */
	node.modulator.stop(currentTime);
	node.oscillator.stop(currentTime);
}

document.querySelector("textarea").value="ABCDEFGH";
playOctave();

// play/stop button
var stop = false;	// is button a 'stop' button?
document.querySelector("button.button-play").addEventListener('click', function(e) {
	if(stop) {
		node.modulator.stop(audioContext.currentTime);
		node.oscillator.stop(audioContext.currentTime);

		stop = false;
		this.innerHTML = "Play <i class='fa fa-play'></i>";
	}	
	
	else {
		// var currentTime = audioContext.currentTime;
		makeTune(strategy_1);
		
		stop = true;
		this.innerHTML = "Stop <i class='fa fa-stop'></i>";
	}
});

/* create strategy */
/* insert HTML */
var form = document.querySelector("div#create").querySelector("fieldset");
var alphabet = "ABCDEFGHIJKLMNOPQRTSUVWXYZ";

for(var i=0; i<alphabet.length; i++) {
	form.innerHTML += '<div class="uk-margin uk-grid-small uk-child-width-auto uk-grid alpha">\n'+ 
			        	'<div class="uk-margin">\n'+
    						'<input class="uk-input uk-form-width-xsmall" type="text" style="font-size: 0.8em;" value="'+alphabet[i]+' --- '+'" readonly>\n'+
    					'</div>'+
			            '<label><input class="uk-checkbox" type="checkbox" value="C4"> C4</label>\n'+
			            '<label><input class="uk-checkbox" type="checkbox" value="D4"> D4</label>\n'+
			            '<label><input class="uk-checkbox" type="checkbox" value="E4"> E4</label>\n'+
			            '<label><input class="uk-checkbox" type="checkbox" value="F4"> F4</label>\n'+
			            '<label><input class="uk-checkbox" type="checkbox" value="G4"> G4</label>\n'+
			            '<label><input class="uk-checkbox" type="checkbox" value="A4"> A4</label>\n'+
			            '<label><input class="uk-checkbox" type="checkbox" value="B4"> B4</label>\n'+
			            '<label><input class="uk-checkbox" type="checkbox" value="C5"> C5</label>\n'+
			         '</div>';
};

var strategy_open = {};
var register_button = document.querySelector("button.register");
register_button.onclick = function() {
	var alpha = form.getElementsByClassName("alpha");
	/* checked checkboxes for each alphabet */
	for(var a=0; a<alpha.length; a++) {
		strategy_open[alphabet[a]] = new Array();
		var checks = alpha[a].getElementsByClassName("uk-checkbox");
		/* if checked */
		for(let c of checks) {
			if(c.checked)	{ strategy_open[alphabet[a]].push(c.value); }
		}
	}
}

var stop_2 = false;
document.querySelector("button.button-play-2").addEventListener('click', function(e) {
	if(stop_2){
		node.modulator.stop(audioContext.currentTime);
		node.oscillator.stop(audioContext.currentTime);

		stop_2 = false;
		this.innerHTML = "Play <i class='fa fa-play'></i>";
	}	
	
	else{
		makeTune(strategy_open);
		
		stop_2 = true;
		this.innerHTML = "Stop <i class='fa fa-stop'></i>";
	}
}); 
