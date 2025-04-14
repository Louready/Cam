/**
 * Enemy class
 * Represents threats that follow the flow field and target the player
 */
class Enemy {
  constructor(x, y, size = null) {
    this.pos = createVector(x, y);
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);
    this.size = size || random(20, 35); // Enemy size (diameter)
    this.speed = map(this.size, 20, 35, 1.5, 0.8); // Smaller enemies move faster
    this.health = ceil(this.size / 10); // Health based on size
    this.maxHealth = this.health;
    this.color = color(255, 0, 0);
    this.pulsePhase = random(TWO_PI); // For pulsing animation
  }
  
  /**
   * Apply force to the enemy
   */
  applyForce(force) {
    this.acc.add(force);
  }
  
  /**
   * Update enemy position and behavior
   */
  update() {
    // Follow flow field
    let x = floor(this.pos.x / scale);
    let y = floor(this.pos.y / scale);
    
    // Make sure we're within bounds
    x = constrain(x, 0, cols - 1);
    y = constrain(y, 0, rows - 1);
    
    let index = x + y * cols;
    let angle = flowField[index];
    let force = p5.Vector.fromAngle(angle);
    force.mult(0.5); // Flow field influence
    
    // Add attraction towards player
    let dirToPlayer = p5.Vector.sub(player.pos, this.pos);
    let distToPlayer = dirToPlayer.mag();
    
    // Only start seeking the player when within a certain range
    if (distToPlayer < 250) {
      dirToPlayer.normalize();
      dirToPlayer.mult(0.3); // Player attraction influence
      force.add(dirToPlayer);
    }
    
    this.applyForce(force);
    
    // Physics update
    this.vel.add(this.acc);
    this.vel.limit(this.speed);
    this.pos.add(this.vel);
    this.acc.mult(0);
    
    // Handle screen wrapping
    this.edges();
    
    // Update pulse animation
    this.pulsePhase += 0.1;
    if (this.pulsePhase > TWO_PI) {
      this.pulsePhase -= TWO_PI;
    }
  }
  
  /**
   * Wrap enemy around screen edges
   */
  edges() {
    if (this.pos.x > width) this.pos.x = 0;
    if (this.pos.x < 0) this.pos.x = width;
    if (this.pos.y > height) this.pos.y = 0;
    if (this.pos.y < 0) this.pos.y = height;
  }
  
  /**
   * Draw enemy to the canvas
   */
  show() {
    push();
    translate(this.pos.x, this.pos.y);
    
    // Pulsing effect
    let pulse = sin(this.pulsePhase) * 0.1 + 1;
    let displaySize = this.size * pulse;
    
    // Health indicator as ring around enemy
    let healthPercent = this.health / this.maxHealth;
    noFill();
    strokeWeight(3);
    stroke(255, 0, 0, 100);
    arc(0, 0, displaySize + 10, displaySize + 10, 0, TWO_PI * healthPercent);
    
    // Main enemy body
    noStroke();
    fill(255, 0, 0, 200);
    ellipse(0, 0, displaySize);
    
    // Inner pattern
    fill(255, 100, 100, 150);
    let innerSize = displaySize * 0.6;
    ellipse(0, 0, innerSize);
    
    pop();
  }
  
  /**
   * Handle getting hit by a bullet
   */
  hit() {
    this.health--;
    // Return true if enemy is destroyed
    return this.health <= 0;
  }
}

/**
 * Spawn enemies based on particle density in the flow field
 */
function spawnEnemiesFromDensity() {
  // Create a density map
  let densityMap = new Array(cols * rows).fill(0);
  
  // Count particles in each cell
  particles.forEach(p => {
    let { x, y } = p.getGridCell();
    let index = x + y * cols;
    if (index >= 0 && index < densityMap.length) {
      densityMap[index]++;
    }
  });
  
  // Threshold for spawning (higher value = less enemies)
  let threshold = 4;
  let enemiesSpawned = 0;
  let maxSpawns = 2; // Maximum enemies to spawn per call
  
  // Find cells with high density
  for (let i = 0; i < densityMap.length; i++) {
    if (densityMap[i] > threshold && random() < 0.2) {
      // Calculate the position
      let x = (i % cols) * scale + scale/2;
      let y = floor(i / cols) * scale + scale/2;
      
      // Don't spawn too close to the player
      let distToPlayer = dist(x, y, player.pos.x, player.pos.y);
      if (distToPlayer > 150) {
        // Create a new enemy
        enemies.push(new Enemy(x, y));
        enemiesSpawned++;
        
        // Limit the number of enemies spawned at once
        if (enemiesSpawned >= maxSpawns) {
          break;
        }
      }
    }
  }
}

/**
 * Spawn enemies at random edges of the screen
 */
function spawnEnemyAtEdge() {
  let x, y;
  let side = floor(random(4));
  
  switch(side) {
    case 0: // Top
      x = random(width);
      y = 0;
      break;
    case 1: // Right
      x = width;
      y = random(height);
      break;
    case 2: // Bottom
      x = random(width);
      y = height;
      break;
    case 3: // Left
      x = 0;
      y = random(height);
      break;
  }
  
  enemies.push(new Enemy(x, y));
}
