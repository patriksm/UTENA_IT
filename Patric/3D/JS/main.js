let myWolrd = document.getElementById("world");

let lvl_one_map = [
    { id: "floor", w: 1000, h: 1000, color: "grey", x: 0, y: 0, z: -100, rx: 0, ry: 90, rz: 0 },
    {}
];

function drawSquares(map) {
    let myNewElement = document.createElement("div");
    myNewElement.id = map[0].id;
    myNewElement.style.position = "absolute";
    myNewElement.style.width = `${map[0].w}px`;
    myNewElement.style.height = `${map[0].h}px`;
    myNewElement.style.backgroundColor = map[0].color;
    myNewElement.style.transform =
        `translate3d(
    ${myWolrd.clientWidth / 2 - map[0].w / 2 + map[0].y}px, 
    ${myWolrd.clientHeight / 2 - map[0].h / 2 - map[0].z}px, 
    ${map[0].x}px
    ) 
    rotateX(${map[0].ry}deg) 
    rotateY(${map[0].rz}deg) 
    rotateZ(${map[0].rx}deg)`;
    myWolrd.appendChild(myNewElement);
}

drawSquares(lvl_one_map);