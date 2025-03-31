// script.js
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const menu = document.getElementById('menu');
const instructions = document.getElementById('instructions');
const customizationMenu = document.getElementById('customizationMenu');
const pauseOverlay = document.getElementById('pauseOverlay');

// --- Constants ---
const WIDTH = 600;
const HEIGHT = 400;
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 60;
const BALL_SIZE = 10;
let PADDLE_COLOR = 'white'; // Default paddle color
let BALL_COLOR = 'white';    // Default ball color
let BG_COLOR = '#282c34';   // Default background color
const INITIAL_BALL_SPEED_X = 5;
const INITIAL_BALL_SPEED_Y = 5;
const PADDLE_SPEED = 9;
const BALL_SPEED_INCREASE = .25;
const MAX_BALL_SPEED = 16;
const AI_REACTION_DELAY = 3; // Frames of delay.  Higher number = slower reaction.


canvas.width = WIDTH;
canvas.height = HEIGHT;

let gameMode = 0;
let gameRunning = false; //for preventing issues during menu screen
let paused = false;
let aiFrameCounter = 0; //  counter for AI reaction delay.

// --- Classes ---
class Paddle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = PADDLE_WIDTH;
        this.height = PADDLE_HEIGHT;
        this.speed = PADDLE_SPEED;
    }

    move(up, down) {
      if(!gameRunning || paused) return;

        if (up && this.y > 0) {
            this.y -= this.speed;
        }
        if (down && this.y + this.height < HEIGHT) {
            this.y += this.speed;
        }
         this.y = Math.max(0, Math.min(this.y, HEIGHT - this.height)); // Boundary check

    }

    draw() {
        ctx.fillStyle = PADDLE_COLOR; // Use the custom color
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

     reset() {
         this.y = HEIGHT / 2 - PADDLE_HEIGHT / 2;
    }

}

class Ball {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = BALL_SIZE;
        this.speedX = INITIAL_BALL_SPEED_X * (Math.random() < 0.5 ? 1 : -1);
        this.speedY = INITIAL_BALL_SPEED_Y * (Math.random() < 0.5 ? 1 : -1);
    }

    move() {
      if(!gameRunning || paused) return;
        this.x += this.speedX;
        this.y += this.speedY;

        // Bounce off top/bottom
        if (this.y <= 0 || this.y + this.size >= HEIGHT) {
            this.speedY *= -1;
        }
    }

    draw() {
        ctx.fillStyle = BALL_COLOR; // Use the custom color
        ctx.fillRect(this.x, this.y, this.size, this.size);
    }

    reset() {
        this.x = WIDTH / 2;
        this.y = HEIGHT / 2;
        this.speedX = INITIAL_BALL_SPEED_X * (Math.random() < 0.5 ? 1 : -1);
        this.speedY = INITIAL_BALL_SPEED_Y * (Math.random() < 0.5 ? 1 : -1);
    }

    increaseSpeed() {
        if (Math.abs(this.speedX) < MAX_BALL_SPEED) {
            this.speedX += this.speedX > 0 ? BALL_SPEED_INCREASE : -BALL_SPEED_INCREASE;
        }
        if (Math.abs(this.speedY) < MAX_BALL_SPEED) {
            this.speedY += this.speedY > 0 ? BALL_SPEED_INCREASE : -BALL_SPEED_INCREASE;
        }
    }


    checkCollision(paddle) {
      if(!gameRunning || paused) return;

        if (
            this.x < paddle.x + paddle.width &&
            this.x + this.size > paddle.x &&
            this.y < paddle.y + paddle.height &&
            this.y + this.size > paddle.y
        ) {
            //  this.speedX *= -1;  //Simple reverse

            // More Advanced Bounce:
            let deltaY = this.y - (paddle.y + paddle.height / 2); //Difference from paddle center
            this.speedY = deltaY * 0.3;  //Adjust speed based on where the ball hits.
            this.speedX *= -1;

            this.increaseSpeed();
        }
    }
}


// --- Game Objects ---
const player1 = new Paddle(20, HEIGHT / 2 - PADDLE_HEIGHT / 2);
const player2 = new Paddle(WIDTH - 20 - PADDLE_WIDTH, HEIGHT / 2 - PADDLE_HEIGHT / 2);
const ball = new Ball(WIDTH / 2, HEIGHT / 2);

// --- Score ---
let score1 = 0;
let score2 = 0;

// --- Input Handling ---
const keys = {};
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
     if (e.key === 'Escape') {
        togglePause();
    }
});
document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});


 // --- AI Logic (for Single Player) ---
function aiMove() {
    if(!gameRunning || paused) return;

    aiFrameCounter++;
    if(aiFrameCounter < AI_REACTION_DELAY) return; //do nothing until delay is met
    aiFrameCounter = 0;//reset counter


    // Simple AI: Follow the ball's Y position
    let paddle2Center = player2.y + PADDLE_HEIGHT / 2;
    if (paddle2Center < ball.y - 15) {  // -15 creates a deadband, more humanlike
        player2.move(false,true); //move down
    } else if (paddle2Center > ball.y + 15) {
        player2.move(true, false); //move up
    }
}


// --- Game Loop ---
function gameLoop() {

    if(paused) return; // Don't update or draw if paused.

     // --- Input ---
    if(gameMode === 2 || gameMode === 1){
        player1.move(keys['w'], keys['s']);
    }
    if(gameMode === 2){
        player2.move(keys['ArrowUp'], keys['ArrowDown']);
    }


    // --- Game Logic ---
    ball.move();
    ball.checkCollision(player1);
    ball.checkCollision(player2);

    // Scoring
    if (ball.x <= 0) {
        score2++;
        updateScore();
        resetGame();
    } else if (ball.x + ball.size >= WIDTH) {
        score1++;
        updateScore();
        resetGame();
    }
    if(gameMode === 1){
        aiMove();
    }

    // --- Drawing ---
    ctx.clearRect(0, 0, WIDTH, HEIGHT); // Clear canvas
     ctx.fillStyle = BG_COLOR;  // set the background color
    ctx.fillRect(0, 0, WIDTH, HEIGHT); //fill background

    player1.draw();
    player2.draw();
    ball.draw();
     // Draw the middle line
    ctx.beginPath();
    ctx.setLineDash([5, 5]); // Dashed line
    ctx.moveTo(WIDTH / 2, 0);
    ctx.lineTo(WIDTH / 2, HEIGHT);
    ctx.strokeStyle = 'white';
    ctx.stroke();
    ctx.setLineDash([]);  // Reset line dash


    if(gameRunning){ //only call if the game is running
        requestAnimationFrame(gameLoop); // Call gameLoop again
    }

}

function updateScore() {
    scoreDisplay.textContent = `${score1} - ${score2}`;
}


// --- Start/Menu Functions ---
function startGame(mode) {
    gameMode = mode;
    menu.style.display = 'none';
    instructions.style.display = 'none';
    customizationMenu.style.display = 'none';
    canvas.style.display = 'block';
    scoreDisplay.style.display = 'block';
    applyCustomization(); // Apply colors
    resetGame();
    gameRunning = true;
    gameLoop(); // Start the game loop
}
function showInstructions(){
    menu.style.display = 'none';
    instructions.style.display = 'block';
     let backButton = document.createElement("button");
     backButton.classList.add("menu-button"); // Add the class
    backButton.textContent = "Back to Menu";
    backButton.onclick = () => backToMenu('instructions');
     instructions.appendChild(backButton);
}

 function showCustomization() {
    menu.style.display = 'none';
    customizationMenu.style.display = 'block';
}

function applyCustomization() {
     PADDLE_COLOR = document.getElementById('paddleColor').value;
     BALL_COLOR = document.getElementById('ballColor').value;
     BG_COLOR = document.getElementById('bgColor').value;
     document.body.style.backgroundColor = BG_COLOR; //for outside the canvas
}


function backToMenu(fromMenu) {
   document.getElementById(fromMenu).style.display = 'none';

    if(fromMenu === 'instructions'){ //removes back button
         instructions.innerHTML = ` <h2>Controls:</h2>
                                 <p>Player 1 (Left): W/S Keys</p>
                                <p>Player 2 (Right): Up/Down Arrow Keys</p>
                                <p>Pause: Escape Key</p>`; // Restore original content

        // Re-add the back button with the class
        let backButton = document.createElement("button");
        backButton.classList.add("menu-button");
        backButton.textContent = "Back to Menu";
        backButton.onclick = () => backToMenu('instructions');
        instructions.appendChild(backButton);
    }


    menu.style.display = 'block';

    gameRunning = false; //stops game loop if you go back
    resetGame(); //resets game if you go back
     score1 = 0;
     score2 = 0;
     updateScore();
     canvas.style.display = "none"; //hides canvas
     scoreDisplay.style.display = "none"; //hide score
     pauseOverlay.style.display = 'none'; //hide pause in case
     paused = false;


}

function resetGame() {
  ball.reset();
  player1.reset(); //reset paddles positions
  player2.reset();
}

function togglePause() {
    if (!gameRunning) return; // Can't pause if game not running

    paused = !paused; // Toggle the paused state

    if (paused) {
        pauseOverlay.style.display = 'flex'; // Show overlay
        pauseOverlay.style.display = 'none'; // Hide overlay
                gameLoop(); // Resume the game loop
            }
        }

        function resumeGame() {
            paused = false;
            pauseOverlay.style.display = 'none';
            gameLoop(); // Restart the game loop. VERY IMPORTANT
        }
    {

    }
{
    
}

