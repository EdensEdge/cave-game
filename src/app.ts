// SETUP
const stats = <HTMLDivElement> document.querySelector('div.stats');
const canv1 = <HTMLCanvasElement> document.querySelector('canvas#l1');
const ctx1 = canv1.getContext('2d');
const canv2 = <HTMLCanvasElement> document.querySelector('canvas#l2');
const ctx2 = canv2.getContext('2d');

class GridArray extends Array<boolean> {

    width: number;
    height: number;

    constructor(w: number, h: number) {
        super(w*h);
        this.width = w;
        this.height = h;
    }

    getIndex(i: number): {x: number, y: number} { return {x:i%this.width, y:Math.floor(i/this.width)} }
    getCoord(x: number, y: number): number { return y*this.width+x; }
    fromCoord(x: number, y: number): boolean { return this[y*this.width+x]; }

    slice2(startx = 0, endx = this.length, starty = 0, endy = this.length): GridArray {
        let res = new GridArray(startx - endx, starty - endy);
        for (let x = starty; x < endx; x++)
        for (let y = starty; y < endy; y++) {
            res[res.getCoord(x, y)] = this[this.getCoord(x, y)];
        }
        return res;
    }
}

const widthSlider = <HTMLInputElement> document.querySelector('div#width input');
const heightSlider = <HTMLInputElement> document.querySelector('div#height input');

const starveSlider = <HTMLInputElement> document.querySelector('div#starve input');
const reviveSlider = <HTMLInputElement> document.querySelector('div#revive input');
const chanceSlider = <HTMLInputElement> document.querySelector('div#chance input');
const stepsSlider = <HTMLInputElement> document.querySelector('div#steps input');

let WIDTH: number;
let HEIGHT: number;

let STARVE: number;
let REVIVE: number;
let STEPS: number;
let CHANCE: number;

let points: GridArray;
let unitWidth: number;
let unitHeight: number;

function generate() {
    // GENERATE
    points = new GridArray(WIDTH+1, HEIGHT+1);
    unitWidth = canv1.width/WIDTH;
    unitHeight = canv1.height/HEIGHT;
    for (let i = 0; i < points.length; i++) points[i] = Math.random()>=CHANCE;
    
    for (let step = STEPS; step > 0; step--) {
        const buffer = points;
        for (let i = 0; i < buffer.length; i++) {
            const pos = buffer.getIndex(i);
            const neighbors =
            (pos.y>0&&buffer.fromCoord(pos.x, pos.y-1)?1:0)              // Above
            +(pos.x>0&&buffer.fromCoord(pos.x-1, pos.y)?1:0)             // Left
            +(pos.y<buffer.height&&buffer.fromCoord(pos.x, pos.y+1)?1:0) // Below
            +(pos.x<buffer.width&&buffer.fromCoord(pos.x+1, pos.y)?1:0)  // Right
            +(pos.x>0&&pos.y>0&&buffer.fromCoord(pos.x-1, pos.y-1)?1:0)                         // Above+Left
            +(pos.x>0&&pos.y<buffer.height&&buffer.fromCoord(pos.x-1, pos.y+1)?1:0)             // Bottom+Left
            +(pos.x<buffer.width&&pos.y>0&&buffer.fromCoord(pos.x+1, pos.y-1)?1:0)              // Above+Right
            +(pos.x<buffer.width&&pos.y<buffer.height&&buffer.fromCoord(pos.x+1, pos.y+1)?1:0); // Below+Right
            
            if (buffer[i] && neighbors < STARVE) points[i] = false;
            else if (neighbors > REVIVE) points[i] = true;
        }
        points = buffer;
    }
    
    // RENDER
    ctx1.clearRect(0, 0, canv1.width, canv1.height);

    function line(a, b) { ctx1.moveTo(Math.floor(a.x*unitWidth), Math.floor(a.y*unitHeight)); ctx1.lineTo(Math.floor(b.x*unitWidth), Math.floor(b.y*unitHeight)); }

    ctx1.beginPath();
    ctx1.fillStyle = 'gray';
    ctx1.strokeStyle = 'black';
    ctx1.lineWidth = 2;

    for (let i = 0; i < WIDTH*HEIGHT; i++) {
        const x = i%WIDTH; const y = Math.floor(i/WIDTH);

        const t = {x:x+0.5,y};
        const r = {x:x+1,y:y+0.5};
        const b = {x:x+0.5,y:y+1};
        const l = {x,y:y+0.5};

        const tl = points.fromCoord(x, y)?0x000:0x1000;     // Top right
        const tr = points.fromCoord(x+1, y)?0x000:0x0100;   // Top Left
        const br = points.fromCoord(x+1, y+1)?0x000:0x0010; // Bottom right
        const bl = points.fromCoord(x, y+1)?0x000:0x0001;   // Bottom left

        switch (tl|tr|br|bl) {
            case 1: line(l, b); break; // 1
            case 16: line(r, b); break; // 2
            case 17: line(l, r); break; // 3
            case 256: line(t, r); break; // 4
            case 257: line(r, b); line(l, t); break; // 5
            case 272: line(t, b); break; // 6
            case 273: line(l, t); break; // 7
            case 4096: line(l, t); break; // 8
            case 4097: line(t, b); break; // 9
            case 4112: line(l, b); line(t, r); break; // 10
            case 4113: line(t, r); break; // 11
            case 4352: line(l, r); break; // 12
            case 4353: line(r, b); break; // 13
            case 4368: line(l, b); break; // 14
            case 0: {
                ctx1.fillStyle = 'rgba(0 255 0 / 10%)';
                ctx1.fillRect(x*unitWidth, y*unitHeight, unitWidth, unitHeight);
                break;
            }
            case 4369: {
                ctx1.fillStyle = 'rgba(255 0 0 / 10%)';
                ctx1.fillRect(x*unitWidth, y*unitHeight, unitWidth, unitHeight);
                break;
            }
        }

    }
    ctx1.closePath();
    ctx1.stroke();

    ctx1.fillStyle = 'blue';
    for (let i = 0; i < points.length; i++) {
        if (points[i]) {
            const pos = points.getIndex(i);
            ctx1.beginPath();
            ctx1.arc(pos.x*unitWidth, pos.y*unitHeight, 1, 0, Math.PI*2);
            ctx1.closePath();
            ctx1.fill();
        }
    }
}

// GUI
starveSlider.oninput = () => {
    (<HTMLSpanElement> document.querySelector('div#starve span')).innerText = starveSlider.value;
    STARVE = parseInt(starveSlider.value);
    generate();
}

reviveSlider.oninput = () => {
    (<HTMLSpanElement> document.querySelector('div#revive span')).innerText = reviveSlider.value;
    REVIVE = parseInt(reviveSlider.value);
    generate();
}

chanceSlider.oninput = () => {
    (<HTMLSpanElement> document.querySelector('div#chance span')).innerText = chanceSlider.value;
    CHANCE = parseFloat(chanceSlider.value);
    generate();
}

stepsSlider.oninput = () => {
    (<HTMLSpanElement> document.querySelector('div#steps span')).innerText = stepsSlider.value;
    STEPS = parseInt(stepsSlider.value);
    generate();
}

widthSlider.oninput = () => {
    (<HTMLSpanElement> document.querySelector('div#width span')).innerText = widthSlider.value;
    WIDTH = parseInt(widthSlider.value);
    generate();
}

heightSlider.oninput = () => {
    (<HTMLSpanElement> document.querySelector('div#height span')).innerText = heightSlider.value;
    HEIGHT = parseInt(heightSlider.value);
    generate();
}

function reset() {
    starveSlider.value = (<HTMLSpanElement> document.querySelector('div#starve span')).innerText = String(STARVE = 4);
    reviveSlider.value = (<HTMLSpanElement> document.querySelector('div#revive span')).innerText = String(REVIVE = 5);
    chanceSlider.value = (<HTMLSpanElement> document.querySelector('div#chance span')).innerText = String(CHANCE = 4);
    stepsSlider.value = (<HTMLSpanElement> document.querySelector('div#steps span')).innerText = String(STEPS = 4);
    widthSlider.value = (<HTMLSpanElement> document.querySelector('div#width span')).innerText = String(WIDTH = 80);
    heightSlider.value = (<HTMLSpanElement> document.querySelector('div#height span')).innerText = String(HEIGHT = 60);
    generate();
}

// INIT
reset();

// STATS
ctx2.fillStyle = 'rgba(0 0 0 / 40%)';
canv2.addEventListener('mouseenter', () => { stats.style.display = 'block'; });
canv2.addEventListener('mouseleave', () => { stats.style.display = 'none'; ctx2.clearRect(0, 0, canv2.width, canv2.height); });
canv2.addEventListener('mousemove', e => {
    const x = Math.floor(e.offsetX/unitWidth);
    const y = Math.floor(e.offsetY/unitHeight);
    (<HTMLParagraphElement> stats.querySelector('p#pos')).innerText = `Position: (${x},${y})`;
    (<HTMLParagraphElement> stats.querySelector('p#index')).innerText = 'Index: ' + points.getCoord(x, y);
    (<HTMLParagraphElement> stats.querySelector('p#type')).innerText = 'Type: ' + (points.fromCoord(x, y)?'Floor':'Wall');

    ctx2.clearRect(0, 0, canv2.width, canv2.height);
    ctx2.fillRect(Math.floor(e.offsetX/unitWidth)*unitWidth, Math.floor(e.offsetY/unitHeight)*unitHeight, unitWidth, unitHeight);
    stats.style.left = e.x+'px';
    stats.style.top = e.y+'px';
});