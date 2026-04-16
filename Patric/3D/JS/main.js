let myWolrd = document.getElementById("world");

let lvl_one_map = [
    { id: "floor", w: 1000, h: 1000, color: "grey", x: 0, y: 0, z: -100, rx: 0, ry: 90, rz: 0 },
    { id: "hinter wall", w: 1000, h: 200, color: "aquamarine", x: -500, y: 0, z: 0, rx: 0, ry: 0, rz: 0 },
    { id: "right wall", w: 1000, h: 200, color: "#ff0086", x: 0, y: 500, z: 0, rx: 0, ry: 0, rz: 90 },
    { id: "left wall", w: 1000, h: 200, color: "#17c97d", x: 0, y: -500, z: 0, rx: 0, ry: 0, rz: 90 }
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
let vel = 40;

function update() {
    myWolrd.style.transform = `translate3d(${dispVector.y}px, ${dispVector.z}px, ${dispVector.x}px)`;
    dispVector.x += vel;
}

let myGame = setInterval(update, 100);