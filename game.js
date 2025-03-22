// Get canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startPanel = document.getElementById('startPanel');
const startButton = document.getElementById('startButton');

// Set canvas size by Henry
canvas.width = 800;
canvas.height = 600;

// Game state
let gameStarted = false;
let gameOver = false;
let score = 0;
let wave = 1;
let waveInProgress = false;
let waveEnemiesRemaining = 0;
const MAX_WAVES = 15;
const WAVE_DURATION = 60000; // 60 seconds in milliseconds
let waveStartTime = 0;
let waveTimeRemaining = 0;
let gamesPlayed = 0;
let hasPaid = false;

// Payment link via OmniTek
const PAYMENT_LINK = 'https://buy.stripe.com/test_bIYcOydmC3rb54AdQQ';

// Game objects
const player = {
    x: canvas.width / 2,
    y: canvas.height - 50,
    width: 50,
    height: 50,
    speed: 5,
    color: '#00ff00',
    glow: 0,
    glowDirection: 1,
    points: [
        { x: 25, y: 0 },    // top
        { x: 0, y: 50 },    // bottom left
        { x: 50, y: 50 }    // bottom right
    ],
    shield: 0,
    shieldMax: 100
};

const bullets = [];
const enemies = [];
const particles = [];

// Game settings
const bulletSpeed = 7;
const enemySpeed = 2;
const enemySpawnRate = 1000;
const waveSpawnRate = 500;
let lastEnemySpawn = 0;
let lastWaveTime = 0;

// Input handling
const keys = {};
document.addEventListener('keydown', (e) => keys[e.key] = true);
document.addEventListener('keyup', (e) => keys[e.key] = false);

function resetGame() {
    score = 0;
    wave = 1;
    waveInProgress = false;
    waveEnemiesRemaining = 0;
    enemies.length = 0;
    bullets.length = 0;
    particles.length = 0;
    gameOver = false;
    lastEnemySpawn = 0;
    lastWaveTime = 0;
    waveStartTime = 0;
    waveTimeRemaining = WAVE_DURATION;
}

function checkPaymentStatus() {
    // Check if user has paid (you might want to implement proper server-side verification)
    const paidStatus = localStorage.getItem('hasPaid');
    if (paidStatus === 'true') {
        hasPaid = true;
    }
}

function handlePayment() {
    // Open payment link in a new tab
    window.open(PAYMENT_LINK, '_blank');
    
    // Show payment confirmation message
    const paymentMessage = document.createElement('div');
    paymentMessage.style.position = 'absolute';
    paymentMessage.style.top = '50%';
    paymentMessage.style.left = '50%';
    paymentMessage.style.transform = 'translate(-50%, -50%)';
    paymentMessage.style.backgroundColor = 'rgba(0, 0, 0, 0.95)';
    paymentMessage.style.padding = '2rem';
    paymentMessage.style.borderRadius = '10px';
    paymentMessage.style.textAlign = 'center';
    paymentMessage.style.color = '#fff';
    paymentMessage.style.border = '2px solid #00ff00';
    paymentMessage.style.zIndex = '1000';
    paymentMessage.style.boxShadow = '0 0 20px rgba(0, 255, 0, 0.5)';
    
    paymentMessage.innerHTML = `
        <h2 style="color: #00ff00; margin-bottom: 1rem; font-size: 2rem;">Payment Instructions</h2>
        <p style="margin-bottom: 1rem; font-size: 1.2rem;">1. Complete your payment in the new tab</p>
        <p style="margin-bottom: 1rem; font-size: 1.2rem;">2. After payment, click "I've Paid"</p>
        <p style="margin-bottom: 1.5rem; font-size: 1.2rem;">3. You'll be able to play unlimited games!</p>
        <button onclick="confirmPayment()" style="background-color: #00ff00; color: #000; border: none; padding: 1rem 2rem; font-size: 1.2rem; border-radius: 5px; cursor: pointer; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 0 10px rgba(0, 255, 0, 0.5);">I've Paid</button>
    `;
    
    document.getElementById('gameContainer').appendChild(paymentMessage);
}

function confirmPayment() {
    localStorage.setItem('hasPaid', 'true');
    hasPaid = true;
    // Remove payment message
    const paymentMessage = document.querySelector('#gameContainer > div:last-child');
    if (paymentMessage) paymentMessage.remove();
    // Start the game
    startPanel.style.display = 'none';
    gameStarted = true;
    resetGame();
}

// Start button handler
startButton.addEventListener('click', () => {
    if (gamesPlayed === 0 || hasPaid) {
        startPanel.style.display = 'none';
        gameStarted = true;
        resetGame();
    } else {
        // Show payment required message
        const paymentMessage = document.createElement('div');
        paymentMessage.style.position = 'absolute';
        paymentMessage.style.top = '50%';
        paymentMessage.style.left = '50%';
        paymentMessage.style.transform = 'translate(-50%, -50%)';
        paymentMessage.style.backgroundColor = 'rgba(0, 0, 0, 0.95)';
        paymentMessage.style.padding = '2rem';
        paymentMessage.style.borderRadius = '10px';
        paymentMessage.style.textAlign = 'center';
        paymentMessage.style.color = '#fff';
        paymentMessage.style.border = '2px solid #00ff00';
        paymentMessage.style.zIndex = '1000';
        paymentMessage.style.boxShadow = '0 0 20px rgba(0, 255, 0, 0.5)';
        
        paymentMessage.innerHTML = `
            <h2 style="color: #00ff00; margin-bottom: 1rem; font-size: 2rem;">Payment Required</h2>
            <p style="margin-bottom: 1rem; font-size: 1.2rem;">You've played your free game!</p>
            <p style="margin-bottom: 1rem; font-size: 1.2rem;">Pay $4.99 to continue playing unlimited games</p>
            <p style="margin-bottom: 1.5rem; font-size: 1.2rem;">Click the button below to pay</p>
            <button onclick="handlePayment()" style="background-color: #00ff00; color: #000; border: none; padding: 1rem 2rem; font-size: 1.2rem; border-radius: 5px; cursor: pointer; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 0 10px rgba(0, 255, 0, 0.5);">Pay Now</button>
        `;
        
        document.getElementById('gameContainer').appendChild(paymentMessage);
    }
});

// Particle system
function createParticles(x, y, color) {
    for (let i = 0; i < 10; i++) {
        particles.push({
            x,
            y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 1,
            color
        });
    }
}

// Game functions
function spawnEnemy(isWave = false) {
    const enemy = {
        x: Math.random() * (canvas.width - 30),
        y: -30,
        width: 30,
        height: 30,
        color: isWave ? '#ff00ff' : '#ff0000',
        isWaveEnemy: isWave,
        glow: 0,
        glowDirection: 1,
        points: isWave ? [
            { x: 15, y: 0 },    // top
            { x: 0, y: 30 },    // bottom left
            { x: 30, y: 30 }    // bottom right
        ] : [
            { x: 15, y: 0 },    // top
            { x: 0, y: 15 },    // left
            { x: 30, y: 15 },   // right
            { x: 15, y: 30 }    // bottom
        ],
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 0.1
    };
    enemies.push(enemy);
    if (isWave) waveEnemiesRemaining++;
}

function shoot() {
    const bullet = {
        x: player.x + player.width / 2 - 2.5,
        y: player.y,
        width: 5,
        height: 10,
        color: '#ffff00',
        glow: 1,
        trail: []
    };
    bullets.push(bullet);
    createParticles(bullet.x, bullet.y, '#ffff00');
}

function startWave() {
    waveInProgress = true;
    waveEnemiesRemaining = 5 + wave * 2;
    const spawnDelay = Math.max(500 - wave * 20, 100); // Faster spawns as waves progress
    waveStartTime = Date.now();
    waveTimeRemaining = WAVE_DURATION;
    
    for (let i = 0; i < waveEnemiesRemaining; i++) {
        setTimeout(() => spawnEnemy(true), i * spawnDelay);
    }
}

function update() {
    if (!gameStarted || gameOver) return;

    // Player movement
    if (keys['ArrowLeft'] && player.x > 0) player.x -= player.speed;
    if (keys['ArrowRight'] && player.x < canvas.width - player.width) player.x += player.speed;
    if (keys[' ']) shoot();

    // Player glow effect
    player.glow += 0.05 * player.glowDirection;
    if (player.glow >= 1) player.glowDirection = -1;
    if (player.glow <= 0) player.glowDirection = 1;

    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].y -= bulletSpeed;
        bullets[i].glow -= 0.02;
        bullets[i].trail.push({ x: bullets[i].x, y: bullets[i].y });
        if (bullets[i].trail.length > 5) bullets[i].trail.shift();
        
        if (bullets[i].y < 0) bullets.splice(i, 1);
    }

    // Update enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        enemies[i].y += enemySpeed + wave * 0.1; // Enemies get faster each wave
        enemies[i].glow += 0.05 * enemies[i].glowDirection;
        enemies[i].rotation += enemies[i].rotationSpeed;
        
        if (enemies[i].glow >= 1) enemies[i].glowDirection = -1;
        if (enemies[i].glow <= 0) enemies[i].glowDirection = 1;

        if (enemies[i].y > canvas.height) {
            const isWaveEnemy = enemies[i].isWaveEnemy;
            enemies.splice(i, 1);
            if (isWaveEnemy) {
                waveEnemiesRemaining--;
            }
            gameOver = true;
        }
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].x += particles[i].vx;
        particles[i].y += particles[i].vy;
        particles[i].life -= 0.02;
        if (particles[i].life <= 0) particles.splice(i, 1);
    }

    // Collision detection
    for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = enemies.length - 1; j >= 0; j--) {
            if (checkCollision(bullets[i], enemies[j])) {
                createParticles(bullets[i].x, bullets[i].y, enemies[j].color);
                bullets.splice(i, 1);
                const isWaveEnemy = enemies[j].isWaveEnemy;
                enemies.splice(j, 1);
                if (isWaveEnemy) {
                    waveEnemiesRemaining--;
                    score += 20;
                } else {
                    score += 10;
                }
                break;
            }
        }
    }

    // Wave management
    const currentTime = Date.now();
    if (waveInProgress) {
        waveTimeRemaining = WAVE_DURATION - (currentTime - waveStartTime);
        
        // If wave time is up
        if (waveTimeRemaining <= 0) {
            waveInProgress = false;
            if (wave >= MAX_WAVES) {
                gameOver = true;
                return;
            }
            wave++;
            startWave();
        }
    } else if (currentTime - lastWaveTime > 5000) { // 5 second break between waves
        if (wave >= MAX_WAVES) {
            gameOver = true;
            return;
        }
        wave++;
        startWave();
    }

    // Regular enemy spawning
    if (currentTime - lastEnemySpawn > enemySpawnRate) {
        spawnEnemy();
        lastEnemySpawn = currentTime;
    }

    if (gameOver) {
        gamesPlayed++;
        // Draw semi-transparent black overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw game over text
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 48px Arial';
        ctx.fillText('Game Over!', canvas.width / 2 - 100, canvas.height / 2 - 100);
        ctx.font = 'bold 24px Arial';
        ctx.fillText(`Final Score: ${score}`, canvas.width / 2 - 70, canvas.height / 2 - 40);
        ctx.fillText(`Waves Completed: ${wave - 1}/${MAX_WAVES}`, canvas.width / 2 - 70, canvas.height / 2);
        
        // Show payment message if this is the first game
        if (gamesPlayed === 1) {
            ctx.fillStyle = '#00ff00';
            ctx.font = 'bold 32px Arial';
            ctx.fillText('First game completed!', canvas.width / 2 - 150, canvas.height / 2 + 60);
            ctx.fillText('Next game requires payment', canvas.width / 2 - 180, canvas.height / 2 + 100);
            
            // Create and show payment button
            const paymentButton = document.createElement('button');
            paymentButton.textContent = 'Pay Now ($4.99)';
            paymentButton.style.position = 'absolute';
            paymentButton.style.left = '50%';
            paymentButton.style.top = '60%';
            paymentButton.style.transform = 'translate(-50%, -50%)';
            paymentButton.style.padding = '1rem 2rem';
            paymentButton.style.fontSize = '24px';
            paymentButton.style.backgroundColor = '#00ff00';
            paymentButton.style.color = '#000';
            paymentButton.style.border = 'none';
            paymentButton.style.borderRadius = '5px';
            paymentButton.style.cursor = 'pointer';
            paymentButton.style.boxShadow = '0 0 20px rgba(0, 255, 0, 0.5)';
            paymentButton.onclick = handlePayment;
            
            // Remove any existing payment button
            const existingButton = document.querySelector('#gameContainer button');
            if (existingButton) existingButton.remove();
            
            // Add the new payment button
            document.getElementById('gameContainer').appendChild(paymentButton);
        }
        
        startPanel.style.display = 'block';
        startButton.textContent = hasPaid ? 'Play Again' : 'Continue';
    }
}

function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

function draw() {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw stars with parallax effect
    for (let i = 0; i < 100; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = Math.random() * 2;
        const speed = Math.random() * 0.5;
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.5})`;
        ctx.fillRect(x, y, size, size);
    }

    // Draw player with enhanced glow effect
    ctx.shadowColor = '#00ff00';
    ctx.shadowBlur = 20 * player.glow;
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.moveTo(player.x + player.points[0].x, player.y + player.points[0].y);
    for (let i = 1; i < player.points.length; i++) {
        ctx.lineTo(player.x + player.points[i].x, player.y + player.points[i].y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw bullets with enhanced trail effect
    bullets.forEach(bullet => {
        // Draw trail
        bullet.trail.forEach((pos, index) => {
            const alpha = (index / bullet.trail.length) * 0.5;
            ctx.fillStyle = `rgba(255, 255, 0, ${alpha})`;
            ctx.beginPath();
            ctx.arc(pos.x + bullet.width/2, pos.y + bullet.height/2, bullet.width/2, 0, Math.PI * 2);
            ctx.fill();
        });

        // Draw bullet
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(bullet.x + bullet.width/2, bullet.y + bullet.height/2, bullet.width/2, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw enemies with rotation and glow
    enemies.forEach(enemy => {
        ctx.save();
        ctx.translate(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
        ctx.rotate(enemy.rotation);
        ctx.translate(-(enemy.x + enemy.width/2), -(enemy.y + enemy.height/2));
        
        ctx.shadowColor = enemy.color;
        ctx.shadowBlur = 10 * enemy.glow;
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.moveTo(enemy.x + enemy.points[0].x, enemy.y + enemy.points[0].y);
        for (let i = 1; i < enemy.points.length; i++) {
            ctx.lineTo(enemy.x + enemy.points[i].x, enemy.y + enemy.points[i].y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();
    });

    // Draw particles with enhanced glow
    particles.forEach(particle => {
        ctx.fillStyle = `rgba(${particle.color}, ${particle.life})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, 1, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw UI with enhanced styling
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px Arial';
    ctx.fillText(`Score: ${score}`, 10, 30);
    ctx.fillText(`Wave: ${wave}/${MAX_WAVES}`, 10, 60);
    
    if (waveInProgress) {
        // Draw wave timer
        const minutes = Math.floor(waveTimeRemaining / 60000);
        const seconds = Math.floor((waveTimeRemaining % 60000) / 1000);
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        ctx.fillStyle = '#ff00ff';
        ctx.fillText(`Wave Time: ${timeString}`, 10, 90);
        ctx.fillText(`Wave Enemies: ${waveEnemiesRemaining}`, 10, 120);
        
        // Draw wave progress bar
        const progressWidth = 200;
        const progressHeight = 10;
        const progressX = 10;
        const progressY = 140;
        
        // Background of progress bar
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(progressX, progressY, progressWidth, progressHeight);
        
        // Progress fill
        const progress = waveTimeRemaining / WAVE_DURATION;
        ctx.fillStyle = '#ff00ff';
        ctx.fillRect(progressX, progressY, progressWidth * progress, progressHeight);
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start the game loop
gameLoop();

// Initialize payment status
checkPaymentStatus(); 