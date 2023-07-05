const fs = require("fs");
const { JSDOM } = require("jsdom");

const html = fs.readFileSync("index.html");
const page = new JSDOM(html);
document = page.window.document;

const js = require("./script.js");

test("adds 1 + 2 to equal 3", () => {
    expect(1 + 2).toBe(3);
});
