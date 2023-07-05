const fs = require("fs");
const { JSDOM } = require("jsdom");

const html = fs.readFileSync("index.html");
const page = new JSDOM(html);
document = page.window.document;

const js = require("./script.js");
let Position = js.Position;

test("Expects 1 + 2 to equal 3", () => {
    expect(1 + 2).toBe(3);
});
test("Distance between points calculated correctly", () => {
    let p1 = new Position(0, 0);
    let p2 = new Position(1, 1);
    let dist = p1.distanceBetween(p2);
    expect(dist).toBeCloseTo(1.4142);
});
