/**
 * Bullet class
 * Represents projectiles fired by the player
 */
class Bullet {
  constructor(x, y, angle) {
    this.pos = createVector(x, y);
    this.vel = p5.Vector.fromAngle(angle);
    this.vel.mult(7); // Bullet speed
    this.r = 6; // Bullet radius
    this.life = 60; // Bullet lifetime in frames
    this.color = color(255, 255, 0);
    this.trail = [];
    this.maxTrailLength = 5;
  }
  
  /**
   * Update bullet position and state
   */
  update() {
    // Add current position to trail
    this.trail.push(createVector(this.pos.x, this.pos.y));
    
    // Limit trail length
    if (this.trail.length > this.maxTrailLength) {
      this.trail.shift();
    }
    
    // Move bullet
    this.pos.add(this.vel);
    
    // Decrease lifetime
    this.life--;
  }
  
  /**
   * Check if bullet should be removed
   */
  offscreen() {
    return (
      this.pos.x < 0 ||
      this.pos.x > width ||
      this.pos.y < 0 ||
      this.pos.y > height ||
      this.life <= 0
    );
  }
  
  /**
   * Draw bullet to the canvas
   */
  show() {
    // Draw trail
    noStroke();
    for (let i = 0; i < this.trail.length; i++) {
      const trailPos = this.trail[i];
      const alpha = map(i, 0, this.trail.length - 1, 50, 200);
      const size = map(i, 0, this.trail.length - 1, this.r * 0.5, this.r);
      
      fill(255, 255, 0, alpha);
      ellipse(trailPos.x, trailPos.y, size);
    }
    
    // Draw bullet
    fill(this.color);
    ellipse(this.pos.x, this.pos.y, this.r * 2);
    
    // Add glow effect
    drawingContext.shadowBlur = 10;
    drawingContext.shadowColor = color(255, 255, 100, 200);
    ellipse(this.pos.x, this.pos.y, this.r * 1.5);
    drawingContext.shadowBlur = 0;
  }
}
