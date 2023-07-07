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
        this.width = 60;
        this.height = 48;
        this.board = [];
        this.row = [];
        for (let i = 0; i < this.width; i++) {
            this.row.push(0);
        }
        for (let i = 0; i < this.height; i++) {
            this.board.push(this.row.slice(0));
        }
        this.elementSize = this.canvas.width / this.width;
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
    loop() {
        this.loop = setInterval(() => {
            this.render();
        }, 33);
    }
    end() {
        clearInterval(this.loop);
        this.clear();
    }
}
class Entity {
    constructor(x, y, game) {
        this.x = x;
        this.y = y;
        this.game = game;
        game.entities.push(this);
        this.positions = this.positionsUp;
        this.position = "up";
        this.colors = ["red", "pink"];
        this.priorPositions = this.positions();
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
    constructor(x, y, game) {
        super(x, y, game);
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
    constructor(x, y, game) {
        super(x, y, game);
        this.colors = ["blue", "lightblue"];
    }
    onCollide(thing) {
        if (thing instanceof Base) {
        } else {
            thing.destroy();
            this.destroy();
            game.end();
        }
    }
}
class AlienShip extends Ship {
    constructor(x, y, game) {
        super(x, y, game);
        this.colors = ["green", "lightgreen"];
    }
    onCollide(thing) {
        this.destroy();
        thing.destroy();
    }
}

class Shot extends Entity {
    constructor(x, y, game) {
        super(x, y, game);
    }

    onCollide(thing) {
        if (thing instanceof Base) {
            this.destroy();
        } else {
            this.destroy();
            thing.destroy();
        }
    }
}

class PlayerShot extends Shot {
    constructor(x, y, game) {
        super(x, y, game);
        this.colors = ["red"];
    }
}
class AlienShot extends Shot {
    constructor(x, y, game) {
        super(x, y, game);
        this.colors = ["yellow"];
    }
}
class Rock extends Entity {
    constructor(x, y, game) {
        super(x, y, game);
        this.colors = ["maroon"];
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
let canvas = document.querySelector("#canvas");
let game = new Game(canvas);
//TODO this has to do with rounding I think I'm manually padding it to ensure the last block isn't partially off screen look into a more proper fix
canvas.height += 5;

let foo = new PlayerShip(30, 20, game);
let bar = new AlienShip(20, 24, game);
let zip = new PlayerShot(30, 28, game);
let zap = new AlienShot(15, 20, game);
let base = new Base(30, 30, game);
// game.rockIt();
canvas.focus();
document.addEventListener("keydown", handleKeys);
function handleKeys(evt) {
    switch (evt.key) {
        case "w":
            foo.forward();
            break;
        case "a":
            foo.move("left");
            break;
        case "d":
            foo.move("right");
            break;
        case "q":
            foo.rotateCounter();
            break;
        case "s":
            foo.back();
            break;
        case "e":
            foo.rotateClockwise();
            break;
        case "ArrowUp":
            foo.forward();
            break;
        case "ArrowLeft":
            foo.rotateCounter();
            break;
        case "ArrowDown":
            foo.back();
            break;
        case "ArrowRight":
            foo.rotateClockwise();
            break;
    }
}
game.loop();

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
