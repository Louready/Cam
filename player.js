/**
 * Player class
 * Represents the player character with camera feed as avatar
 */
class Player {
  constructor() {
    this.pos = createVector(width/2, height/2);
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);
    this.angle = 0;
    this.size = 50; // Diameter of the player circle
    this.maxSpeed = 3;
    this.friction = 0.97; // Slows the player down over time
    this.health = 100;
    this.lastShotTime = 0;
    this.shotCooldown = 300; // Milliseconds between shots
    this.invincible = false;
    this.invincibleDuration = 0;
  }
  
  /**
   * Apply force to the player
   */
  applyForce(force) {
    this.acc.add(force);
  }
  
  /**
   * Update player's position and state
   */
  update() {
    // Handle joystick input on mobile
    if (joystick.active) {
      let dir = createVector(
        joystick.currentX - joystick.baseX, 
        joystick.currentY - joystick.baseY
      );
      
      if (dir.mag() > 10) { // Threshold to prevent tiny movements
        this.angle = dir.heading();
        
        // Scale force based on joystick displacement
        let forceMag = map(dir.mag(), 0, joystick.baseRadius, 0, 0.2);
        let force = p5.Vector.fromAngle(this.angle).mult(forceMag);
        this.applyForce(force);
      }
    }
    
    // Handle keyboard input for desktop
    if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) { // Left arrow or A
      this.angle -= 0.1;
    }
    if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) { // Right arrow or D
      this.angle += 0.1;
    }
    if (keyIsDown(UP_ARROW) || keyIsDown(87)) { // Up arrow or W
      let force = p5.Vector.fromAngle(this.angle).mult(0.2);
      this.applyForce(force);
    }
    
    // Physics update
    this.vel.add(this.acc);
    this.vel.limit(this.maxSpeed);
    this.pos.add(this.vel);
    this.vel.mult(this.friction);
    this.acc.mult(0);
    
    // Handle screen wrapping
    this.edges();
    
    // Update invincibility duration
    if (this.invincible) {
      this.invincibleDuration--;
      if (this.invincibleDuration <= 0) {
        this.invincible = false;
      }
    }
  }
  
  /**
   * Wrap player around screen edges
   */
  edges() {
    if (this.pos.x > width) this.pos.x = 0;
    if (this.pos.x < 0) this.pos.x = width;
    if (this.pos.y > height) this.pos.y = 0;
    if (this.pos.y < 0) this.pos.y = height;
  }
  
  /**
   * Draw player to the canvas, using webcam feed
   */
  show() {
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.angle + PI/2); // Rotate to face direction of movement
    
    // Create a pulsing effect when invincible
    let playerSize = this.size;
    if (this.invincible) {
      let pulseFactor = map(sin(frameCount * 0.2), -1, 1, 0.9, 1.1);
      playerSize *= pulseFactor;
      
      // Draw a shield effect
      noFill();
      stroke(100, 200, 255, 100);
      strokeWeight(3);
      ellipse(0, 0, playerSize * 1.3);
    }
    
    // Clip the video feed into a circle
    drawingContext.save();
    drawingContext.beginPath();
    drawingContext.arc(0, 0, playerSize/2, 0, TWO_PI);
    drawingContext.clip();
    
    // Draw the video
    if (video && video.loadedmetadata) {
      // Calculate offset to center the video in the player circle
      let videoRatio = video.width / video.height;
      let vidW, vidH;
      
      if (videoRatio >= 1) {
        // Landscape or square video
        vidH = playerSize;
        vidW = vidH * videoRatio;
      } else {
        // Portrait video
        vidW = playerSize;
        vidH = vidW / videoRatio;
      }
      
      image(video, -vidW/2, -vidH/2, vidW, vidH);
    } else {
      // Fallback if video isn't ready
      fill(200, 100, 100);
      ellipse(0, 0, playerSize);
    }
    
    drawingContext.restore();
    
    // Draw direction indicator
    if (!this.invincible) {
      fill(255, 255, 0);
      triangle(
        playerSize/2, 0,
        playerSize/2 + 10, -5,
        playerSize/2 + 10, 5
      );
    }
    
    pop();
  }
  
  /**
   * Create a new bullet
   */
  shoot() {
    let currentTime = millis();
    
    // Check if enough time has passed since last shot
    if (currentTime - this.lastShotTime >= this.shotCooldown) {
      this.lastShotTime = currentTime;
      
      // Create a bullet from player's position and angle
      let bullet = new Bullet(this.pos.x, this.pos.y, this.angle);
      bullets.push(bullet);
      
      // Return true to indicate success
      return true;
    }
    
    // Return false if we couldn't shoot
    return false;
  }
  
  /**
   * Handle collision with enemy
   */
  hit() {
    if (!this.invincible) {
      // Reduce health by 10 points instead of 20 for more gradual damage
      this.health -= 10;
      
      // Game over if health is depleted
      if (this.health <= 0) {
        gameOver = true;
        return;
      }
      
      // Become temporarily invincible
      this.invincible = true;
      this.invincibleDuration = 90; // Increased frames of invincibility to give player more recovery time
      
      // Visual feedback for being hit
      this.vel.mult(-1.5); // Knockback effect
    }
  }
}
