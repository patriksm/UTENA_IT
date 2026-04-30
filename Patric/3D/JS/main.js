const DEG = Math.PI / 180;
let myWolrd = document.getElementById("world");
let container = document.getElementById("container");

var lock = false;

document.addEventListener("pointerlockchange", (e) => {
    lock = !lock;
});

container.onclick = function () {
    if(!lock) {
        container.requestPointerLock();
    }
}



let lvl_one_map = [
    { id: "floor", w: 1000, h: 1000, color: "grey", x: 0, y: 0, z: -100, rx: 0, ry: 90, rz: 0 },
    { id: "hinter wall", w: 1000, h: 200, color: "aquamarine", x: -500, y: 0, z: 0, rx: 0, ry: 0, rz: 0 },
    { id: "right wall", w: 1000, h: 200, color: "#ff0086", x: 0, y: 500, z: 0, rx: 0, ry: 0, rz: 90 },
    { id: "left wall", w: 1000, h: 200, color: "#17c97d", x: 0, y: -500, z: 0, rx: 0, ry: 0, rz: 90 },
    { id: "central_item", w: 10, h: 10, color: "black", x: -10, y: 0, z: 0, rx: 0, ry: 0, rz: 0 }
];

function drawSquares(map) {
    for (let i = 0; i < map.length; i++) {
        let myNewElement = document.createElement("div");
        myNewElement.id = map[i].id;
        myNewElement.style.position = "absolute";
        myNewElement.style.width = `${map[i].w}px`;
        myNewElement.style.height = `${map[i].h}px`;
        myNewElement.style.backgroundColor = map[i].color;
        myNewElement.style.transform =
            `translate3d(
    ${myWolrd.clientWidth / 2 - map[i].w / 2 + map[i].y}px, 
    ${myWolrd.clientHeight / 2 - map[i].h / 2 - map[i].z}px, 
    ${map[i].x}px
    ) 
    rotateX(${map[i].ry}deg) 
    rotateY(${map[i].rz}deg) 
    rotateZ(${map[i].rx}deg)`;
        myWolrd.appendChild(myNewElement);
    }

}

drawSquares(lvl_one_map);

let dispVector = { x: 0, y: 0, z: 0 };
let rot = { x: 0, y: 0, z: 0 };
let velX = velY = velZ = 5;
let mouseY = mouseZ = 0;
let dt = 1;

function player(x, y, z, rx, ry, rz) { //constuctor defining object of the class player
    this.x = x;
    this.y = y;
    this.z = z;
    this.rx = rx;
    this.ry = ry;
    this.rz = rz;
}

let pawn = new player(0, 0, 0, 0, 0, 0); // here new instance of the class player is created and it is called pawn

document.addEventListener("keydown", (e) => {
    if (e.code == "KeyW") {
        dispVector.x = -velX * dt;
    }
    if (e.code == "KeyS") {
        dispVector.x = velX * dt;
    }
    if (e.code == "KeyD") {
        dispVector.y = velY * dt;
    }
    if (e.code == "KeyA") {
        dispVector.y = -velY * dt;
    }
});

document.addEventListener("keyup", (e) => {
    if (e.code == "KeyW") {
        dispVector.x = 0;
    }
    if (e.code == "KeyS") {
        dispVector.x = 0;
    }
    if (e.code == "KeyD") {
        dispVector.y = 0;
    }
    if (e.code == "KeyA") {
        dispVector.y = 0;
    }
});

document.addEventListener("mousemove", (e) => {
    rot.z = e.movementX;
    rot.y = e.movementY;
})

function update() {
    // pawn.x += dispVector.x; 
    // pawn.y += dispVector.y; 
    if (lock) {
        pawn.x += dispVector.x * Math.cos(pawn.rz * DEG) - dispVector.y * Math.sin(pawn.rz * DEG);
        pawn.y += dispVector.x * Math.sin(pawn.rz * DEG) + dispVector.y * Math.cos(pawn.rz * DEG);

        pawn.rz += rot.z;
        pawn.ry += rot.y;
        rot.y = rot.z = 0;
    }    

    myWolrd.style.transform = `translateZ(${600-0}px) RotateX(${-pawn.ry}deg) RotateY(${pawn.rz}deg) RotateZ(${pawn.rx}) translate3d(${-pawn.y}px, ${pawn.z}px, ${-pawn.x}px)`;
}

let myGame = setInterval(update, 10);