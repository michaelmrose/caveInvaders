let body = document.querySelector("body");
let board = document.querySelector("#board");

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
    within(area) {
        return (
            this.x >= 0 &&
            this.y >= 0 &&
            this.x < area.width &&
            this.y < area.height
        );
    }
}

const palette = {
    0: "black",
    1: "brown",
    2: "green",
    7: "blue",
};
const paletteValues = {
    black: 0,
    brown: 1,
    green: 2,
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
    // entitiesWithinNMovesOfPos(pos, limit) {
    //     this.entities.filter((e) => {
    //         e.pos.distanceBetween(pos) >= limit;
    //     });
    // }
    addDots() {
        let p1 = new Position(3, 0);
        let p2 = new Position(0, 30);
        let dotty = new Dot(p1, this);
        let dotty2 = new Dot(p2, this);
        this.entities.push(dotty);
        this.entities.push(dotty2);
    }
}

class Entity {
    constructor(pos, game) {
        this.pos = pos;
        this.update = (world, pos) => world;
    }
}

class Dot extends Entity {
    constructor(pos, game) {
        super(pos, game);
        this.update = (world) => {
            this.pos = this.pos.add(new Position(1, 0));
            world[game.posToOffset(this.pos)] = paletteValues["blue"];
            return world;
        };
    }
}

let game = new Game(board);
