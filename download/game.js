/**
 * Perlin Noise Shooter Game with Camera Feed
 * Main game setup and loop
 */

/*******************************************************
 *              GLOBAL VARIABLES & SETTINGS
 *******************************************************/

// Flow field settings
let cols, rows;
let scale = 20;         // Size of each cell in the flow field
let inc = 0.05;         // Noise increment for Perlin noise
let zOff = 0;           // Time offset for Perlin noise animation
let flowField = [];     // Stores angle for each cell

// Particle (smoke) settings
let particles = [];
let numParticles = 600;
let alphaTrail = 20;    // Background fade strength
let maxSpeed = 2.0;     // Speed limit for particles

// Swirl effect (when mouse is pressed)
let swirlRadius = 100;
let swirlStrength = 0.15;

// Canvas dimensions
let w, h;

// Game variables
let player;
let bullets = [];
let enemies = [];
let healthPickups = []; // Array to store health pickups
let score = 0;
let gameOver = false;
let level = 1;
let enemySpawnRate = 180; // Frames between enemy spawns
let enemySpawnCounter = 0;
let difficulty = 1.0;
let healthPickupChance = 0.005; // Chance of spawning health pickup each frame

// Webcam Video
let video;

// Mobile joystick
let joystick = {
  active: false,
  baseX: 80,
  baseY: 520,
  currentX: 80,
  currentY: 520,
  baseRadius: 50,
  knobRadius: 20
};

/*******************************************************
 *                        SETUP
 *******************************************************/
function setup() {
  // Create full-screen canvas
  w = windowWidth;
  h = windowHeight;
  createCanvas(w, h);
  
  // Set up the webcam
  video = createCapture(VIDEO);
  video.size(320, 240);
  video.hide(); // Hide the DOM element
  
  // Calculate flow field grid dimensions
  cols = floor(w / scale);
  rows = floor(h / scale);
  flowField = new Array(cols * rows);
  
  // Create particles for the smoke effect
  for (let i = 0; i < numParticles; i++) {
    particles.push(new Particle());
  }
  
  // Create the player (will display webcam feed)
  player = new Player();
  
  // Create mobile controls if needed
  createFireButton();
  
  // Add keyboard event listener for shooting
  window.addEventListener('keydown', handleKeyPress);
  
  // Add restart button functionality
  document.getElementById('restart-button').addEventListener('click', resetGame);
  
  // Set initial background to black
  background(0);
}

/*******************************************************
 *                        DRAW
 *******************************************************/
function draw() {
  // Handle game over state
  if (gameOver) {
    displayGameOver();
    return;
  }
  
  // Create fading effect for trails
  fill(0, alphaTrail);
  rect(0, 0, width, height);
  
  // Update flow field
  flowField = updateFlowField();
  
  // Apply swirl effect on mouse press (desktop) or touch (mobile)
  if (mouseIsPressed) {
    flowField = applySwirl(flowField, mouseX, mouseY);
  }
  
  // Update and display particles (smoke effect)
  for (let i = 0; i < particles.length; i++) {
    particles[i].follow(flowField);
    particles[i].update();
    particles[i].edges();
    particles[i].show();
  }
  
  // Handle mobile joystick if on mobile device
  if (isMobile) {
    handleJoystick();
  }
  
  // Draw the joystick for mobile
  drawJoystick();
  
  // Update and display player
  player.update();
  player.show();
  
  // Update and display bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].update();
    bullets[i].show();
    
    // Remove bullets that go off screen
    if (bullets[i].offscreen()) {
      bullets.splice(i, 1);
    }
  }
  
  // Update and display enemies
  for (let i = enemies.length - 1; i >= 0; i--) {
    enemies[i].update();
    enemies[i].show();
    
    // Check for collision with player
    let d = dist(enemies[i].pos.x, enemies[i].pos.y, player.pos.x, player.pos.y);
    if (d < enemies[i].size/2 + player.size/2 - 5) { // Slight forgiveness in hitbox
      player.hit();
      
      // Remove enemy if it hits player
      enemies.splice(i, 1);
      
      continue; // Skip rest of processing for this enemy
    }
    
    // Check for collision with bullets
    for (let j = bullets.length - 1; j >= 0; j--) {
      let hitDist = dist(enemies[i].pos.x, enemies[i].pos.y, bullets[j].pos.x, bullets[j].pos.y);
      if (hitDist < enemies[i].size/2 + bullets[j].r) {
        // Enemy hit by bullet
        if (enemies[i].hit()) {
          // Enemy destroyed
          enemies.splice(i, 1);
          score += 10 * level;
        }
        
        // Remove bullet
        bullets.splice(j, 1);
        break;
      }
    }
  }
  
  // Spawn new enemies periodically and based on density
  enemySpawnCounter++;
  if (enemySpawnCounter >= enemySpawnRate / difficulty) {
    spawnEnemyAtEdge();
    enemySpawnCounter = 0;
  }
  
  if (frameCount % 60 === 0) {
    spawnEnemiesFromDensity();
  }
  
  // Increase difficulty over time
  if (frameCount % 1000 === 0) {
    level++;
    difficulty += 0.1;
  }
  
  // Randomly spawn health pickups
  if (random() < healthPickupChance) {
    spawnHealthPickup();
  }
  
  // Update and display health pickups
  for (let i = healthPickups.length - 1; i >= 0; i--) {
    healthPickups[i].update();
    healthPickups[i].show();
    
    // Check if player collected the health pickup
    let distToPlayer = dist(player.pos.x, player.pos.y, healthPickups[i].pos.x, healthPickups[i].pos.y);
    if (distToPlayer < player.size/2 + healthPickups[i].size/2) {
      // Player collected the health pickup
      player.health = min(player.health + healthPickups[i].value, 100);
      healthPickups.splice(i, 1);
      
      // Play a success sound here if you have one
    }
  }
  
  // Display score and health
  displayHUD();
  
  // Advance the Perlin noise time offset
  zOff += 0.005;
}

/*******************************************************
 *                     GAME FUNCTIONS
 *******************************************************/

/**
 * Display HUD (heads-up display) with score and health
 */
function displayHUD() {
  // Update score and level display
  const healthBarWidth = 150;
  const healthPercent = player.health / 100;
  
  // Update the text display
  document.getElementById('score-display').innerHTML = `
    <div>Score: ${score} | Level: ${level}</div>
    <div class="health-bar-container" style="width: ${healthBarWidth}px; height: 15px; background-color: #333; border: 2px solid #666; margin-top: 5px;">
      <div class="health-bar" style="width: ${healthPercent * 100}%; height: 100%; background-color: ${healthPercent > 0.6 ? '#2ecc71' : healthPercent > 0.3 ? '#f39c12' : '#e74c3c'};">
      </div>
    </div>
  `;
}

/**
 * Display game over screen
 */
function displayGameOver() {
  // Show game over screen
  document.getElementById('game-over-screen').style.display = 'block';
  document.getElementById('final-score').textContent = score;
}

/**
 * Reset the game after game over
 */
function resetGame() {
  // Reset game variables
  score = 0;
  level = 1;
  difficulty = 1.0;
  gameOver = false;
  bullets = [];
  enemies = [];
  healthPickups = [];
  
  // Reset player
  player = new Player();
  
  // Reset enemy spawn counter
  enemySpawnCounter = 0;
  
  // Hide game over screen
  document.getElementById('game-over-screen').style.display = 'none';
  
  // Restart animation loop if it was stopped
  if (!isLooping()) {
    loop();
  }
}

/**
 * Handle window resize
 */
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  w = width;
  h = height;
  
  // Recalculate flow field dimensions
  cols = floor(w / scale);
  rows = floor(h / scale);
  flowField = new Array(cols * rows);
  
  // Update joystick position
  joystick.baseY = h - 80;
}

/**
 * Health Pickup class for creating floating health items
 */
class HealthPickup {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);
    this.size = 20;
    this.value = 25; // Health points restored when collected
    this.pulsePhase = 0;
    
    // Apply a small random velocity
    this.vel = p5.Vector.random2D();
    this.vel.mult(0.5);
  }
  
  update() {
    // Add some slight movement
    let noiseX = noise(this.pos.x * 0.01, this.pos.y * 0.01, frameCount * 0.01) * 0.5 - 0.25;
    let noiseY = noise(this.pos.x * 0.01, this.pos.y * 0.01, frameCount * 0.01 + 500) * 0.5 - 0.25;
    this.acc = createVector(noiseX, noiseY);
    
    this.vel.add(this.acc);
    this.vel.limit(1);
    this.pos.add(this.vel);
    this.acc.mult(0);
    
    // Wrap around screen edges
    if (this.pos.x > width) this.pos.x = 0;
    if (this.pos.x < 0) this.pos.x = width;
    if (this.pos.y > height) this.pos.y = 0;
    if (this.pos.y < 0) this.pos.y = height;
    
    // Update pulse animation
    this.pulsePhase += 0.05;
    if (this.pulsePhase > TWO_PI) {
      this.pulsePhase -= TWO_PI;
    }
  }
  
  show() {
    push();
    translate(this.pos.x, this.pos.y);
    
    // Pulsing effect
    let pulse = sin(this.pulsePhase) * 0.2 + 1;
    let displaySize = this.size * pulse;
    
    // Health pickup glow
    drawingContext.shadowBlur = 15;
    drawingContext.shadowColor = color(0, 255, 0, 200);
    
    // Health pickup visual (red cross)
    noStroke();
    
    // Green circle background
    fill(0, 255, 0, 200);
    ellipse(0, 0, displaySize);
    
    // White cross symbol
    fill(255);
    rectMode(CENTER);
    // Horizontal bar
    rect(0, 0, displaySize * 0.7, displaySize * 0.25, 5);
    // Vertical bar
    rect(0, 0, displaySize * 0.25, displaySize * 0.7, 5);
    
    // Reset shadow
    drawingContext.shadowBlur = 0;
    pop();
  }
}

/**
 * Spawn a health pickup at a random location
 */
function spawnHealthPickup() {
  // Make sure we don't spawn too close to the player
  let x, y;
  let tooClose = true;
  
  while (tooClose) {
    x = random(width);
    y = random(height);
    let d = dist(x, y, player.pos.x, player.pos.y);
    if (d > 150) {
      tooClose = false;
    }
  }
  
  healthPickups.push(new HealthPickup(x, y));
}
