const canvas = document.getElementById("game"); //this line connects object canvas in JavaScript code to the TAG with id = game in index.html file. 
const ctx = canvas.getContext('2d');

var background = new Image(); // definition of a new Image
background.src = "img/ground.png"; // declaration of the image location

function drawMyGame() { //the function where all the game graphics will be drawn
    ctx.drawImage(background, 0, 0);
}

let game = setInterval(drawMyGame, 100); //refresh function for the graphics