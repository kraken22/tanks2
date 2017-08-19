var bullets = [];

function showBullets() {
  for (var i = bullets.length-1; i >= 0; i--) {
    bullets[i].show();
    bullets[i].update();
  }
}

function Bullet(x, y, dir, id, type, col) {
  this.x = x;
  this.y = y;
  this.dir = dir;
  this.id = id;
  this.col = col;
  this.type = type;
  if(type == 1){
    this.speed = 5;
    this.r = 4;
    this.damage = 3;
  }else if (type == 2) {
    this.speed = 4;
    this.r = 8;
    this.damage = 12;
  }

  this.update = function () {
    this.x += this.speed * sin(this.dir);
    this.y -= this.speed * cos(this.dir);
    this.collisions();
    this.deleteOffScreen();
  }

  this.collisions = function () {
    // Splice if hitting wall
    for (var i = 0; i < walls.length; i++) {
      if (walls[i].bulletColliding(this.x, this.y, 20)) {
        bullets.splice(bullets.indexOf(this), 1);
        return;
      }
    }
    // Splice and apply damage if hitting tank
    if(this.id != tank.id){
      if (collideRectCircle(tank.pos.x - tank.w/2, tank.pos.y - tank.h/2, tank.w, tank.h, this.x, this.y, this.r/2)) {
        tank.health -= this.damage;
        tank.pos.x += this.type**2*sin(this.dir);
        tank.pos.y -= this.type**2*cos(this.dir);
        bullets.splice(bullets.indexOf(this), 1);
        console.log('hit myself');
        return;
      }
    }
    // Splice if hitting other tank
    for (var i = 0; i < tanks.length; i++) {
      if (this.id != tanks[i].id) {
        if (collideRectCircle(tanks[i].pos.x - tanks[i].w/2, tanks[i].pos.y - tanks[i].h/2, tanks[i].w, tanks[i].h, this.x, this.y, this.r/2)) {
          bullets.splice(bullets.indexOf(this), 1);
          console.log('other hit');
          return;
        }
      }
    }
  }

  this.deleteOffScreen = function () {
    if(this.x < 0 || this.x > width || this.y < 0 || this.y > height){
      bullets.splice(bullets.indexOf(this), 1);
    }
  }

  this.show = function () {
    fill(this.col);
    noStroke();
    ellipse(this.x, this.y, this.r, this.r);
  }
}

function Gun() {
  this.type = 1;
  this.reload1 = 0;
  this.reload2 = 0;
  this.shoot = function () {
    if(this.reload1 <= 0 && this.type == 1){
      this.reload1 = 6;
    } else if(this.reload2 <= 0 && this.type == 2){
      this.reload2 = 50;
    }else{
      return;
    }
    var bulletData = {
      x: tank.pos.x + 20*sin(tank.gunDir+tank.dir),
      y: tank.pos.y - 20*cos(tank.gunDir+tank.dir),
      dir: tank.gunDir + tank.dir,
      id: tank.id,
      type: this.type,
      col: tank.colour
    }
    bullets.push(new Bullet(bulletData.x, bulletData.y, bulletData.dir, bulletData.id, bulletData.type, bulletData.col));
    socket.emit('bullet', bulletData);

    // Recoil effect
    tank.pos.x -= this.type**2*sin(tank.gunDir+tank.dir);
    tank.pos.y += this.type**2*cos(tank.gunDir+tank.dir);
  }

  this.update = function () {
    this.reload1 --;
    this.reload2 --;
  }
}
