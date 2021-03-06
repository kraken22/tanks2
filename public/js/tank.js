var tank;
var tanks = [];

function showTanks() {
  for (var i = 0; i < tanks.length; i++) {
    if (tanks[i].id != tank.id) {
      tanks[i].show();
    }
  }
}

function Tank() {
  this.pos = createVector(
    random(-fullWidth / 2, fullWidth / 2),
    random(-fullHeight / 2, fullHeight / 2)
  );
  this.previousPos = this.pos.copy();
  this.viewPos = this.pos.copy();
  this.dir = 0;
  this.gunDir = 0;
  this.speed = 0;
  this.dirVel = 0;
  this.gunDirVel = 0;
  this.useAi = false;
  this.speedMultiplyer = 1;

  this.w = 25.5;
  this.h = 30;

  this.id = '';

  this.colour = Cookies.get('tank_colour');
  if (this.colour == undefined) {
    var colours = colourArray.slice();
    var col = colours[Math.floor(random(4))];
    console.log(col);
    this.colour = col;
  }

  this.health = 100;
  this.maxHealth = 150;

  this.coins = 0;

  this.name = Cookies.get('name');
  if (this.name == undefined) {
    this.name = generateName();
  }
  this.displayName = generateName();

  //Weaponry
  this.gun = new Gun();
  this.weaponManager = new WeaponManager();
  this.ai = new AI();

  this.update = function() {
    // UPDATE VARIABLES
    this.pos.x += this.speed * sin(this.dir);
    this.pos.y -= this.speed * cos(this.dir);
    this.dir += this.dirVel;
    this.gunDir += this.gunDirVel;
    this.respawnTimer--;
    this.boostTimer--;

    team.payForFlags();

    // SMOOTHEN TANK MOVEMENT
    this.viewPos.x = lerp(this.viewPos.x, this.pos.x, 0.6);
    this.viewPos.y = lerp(this.viewPos.y, this.pos.y, 0.6);

    // CHECKING
    this.collisions();

    // RESET VARIABLES
    this.speed = 0;
    this.dirVel = 0;
    this.gunDirVel = 0;
    this.useAi = false;
    if (this.speedMultiplyer <= 0.9) {
      this.speedMultiplyer += 0.1;
    } else if (this.speedMultiplyer >= 1.1) {
      this.speedMultiplyer -= 0.1;
    } else {
      this.speedMultiplyer = 1;
    }

    if (this.health > this.maxHealth) {
      this.health = this.maxHealth;
    }

    // UPDATE WEAPONRY
    this.gun.update();
    if (this.useAi) {
      this.ai.update();
    }
  };

  this.show = function() {
    push();
    imageMode(CENTER);
    translate(this.viewPos.x, this.viewPos.y);

    // SHOW HEALTH BAR
    fill(color(this.colour));
    noStroke();
    rectMode(CENTER);
    rect(0, -30, map(this.health, 0, 100, 0, 30), 1.6);
    if (this.health > this.maxHealth - 25) {
      rect(-map(this.health, 0, 100, 0, 30) / 2, -30, 1.6, 3.8, 100);
      rect(map(this.health, 0, 100, 0, 30) / 2, -30, 1.6, 3.8, 100);
    }
    // SHOW NAME
    fill(120);
    textAlign(CENTER, CENTER);
    textSize(8);
    text(this.name, 0, -36);

    this.gun.showReloadTimers();

    // SHOW TANK
    rotate(this.dir);
    image(this.image, 0, 0, this.w, this.h);
    rotate(this.gunDir);
    image(this.gunImage, 0, -this.w / 4, this.w, this.h);
    pop();
    if (this.useAi) {
      this.ai.show();
    }
  };

  // =========================== COLLISIONS =========================== //

  this.collisions = function() {
    this.pos.x = constrain(this.pos.x, -fullWidth / 2, fullWidth / 2);
    this.pos.y = constrain(this.pos.y, -fullHeight / 2, fullHeight / 2);

    var hit = false;
    var touchingWalls =[];
    for (var i = 0; i < walls.length; i++) {
      if (walls[i].tankColliding(this.pos)) {
        hit = true;
        touchingWalls.push(walls[i]);
      }
    }
    for (var i = 0; i < this.weaponManager.bridges.length; i++) {
      if (this.weaponManager.bridges[i].colour != this.colour) {
        if (this.weaponManager.bridges[i].colliding()) {
          hit = true;
        }
      } else {
        if (
          this.weaponManager.bridges[i].colliding() &&
          !this.weaponManager.bridges[i].onRoad()
        ) {
          hit = true;
        }
      }
    }
    //

    this.ai.colliding = hit;

    if (hit) {
      // for(var j = 0; j < touchingWalls.length; j++){
      //   var wall = touchingWalls[j];
      //   if(wall){
      //     var c = distanceCollideLineCircle(wall.x1, wall.y1, wall.x2, wall.y2, this.pos.x, this.pos.y, this.h);
      //     var v = createVector(this.pos.x - c.x, this.pos.y - c.y);
      //     v.setMag(c.d);
      //     this.pos.add(v);
      //
      //     if(c.d > 2){
      //       this.pos.set(this.previousPos);
      //     }else{
      //       this.previousPos.set(this.pos);
      //     }
      //   }else {
      //     this.pos.set(this.previousPos);
      //   }
      // }
      //old collisions :
      this.pos.set(this.previousPos);
    } else {
      this.previousPos.set(this.pos);
    }
  };

  // =================== DEATH AND HEALTH FUNCTIONS ======================== //

  this.death = function(name) {
    var deathData = {
      killerName: name,
      victimName: this.name,
      victimX: this.pos.x,
      victimY: this.pos.y
    };
    socket.emit('death', deathData);
    this.health = 100;
    this.getSpawnPoint();
    this.previousPos.set(this.pos);
    pause.deathScreen.toggleDeathScreen(name);
    if (name == this.name || name == 'lava') {
      if (this.coins > 200) {
        this.coins -= 200;
      } else {
        this.coins = 0;
      }
    }
  };

  this.checkDeath = function(name) {
    if (this.health <= 0) {
      this.death(name);
    }
  };

  this.kill = function(name) {
    notify('You killed ' + name, 200, this.colour, width / 2);
    if (name != tank.name) {
      switch (team.getTeamPlayers(this.colour)) {
        case 1:
          this.health += 70;
          this.coins += 150;
          break;
        case 2:
          this.health += 50;
          this.coins += 120;
          break;
        default:
          this.health += 30;
          this.coins += 80;
          break;
      }
    } else {
      // this.weaponManager.landmineAmount -= 2;
      // this.weaponManager.bombAmount -= 2;
      // this.weaponManager.blastAmount -= 2;
    }
  };

  this.teamKill = function(name) {
    notify(
      'Your team gunner killed ' + name,
      200,
      this.colour,
      width - width / 3
    );
    this.health += 30;
    this.coins += 20;
  };

  this.removeHealth = function(amount) {
    if (!pause.paused) {
      this.health -= amount;
    }
  };

  // =================== VISUAL FUNCTIONS ======================== //

  this.loadImages = function(col) {
    this.colour = col;
    this.image = loadImage('./assets/' + this.colour + '_body.png');
    this.gunImage = loadImage('./assets/' + this.colour + '_gun.png');
  };
  this.loadImages(this.colour);

  this.changeName = function(name) {
    if (name != null && name != undefined && name.length > 2) {
      this.name = name;
      Cookies.set('name', name);
      window.location.reload();
    } else {
      simpleNotify('invalid name');
    }
  };

  this.removeName = function() {
    Cookies.remove('name');
    window.location.reload();
  };

  this.setColour = function() {
    var colourAllowed = team.allowColour(tank.colour);
    if (colourAllowed) {
      return;
    } else {
      var colours = colourArray.slice();
      while (!colourAllowed) {
        col = colours[Math.floor(random(4))];
        colourAllowed = team.allowColour(col);
      }
      tank.loadImages(col);
    }
  };

  // =================== SPAWN FUNCTIONS ======================== //
  this.getSpawnPoint = function() {
    if (team.getFlagCount() > 0) {
      var myFlags = [];
      for (var i = 0; i < flags.length; i++) {
        if (flags[i].colour == this.colour) {
          myFlags.push(flags[i]);
        }
      }
      var randomFlag = myFlags[floor(random(myFlags.length))];
      tank.pos.set(randomFlag.x,randomFlag.y);
    } else {
      var spawnSafe = false;
      while (spawnSafe == false) {
        this.pos.set(
          random(-fullWidth / 2, fullWidth / 2),
          random(-fullHeight / 2, fullHeight / 2)
        );
        console.log('not safe');
        spawnSafe = true;
        for (var i = 0; i < waters.length; i++) {
          if (waters[i].tankColliding(this.pos)) {
            spawnSafe = false;
          }
        }
        for (var i = 0; i < walls.length; i++) {
          if(walls[i].tankColliding(this.pos)){
            spawnSafe = false;
          }
        }
      }
    }
  };
  setTimeout(function() {
    tank.getSpawnPoint();
    tank.setColour();
    connected = true;
    pause.paused = false;
  }, 400);
}
