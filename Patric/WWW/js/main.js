const canvas = document.getElementById("game"); //this line connects object canvas in JavaScript code to the TAG with id = game in index.html file. 
const ctx = canvas.getContext('2d');

//==== CONSTANTS ====
const BOX = 32;
//-------------------

var background = new Image(); // definition of a new Image
background.src = "img/ground.png"; // declaration of the image location

var foodImg = new Image();
foodImg.src = "img/mango.png";

var snakeHead = new Image();
snakeHead.src = "img/snakeHead.png";

var food = {
    x: Math.floor(17 * Math.random() + 1) * BOX,
    y: Math.floor(15 * Math.random() + 3) * BOX
}

var snake = [];
snake[0] = {
    x: 9 * BOX,
    y: 10 * BOX
}

var dir = '';
var score = 0;

document.addEventListener("keydown", (e) => {
    if (e.code == 'ArrowUp' && dir != 'down') dir = 'up';
    if (e.code == 'ArrowRight' && dir != 'left') dir = 'right';
    if (e.code == 'ArrowDown' && dir != 'up') dir = 'down';
    if (e.code == 'ArrowLeft' && dir != 'right') dir = 'left';
});

function drawMyGame() { //the function where all the game graphics will be drawn
    ctx.drawImage(background, 0, 0);
    ctx.drawImage(foodImg, food.x, food.y);
    //horizontal displacement: 1*BOX --> 17*BOX
    //vertical displacement: 3*BOX --> 17*BOX

    ctx.font = "50px Arial";
    ctx.fillStyle = "white";
    ctx.fillText(`Score: ${score}`, BOX, 2 * BOX);

    for (let i = 0; i < snake.length; i++) {
        if (i == -1) {
            ctx.drawImage(snakeHead, snake[i].x, snake[i].y);
        } else {
            ctx.fillStyle = "brown";
            ctx.fillRect(snake[i].x, snake[i].y, BOX, BOX);
        }

    }

    let snakeX = snake[0].x;
    let snakeY = snake[0].y;

    if (dir == 'right') snakeX += BOX;
    if (dir == 'left') snakeX -= BOX;
    if (dir == 'up') snakeY -= BOX;
    if (dir == 'down') snakeY += BOX;

    if (snakeX > 17 * BOX) {
        snakeX = 1 * BOX;
    } else if (snakeX < BOX) {
        snakeX = 17 *BOX;
    }

    if (snakeX == food.x && snakeY == food.y) {
        food = {
            x: Math.floor(17 * Math.random() + 1) * BOX,
            y: Math.floor(15 * Math.random() + 3) * BOX
        }
        score++;
    } else {
        snake.pop();
    }



    let newHead = {
        x: snakeX,
        y: snakeY
    }

    snake.unshift(newHead);
}

let game = setInterval(drawMyGame, 100); //refresh function for the graphics