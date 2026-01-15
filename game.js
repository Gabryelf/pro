// Игровые переменные
let gameState = {
    energy: 100,
    lives: 20,
    wave: 1,
    maxWaves: 10,
    gameActive: false,
    selectedTower: null,
    towers: [],
    enemies: [],
    projectiles: [],
    enemyId: 0,
    projectileId: 0,
    waveInProgress: false,
    enemyCount: 0,
    enemiesKilled: 0
};

// DOM элементы
const energyEl = document.getElementById('energy');
const livesEl = document.getElementById('lives');
const waveEl = document.getElementById('wave');
const energyFill = document.querySelector('.energy-fill');
const towersContainer = document.getElementById('towersContainer');
const enemiesContainer = document.getElementById('enemiesContainer');
const projectilesContainer = document.getElementById('projectilesContainer');
const startWaveBtn = document.getElementById('startWave');
const upgradeCrystalBtn = document.getElementById('upgradeCrystal');
const sellTowerBtn = document.getElementById('sellTower');
const gameLog = document.querySelector('.log-content');
const gameModal = document.getElementById('gameModal');
const modalTitle = document.getElementById('modalTitle');
const modalMessage = document.getElementById('modalMessage');
const startGameBtn = document.getElementById('startGame');
const restartGameBtn = document.getElementById('restartGame');

// Башни
const towerTypes = {
    arcane: {
        name: "Аркана",
        damage: 15,
        range: 150,
        cost: 30,
        color: "#9d4edd",
        icon: "fas fa-hat-wizard",
        cooldown: 1000
    },
    frost: {
        name: "Ледяная",
        damage: 10,
        range: 120,
        cost: 50,
        color: "#00c6ff",
        icon: "fas fa-snowflake",
        cooldown: 800,
        slow: 0.4
    },
    storm: {
        name: "Грозовая",
        damage: 25,
        range: 180,
        cost: 80,
        color: "#ffd700",
        icon: "fas fa-bolt",
        cooldown: 1500,
        chain: 3
    }
};

// Враги
const enemyTypes = [
    { health: 30, speed: 1.5, color: "#666666", points: 10 },
    { health: 50, speed: 1.0, color: "#993333", points: 20 },
    { health: 80, speed: 0.7, color: "#660066", points: 30 }
];

// Инициализация
function initGame() {
    updateUI();
    setupEventListeners();
    showModal("Arcane Tower Defense", "Защитите кристалл от 10 волн теней!");
    
    // Создаем точку спавна врагов (вне экрана)
    createSpawnPoint();
}

// Создание точки спавна
function createSpawnPoint() {
    const spawn = document.createElement('div');
    spawn.className = 'spawn-point';
    spawn.style.cssText = `
        position: absolute;
        top: 50px;
        left: 50px;
        width: 30px;
        height: 30px;
        background: radial-gradient(circle, #ff0066, transparent 70%);
        border-radius: 50%;
        z-index: 5;
    `;
    document.querySelector('.game-area').appendChild(spawn);
}

// Настройка событий
function setupEventListeners() {
    // Выбор башни
    document.querySelectorAll('.tower-option').forEach(option => {
        option.addEventListener('click', function() {
            const type = this.dataset.type;
            const cost = parseInt(this.dataset.cost);
            
            if (gameState.energy >= cost) {
                document.querySelectorAll('.tower-option').forEach(opt => 
                    opt.classList.remove('selected'));
                this.classList.add('selected');
                gameState.selectedTower = { type, cost };
                addLog(`Выбрана ${towerTypes[type].name} башня`);
            } else {
                addLog("Недостаточно энергии!");
            }
        });
    });
    
    // Установка башни
    document.querySelector('.game-area').addEventListener('click', function(e) {
        if (!gameState.selectedTower || gameState.waveInProgress) return;
        
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Проверяем, не слишком ли близко к кристаллу
        const crystal = document.getElementById('crystal');
        const crystalRect = crystal.getBoundingClientRect();
        const crystalX = crystalRect.left - rect.left + crystalRect.width/2;
        const crystalY = crystalRect.top - rect.top + crystalRect.height/2;
        
        const distance = Math.sqrt(Math.pow(x - crystalX, 2) + Math.pow(y - crystalY, 2));
        
        if (distance < 200) {
            addLog("Нельзя строить так близко к кристаллу!");
            return;
        }
        
        placeTower(gameState.selectedTower.type, x, y);
    });
    
    // Начало волны
    startWaveBtn.addEventListener('click', startWave);
    
    // Улучшение кристалла
    upgradeCrystalBtn.addEventListener('click', function() {
        if (gameState.energy >= 100) {
            gameState.energy -= 100;
            gameState.energy += 50; // Добавляем 50 энергии
            updateUI();
            addLog("Кристалл улучшен! +50 энергии");
        } else {
            addLog("Нужно 100 энергии для улучшения");
        }
    });
    
    // Продажа башни
    sellTowerBtn.addEventListener('click', function() {
        if (gameState.selectedTower) {
            gameState.selectedTower = null;
            document.querySelectorAll('.tower-option').forEach(opt => 
                opt.classList.remove('selected'));
            addLog("Режим продажи: кликните на башню для продажи");
        } else {
            gameState.selectedTower = 'sell';
        }
    });
    
    // Кнопки модального окна
    startGameBtn.addEventListener('click', function() {
        gameModal.style.display = 'none';
        gameState.gameActive = true;
    });
    
    restartGameBtn.addEventListener('click', function() {
        location.reload();
    });
}

// Размещение башни
function placeTower(type, x, y) {
    const tower = towerTypes[type];
    
    if (gameState.energy < tower.cost) {
        addLog("Недостаточно энергии!");
        return;
    }
    
    gameState.energy -= tower.cost;
    
    const towerEl = document.createElement('div');
    towerEl.className = 'tower';
    towerEl.dataset.type = type;
    towerEl.style.cssText = `
        position: absolute;
        left: ${x - 25}px;
        top: ${y - 25}px;
        width: 50px;
        height: 50px;
        background: ${tower.color};
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 0 20px ${tower.color};
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 1.2rem;
        z-index: 20;
        pointer-events: auto;
        cursor: pointer;
    `;
    
    const icon = document.createElement('i');
    icon.className = tower.icon;
    towerEl.appendChild(icon);
    
    // Радиус атаки
    const rangeEl = document.createElement('div');
    rangeEl.className = 'tower-range';
    rangeEl.style.cssText = `
        position: absolute;
        left: ${-tower.range + 25}px;
        top: ${-tower.range + 25}px;
        width: ${tower.range * 2}px;
        height: ${tower.range * 2}px;
        border: 2px dashed rgba(255,255,255,0.3);
        border-radius: 50%;
        opacity: 0;
        transition: opacity 0.3s;
    `;
    towerEl.appendChild(rangeEl);
    
    // Клик на башню
    towerEl.addEventListener('click', function(e) {
        e.stopPropagation();
        
        if (gameState.selectedTower === 'sell') {
            // Продажа
            gameState.energy += Math.floor(tower.cost * 0.7);
            towerEl.remove();
            updateUI();
            addLog(`Башня продана за ${Math.floor(tower.cost * 0.7)} энергии`);
            gameState.selectedTower = null;
            document.querySelectorAll('.tower-option').forEach(opt => 
                opt.classList.remove('selected'));
        } else {
            // Показать/скрыть радиус
            const range = this.querySelector('.tower-range');
            range.style.opacity = range.style.opacity === '1' ? '0' : '1';
        }
    });
    
    towersContainer.appendChild(towerEl);
    
    gameState.towers.push({
        element: towerEl,
        type: type,
        x: x,
        y: y,
        lastShot: 0,
        ...tower
    });
    
    updateUI();
    addLog(`${tower.name} башня построена!`);
    
    // Сброс выбора
    gameState.selectedTower = null;
    document.querySelectorAll('.tower-option').forEach(opt => 
        opt.classList.remove('selected'));
}

// Начало волны
function startWave() {
    if (gameState.waveInProgress) return;
    
    gameState.waveInProgress = true;
    gameState.enemyCount = 5 + gameState.wave * 2; // Увеличиваем количество врагов
    addLog(`Волна ${gameState.wave} началась!`);
    
    spawnEnemies();
}

// Создание врагов
function spawnEnemies() {
    if (gameState.enemyCount <= 0) return;
    
    const enemyType = enemyTypes[Math.min(Math.floor(gameState.wave / 4), enemyTypes.length - 1)];
    
    const enemy = {
        id: ++gameState.enemyId,
        health: enemyType.health + gameState.wave * 5,
        maxHealth: enemyType.health + gameState.wave * 5,
        speed: enemyType.speed,
        color: enemyType.color,
        points: enemyType.points,
        x: 50,
        y: 50,
        angle: 0,
        distance: 0
    };
    
    const enemyEl = document.createElement('div');
    enemyEl.className = 'enemy';
    enemyEl.dataset.id = enemy.id;
    enemyEl.style.cssText = `
        position: absolute;
        left: ${enemy.x}px;
        top: ${enemy.y}px;
        width: 30px;
        height: 30px;
        background: ${enemy.color};
        border-radius: 50%;
        box-shadow: 0 0 15px ${enemy.color};
        z-index: 15;
        transform-origin: center;
    `;
    
    // Индикатор здоровья
    const healthBar = document.createElement('div');
    healthBar.className = 'enemy-health';
    healthBar.style.cssText = `
        position: absolute;
        top: -10px;
        left: 0;
        width: 100%;
        height: 4px;
        background: #333;
        border-radius: 2px;
        overflow: hidden;
    `;
    
    const healthFill = document.createElement('div');
    healthFill.className = 'health-fill';
    healthFill.style.cssText = `
        width: 100%;
        height: 100%;
        background: #00ff00;
        transition: width 0.3s;
    `;
    
    healthBar.appendChild(healthFill);
    enemyEl.appendChild(healthBar);
    
    enemiesContainer.appendChild(enemyEl);
    
    enemy.element = enemyEl;
    enemy.healthFill = healthFill;
    gameState.enemies.push(enemy);
    
    gameState.enemyCount--;
    
    // Создаем следующего врага с задержкой
    setTimeout(spawnEnemies, 1000 - Math.min(gameState.wave * 50, 800));
}

// Игровой цикл
function gameLoop() {
    if (!gameState.gameActive) return;
    
    // Движение врагов
    gameState.enemies.forEach(enemy => {
        if (!enemy.element) return;
        
        // Спиральное движение к центру
        enemy.angle += 0.02 * enemy.speed;
        enemy.distance += 0.3 * enemy.speed;
        
        const centerX = document.querySelector('.game-area').offsetWidth / 2;
        const centerY = document.querySelector('.game-area').offsetHeight / 2;
        
        enemy.x = centerX + Math.cos(enemy.angle) * (300 - enemy.distance);
        enemy.y = centerY + Math.sin(enemy.angle) * (300 - enemy.distance);
        
        enemy.element.style.left = `${enemy.x - 15}px`;
        enemy.element.style.top = `${enemy.y - 15}px`;
        
        // Проверка достижения кристалла
        const distanceToCenter = Math.sqrt(
            Math.pow(enemy.x - centerX, 2) + Math.pow(enemy.y - centerY, 2)
        );
        
        if (distanceToCenter < 80) {
            // Враг достиг кристалла
            enemyReachedCrystal(enemy);
        }
    });
    
    // Стрельба башен
    const now = Date.now();
    gameState.towers.forEach(tower => {
        if (now - tower.lastShot < tower.cooldown) return;
        
        const target = findTarget(tower);
        if (target) {
            shoot(tower, target);
            tower.lastShot = now;
        }
    });
    
    // Движение снарядов
    gameState.projectiles.forEach((projectile, index) => {
        if (!projectile.element) return;
        
        const dx = projectile.targetX - projectile.x;
        const dy = projectile.targetY - projectile.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 10) {
            // Попадание
            projectileHit(projectile);
            projectile.element.remove();
            gameState.projectiles.splice(index, 1);
        } else {
            // Движение
            projectile.x += dx / distance * 8;
            projectile.y += dy / distance * 8;
            
            projectile.element.style.left = `${projectile.x - 5}px`;
            projectile.element.style.top = `${projectile.y - 5}px`;
        }
    });
    
    updateUI();
    requestAnimationFrame(gameLoop);
}

// Поиск цели для башни
function findTarget(tower) {
    let closest = null;
    let closestDistance = tower.range;
    
    gameState.enemies.forEach(enemy => {
        const dx = enemy.x - tower.x;
        const dy = enemy.y - tower.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < closestDistance) {
            closestDistance = distance;
            closest = enemy;
        }
    });
    
    return closest;
}

// Выстрел
function shoot(tower, target) {
    const projectile = {
        id: ++gameState.projectileId,
        tower: tower,
        target: target,
        x: tower.x,
        y: tower.y,
        targetX: target.x,
        targetY: target.y,
        damage: tower.damage,
        type: tower.type
    };
    
    const projectileEl = document.createElement('div');
    projectileEl.className = 'projectile';
    projectileEl.dataset.type = tower.type;
    projectileEl.style.cssText = `
        position: absolute;
        left: ${tower.x - 5}px;
        top: ${tower.y - 5}px;
        width: 10px;
        height: 10px;
        background: ${tower.color};
        border-radius: 50%;
        box-shadow: 0 0 10px ${tower.color};
        z-index: 25;
    `;
    
    projectilesContainer.appendChild(projectileEl);
    projectile.element = projectileEl;
    
    gameState.projectiles.push(projectile);
    
    // Звук выстрела (опционально)
    try {
        document.getElementById('shootSound').currentTime = 0;
        document.getElementById('shootSound').play();
    } catch (e) {}
}

// Попадание снаряда
function projectileHit(projectile) {
    const enemy = projectile.target;
    if (!enemy || !enemy.element) return;
    
    enemy.health -= projectile.damage;
    
    // Обновление полоски здоровья
    if (enemy.healthFill) {
        const percent = (enemy.health / enemy.maxHealth) * 100;
        enemy.healthFill.style.width = `${percent}%`;
        enemy.healthFill.style.background = percent > 50 ? '#00ff00' : 
                                           percent > 25 ? '#ffff00' : '#ff0000';
    }
    
    // Эффект попадания
    const hitEffect = document.createElement('div');
    hitEffect.style.cssText = `
        position: absolute;
        left: ${enemy.x - 20}px;
        top: ${enemy.y - 20}px;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: radial-gradient(circle, ${projectile.tower.color}, transparent 70%);
        opacity: 0.7;
        z-index: 30;
        animation: hitEffect 0.5s forwards;
    `;
    
    enemiesContainer.appendChild(hitEffect);
    setTimeout(() => hitEffect.remove(), 500);
    
    // Проверка смерти врага
    if (enemy.health <= 0) {
        enemyKilled(enemy);
        
        // Цепная молния для грозовой башни
        if (projectile.type === 'storm' && projectile.tower.chain) {
            chainLightning(enemy, projectile);
        }
    }
}

// Цепная молния
function chainLightning(sourceEnemy, projectile) {
    const chainCount = projectile.tower.chain;
    let chains = 0;
    
    gameState.enemies.forEach(otherEnemy => {
        if (chains >= chainCount) return;
        if (otherEnemy === sourceEnemy || otherEnemy.health <= 0) return;
        
        const dx = otherEnemy.x - sourceEnemy.x;
        const dy = otherEnemy.y - sourceEnemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 100) { // Радиус цепной молнии
            otherEnemy.health -= projectile.damage * 0.5;
            chains++;
            
            // Линия молнии
            drawLightning(sourceEnemy, otherEnemy);
            
            if (otherEnemy.health <= 0) {
                enemyKilled(otherEnemy);
            }
        }
    });
}

// Рисование молнии
function drawLightning(from, to) {
    const lightning = document.createElement('div');
    lightning.style.cssText = `
        position: absolute;
        left: ${from.x}px;
        top: ${from.y}px;
        width: ${Math.sqrt(Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2))}px;
        height: 3px;
        background: linear-gradient(90deg, transparent, #ffff00, #ffaa00, transparent);
        transform-origin: left center;
        transform: rotate(${Math.atan2(to.y - from.y, to.x - from.x)}rad);
        z-index: 35;
        animation: lightningFlash 0.3s forwards;
    `;
    
    enemiesContainer.appendChild(lightning);
    setTimeout(() => lightning.remove(), 300);
}

// Враг убит
function enemyKilled(enemy) {
    gameState.energy += enemy.points;
    gameState.enemiesKilled++;
    
    // Удаляем врага
    if (enemy.element) {
        enemy.element.remove();
    }
    
    // Удаляем из массива
    const index = gameState.enemies.indexOf(enemy);
    if (index > -1) {
        gameState.enemies.splice(index, 1);
    }
    
    // Звук смерти (опционально)
    try {
        document.getElementById('enemyDieSound').currentTime = 0;
        document.getElementById('enemyDieSound').play();
    } catch (e) {}
    
    addLog(`Тень уничтожена! +${enemy.points} энергии`);
    
    // Проверка конца волны
    if (gameState.enemies.length === 0 && gameState.enemyCount === 0) {
        endWave();
    }
}

// Враг достиг кристалла
function enemyReachedCrystal(enemy) {
    gameState.lives--;
    
    // Эффект повреждения кристалла
    const crystal = document.getElementById('crystal');
    crystal.style.animation = 'none';
    setTimeout(() => {
        crystal.style.animation = 'crystalPulse 3s infinite alternate';
    }, 100);
    
    // Удаляем врага
    if (enemy.element) {
        enemy.element.remove();
    }
    
    const index = gameState.enemies.indexOf(enemy);
    if (index > -1) {
        gameState.enemies.splice(index, 1);
    }
    
    addLog("Кристалл поврежден! -1 жизнь");
    
    // Проверка поражения
    if (gameState.lives <= 0) {
        gameOver();
        return;
    }
    
    // Проверка конца волны
    if (gameState.enemies.length === 0 && gameState.enemyCount === 0) {
        endWave();
    }
}

// Конец волны
function endWave() {
    gameState.waveInProgress = false;
    gameState.wave++;
    
    if (gameState.wave > gameState.maxWaves) {
        victory();
        return;
    }
    
    addLog(`Волна ${gameState.wave - 1} завершена! Подготовьтесь к следующей.`);
    updateUI();
}

// Победа
function victory() {
    gameState.gameActive = false;
    modalTitle.textContent = "ПОБЕДА!";
    modalMessage.textContent = `Вы защитили кристалл от всех волн! Убито врагов: ${gameState.enemiesKilled}`;
    restartGameBtn.style.display = 'block';
    gameModal.style.display = 'flex';
}

// Поражение
function gameOver() {
    gameState.gameActive = false;
    modalTitle.textContent = "ПОРАЖЕНИЕ";
    modalMessage.textContent = `Кристалл разрушен! Вы достигли волны ${gameState.wave}`;
    restartGameBtn.style.display = 'block';
    gameModal.style.display = 'flex';
}

// Обновление интерфейса
function updateUI() {
    energyEl.textContent = gameState.energy;
    livesEl.textContent = gameState.lives;
    waveEl.textContent = `${gameState.wave}/${gameState.maxWaves}`;
    
    // Полоска энергии
    const energyPercent = Math.min(gameState.energy / 200 * 100, 100);
    energyFill.style.width = `${energyPercent}%`;
    
    // Сердечки
    const hearts = document.querySelectorAll('.fa-heart');
    hearts.forEach((heart, index) => {
        if (index < Math.ceil(gameState.lives / 5)) {
            heart.style.opacity = '1';
        } else {
            heart.style.opacity = '0.3';
        }
    });
    
    // Кнопка начала волны
    if (gameState.waveInProgress) {
        startWaveBtn.innerHTML = '<i class="fas fa-pause"></i> Волна в процессе';
        startWaveBtn.disabled = true;
    } else {
        startWaveBtn.innerHTML = '<i class="fas fa-play"></i> Начать волну';
        startWaveBtn.disabled = false;
    }
}

// Добавление сообщения в лог
function addLog(message) {
    const p = document.createElement('p');
    p.textContent = `[${new Date().toLocaleTimeString().slice(0,5)}] ${message}`;
    gameLog.prepend(p);
    
    // Ограничиваем количество сообщений
    if (gameLog.children.length > 10) {
        gameLog.removeChild(gameLog.lastChild);
    }
}

// Показать модальное окно
function showModal(title, message) {
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    restartGameBtn.style.display = 'none';
    gameModal.style.display = 'flex';
}

// CSS анимации (добавляем динамически)
const style = document.createElement('style');
style.textContent = `
    @keyframes hitEffect {
        0% { transform: scale(1); opacity: 0.7; }
        100% { transform: scale(2); opacity: 0; }
    }
    
    @keyframes lightningFlash {
        0% { opacity: 1; }
        100% { opacity: 0; }
    }
    
    .tower:hover .tower-range {
        opacity: 0.5 !important;
    }
    
    .enemy {
        transition: left 0.05s linear, top 0.05s linear;
    }
`;
document.head.appendChild(style);

// Запуск игры
initGame();
gameLoop();
