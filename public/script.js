// let R = require("ramda");
/* need a Game and Entity class if I can't figure out how to more completely separate these pass game to entity
 or call static methods on Game if it doesn't need specific parameters. Different types of entities will subclass Entity
 Entity will include player, aliens, shots fired, solid objects, possible subclasses include enemy, wall, bullet, player
 Each entity will have a render method which will draw it on the canvas, a destroy method which will remove it 
 from the list of active entities. An onCollision method which shall desribe how it response to a collision which 
 may in turn call the destroy method if need be. 

 There shall be a board component OR a board class that describing a grid of positions aprox 60x45 "blocks" 
 aprox 2700 represented as a 2D array each representing a row.  When an entity moves into a space what it 
 will do is write a reference to itself to the board.
 
 Each entity that moves will not deliberately move into a position that is occupied by any other entity.  If it does try 
 to do so it will end up calling onCollsion with the  pre-existing entity as an argument. The simplest thing to do is probably initially just destroy both either on pre-existing square or by destroying first the item at the square then 
 moving into the square and being destroyed in turn. Updates shall be processed sequentally starting with the player, 
 so that logic remains consistent. Eg a missile advances nothing is in that space so nothing further happens. Then 
 the player is advanced by virtue of having pressed an arrow key and finds itself moving to the same space as the 
 missile. The missile is destoryed. The player is moved into the position formerly occupied by the missile and is 
 destroyed. The game end logic happens.

As soon as all logic happens everything is rendered by calling render on the background and then all entities.

Control of player happens by plugging actions into a buffer to be evaluated next tick to be evaluated in turn. 
Notably hitting up 17 times really fast doesn't mean the player can move further or fire faster  in one turn. 
They should be asyncstuffed into the buffer and emptied each tick. If direction exists move in the first direction hit
If space exists fire, if escape exists pause at beginning of tick.
 */

class Game {
    constructor(canvasElement) {
        this.canvas = canvasElement;
        this.ctx = canvas.getContext("2d");
        this.canvas.setAttribute("height", getComputedStyle(canvas)["height"]);
        this.canvas.setAttribute("width", getComputedStyle(canvas)["width"]);
        this.entities = [];
        this.graveyard = [];
        this.buried = [];
        this.width = 128;
        this.height = 96;
        this.board = [];
        this.row = [];
        this.ended = false;
        this.ended = false;
        this.paused = false;
        this.enemiesToSpawn = 1;
        //used to take an action every nth tick
        this.nthTick = 0;
        //In this many ticks we will generate another enemy and decrease this value leading to faster spawns
        this.ticksToGenerateEnemies = 300;

        //filll a column with zeros to represent an empty square
        for (let i = 0; i < this.width; i++) {
            this.row.push(0);
        }

        //fill the board with rows of zeros
        for (let i = 0; i < this.height; i++) {
            this.board.push(this.row.slice(0));
        }

        //will be used to to reset the board to an empty state
        this.emptyBoard = structuredClone(this.board);

        //darn you canvas size rounding errors
        this.elementSize = this.canvas.width / this.width;
        this.canvas.height = this.elementSize * 96;
        this.ctx.fillStyle = "red";
        this.score = 0;
        this.gameOverSound = new Audio("gameover.mp3");
        this.renderStartMessage();
    }
    clear() {
        this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    color(x, y, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(
            x * this.elementSize,
            y * this.elementSize,
            this.elementSize,
            this.elementSize
        );
    }
    positionInsideBoard(p) {
        return p.x >= 0 && p.y >= 0 && p.x < this.width && p.y < this.height;
    }

    render() {
        if (this.ended === false) {
            this.clear();
            this.entities.forEach((e) => {
                e.render();
            });
            this.ctx.fillStyle = "red";
            this.renderScore();
            this.ctx.fillStyle = "red";
            this.renderPaused();
            this.ctx.fillStyle = "red";
        } else this.renderEnd();
    }
    rockIt() {
        let top = range(this.width);
        for (let i = 0; i < top.length; i++) {
            new InvulnerableRock(i, 0, this);
            new InvulnerableRock(i, this.height - 1, this);
        }
        let sides = range(this.height);
        for (let i = 1; i < sides.length - 1; i++) {
            new InvulnerableRock(0, i, this);
            new InvulnerableRock(this.width - 1, i, this);
        }
    }
    startLoop() {
        this.loop = setInterval(() => {
            this.tick();
            this.render();
        }, 33);
    }
    tick() {
        if (this.paused === false) {
            //clear the positions occupied by destroyed entities
            //a second tier "buried" shouldn't be needed added to avoid
            //double counting aliens for score should be fixed by just not
            //doing that in the future
            this.graveyard.forEach((e) => {
                if (e instanceof AlienShip && !this.buried.includes(e)) {
                    this.score++;
                    this.buried.push(e);
                }
                e.positions().forEach((p) => (this.board[p.y][p.x] = 0));
            });
            //to hold entities to be destroyed at start of tick
            this.graveyard = [];
            //this will be examined to allow destoryed enemy ships to be counted
            this.buried = [];
            this.generateEnemies();
            //ensure metadata map holds correct points for each entity
            this.entities.forEach((e) => e.claimPointsOnBoard());

            // each entity has an array of functions it should evaluate every tick herein termed strategies
            // actions are strategies for player entity should simply be merged with strategies as use case is identical

            this.entities.forEach((e) => {
                e.strategies.forEach((s) => {
                    s(e);
                });
                e.actions.forEach((a) => {
                    a();
                });
                e.actions = [];
            });
        }
    }
    randomPositionWithinBoard() {
        let x = rand(3, this.width - 3);
        let y = rand(3, this.height - 3);
        return [x, y];
    }

    randomPositionOnPeripheryOfBoard() {
        while (true) {
            let r = this.randomPositionWithinBoard();
            let x = r[0];
            let y = r[1];
            let xRange = range(3, 21).concat(this.width - 20, this.width - 2);
            let yRange = range(3, 21).concat(this.height - 20, this.height - 2);
            if (xRange.includes(x) || yRange.includes(y)) {
                return r;
            }
        }
    }

    // ticks both get closer together and spawn more enemies as time goes by
    generateEnemies() {
        this.nthTick++;
        if (this.nthTick % this.ticksToGenerateEnemies === 0) {
            for (let i = 0; i < this.enemiesToSpawn; i++)
                new AlienShip(
                    ...this.randomPositionOnPeripheryOfBoard(),
                    this,
                    "up"
                );
            this.ticksToGenerateEnemies = Math.max(
                10,
                this.ticksToGenerateEnemies - 1
            );
            this.enemiesToSpawn = Math.min(this.enemiesToSpawn + 1, 8);
        }
    }
    // setup for initial game state
    scenario() {
        this.player = new PlayerShip(
            this.width / 2 + 5,
            this.height / 2 + 5,
            this,
            "up"
        );
        this.player.face("right");
        this.base = new Base(this.width / 2, this.height / 2, this, "up");

        for (let i = 0; i < 3; i++) {
            new AlienShip(
                ...this.randomPositionOnPeripheryOfBoard(),
                this,
                "up"
            );
        }
        this.rockIt();
    }
    start() {
        this.started = true;
        this.score = 0;
        this.ended = false;
        // this.hideInstructions();
        this.startLoop();
    }
    end() {
        this.ended = true;
        clearInterval(this.loop);
        this.clear();
        this.entities = [];
        this.enemiesToSpawn = 1;
        this.nthTick = 0;
        this.paused = false;
        this.board = structuredClone(this.emptyBoard);
    }
    pause() {
        if (this.paused) this.paused = false;
        else {
            this.paused = true;
        }
    }
    restart() {
        game.end();
        game.scenario();
        game.start();
    }
    renderScore() {
        this.printToScreen(
            this.score,
            this.canvas.width / 15,
            this.canvas.width - this.canvas.width / 25,
            this.canvas.width / 15
        );
    }
    renderStartMessage() {
        this.ctx.fillStyle = "#735399";
        this.printToScreen(
            "CAVE INVADERS",
            this.canvas.width / 10,
            this.canvas.width / 2,
            this.canvas.width / 2 - this.canvas.width * 0.2
        );
        this.ctx.fillStyle = "red";
        this.printToScreen("Hit Enter to Begin", this.canvas.width / 15);
    }
    renderPaused() {
        if (this.paused === true) {
            this.printToScreen("Paused", this.canvas.width / 5);
        }
    }
    printToScreen(
        text,
        size,
        x = this.canvas.width / 2,
        y = this.canvas.height / 2
    ) {
        this.ctx.textAlign = "center";
        this.ctx.font = `${size}px Charge Vector`;
        this.fillStyle = "red";
        this.ctx.fillText(text, x, y);
    }
    renderEnd() {
        this.ctx.fillStyle = "red";
        this.ctx.textAlign = "center";
        let rating;
        if (this.score === 0) rating = "zero";
        else if (this.score > 100) rating = "cheater";
        else if (this.score > 25) rating = "killer";
        else if (this.score > 10) rating = "beginner";
        else if (this.score > 0) rating = "loser";
        this.printToScreen(
            `Score: ${this.score} `,
            this.canvas.width / 15,
            this.canvas.width / 2,
            this.canvas.height / 2 - this.canvas.height * 0.1
        );
        this.printToScreen(
            ` Rating: ${rating}`,
            this.canvas.width / 15,
            this.canvas.width / 2,
            this.canvas.height / 2
        );
        this.printToScreen(
            ` Hit Escape to Restart`,
            this.canvas.width / 15,
            this.canvas.width / 2,
            this.canvas.height / 2 + this.canvas.height * 0.1
        );
    }
}

class Entity {
    constructor(x, y, game, position) {
        this.x = x;
        this.y = y;
        this.game = game;
        this.ticksTowardsMovement = 0;
        this.ticksToMove = 1;
        game.entities.push(this);
        this.position = position;
        this.positions = this.positionsUp;
        this.colors = ["purple"];
        this.priorPositions = this.positions();
        this.checkForCollsion();
        this.claimPointsOnBoard();
        this.strategies = [];
        this.actions = [];
    }

    // positions are obviously going to depend on orientation
    positionsUp() {
        return [{ x: this.x, y: this.y, color: this.colors[0] }];
    }
    positionsDown() {
        return [{ x: this.x, y: this.y, color: this.colors[0] }];
    }
    positionsLeft() {
        return [{ x: this.x, y: this.y, color: this.colors[0] }];
    }
    positionsRight() {
        return [{ x: this.x, y: this.y, color: this.colors[0] }];
    }
    face(direction) {
        this.position = direction;
        switch (direction) {
            case "up":
                this.positions = this.positionsUp;
                break;
            case "down":
                this.positions = this.positionsDown;
                break;
            case "left":
                this.positions = this.positionsLeft;
                break;
            case "right":
                this.positions = this.positionsRight;
                break;
        }
    }
    faceEntity(e) {
        if (e.x === this.x) {
            if (e.x > this.x) this.face("left");
            if (e.x < this.x) this.face("right");
        }
        if (e.y === this.y) {
            if (e.y > this.y) this.face("up");
            if (e.y < this.y) this.face("down");
        }
    }
    facingEntity(e) {
        if (e.x === this.x) {
            if (e.y > this.y && this.positions === this.positionsDown)
                return true;
            if (e.y < this.y && this.positions === this.positionsUp)
                return true;
        }
        if (e.y === this.y) {
            if (e.x > this.x && this.positions === this.positionsRight)
                return true;
            if (e.x < this.x && this.positions === this.positionsLeft)
                return true;
        }
        return false;
    }
    render() {
        this.positions().forEach((p) => {
            this.game.color(p.x, p.y, p.color);
        });
    }
    allPositionsWithinBoard() {
        return this.positions().every((p) => {
            return game.positionInsideBoard({ x: p.x, y: p.y });
        });
    }
    //move and rotate functions that directly change position or orientation
    // are effectively wrapped by changePositionOrReset by virtue of calling
    //this function with their operation and having it perform or roll back the op
    // to avoid an invalid state

    move(direction) {
        this.changePositionOrReset(() => this._move(direction));
    }
    _move(direction) {
        if (this.ticksTowardsMovement >= this.ticksToMove) {
            switch (direction) {
                case "up":
                    this.position = direction;
                    this.positions = this.positionsUp;
                    this.y = this.y - 1;
                    break;
                case "down":
                    this.position = direction;
                    this.positions = this.positionsDown;
                    this.y = this.y + 1;
                    break;
                case "left":
                    this.position = direction;
                    this.positions = this.positionsLeft;
                    this.x = this.x - 1;
                    break;
                case "right":
                    this.position = direction;
                    this.positions = this.positionsRight;
                    this.x = this.x + 1;
                    break;
            }
            this.ticksTowardsMovement = 0;
        }
        this.ticksTowardsMovement++;
    }
    forward() {
        this.move(this.position);
    }
    //This is a little dumb because move direction will change orientation meaning going back would
    // without adjustment simply go back and forth in a singular small area
    back() {
        switch (this.position) {
            case "up":
                this.move("down");
                this.position = "up";
                this.positions = this.positionsUp;
                break;
            case "down":
                this.move("up");
                this.position = "down";
                this.positions = this.positionsDown;
                break;
            case "left":
                this.move("right");
                this.position = "left";
                this.positions = this.positionsLeft;
                break;
            case "right":
                this.move("left");
                this.position = "right";
                this.positions = this.positionsRight;
                break;
        }
    }
    moveAbsolute(direction) {
        this.move(direction);
    }
    claimPointsOnBoard() {
        this.priorPositions.forEach((p) => {
            this.game.board[p.y][p.x] = 0;
        });
        this.positions().forEach((p) => {
            this.game.board[p.y][p.x] = this;
        });
    }

    rotateCounter() {
        this.changePositionOrReset(this._rotateCounter.bind(this));
    }
    _rotateCounter() {
        switch (this.position) {
            case "up":
                this.position = "left";
                this.positions = this.positionsLeft;
                break;
            case "down":
                this.position = "right";
                this.positions = this.positionsRight;
                break;
            case "left":
                this.position = "down";
                this.positions = this.positionsDown;
                break;
            case "right":
                this.position = "up";
                this.positions = this.positionsUp;
                break;
        }
    }
    rotateClockwise() {
        this.changePositionOrReset(this._rotateClockwise.bind(this));
    }
    _rotateClockwise() {
        switch (this.position) {
            case "up":
                this.position = "right";
                this.positions = this.positionsRight;
                break;
            case "down":
                this.position = "left";
                this.positions = this.positionsLeft;
                break;
            case "left":
                this.position = "up";
                this.positions = this.positionsUp;
                break;
            case "right":
                this.position = "down";
                this.positions = this.positionsDown;
                break;
        }
    }
    // TODO there should be a better way than filtering the whole list access via ID?
    destroy() {
        game.entities = game.entities.filter((e) => e !== this);
        this.onDestroy();
        this.game.graveyard.push(this);
    }
    onDestroy() {}
    onCollide(thing) {
        this.destroy();
    }
    checkForCollsion() {
        this.positions().forEach((p) => {
            let thingAtPosition = game.board[p.y][p.x];
            if (
                thingAtPosition !== 0 &&
                thingAtPosition !== this &&
                thingAtPosition
                    .positions()
                    .filter((e) => e.x === p.x && e.y === p.y).length > 0
            ) {
                thingAtPosition.onCollide(this);
                this.onCollide(thingAtPosition);
                return true;
            }
        });
        return false;
    }
    // performs OP but rolls back values if it results in an invalid state intended to be used by movement and rotation functions
    changePositionOrReset(op) {
        let priorX = this.x;
        let priorY = this.y;
        this.priorPositions = this.positions();
        op();
        if (this.allPositionsWithinBoard() && !this.checkForCollsion()) {
            this.claimPointsOnBoard();
        } else {
            this.x = priorX;
            this.y = priorY;
        }
    }

    //=================================================================
}
class Ship extends Entity {
    constructor(x, y, game, position) {
        super(x, y, game, position);
        this.shotType = AlienShot;
        this.ticksToShoot = 80;
        this.ticksChargedTowardsShot = 0;
        this.zapSound = new Audio("zap.mp3");
        this.dieSound = new Audio("die.mp3");
    }
    shoot() {
        if (this.ticksChargedTowardsShot >= this.ticksToShoot) {
            this.ticksChargedTowardsShot = 0;
            this.zapSound.play();
            switch (this.position) {
                case "up":
                    new this.shotType(
                        this.x,
                        this.y - 3,
                        this.game,
                        this.position
                    );
                    break;
                case "down":
                    new this.shotType(
                        this.x,
                        this.y + 3,
                        this.game,
                        this.position
                    );
                    break;
                case "left":
                    new this.shotType(
                        this.x - 3,
                        this.y,
                        this.game,
                        this.position
                    );
                    break;
                case "right":
                    new this.shotType(
                        this.x + 3,
                        this.y,
                        this.game,
                        this.position
                    );
                    break;
            }
        } else {
        }
    }
    positionsUp() {
        return [
            { x: this.x, y: this.y, color: this.colors[0] },
            { x: this.x, y: this.y - 1, color: this.colors[1] },
        ];
    }
    positionsDown() {
        return [
            { x: this.x, y: this.y, color: this.colors[0] },
            { x: this.x, y: this.y + 1, color: this.colors[1] },
        ];
    }
    positionsLeft() {
        return [
            { x: this.x, y: this.y, color: this.colors[0] },
            { x: this.x - 1, y: this.y, color: this.colors[1] },
        ];
    }
    positionsRight() {
        return [
            { x: this.x, y: this.y, color: this.colors[0] },
            { x: this.x + 1, y: this.y, color: this.colors[1] },
        ];
    }
}
class PlayerShip extends Ship {
    constructor(x, y, game, position) {
        super(x, y, game, position);
        this.shotType = PlayerShot;
        this.colors = ["blue", "lightblue"];
        this.ticksToShoot = 5;
        this.strategies.push(() => chargeShot(this));
    }
    onDestroy() {
        this.game.gameOverSound.play();
        this.game.end();
    }
}
class AlienShip extends Ship {
    constructor(x, y, game, position) {
        super(x, y, game, position);
        this.colors = ["green", "lightgreen"];
        this.ticksToShoot = 80;
        this.ticksToMove = 7;
        this.target = undefined;
        this.strategies.push(() => chargeShot(this));
        this.strategies.push(() => shootPlayer(this));
        this.strategies.push(() => followTarget(this, this.target));
        this.strategies.push(() =>
            selectNearestTargetFromArrayWeightedByPriority(
                this,
                this.game.player,
                this.game.base
            )
        );
    }
    onDestroy() {
        this.dieSound.play();
    }
}

class Shot extends Entity {
    constructor(x, y, game, position) {
        super(x, y, game, position);
        this.strategies.push(() => {
            moveForward(this);
        });
    }
}

class PlayerShot extends Shot {
    constructor(x, y, game, position) {
        super(x, y, game, position);
        this.colors = ["red"];
        this.ticksToMove = 1;
    }
}
class AlienShot extends Shot {
    constructor(x, y, game, position) {
        super(x, y, game, position);
        this.colors = ["yellow"];
        this.ticksToMove = 1;
    }
    onCollide(thing) {
        if (thing instanceof AlienShip) {
        } else this.destroy();
    }
}
class Rock extends Entity {
    constructor(x, y, game) {
        super(x, y, game);
        this.colors = ["brown"];
    }
}
class InvulnerableRock extends Entity {
    constructor(x, y, game) {
        super(x, y, game);
        this.colors = ["maroon"];
    }
    destroy() {}
    onCollide(thing) {
        thing.back();
        thing.back();
        thing.back();
        thing.back();
        // if thing overlapped it might have claimed ponts incorrectly
        this.claimPointsOnBoard();
    }
}
class Base extends Entity {
    constructor(x, y, game) {
        super(x, y, game);
        this.colors = ["gold"];
    }

    positionsUp() {
        return [
            { x: this.x, y: this.y, color: this.colors[0] },
            { x: this.x - 1, y: this.y, color: this.colors[0] },
            { x: this.x + 1, y: this.y, color: this.colors[0] },

            { x: this.x, y: this.y - 1, color: this.colors[0] },
            { x: this.x - 1, y: this.y - 1, color: this.colors[0] },
            { x: this.x + 1, y: this.y - 1, color: this.colors[0] },

            { x: this.x, y: this.y + 1, color: this.colors[0] },
            { x: this.x - 1, y: this.y + 1, color: this.colors[0] },
            { x: this.x + 1, y: this.y + 1, color: this.colors[0] },
        ];
    }
    positionsDown() {
        return this.positionsUp();
    }
    positionsLeft() {
        return this.positionsUp();
    }
    positionsRight() {
        return this.positionsUp();
    }
    onCollide(thing) {
        if (thing instanceof AlienShip) this.destroy();
    }
    onDestroy() {
        this.game.gameOverSound.play();
        game.end();
    }
}
//=========================================================================
// Strategies
//=========================================================================
function moveForward(e) {
    e.forward();
}
function distanceBetween(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}
function selectNearestTargetFromArrayWeightedByPriority(e, player, base) {
    // lets make this simple for starters we are just going to pick between player and base
    let distanceToBase = distanceBetween(e, base);
    let distanceToPlayer = distanceBetween(e, player);
    if (distanceToPlayer < distanceToBase / 2) e.target = player;
    else e.target = base;
}
function followTarget(e, target) {
    if (typeof target !== "undefined") {
        let playerX = target.x;
        let playerY = target.y;
        if (e.y > playerY) e.move("up");
        else if (e.y < playerY) e.move("down");
        else if (e.x > playerX) e.move("left");
        else if (e.x < playerX) e.move("right");
    }
}

function chargeShot(e) {
    e.ticksChargedTowardsShot += 1;
}
function shootPlayer(e) {
    let playerX = game.player.x;
    let playerY = game.player.y;
    if (playerX === e.x || playerY === e.y) {
        e.faceEntity(game.player);
        if (e.facingEntity(game.player)) e.shoot();
    }
}

//=======================================================================
// Setup
//=======================================================================

let canvas = document.querySelector("#canvas");
canvas.focus();
let game = new Game(canvas);
game.scenario();
// game.start();

// Logic at the start is a little tortued. We don't want to process key presses while paused but we DO want to process p to unpause
function handleKeys(evt) {
    if (game.paused)
        if (evt.key === "p") {
            game.pause();
            return true;
        } else return true;
    switch (evt.key) {
        case "ArrowUp":
            game.player.actions.push(() => game.player.forward());
            break;
        case "ArrowLeft":
            game.player.actions.push(() => game.player.rotateCounter());
            break;
        case "ArrowDown":
            game.player.actions.push(() => game.player.back());
            break;
        case "ArrowRight":
            game.player.actions.push(() => game.player.rotateClockwise());
            break;
        case "w":
            game.player.actions.push(() => game.player.move("up"));
            break;
        case "a":
            game.player.actions.push(() => game.player.move("left"));
            break;
        case "s":
            game.player.actions.push(() => game.player.move("down"));
            break;
        case "d":
            game.player.actions.push(() => game.player.move("right"));
            break;
        case "p":
            game.pause();
            break;
        case "Enter":
            if (!game.started) game.start();
            break;
        case "Escape":
            game.restart();
            break;
        case " ":
            game.player.actions.push(() => game.player.shoot());
        default:
            console.log(evt.key);
    }
}

document.addEventListener("keydown", handleKeys.bind(this));

//=======================================================================
// Misc
//=======================================================================
// derived from class discussion
function rand(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

//derived in part from https://stackoverflow.com/questions/3895478/does-javascript-have-a-method-like-range-to-generate-a-range-within-the-supp
function range(start, end) {
    let s, e;
    if (typeof end === "undefined") {
        s = 0;
        e = start;
    } else {
        s = start;
        e = end;
    }
    return Array.from({ length: e - s }, (x, i) => i).map((x) => x + s);
}
