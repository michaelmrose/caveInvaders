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
        this.width = 128;
        this.height = 96;
        this.board = [];
        this.row = [];
        this.ended = false;
        for (let i = 0; i < this.width; i++) {
            this.row.push(0);
        }
        for (let i = 0; i < this.height; i++) {
            this.board.push(this.row.slice(0));
        }
        this.emptyBoard = structuredClone(this.board);
        //darn you canvas size rounding errors
        this.elementSize = this.canvas.width / this.width;
        this.canvas.height = this.elementSize * 96;
        this.ctx.fillStyle = "red";
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
        this.clear();
        this.entities.forEach((e) => {
            e.render();
        });
    }
    rockIt() {
        let top = range(this.width);
        for (let i = 0; i < top.length; i++) {
            new Rock(i, 0, this);
            new Rock(i, this.height - 1, this);
        }
        let sides = range(this.height);
        for (let i = 0; i < sides.length; i++) {
            new Rock(0, i, this);
            new Rock(this.width - 1, i, this);
        }
    }
    startLoop() {
        this.loop = setInterval(() => {
            this.render();
        }, 33);
    }
    scenario() {
        this.foo = new PlayerShip(3, 3, game, "up");
        this.bar = new AlienShip(20, 24, game, "up");
        this.zip = new PlayerShot(30, 28, game, "up");
        this.zap = new AlienShot(15, 20, game, "up");
        this.base = new Base(30, 30, game);
        this.rockIt();
    }
    start() {
        this.ended = false;
        this.startLoop();
    }
    end() {
        this.ended = false;
        clearInterval(this.loop);
        this.clear();
        this.entities = [];
        this.board = structuredClone(this.emptyBoard);
    }
    restart() {
        if (!game.ended) game.end();
        game.scenario();
        game.start();
    }
}
class Entity {
    constructor(x, y, game, position) {
        this.x = x;
        this.y = y;
        this.game = game;
        game.entities.push(this);
        this.position = position;
        this.positions = this.positionsUp;
        this.colors = ["purple"];
        this.priorPositions = this.positions();
        this.checkForCollsion();
        this.claimPointsOnBoard();
    }

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
    move(direction) {
        this.changePositionOrReset((dir) => this._move(direction));
    }
    _move(direction) {
        switch (direction) {
            case "up":
                this.y = this.y - 1;
                break;
            case "down":
                this.y = this.y + 1;
                break;
            case "left":
                this.x = this.x - 1;
                break;
            case "right":
                this.x = this.x + 1;
                break;
        }
    }
    forward() {
        this.move(this.position);
    }
    back() {
        switch (this.position) {
            case "up":
                this.move("down");
                break;
            case "down":
                this.move("up");
                break;
            case "left":
                this.move("right");
                break;
            case "right":
                this.move("left");
                break;
        }
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
    // TODO THIS DOESNT KEEP PLAYER FROM ROTATING OUT OF THE BOARD
    // THERE IS A LOGIC ERROR HERE
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
        let ps = this.positions();
        ps.forEach((p) => (this.game.board[p.y][p.x] = 0));
        game.entities = game.entities.filter((e) => e !== this);
    }
    checkForCollsion() {
        this.positions().forEach((p) => {
            let thingAtPosition = game.board[p.y][p.x];
            if (thingAtPosition !== 0 && thingAtPosition !== this) {
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
}
class Ship extends Entity {
    constructor(x, y, game, position) {
        super(x, y, game, position);
        this.shotType = AlienShot;
    }
    // TODO for some reason shot is created with position = undefined which will prevent this from working when things are actually set in motion
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
    }

    shoot() {
        switch (this.position) {
            case "up":
                new this.shotType(this.x, this.y - 2, this.game, this.position);
                // new PlayerShot(this.x, this.y - 2, this.game, this.position);
                break;
            case "down":
                new this.shotType(this.x, this.y + 2, this.game, this.position);
                break;
            case "left":
                new this.shotType(this.x - 2, this.y, this.game, this.position);
                break;
            case "right":
                new this.shotType(this.x + 2, this.y, this.game, this.position);
                break;
        }
    }
    onCollide(thing) {
        if (thing instanceof Base) {
        } else if (thing instanceof Rock) {
        } else {
            this.destroy();
            game.end();
        }
    }
}
class AlienShip extends Ship {
    constructor(x, y, game, position) {
        super(x, y, game, position);
        this.colors = ["green", "lightgreen"];
    }
    onCollide(thing) {
        this.destroy();
    }
}

class Shot extends Entity {
    constructor(x, y, game, position) {
        super(x, y, game, position);
        this.position = "up";
    }

    onCollide(thing) {
        this.destroy();
    }
}

class PlayerShot extends Shot {
    constructor(x, y, game, position) {
        super(x, y, game), position;
        this.colors = ["red"];
    }
}
class AlienShot extends Shot {
    constructor(x, y, game, position) {
        super(x, y, game, position);
        this.colors = ["yellow"];
    }
}
class Rock extends Entity {
    constructor(x, y, game) {
        super(x, y, game);
        this.colors = ["maroon"];
    }
    onCollide(thing) {
        console.log("back loser");
        thing.back();
        thing.back();
        thing.back();
        thing.back();
        //intruder may have overridden board positions
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
            { x: this.x + 1, y: this.y, color: this.colors[0] },
            { x: this.x + 2, y: this.y, color: this.colors[0] },

            { x: this.x, y: this.y + 1, color: this.colors[0] },
            { x: this.x + 1, y: this.y + 1, color: this.colors[0] },
            { x: this.x + 2, y: this.y + 1, color: this.colors[0] },

            { x: this.x, y: this.y + 2, color: this.colors[0] },
            { x: this.x + 1, y: this.y + 2, color: this.colors[0] },
            { x: this.x + 2, y: this.y + 2, color: this.colors[0] },
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
        if (thing instanceof AlienShip) this.destroy;
        //TODO this logic doesn't work
        if (thing instanceof Shot) thing.destroy;
    }
    destroy() {
        super.destroy();
        game.end();
    }
}

//=======================================================================
// Setup
//=======================================================================

let canvas = document.querySelector("#canvas");
canvas.focus();
let game = new Game(canvas);
game.scenario();
game.start();

function handleKeys(evt) {
    switch (evt.key) {
        case "w":
            game.foo.forward();
            break;
        case "a":
            game.foo.move("left");
            break;
        case "d":
            game.foo.move("right");
            break;
        case "q":
            game.foo.rotateCounter();
            break;
        case "s":
            game.foo.back();
            break;
        case "e":
            game.foo.rotateClockwise();
            break;
        case "ArrowUp":
            game.foo.forward();
            break;
        case "ArrowLeft":
            game.foo.rotateCounter();
            break;
        case "ArrowDown":
            game.foo.back();
            break;
        case "ArrowRight":
            game.foo.rotateClockwise();
            break;
        case "Escape":
            game.restart();
            break;
        case " ":
            game.foo.shoot();
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
function randomPositionWithinBoard() {
    let x = rand(0, 59);
    let y = rand(0, 48);
    return game.board[y][x];
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
