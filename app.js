// SETUP
const stats = document.querySelector('div.stats');
const canv1 = document.querySelector('canvas#l1');
const ctx1 = canv1.getContext('2d');
const canv2 = document.querySelector('canvas#l2');
const ctx2 = canv2.getContext('2d');
class GridArray extends Array {
    constructor(w, h) {
        super(w * h);
        this.width = w;
        this.height = h;
    }
    _1dto2d(i) { return { x: i % this.width, y: Math.floor(i / this.width) }; }
    _2dto1d(x, y) { return y * this.width + x; }
    _2dtoval(x, y) { return this[y * this.width + x]; }
}
const widthSlider = document.querySelector('div#width input');
const heightSlider = document.querySelector('div#height input');
const starveSlider = document.querySelector('div#starve input');
const reviveSlider = document.querySelector('div#revive input');
const chanceSlider = document.querySelector('div#chance input');
const stepsSlider = document.querySelector('div#steps input');
let WIDTH;
let HEIGHT;
let STARVE;
let REVIVE;
let STEPS;
let CHANCE;
let points;
let unitWidth;
let unitHeight;
function generate() {
    // GENERATE
    points = new GridArray(WIDTH + 1, HEIGHT + 1);
    unitWidth = canv1.width / WIDTH;
    unitHeight = canv1.height / HEIGHT;
    for (let i = 0; i < points.length; i++)
        points[i] = Math.random() >= CHANCE;
    for (let step = STEPS; step > 0; step--) {
        const buffer = points;
        for (let i = 0; i < buffer.length; i++) {
            const pos = buffer._1dto2d(i);
            const neighbors = (pos.y > 0 && buffer._2dtoval(pos.x, pos.y - 1) ? 1 : 0) // Above
                + (pos.x > 0 && buffer._2dtoval(pos.x - 1, pos.y) ? 1 : 0) // Left
                + (pos.y < buffer.height && buffer._2dtoval(pos.x, pos.y + 1) ? 1 : 0) // Below
                + (pos.x < buffer.width && buffer._2dtoval(pos.x + 1, pos.y) ? 1 : 0) // Right
                + (pos.x > 0 && pos.y > 0 && buffer._2dtoval(pos.x - 1, pos.y - 1) ? 1 : 0) // Above+Left
                + (pos.x > 0 && pos.y < buffer.height && buffer._2dtoval(pos.x - 1, pos.y + 1) ? 1 : 0) // Bottom+Left
                + (pos.x < buffer.width && pos.y > 0 && buffer._2dtoval(pos.x + 1, pos.y - 1) ? 1 : 0) // Above+Right
                + (pos.x < buffer.width && pos.y < buffer.height && buffer._2dtoval(pos.x + 1, pos.y + 1) ? 1 : 0); // Below+Right
            if (buffer[i] && neighbors < STARVE)
                points[i] = false;
            else if (neighbors > REVIVE)
                points[i] = true;
        }
        points = buffer;
    }
    // RENDER
    ctx1.clearRect(0, 0, canv1.width, canv1.height);
    function line(a, b) { ctx1.moveTo(Math.floor(a.x * unitWidth), Math.floor(a.y * unitHeight)); ctx1.lineTo(Math.floor(b.x * unitWidth), Math.floor(b.y * unitHeight)); }
    ctx1.beginPath();
    ctx1.fillStyle = 'gray';
    ctx1.strokeStyle = 'black';
    ctx1.lineWidth = 2;
    for (let i = 0; i < WIDTH * HEIGHT; i++) {
        const x = i % WIDTH;
        const y = Math.floor(i / WIDTH);
        const t = { x: x + 0.5, y };
        const r = { x: x + 1, y: y + 0.5 };
        const b = { x: x + 0.5, y: y + 1 };
        const l = { x, y: y + 0.5 };
        const tl = points._2dtoval(x, y) ? 0x000 : 0x1000; // Top right
        const tr = points._2dtoval(x + 1, y) ? 0x000 : 0x0100; // Top Left
        const br = points._2dtoval(x + 1, y + 1) ? 0x000 : 0x0010; // Bottom right
        const bl = points._2dtoval(x, y + 1) ? 0x000 : 0x0001; // Bottom left
        switch (tl | tr | br | bl) {
            case 1:
                line(l, b);
                break; // 1
            case 16:
                line(r, b);
                break; // 2
            case 17:
                line(l, r);
                break; // 3
            case 256:
                line(t, r);
                break; // 4
            case 257:
                line(r, b);
                line(l, t);
                break; // 5
            case 272:
                line(t, b);
                break; // 6
            case 273:
                line(l, t);
                break; // 7
            case 4096:
                line(l, t);
                break; // 8
            case 4097:
                line(t, b);
                break; // 9
            case 4112:
                line(l, b);
                line(t, r);
                break; // 10
            case 4113:
                line(t, r);
                break; // 11
            case 4352:
                line(l, r);
                break; // 12
            case 4353:
                line(r, b);
                break; // 13
            case 4368:
                line(l, b);
                break; // 14
            case 0: {
                ctx1.fillStyle = 'rgba(0 255 0 / 10%)';
                ctx1.fillRect(x * unitWidth, y * unitHeight, unitWidth, unitHeight);
                break;
            }
            case 4369: {
                ctx1.fillStyle = 'rgba(255 0 0 / 10%)';
                ctx1.fillRect(x * unitWidth, y * unitHeight, unitWidth, unitHeight);
                break;
            }
        }
    }
    ctx1.closePath();
    ctx1.stroke();
    ctx1.fillStyle = 'blue';
    for (let i = 0; i < points.length; i++) {
        if (points[i]) {
            const pos = points._1dto2d(i);
            ctx1.beginPath();
            ctx1.arc(pos.x * unitWidth, pos.y * unitHeight, 1, 0, Math.PI * 2);
            ctx1.closePath();
            ctx1.fill();
        }
    }
}
// GUI
starveSlider.oninput = () => {
    document.querySelector('div#starve span').innerText = starveSlider.value;
    STARVE = parseInt(starveSlider.value);
    generate();
};
reviveSlider.oninput = () => {
    document.querySelector('div#revive span').innerText = reviveSlider.value;
    REVIVE = parseInt(reviveSlider.value);
    generate();
};
chanceSlider.oninput = () => {
    document.querySelector('div#chance span').innerText = chanceSlider.value;
    CHANCE = parseFloat(chanceSlider.value);
    generate();
};
stepsSlider.oninput = () => {
    document.querySelector('div#steps span').innerText = stepsSlider.value;
    STEPS = parseInt(stepsSlider.value);
    generate();
};
widthSlider.oninput = () => {
    document.querySelector('div#width span').innerText = widthSlider.value;
    WIDTH = parseInt(widthSlider.value);
    generate();
};
heightSlider.oninput = () => {
    document.querySelector('div#height span').innerText = heightSlider.value;
    HEIGHT = parseInt(heightSlider.value);
    generate();
};
function reset() {
    starveSlider.value = document.querySelector('div#starve span').innerText = String(STARVE = 4);
    reviveSlider.value = document.querySelector('div#revive span').innerText = String(REVIVE = 5);
    chanceSlider.value = document.querySelector('div#chance span').innerText = String(CHANCE = 4);
    stepsSlider.value = document.querySelector('div#steps span').innerText = String(STEPS = 4);
    widthSlider.value = document.querySelector('div#width span').innerText = String(WIDTH = 80);
    heightSlider.value = document.querySelector('div#height span').innerText = String(HEIGHT = 60);
    generate();
}
// INIT
reset();
// STATS
ctx2.fillStyle = 'rgba(0 0 0 / 40%)';
canv2.addEventListener('mouseenter', () => { stats.style.display = 'block'; });
canv2.addEventListener('mouseleave', () => { stats.style.display = 'none'; ctx2.clearRect(0, 0, canv2.width, canv2.height); });
canv2.addEventListener('mousemove', e => {
    const x = Math.floor(e.offsetX / unitWidth);
    const y = Math.floor(e.offsetY / unitHeight);
    stats.querySelector('p#pos').innerText = `Position: (${x},${y})`;
    stats.querySelector('p#index').innerText = 'Index: ' + points._2dto1d(x, y);
    stats.querySelector('p#type').innerText = 'Type: ' + (points._2dtoval(x, y) ? 'Floor' : 'Wall');
    ctx2.clearRect(0, 0, canv2.width, canv2.height);
    ctx2.fillRect(Math.floor(e.offsetX / unitWidth) * unitWidth, Math.floor(e.offsetY / unitHeight) * unitHeight, unitWidth, unitHeight);
    stats.style.left = e.x + 'px';
    stats.style.top = e.y + 'px';
});
