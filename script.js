//---------------------Global Variables-----------------------------------------//
const holdClueTime = 600;  // how long to hold each clue’s light/sound
const pauseTime = 300; // how long to pause in between clues
const waitNextClue = 300; // how long to wait before playback
let user_pattern = []; // Holds the user's input
let audioInitialized = false;
let isgameplaying = false;
let audioContext;
let oscillatorNode;
let gainNode;
let isSoundPlaying = false;
let gameSequence = []; // Holds the full sequence of button IDs
let currentRound = 0; 

 
//sound frequencies for each button
const buttonFrequencies = {
    start_button1: 293.66, // D4
    start_button2: 370.00, // F#4
    start_button3: 440.00, // A4
    start_button4: 587.33  // D5
};

// -----------------Audio Context Initialization-----------------------------//
// Initialize the audio context
function initializeAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();

        oscillatorNode = audioContext.createOscillator();
        gainNode = audioContext.createGain();

        oscillatorNode.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillatorNode.start();
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    }
}

//--------------------Tone Functions-----------------------------------------//

//this function starts the tone for the button that is pressed
function startTone(buttonId, forceRestart = false) {
    if (!audioInitialized) {
      initializeAudio();
    }
    const frequency = buttonFrequencies[buttonId];
    if (frequency) {
      // If forceRestart is true, or not currently playing, we set the tone
      if (forceRestart || !isSoundPlaying) {
        audioContext.resume();
        oscillatorNode.frequency.setValueAtTime(frequency, audioContext.currentTime);
        gainNode.gain.setTargetAtTime(0.4, audioContext.currentTime, 0.01);
        isSoundPlaying = true;
      }
    }
  }

  //this function stops the tone for the button that is pressed
function stopTone() {
    if (isSoundPlaying) {
        gainNode.gain.setTargetAtTime(0, audioContext.currentTime, 0.01); // Volume fade-out
        isSoundPlaying = false;
    }
}

initializeAudio(); // Initialize the audio context

//--------------------Button Functions-----------------------------------------//
//--------------------Game Logic-----------------------------------------//
//Description: This function starts the game
function startGame() {
    const button = document.getElementById("start_stop_button");
    if (button.innerHTML === "Start") {
        button.innerHTML = "Stop";
        isgameplaying = true;
        resetGame(); // Reset the game
        playRound(); // Start the first round
    } else {
        stopGame();
    }
}

//This function resets the game to the initial state
function resetGame() {
    gameSequence = generateSequence(8); // Generate a random sequence of 8 clues
    currentRound = 0; // Reset to the first round
    user_pattern = []; // Clear the user's input
}

// Generate a random sequence of button IDs
function generateSequence(length) {
    const buttons = ["start_button1", "start_button2", "start_button3", "start_button4"];
    let sequence = [];
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * buttons.length);
        sequence.push(buttons[randomIndex]);
    }
    
    return sequence;
}
 //Description: This function stops the game
function stopGame() {
    var button_id = document.getElementById("start_stop_button");
    button_id.innerHTML = "Start";
    isgameplaying = false;
    stopTone();

    const buttons = [
        document.getElementById("start_button1"),
        document.getElementById("start_button2"),
        document.getElementById("start_button3"),
        document.getElementById("start_button4")
    ];

    for (let i = 0; i < buttons.length; i++) {
        change_color_on_mouse(buttons[i].id, false);
    }
}





// Play the current round
function playRound() {
    if (!isgameplaying) return;
    
    if (audioContext.state === "suspended") {
      audioContext.resume();
    }
    
    user_pattern = [];
    currentRound++;
  
    let duration = waitNextClue; // start playback after this initial wait
    for (let i = 0; i < currentRound; i++) {
      const buttonId = gameSequence[i];
      // schedule playClue(buttonId) for time = delay
      setTimeout(() => {
        playClue(buttonId);
      }, duration);
      // add the clue hold time
      duration += holdClueTime;
      // add the pause time
      duration += pauseTime;
    }
  }
  
// Play a clue
function playClue(buttonId) {
    startTone(buttonId, true); // Start the tone
    change_color_on_mouse(buttonId, true);
    setTimeout(() => {
        stopTone();
        change_color_on_mouse(buttonId, false);
    }, holdClueTime);
}


// Check the user's input
function checkUserInput() {
    if(!isgameplaying){
        return;
      }
    const currentIndex = user_pattern.length - 1;

    // Check if the latest input matches the game sequence
    if (user_pattern[currentIndex] !== gameSequence[currentIndex]) {
        console.log("Incorrect input. Game Over!");
        game_lost();
        return;
    }

    // If the user completes the current round
    if (user_pattern.length === currentRound) {
        if (currentRound === gameSequence.length) {
            game_won();
        } else {
            setTimeout(() => {
                playRound(); // Proceed to the next round
            }, 1000);
        }
    }
}

function change_color_on_mouse(button_id, isMouseDown) {
    const button = document.getElementById(button_id);
    if (!button) return;

    if (isMouseDown) {
        if (!button.temp_color) {
            button.temp_color = window.getComputedStyle(button).backgroundColor;
        }
        if (button.id === "start_button1") button.style.backgroundColor = "red";
        else if (button.id === "start_button2") button.style.backgroundColor = "blue";
        else if (button.id === "start_button3") button.style.backgroundColor = "green";
        else button.style.backgroundColor = "yellow";
    } else {
        if (button.temp_color) {
            button.style.backgroundColor = button.temp_color;
            delete button.temp_color;
        }
    }
}

function game_lost() {
    stopGame();
    alert("Game Over! You lost, try again!");
}

function game_won() {
    stopGame();
    alert("Congratulations! You won the game!");
}


//--------------------Event Listeners-----------------------------------------//

document.addEventListener("mousedown", (event) => {
    if (event.target.classList.contains("sound_buttons")) {
        startTone(event.target.id);
        change_color_on_mouse(event.target.id, true);
        user_pattern.push(event.target.id);
    }
});

document.addEventListener("mouseup", (event) => {
    if (event.target.classList.contains("sound_buttons")) {
        stopTone();
        change_color_on_mouse(event.target.id, false);
        

        // Check user input on mouseup
        checkUserInput();
    }
});
document.addEventListener("click", function(event) {
    if (event.target.classList.contains("start_stop_button")) {
        startGame();
    }
});

document.addEventListener("click", () => {
    if (!audioInitialized) {
        initializeAudio();
        audioInitialized = true;
    }
});

//--------------------Main-----------------------------------------//