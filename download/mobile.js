/**
 * Mobile controls and responsiveness
 */

// Detect if the device is mobile
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Create fire button for mobile devices
function createFireButton() {
  if (isMobile) {
    const fireButton = document.createElement('button');
    fireButton.id = 'fire-button';
    fireButton.innerText = 'FIRE';
    document.getElementById('game-container').appendChild(fireButton);
    
    // Add event listener
    fireButton.addEventListener('touchstart', function(e) {
      e.preventDefault(); // Prevent default touch action
      if (!gameOver && player) {
        player.shoot();
      }
    });
  }
}

/**
 * Draw the virtual joystick for mobile controls
 */
function drawJoystick() {
  if (!isMobile) return;
  
  // Draw base (outer circle)
  fill(100, 100, 100, 150);
  stroke(200, 200, 200, 200);
  strokeWeight(2);
  ellipse(joystick.baseX, joystick.baseY, joystick.baseRadius * 2);
  
  // Draw knob (inner circle)
  if (joystick.active) {
    fill(150, 150, 250, 200);
  } else {
    fill(150, 150, 150, 200);
  }
  noStroke();
  ellipse(joystick.currentX, joystick.currentY, joystick.knobRadius * 2);
}

/**
 * Handle joystick interaction from touch events
 */
function handleJoystick() {
  // Only process touches meant for the joystick
  // (lower left portion of the screen)
  joystick.active = false;
  
  // Check all current touches
  for (let i = 0; i < touches.length; i++) {
    let touch = touches[i];
    
    // If touch is in the joystick area (lower left)
    if (touch.x < width/3 && touch.y > height/2) {
      joystick.active = true;
      
      // Calculate how far the touch point can move from base
      let maxDistance = joystick.baseRadius;
      
      // Get direction vector from base to touch
      let dirX = touch.x - joystick.baseX;
      let dirY = touch.y - joystick.baseY;
      
      // Calculate distance
      let distance = sqrt(dirX * dirX + dirY * dirY);
      
      // If the touch is beyond the max distance, scale it back
      if (distance > maxDistance) {
        let scale = maxDistance / distance;
        dirX *= scale;
        dirY *= scale;
      }
      
      // Update joystick position
      joystick.currentX = joystick.baseX + dirX;
      joystick.currentY = joystick.baseY + dirY;
      break;
    }
  }
  
  // If no valid touch is found, reset joystick to base position
  if (!joystick.active) {
    joystick.currentX = joystick.baseX;
    joystick.currentY = joystick.baseY;
  }
}

/**
 * Handle keyboard shooting (for desktop)
 * @param {KeyboardEvent} event - The keyboard event
 */
function handleKeyPress(event) {
  // Space bar or Enter to shoot
  if ((event.code === 'Space' || event.code === 'Enter') && !gameOver && player) {
    player.shoot();
  }
  
  // R key to restart if game is over
  if (event.code === 'KeyR' && gameOver) {
    resetGame();
  }
}

/**
 * Resize the game based on window dimensions
 */
function windowResized() {
  // Resize canvas to fill window
  resizeCanvas(windowWidth, windowHeight);
  
  // Update the dimensions
  w = width;
  h = height;
  
  // Recalculate flow field grid
  cols = floor(w / scale);
  rows = floor(h / scale);
  flowField = new Array(cols * rows);
  
  // Update joystick position for mobile
  joystick.baseX = 80;
  joystick.baseY = h - 80;
  joystick.currentX = joystick.baseX;
  joystick.currentY = joystick.baseY;
  
  // Update player position
  if (player && player.pos) {
    // Keep player in center when resizing
    player.pos.x = constrain(player.pos.x, 0, width);
    player.pos.y = constrain(player.pos.y, 0, height);
  }
}
