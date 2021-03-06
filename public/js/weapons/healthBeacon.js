function HealthBeacon(x, y, col, owner, id) {
  this.x = x;
  this.y = y;
  this.colour = col;
  this.id = id;
  this.owner = owner;
  this.health = 1000;
  this.w = 30;
  this.radius = 220;
  this.image = loadImage('/assets/healthBeacon.png');
  this.angle = 0;
  this.speed = 0;

  this.show = function() {
    noStroke();
    fill(this.colour);
    ellipse(this.x, this.y, 8, 8);

    push();
    translate(this.x, this.y);

    stroke(this.colour);
    noFill();
    strokeWeight(2);
    arc(0, 0, this.w, this.w, 0, map(this.health, 0, 1000, 0, TWO_PI));

    rotate(this.angle);
    imageMode(CENTER);
    image(this.image, 0, 0, this.w, this.w);
    pop();
  };

  this.update = function() {
    this.speed = 0;
    if (!pause.paused) {
      if (this.colour == tank.colour) {
        var d = dist(this.x, this.y, tank.pos.x, tank.pos.y);
        if (d < this.radius) {
          tank.health += map(d, 0, this.radius, 0.07, 0);
          this.speed = map(d, 0, this.radius, 0.15, 0.01);
        }
      }
    }
    if(this.health < 999){
      this.health += 0.03;
    }
    this.angle -= this.speed;
  };

  this.checkDeath = function() {
    if (this.health <= 0) {
      particleEffects.push(new ParticleEffect(this.x, this.y, this.colour));
      if (this.colour == tank.colour) {
        simpleNotify("Your team's Health Beacon has been destroyed");
      }
      for (var i = 0; i < 4; i++) {
        this.dropHealthPacket();
      }
      this.remove();
      return true;
    }
  };

  this.remove = function () {
    var removeData = {
      type: 'healthBeaconRemove',
      id: this.id
    };
    socket.emit('weapon', removeData);

    tank.weaponManager.healthBeacons.splice(
      tank.weaponManager.healthBeacons.indexOf(this),
      1
    );
  }

  this.dropHealthPacket = function() {
    var data = {
      x: this.x + random(-20, 20),
      y: this.y + random(-20, 20),
      name: this.owner,
      col: 'white',
      type: 'healthPacket',
      size: 30
    };
    data.id = generateId();
    var hp = new HealthPacket(
      data.x,
      data.y,
      data.name,
      data.col,
      data.id,
      data.size
    );
    socket.emit('weapon', data);
    tank.weaponManager.healthPackets.push(hp);
  };


  this.hitByBullet = function (b) {
    if (b.col != this.colour) {
      this.health -= b.damage;
      if (this.health <= 0) {
        if (b.name == tank.name) {
          tank.health += 30;
          tank.coins += 40;
          notify("You destoyed " + this.owner + "'s health beacon", 150, this.colour, width - width / 3)
        }
        this.remove();
      }
      return true;
    }
  }

  this.remove = function () {
    var data = {
      id: this.id,
      type: "healthBeaconRemove",
    }
    socket.emit('weapon', data);
    particleEffects.push(new ParticleEffect(this.x, this.y, this.colour));
    tank.weaponManager.healthBeacons.splice(tank.weaponManager.healthBeacons.indexOf(this), 1);
  }
}

function removeAllHealthBeacons() {
  for(var i = tank.weaponManager.healthBeacons.length -1; i >= 0; i--){
    tank.weaponManager.healthBeacons[i].remove();
  }
}
