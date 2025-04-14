/**
 * Particle class for creating smoke-like effects
 * Each particle follows the flow field and renders as a colored dot
 */
class Particle {
  constructor() {
    this.pos = createVector(random(width), random(height));
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);
    this.r = random(2, 5);
    
    // Create random but harmonious colors for particles
    const baseHue = random(360);
    const baseBrightness = random(50, 90);
    
    colorMode(HSB, 360, 100, 100, 100);
    this.color = color(
      baseHue,
      random(40, 80),
      baseBrightness,
      random(30, 70)
    );
    colorMode(RGB, 255, 255, 255, 255);
  }
  
  /**
   * Apply force from the flow field to the particle
   */
  follow(flowField) {
    let x = floor(this.pos.x / scale);
    let y = floor(this.pos.y / scale);
    
    // Make sure we're within bounds of the flow field
    x = constrain(x, 0, cols - 1);
    y = constrain(y, 0, rows - 1);
    
    let index = x + y * cols;
    let angle = flowField[index];
    let force = p5.Vector.fromAngle(angle);
    force.setMag(maxSpeed * 0.3);
    this.applyForce(force);
  }
  
  /**
   * Add force to acceleration
   */
  applyForce(force) {
    this.acc.add(force);
  }
  
  /**
   * Update particle position
   */
  update() {
    this.vel.add(this.acc);
    this.pos.add(this.vel);
    this.vel.limit(maxSpeed);
    this.acc.mult(0);
  }
  
  /**
   * Wrap particle around edges of the screen
   */
  edges() {
    if (this.pos.x > width) this.pos.x = 0;
    if (this.pos.x < 0) this.pos.x = width;
    if (this.pos.y > height) this.pos.y = 0;
    if (this.pos.y < 0) this.pos.y = height;
  }
  
  /**
   * Draw particle to the canvas
   */
  show() {
    noStroke();
    fill(this.color);
    ellipse(this.pos.x, this.pos.y, this.r * 2);
  }
  
  /**
   * Get the current grid cell of the particle
   */
  getGridCell() {
    let x = floor(this.pos.x / scale);
    let y = floor(this.pos.y / scale);
    
    // Make sure we're within bounds
    x = constrain(x, 0, cols - 1);
    y = constrain(y, 0, rows - 1);
    
    return { x, y };
  }
}

/**
 * Create a swirl effect in the flow field centered at (mx, my)
 */
function applySwirl(flowField, mx, my) {
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let centerX = x * scale + scale / 2;
      let centerY = y * scale + scale / 2;
      let d = dist(mx, my, centerX, centerY);
      
      if (d < swirlRadius) {
        let index = x + y * cols;
        let angle = flowField[index];
        
        // Apply more swirl effect the closer we are to the center
        let swirl = swirlStrength * (1 - d / swirlRadius);
        flowField[index] = angle + swirl;
      }
    }
  }
  
  return flowField;
}

/**
 * Update the flow field using Perlin noise
 */
function updateFlowField() {
  let yOff = 0;
  for (let y = 0; y < rows; y++) {
    let xOff = 0;
    for (let x = 0; x < cols; x++) {
      let index = x + y * cols;
      let angle = noise(xOff, yOff, zOff) * TWO_PI * 2;
      flowField[index] = angle;
      xOff += inc;
    }
    yOff += inc;
  }
  
  return flowField;
}
