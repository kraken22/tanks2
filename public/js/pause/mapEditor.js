function MapEditor() {
  this.currentWall = [];
  this.allWalls = [];
  this.active = false;
  this.eraser = false;
  this.menu = new MapEditorMenu();
  this.syncedWalls = [];
  this.showMenu = true;

  this.viewScale = width / fullWidth;

  this.show = function () {
    push()
    translate(width / 2, height / 2);
    scale(this.viewScale);
    noStroke();
    fill(20);
    rect(-fullWidth / 2, -fullHeight / 2, fullWidth, fullHeight);
    stroke(100);
    strokeWeight(15);
    for (var j = 0; j < this.allWalls.length; j++) {
      for (var i = 0; i < this.allWalls[j].length - 1; i++) {
        line(this.allWalls[j][i].x, this.allWalls[j][i].y, this.allWalls[j][i + 1].x, this.allWalls[j][i + 1].y);
      }
    }
    stroke(140);
    fill(140);
    if (this.currentWall.length == 1) {
      noStroke();
      ellipse(this.currentWall[0].x, this.currentWall[0].y, 15, 15);
    }
    for (var i = 0; i < this.currentWall.length - 1; i++) {
      line(this.currentWall[i].x, this.currentWall[i].y, this.currentWall[i + 1].x, this.currentWall[i + 1].y);
    }

    if (this.eraser) {
      stroke(255, 0, 0);
      strokeWeight(3);
      line(this.grmp().x - 10, this.grmp().y - 10, this.grmp().x + 10, this.grmp().y + 10);
      line(this.grmp().x + 10, this.grmp().y - 10, this.grmp().x - 10, this.grmp().y + 10);
    }

    pop();


    if (this.showMenu) {
      this.menu.show();
    }
  }

  this.grmp = function () {
    return {
      x: mouseX / (this.viewScale) - width / 1,
      y: mouseY / (this.viewScale) - height / 1
    }
  }

  this.changeMode = function () {
    if (this.active) {
      this.currentWall = [];
      pause.onHomeScreen = true;
      this.active = false;
    } else {
      this.loadLines();
      pause.onHomeScreen = false;
      this.active = true;
    }
  }

  this.addLine = function () {
    if (this.eraser) {
      this.menu.buttons[3].active = false;
      this.eraser = false;
    }
    if (this.currentWall.length > 1) {
      this.allWalls.push(this.currentWall);
    }
    this.currentWall = [];
  }

  this.addPoint = function () {
    this.currentWall.push({
      x: this.grmp().x,
      y: this.grmp().y
    });
  }

  this.removePoint = function () {
    for (var i = this.allWalls.length - 1; i >= 0; i--) {
      for (var j = 0; j < this.allWalls[i].length; j++) {
        if (dist(this.allWalls[i][j].x, this.allWalls[i][j].y, this.grmp().x, this.grmp().y) < 10) {
          if (this.allWalls[i].length > 2) {
            var newArrayLess = this.allWalls[i].slice(0, j);
            var newArrayMore = this.allWalls[i].slice(j + 1, this.allWalls[i].length);
            this.allWalls.push(newArrayLess);
            this.allWalls.push(newArrayMore);
          }
          this.allWalls.splice(i, 1);
        }
      }
    }
  }

  this.undo = function () {
    this.addLine();
    this.allWalls.splice(-1, 1);
  }

  this.clearAll = function () {
    this.currentWall = [];
    this.allWalls = [];
    this.eraser = false;
  }

  this.mouseClick = function () {
    var buttonClicked = this.menu.mouseClick();
    if (!buttonClicked) {
      if (this.eraser) {
        this.removePoint();
      } else {
        this.addPoint();
      }
    }
  }

  this.toggleEraser = function () {
    if (this.eraser) {
      this.eraser = false;
      this.menu.buttons[3].active = false;
    } else {
      this.menu.buttons[3].active = true;
      this.eraser = true;
    }
    if (this.currentWall.length > 1) {
      this.allWalls.push(this.currentWall);
    }
    this.currentWall = [];
  }

  this.saveMap = function () {
    this.addLine();
    this.syncedWalls = this.allWalls;
    this.createWallsFromArray(this.allWalls);
    socket.emit("new_map", this.allWalls);
    this.changeMode();
  }

  this.newMap = function (data) {
    this.syncedWalls = data;
    this.createWallsFromArray(data);
  }

  this.loadLines = function () {
    this.allWalls = this.syncedWalls;
  }

  this.createWallsFromArray = function (wallData) {
    walls = [];
    for (var j = 0; j < wallData.length; j++) {
      if (wallData[j].length > 1) {
        for (var i = 0; i < wallData[j].length - 1; i++) {
          walls.push(new Wall(wallData[j][i].x, wallData[j][i].y, wallData[j][i + 1].x, wallData[j][i + 1].y));
        }
      }
    }
  }
}

function MapEditorMenu() {
  this.r = 60;
  this.x = width - this.r / 2;
  this.y = this.r / 2;

  this.buttons = [];
  this.buttons.push(new Button(this.x, this.y + 0 * this.r, this.r, 'Save', 12))
  this.buttons.push(new Button(this.x, this.y + 1 * this.r, this.r, 'Exit', 12))
  this.buttons.push(new Button(this.x, this.y + 2 * this.r, this.r, 'Clear', 12))
  this.buttons.push(new Button(this.x, this.y + 3 * this.r, this.r, 'Eraser', 12))
  this.buttons.push(new Button(this.x, this.y + 4 * this.r, this.r, 'Undo', 12))
  this.buttons.push(new Button(this.x, this.y + 5 * this.r, this.r, 'Add Line', 12))

  this.show = function () {
    for (var i = 0; i < this.buttons.length; i++) {
      this.buttons[i].show();
    }
  }

  this.mouseClick = function () {
    for (var i = 0; i < this.buttons.length; i++) {
      if (this.buttons[i].detectPress()) {
        this.buttonLogic(i);
        return true;
      }
    }
  }


  this.buttonLogic = function (buttonIndex) {
    switch (buttonIndex) {
      case 0:
        pause.mapEditor.saveMap();
        break;
      case 1:
        pause.mapEditor.changeMode();
        break;
      case 2:
        pause.mapEditor.clearAll();
        break;
      case 3:
        pause.mapEditor.toggleEraser();
        break;
      case 4:
        pause.mapEditor.undo();
        break;
      case 5:
        pause.mapEditor.addLine();
        break;
    }
  }
}