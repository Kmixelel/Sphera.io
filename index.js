const audio_gameStart = new Audio('assets/gamestart.mp3');
const audio_gameOver = new Audio('assets/gameover.mp3');
const audio_hit = new Audio('assets/hit.mp3');
const audio_shoot = new Audio('assets/shoot.mp3');

const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');
const scoreContainerEl = document.querySelector('#scoreContainerEl');
const scoreEl = document.querySelector('#scoreEl');
const highScoreEl = document.querySelector('#highScoreEl');
const startGameBtn = document.querySelector('#startGameBtn');
const modalEl = document.querySelector('#modalEl');
const bigScoreEl = document.querySelector('#bigScoreEl');
const bigHighScoreEl = document.querySelector('#bigHighScoreEl');

canvas.width = innerWidth;
canvas.height = innerHeight;

let flag_gameActive = false;

if (localStorage.getItem('highscore')) {
    bigHighScoreEl.innerHTML = localStorage.getItem('highscore');
} else {
    localStorage.setItem('highscore', 0);
}

class Player {
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
    }
    draw() {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();
    }
}
class Projectile {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    }
    draw() {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();
    }
    update() {
        this.draw();
        this.x = this.x + this.velocity.x;
        this.y = this.y + this.velocity.y;
    }
}

class Enemy {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    }
    draw() {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();
    }
    update() {
        this.draw();
        this.x = this.x + this.velocity.x;
        this.y = this.y + this.velocity.y;
        this.velocity.x *= (score / 100000000) + 1;
        this.velocity.y *= (score / 100000000) + 1;
    }
}

const friction = 0.99;
class Particle {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
        this.alpha = 1;
    }
    draw() {
        c.save();
        c.globalAlpha = this.alpha;
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();
        c.restore();
    }
    update() {
        this.draw();
        this.velocity.x *= friction;
        this.velocity.y *= friction;
        this.x = this.x + this.velocity.x;
        this.y = this.y + this.velocity.y;
        this.alpha -= 0.01;
    }
}

const x = canvas.width / 2;
const y = canvas.height / 2;

let player = new Player(x, y, 10, 'white');
let projectiles = [];
let enemies = [];
let particles = [];

function init() {
    flag_gameActive = true;
    highScoreEl.innerHTML = localStorage.getItem('highscore');
    scoreContainerEl.classList.remove("hidden");
    player = new Player(x, y, 10, 'white');
    projectiles = [];
    enemies = [];
    particles = [];
    score = 0;
    scoreEl.innerHTML = score;
    bigScoreEl.innerHTML = score;
}

function spawnEnemies() {
    setInterval(() => {
        const radius = Math.random() * (60 - 15) + 15;

        let x;
        let y;
            
        if (Math.random() < 0.5) {
            x = Math.random() < 0.5 ?
                0 - radius : canvas.width + radius;
            y = Math.random() * canvas.height;
        } else {
            x = Math.random() * canvas.width;
            y = Math.random() < 0.5 ?
                0 - radius : canvas.height + radius;

        }


        const color = `hsl(${Math.random() * 360},50%,50%)`;
        const angle = Math.atan2(
            canvas.height / 2 - y,
            canvas.width / 2 - x);
        const velocity = {
            x: Math.cos(angle),
            y: Math.sin(angle)
        };

        enemies.push(new Enemy(x, y, radius, color, velocity));
    }, 1000)
}

let animationId;
let score = 0;

function animate() {
    animationId = requestAnimationFrame(animate);
    c.fillStyle = 'rgba(0,0,0,0.1)';
    c.fillRect(0, 0, canvas.width, canvas.height);
    player.draw();
    particles.forEach((particle, index) => {
        if (particle.alpha <= 0) {
            particles.splice(index, 1);
        } else {
            particle.update();
        }
    });
    projectiles.forEach((projectile, index) => {
        projectile.update();

        if (projectile.x + projectile.radius < 0 ||
            projectile.x - projectile.radius > canvas.width ||
            projectile.y + projectile.radius < 0 ||
            projectile.y - projectile.radius > canvas.height) {
            setTimeout(() => {
                projectiles.splice(index, 1)
            }, 0);
        }
    })
    enemies.forEach((enemy, index) => {
        enemy.update();

        const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
        if (dist - enemy.radius - player.radius < 1) {
            audio_gameOver.play();
            flag_gameActive = false;
            scoreContainerEl.classList.add("hidden");
            cancelAnimationFrame(animationId);
            bigScoreEl.innerHTML = score;
            if (score > localStorage.getItem('highscore')) {
                localStorage.setItem('highscore', score);
                bigHighScoreEl.innerHTML = score;
            }
            modalEl.style.display = 'flex';
        }

        projectiles.forEach((projectile, projectileIndex) => {
            const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);

            if (dist - enemy.radius - projectile.radius < 1) {
                audio_hit.cloneNode(true).play();


                for (let i = 0; i < enemy.radius * 2; i++) {
                    particles.push(new Particle(projectile.x,
                        projectile.y,
                        Math.random() * 4,
                        enemy.color, {
                        x: Math.random() - 0.5 * (Math.random() * 8),
                        y: Math.random() - 0.5 * (Math.random() * 8)
                    }));
                }

                if (enemy.radius - 20 > 20) {

                    score += 100;
                    scoreEl.innerHTML = score;

                    gsap.to(enemy, {
                        radius: enemy.radius - 10
                    })
                    setTimeout(() => {
                        projectiles.splice(projectileIndex, 1);
                    }, 0)
                } else {

                    score += 250;
                    scoreEl.innerHTML = score;

                    setTimeout(() => {
                        enemies.splice(index, 1);
                        projectiles.splice(projectileIndex, 1);
                    }, 0)
                }


            }
        });
    })
}

addEventListener('click', (event) => {
    if (flag_gameActive) {
        audio_shoot.cloneNode(true).play();
    }
    const angle = Math.atan2(
        event.clientY - canvas.height / 2,
        event.clientX - canvas.width / 2);
    const velocity = {
        x: Math.cos(angle) * 5,
        y: Math.sin(angle) * 5
    }
    projectiles.push(new Projectile(
        canvas.width / 2,
        canvas.height / 2,
        5,
        'white',
        velocity
    ));
})
startGameBtn.addEventListener('click', () => {
    audio_gameStart.play();
    init();
    animate();
    spawnEnemies();
    modalEl.style.display = 'none';
})