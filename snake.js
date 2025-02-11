const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const GRID_SIZE = 20;
const GRID_WIDTH = canvas.width / GRID_SIZE;
const GRID_HEIGHT = canvas.height / GRID_SIZE;

const BLACK = '#000';
const WHITE = '#FFF';
const RED = '#F00';
const GREEN = '#0F0';
const YELLOW = '#FF0';
const PANEL_COLOR = '#333';

const HEART_PIXELS = [
    [2, 0], [3, 1], [4, 1], [5, 0],
    [1, 1], [6, 1],
    [0, 2], [7, 2],
    [0, 3], [7, 3],
    [1, 4], [6, 4],
    [2, 5], [5, 5],
    [3, 6], [4, 6]
];

const HEART_OFFSET_X = (GRID_WIDTH / 2) - 4;
const HEART_OFFSET_Y = (GRID_HEIGHT / 2) - 4;

const HEART_PIXELS_CENTERED = HEART_PIXELS.map(([x, y]) => [x + HEART_OFFSET_X, y + HEART_OFFSET_Y]);

const STATES = {
    START: 0,
    PLAYING: 1,
    PAUSED: 2,
    GAME_OVER: 3,
    WIN: 4,
    DEBUG: 5
};

let gameState = STATES.START;
let snake = [[5, 5], [4, 5], [3, 5]];
let direction = [1, 0];
let collectedPixels = new Set();
let currentPixel = HEART_PIXELS_CENTERED[Math.floor(Math.random() * HEART_PIXELS_CENTERED.length)];
let speed = 3; // Speed in updates per second
let collisionAllowance = 1;
let flashTimer = 0;
const flashInterval = 500; // Flash every 500ms
let frameCounter = 0;

const pauseButton = document.getElementById('pauseButton');
const playAgainButton = document.getElementById('playAgainButton');
const stats = document.getElementById('stats');
const startPanel = document.getElementById('startPanel');
const startButton = document.getElementById('startButton');
const speedDisplay = document.getElementById('speedDisplay');

pauseButton.addEventListener('click', () => {
    if (gameState === STATES.PLAYING) {
        gameState = STATES.PAUSED;
        pauseButton.textContent = 'Resume';
    } else if (gameState === STATES.PAUSED) {
        gameState = STATES.PLAYING;
        pauseButton.textContent = 'Pause';
    }
});

playAgainButton.addEventListener('click', () => {
    resetGame();
});

startButton.addEventListener('click', () => {
    gameState = STATES.PLAYING;
    startPanel.style.display = 'none';
});

document.addEventListener('keydown', (event) => {
    if (gameState === STATES.START) {
        if (event.key === 'Enter') {
            gameState = STATES.PLAYING;
            startPanel.style.display = 'none';
        } else if (event.key === 'ArrowLeft') {
            speed = Math.max(1, speed - 1);
            speedDisplay.textContent = speed;
        } else if (event.key === 'ArrowRight') {
            speed += 1;
            speedDisplay.textContent = speed;
        } else if (event.key === 'd') {
            gameState = STATES.DEBUG;
            startPanel.style.display = 'none';
        }
    } else if (gameState === STATES.DEBUG && event.key === 'd') {
        gameState = STATES.START;
        startPanel.style.display = 'block';
    } else if (gameState === STATES.PLAYING) {
        if (event.key === ' ') {
            gameState = STATES.PAUSED;
            pauseButton.textContent = 'Resume';
        } else if (event.key === 'ArrowUp' && direction[1] !== 1) {
            direction = [0, -1];
        } else if (event.key === 'ArrowDown' && direction[1] !== -1) {
            direction = [0, 1];
        } else if (event.key === 'ArrowLeft' && direction[0] !== 1) {
            direction = [-1, 0];
        } else if (event.key === 'ArrowRight' && direction[0] !== -1) {
            direction = [1, 0];
        }
    } else if (gameState === STATES.PAUSED && event.key === ' ') {
        gameState = STATES.PLAYING;
        pauseButton.textContent = 'Pause';
    }
});

function resetGame() {
    snake = [[5, 5], [4, 5], [3, 5]];
    direction = [1, 0];
    collectedPixels = new Set();
    gameState = STATES.START;
    speed = 3;
    collisionAllowance = 1;
    currentPixel = HEART_PIXELS_CENTERED[Math.floor(Math.random() * HEART_PIXELS_CENTERED.length)];
    playAgainButton.style.display = 'none';
    pauseButton.style.display = 'block';
    stats.textContent = '0/17';
    startPanel.style.display = 'block';
}

function checkCollision() {
    const head = snake[0];
    if (head[0] < 0 || head[0] >= GRID_WIDTH || head[1] < 0 || head[1] >= GRID_HEIGHT) {
        if (collisionAllowance > 0) {
            collisionAllowance -= 1;
            return false;
        }
        return true;
    }
    for (let i = 1; i < snake.length; i++) {
        if (snake[i][0] === head[0] && snake[i][1] === head[1]) {
            if (collisionAllowance > 0) {
                collisionAllowance -= 1;
                return false;
            }
            return true;
        }
    }
    return false;
}

function drawText(text, x, y, color, fontSize = '24px') {
    ctx.font = `${fontSize} Arial`;
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
}

function drawPixelArt(pixels, offsetX, offsetY, color) {
    for (const [x, y] of pixels) {
        const px = x + offsetX;
        const py = y + offsetY;
        if (px >= 0 && px < GRID_WIDTH && py >= 0 && py < GRID_HEIGHT) {
            ctx.fillStyle = color;
            ctx.fillRect(px * GRID_SIZE, py * GRID_SIZE, GRID_SIZE, GRID_SIZE);
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    for (let x = 0; x < GRID_WIDTH; x++) {
        for (let y = 0; y < GRID_HEIGHT; y++) {
            ctx.strokeStyle = WHITE;
            ctx.strokeRect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
        }
    }

    // Draw current heart pixel
    if (gameState === STATES.PLAYING || gameState === STATES.DEBUG) {
        ctx.fillStyle = RED;
        ctx.fillRect(currentPixel[0] * GRID_SIZE, currentPixel[1] * GRID_SIZE, GRID_SIZE, GRID_SIZE);
    }

    // Draw snake
    if (gameState === STATES.PLAYING) {
        for (const segment of snake) {
            ctx.fillStyle = GREEN;
            ctx.fillRect(segment[0] * GRID_SIZE, segment[1] * GRID_SIZE, GRID_SIZE, GRID_SIZE);
        }
    }

    // Draw panel
    ctx.fillStyle = PANEL_COLOR;
    ctx.fillRect((GRID_WIDTH - 5) * GRID_SIZE, 0, 5 * GRID_SIZE, 3 * GRID_SIZE);

    if (gameState === STATES.PLAYING || gameState === STATES.PAUSED) {
        pauseButton.style.display = 'block';
        stats.textContent = `${collectedPixels.size}/${HEART_PIXELS_CENTERED.length}`;
    } else if (gameState === STATES.GAME_OVER || gameState === STATES.WIN) {
        playAgainButton.style.display = 'block';
        pauseButton.style.display = 'none';
    }

    if (gameState === STATES.GAME_OVER) {
        drawText('You Lose', canvas.width / 2 - 50, canvas.height / 2 - 50, RED);
    }

    if (gameState === STATES.WIN || gameState === STATES.DEBUG) {
        // Draw "CC I ❤️ YOU" pixel art
        const winMessage = [
            // C (first)
            [HEART_OFFSET_X - 12, HEART_OFFSET_Y + 1],
            [HEART_OFFSET_X - 12, HEART_OFFSET_Y + 2],
            [HEART_OFFSET_X - 12, HEART_OFFSET_Y + 3],
            [HEART_OFFSET_X - 12, HEART_OFFSET_Y + 4],
            [HEART_OFFSET_X - 11, HEART_OFFSET_Y + 1],
            [HEART_OFFSET_X - 11, HEART_OFFSET_Y + 4],
            [HEART_OFFSET_X - 10, HEART_OFFSET_Y + 1],
            [HEART_OFFSET_X - 10, HEART_OFFSET_Y + 4],
            // C (second)
            [HEART_OFFSET_X - 8, HEART_OFFSET_Y + 1],
            [HEART_OFFSET_X - 8, HEART_OFFSET_Y + 2],
            [HEART_OFFSET_X - 8, HEART_OFFSET_Y + 3],
            [HEART_OFFSET_X - 8, HEART_OFFSET_Y + 4],
            [HEART_OFFSET_X - 7, HEART_OFFSET_Y + 1],
            [HEART_OFFSET_X - 7, HEART_OFFSET_Y + 4],
            [HEART_OFFSET_X - 6, HEART_OFFSET_Y + 1],
            [HEART_OFFSET_X - 6, HEART_OFFSET_Y + 4],
            // I
            [HEART_OFFSET_X - 3, HEART_OFFSET_Y + 1],
            [HEART_OFFSET_X - 3, HEART_OFFSET_Y + 2],
            [HEART_OFFSET_X - 3, HEART_OFFSET_Y + 3],
            [HEART_OFFSET_X - 3, HEART_OFFSET_Y + 4],
            // Heart
            ...HEART_PIXELS_CENTERED,
            // Y
            [HEART_OFFSET_X + 9, HEART_OFFSET_Y + 1],
            [HEART_OFFSET_X + 9, HEART_OFFSET_Y + 2],
            [HEART_OFFSET_X + 10, HEART_OFFSET_Y + 3],
            [HEART_OFFSET_X + 10, HEART_OFFSET_Y + 4],
            [HEART_OFFSET_X + 11, HEART_OFFSET_Y + 2],
            [HEART_OFFSET_X + 11, HEART_OFFSET_Y + 1],
            // O
            [HEART_OFFSET_X + 13, HEART_OFFSET_Y + 1],
            [HEART_OFFSET_X + 13, HEART_OFFSET_Y + 2],
            [HEART_OFFSET_X + 13, HEART_OFFSET_Y + 3],
            [HEART_OFFSET_X + 13, HEART_OFFSET_Y + 4],
            [HEART_OFFSET_X + 14, HEART_OFFSET_Y + 1],
            [HEART_OFFSET_X + 14, HEART_OFFSET_Y + 4],
            [HEART_OFFSET_X + 15, HEART_OFFSET_Y + 1],
            [HEART_OFFSET_X + 15, HEART_OFFSET_Y + 2],
            [HEART_OFFSET_X + 15, HEART_OFFSET_Y + 3],
            [HEART_OFFSET_X + 15, HEART_OFFSET_Y + 4],
            // U
            [HEART_OFFSET_X + 17, HEART_OFFSET_Y + 1],
            [HEART_OFFSET_X + 17, HEART_OFFSET_Y + 2],
            [HEART_OFFSET_X + 17, HEART_OFFSET_Y + 3],
            [HEART_OFFSET_X + 17, HEART_OFFSET_Y + 4],
            [HEART_OFFSET_X + 18, HEART_OFFSET_Y + 4],
            [HEART_OFFSET_X + 19, HEART_OFFSET_Y + 4],
            [HEART_OFFSET_X + 19, HEART_OFFSET_Y + 3],
            [HEART_OFFSET_X + 19, HEART_OFFSET_Y + 2],
            [HEART_OFFSET_X + 19, HEART_OFFSET_Y + 1]
        ];
        drawPixelArt(winMessage, 0, 0, RED);

        // Flash the heart pixels
        flashTimer += 16; // Increment by ~16ms per frame (60 FPS)
        if (flashTimer >= flashInterval) {
            flashTimer = 0;
        }
        const flashState = flashTimer < flashInterval / 2; // Flash on for half the interval
        for (const [x, y] of HEART_PIXELS_CENTERED) {
            const rect = [x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE, GRID_SIZE];
            ctx.fillStyle = flashState ? RED : BLACK;
            ctx.fillRect(...rect);
        }

        // Draw rose bundle
        const ROSE = [
            [0, 0], [2, 0],
            [0, 1], [1, 1], [2, 1],
            [0, 2], [1, 2], [2, 2],
            [1, 3],
            [1, 4]
        ];
        const ROSE_BUNDLE = [
            ...ROSE.map(([x, y]) => [x + 0, y + 0]),
            ...ROSE.map(([x, y]) => [x + 5, y + 0]),
            ...ROSE.map(([x, y]) => [x + 10, y + 0])
        ];
        const ROSE_OFFSET_X = (GRID_WIDTH / 2) - 7;
        const ROSE_OFFSET_Y = HEART_OFFSET_Y + 9;
        for (const [x, y] of ROSE_BUNDLE) {
            const px = x + ROSE_OFFSET_X;
            const py = y + ROSE_OFFSET_Y;
            if (px >= 0 && px < GRID_WIDTH && py >= 0 && py < GRID_HEIGHT) {
                ctx.fillStyle = y > 2 ? GREEN : RED; // Stems green, flowers red
                ctx.fillRect(px * GRID_SIZE, py * GRID_SIZE, GRID_SIZE, GRID_SIZE);
            }
        }
    }
}

function update() {
    if (gameState === STATES.PLAYING) {
        frameCounter++;
        if (frameCounter >= Math.floor(60 / speed)) { // Control snake speed
            frameCounter = 0;
            const newHead = [snake[0][0] + direction[0], snake[0][1] + direction[1]];
            snake.unshift(newHead);

            if (newHead[0] === currentPixel[0] && newHead[1] === currentPixel[1]) {
                collectedPixels.add(currentPixel);
                const remainingPixels = HEART_PIXELS_CENTERED.filter(pixel => !collectedPixels.has(pixel));
                if (remainingPixels.length > 0) {
                    currentPixel = remainingPixels[Math.floor(Math.random() * remainingPixels.length)];
                } else {
                    gameState = STATES.WIN;
                }
            } else {
                snake.pop();
            }

            if (checkCollision()) {
                gameState = STATES.GAME_OVER;
            }
        }
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();