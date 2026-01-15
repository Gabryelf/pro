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
            projectile.x += dx / distance * 8
