
var AlienFlock = function AlienFlock() {
  this.invulnrable = true;
  this.dx = 10; this.dy = 0;
  this.hit = 1; this.lastHit = 0;
  this.speed = 10; //speed of aliens

  this.draw = function() {};

//all aliens dead
  this.die = function() {
    if(Game.board.nextLevel()) {
      Game.loadBoard(new GameBoard(Game.board.nextLevel())); 
    } else {
      Game.callbacks['win']();
    }
  }

  this.step = function (dt) { 
    if(this.hit && this.hit != this.lastHit) {
      this.lastHit = this.hit;
      this.dy = this.speed;
    } else {
      this.dy=0;
    }
    this.dx = this.speed * this.hit;

    var max = {}, cnt = 0;
    this.board.iterate(function() {
      if(this instanceof Alien)  {
        if(!max[this.x] || this.y > max[this.x]) {
          max[this.x] = this.y; 
        }
        cnt++;
      } 
    });

    if(cnt == 0) { this.die(); } 

    this.max_y = max;
    return true;
  };

}


//draws the group of aliens
var Alien = function Alien(opts) {
  this.flock = opts['flock'];
  this.frame = 0;
  this.mx = 0;
}

// Aliens being drawn on canvas
Alien.prototype.draw = function(canvas) {
  Sprites.draw(canvas,this.name,this.x,this.y,this.frame);
}

// When an alien hit the sound is triggered and alien removed from the canvas.
Alien.prototype.die = function() {
  GameAudio.play('die');
  this.flock.speed += 1; //speeding up
  this.board.remove(this);
}

// Aliens moving on the axis X and when hit the end move one field down on axis Y
Alien.prototype.step = function(dt) {
  this.mx += dt * this.flock.dx;
  this.y += this.flock.dy;
  if(Math.abs(this.mx) > 10) {
    if(this.y == this.flock.max_y[this.x]) {
      this.fireSometimes();
    }
    this.x += this.mx;
    this.mx = 0;
    this.frame = (this.frame+1) % 1;
    if(this.x > Game.width - Sprites.map.alien1.w * 2) this.flock.hit = -1;
    if(this.x < Sprites.map.alien1.w) this.flock.hit = 1;
  }
  return true;
}

//Alien fireing on random bases
Alien.prototype.fireSometimes = function() {
      if(Math.random()*100 < 10) {
        this.board.addSprite('missile',this.x + this.w/2 - Sprites.map.missile.w/2,
                                      this.y + this.h, 
                                     { dy: 100 }); //speed of alien's missile
      }
}

var Player = function Player(opts) { 
  this.reloading = 0;
}

//draws player 
Player.prototype.draw = function(canvas) {
   Sprites.draw(canvas,'player',this.x,this.y);
}

//when player dies audio plays and restart screen apears.
Player.prototype.die = function() {
  GameAudio.play('die');
  Game.callbacks['die']();
}

//speed and movement of the player
Player.prototype.step = function(dt) {
  if(Game.keys['left']) { this.x -= 100 * dt; } //speed and movement left key
  if(Game.keys['right']) { this.x += 100 * dt; } //speed and movement right key

  if(this.x < 0) this.x = 0;
  if(this.x > Game.width-this.w) this.x = Game.width-this.w;

  if(Game.keys['up']) { this.y -= 100 * dt; } //speed movement up key
  if(Game.keys['down']) { this.y += 100 * dt; } //speed movement down key

  if(this.y < 0) this.y = 0;
  if(this.y > Game.height-this.h) this.x = Game.height-this.h;

    
  this.reloading--;

//reloading and number of missiles able to fire, fire audio
  if(Game.keys['fire'] && this.reloading <= 0 && this.board.missiles < 50) {
    GameAudio.play('fire');
    this.board.addSprite('missile',
                          this.x + this.w/2 - Sprites.map.missile.w/2,
                          this.y-this.h,
                          { dy: -100, player: true }); //speed of missile
    this.board.missiles++; //add missile after each firing
    this.reloading = 10;
  }
  return true;
}


var Missile = function Missile(opts) {
   this.dy = opts.dy;
   this.player = opts.player;
}

//draws the missiles on the canvas
Missile.prototype.draw = function(canvas) {
   Sprites.draw(canvas,'missile',this.x,this.y);
}

//when alian is hit it is killed
Missile.prototype.step = function(dt) {
   this.y += this.dy * dt;

   var enemy = this.board.collide(this);
   if(enemy) { 
     enemy.die();
     return false;
   }
   return (this.y < 0 || this.y > Game.height) ? false : true;
}

Missile.prototype.die = function() {
  if(this.player) this.board.missiles--;
  if(this.board.missiles < 0) this.board.missiles=0;
   this.board.remove(this);
}
