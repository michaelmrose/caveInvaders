let R = require("ramda");
let body = document.querySelector("body");
let board = document.querySelector("#board");

console.log(typeof R);
class Position {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    add(pos) {
        return new Position(pos.x + this.x, pos.y + this.y);
    }
    distanceBetween(pos) {
        //c sq = a sq + b sq
        let a = Math.abs(pos.x - this.x);
        let b = Math.abs(pos.y - this.y);
        if (a === 0) return b;
        if (b === 0) return a;
        return Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2));
    }
    set(pos) {
        this.x = pos.x;
        this.y = pos.y;
    }
    move(pos) {
        this.x = pos.x + this.x;
        this.y = pos.y + this.y;
    }
    copy() {
        return new Position(this.x, this.y);
    }
}

const west = new Position(-1, 0);
const east = new Position(1, 0);
const north = new Position(0, -1);
const south = new Position(0, 1);
const northWest = new Position(-1, 1);
const northEast = new Position(1, 1);
const southWest = new Position(-1, -1);
const southEast = new Position(1, -1);

const palette = {
    0: "black",
    1: "brown",
    2: "green",
    3: "red",
    7: "blue",
};
const paletteValues = {
    black: 0,
    brown: 1,
    green: 2,
    red: 3,
    blue: 7,
};

class Game {
    constructor(targetElement) {
        this.targetElement = targetElement;
        this.width = 60;
        this.height = 50;
        this.world = R.repeat(0, this.width * this.height);
        this.boardElements = [];
        this.generateBoardElements();
        this.entities = [];
    }
    generateBoardElements() {
        this.world.forEach((e, idx) => {
            let el = document.createElement("div");
            el.classList.add("boardElement");
            let p = this.offsetToPos(idx);
            el.id = `r${p.y}c${p.x}`;
            this.boardElements.push(el);
            this.targetElement.appendChild(el);
        });
    }
    color(world, pos, color) {
        world[this.posToOffset(pos)] = this.palletValues[color];
    }
    offsetToPos(idx) {
        let x = idx % this.width;
        let y = Math.floor(idx / this.width);
        return new Position(x, y);
    }
    valueAtPos(pos) {
        return this.board[this.posToOffset(pos)];
    }
    posToOffset(pos) {
        return pos.y * this.width + pos.x;
    }
    tick() {
        let board = structuredClone(this.world);
        let pipeline = R.pipe(...this.entities.map((e) => e.update));
        this.render(pipeline(board));
    }
    render(world) {
        this.boardElements.forEach((el, idx) => {
            el.style.backgroundColor = palette[world[idx]];
        });
    }
    //TODO rewrite this with the idea of enttities that take up multiple spaces
    entitiesWithinNMovesOfPos(positions, limit) {
        // return this.entities.filter(
        //     (e) => e.positions.distanceBetween(pos) <= limit
        // );
    }
    entityAtPos(pos) {
        return this.entitiesWithinNMovesOfPos(pos, 0).length !== 0;
    }
    unoccupied(pos) {
        return this.entitiesWithinNMovesOfPos(pos, 0).length === 0;
    }
    addDots() {
        for (let i = 0; i < 50; i++) {
            let p = new Position(0, i);
            let dotty = new Dot([p], east, "blue", this);
            this.entities.push(dotty);
        }
        for (let i = 0; i < 50; i++) {
            let p = new Position(20, i);
            let dotty = new Dot([p], east, "red", this);
            this.entities.push(dotty);
        }
    }
}

class Entity {
    constructor(positions, game) {
        this.positions = positions;
        this.game = game;
        this.update = (world, position) => world;
    }
    near(limit) {
        return game
            .entitiesWithinNMovesOfPos(this.pos, limit)
            .filter((e) => e !== this);
    }
    clear(positions) {
        positions.every((p) => this.game.unoccupied(p));
    }

    move(direction) {
        let proposed = this.positions.map((p) => p.add(direction));
        // if (this.clear(proposed)) this.positions = proposed;
    }
    changeDirection(direction) {
        this.direction = direction;
    }
}

class Dot extends Entity {
    constructor(positions, direction, color, game) {
        super(positions, game);
        this.direction = direction;
        this.color = color;
    }

    update = (world) => {
        this.move(this.direction);
        world[game.posToOffset(this.positions[0])] = paletteValues[this.color];
        return world;
    };
}

let game = new Game(board);
game.addDots();
game.tick();
let a = game.entities[0];
let b = game.entities[1];
function advanceGame(n) {
    for (let i = 0; i < n; i++) {
        game.tick();
    }
}

function timer(fn) {
    var start = performance.now();

    fn();

    var end = performance.now();
    return end - start;
}

if (typeof process === "object") {
    exports.timer = timer;
    exports.Game = Game;
    exports.Entity = Entity;
    exports.Position = Position;
}
