const canvas = document.getElementById("game"); //this line connects object canvas in JavaScript code to the TAG with id = game in index.html file. 
const ctx = canvas.getContext('2d');

//==== CONSTANTS ====
const BOX = 32;
//-------------------

var background = new Image(); // definition of a new Image
background.src = "img/ground.png"; // declaration of the image location

var foodImg = new Image();
foodImg.src = "img/mango.png";

var food = {
    x: Math.floor(17*Math.random() + 1)*BOX,
    y: Math.floor(15*Math.random() + 3)*BOX
}

function drawMyGame() { //the function where all the game graphics will be drawn
    ctx.drawImage(background, 0, 0);
    ctx.drawImage(foodImg, food.x, food.y);
    //horizontal displacement: 1*BOX --> 17*BOX
    //vertical displacement: 3*BOX --> 17*BOX
}

let game = setInterval(drawMyGame, 100); //refresh function for the graphics