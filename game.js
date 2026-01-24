// Cosmic Defender - Complete Working Game
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Cosmic Defender загружается...');
    
    // ==================== КОНСТАНТЫ ====================
    const CONFIG = {
        GAME: {
            START_SHIELDS: 1500,
            START_CREDITS: 1000,
            CURRENT_SET: 1,
            MAX_SETS: 5,
            WAVES_PER_SET: 10,
            CELL_SIZE: 40,
            GAME_SPEED: 1.0,
            ENEMY_SPAWN_INTERVAL: 2000,
            BASE_INCOME: 50
        },
        
        STATIONS: {
            LASER: {
                name: 'Лазерная станция',
                cost: 200,
                damage: 25,
                range: 180,
                fireRate: 1200,
                color: '#ff2e63',
                icon: 'bolt',
                sellRatio: 0.6
            },
            PLASMA: {
                name: 'Плазменная пушка',
                cost: 350,
                damage: 40,
                range: 120,
                fireRate: 1800,
                splashRadius: 60,
                color: '#00ff9d',
                icon: 'atom',
                sellRatio: 0.6
            },
            RAILGUN: {
                name: 'Рейлган',
                cost: 500,
                damage: 80,
                range: 300,
                fireRate: 3000,
                armorPenetration: 0.5,
                color: '#00bfff',
                icon: 'crosshairs',
                sellRatio: 0.6
            },
            TESLA: {
                name: 'Катушка Теслы',
                cost: 300,
                damage: 15,
                range: 150,
                fireRate: 800,
                chainTargets: 3,
                color: '#ffd700',
                icon: 'bolt-lightning',
                sellRatio: 0.6
            }
        },
        
        ENEMY_TYPES: {
            SCOUT: {
                name: 'Разведчик',
                health: 100,
                speed: 2.0,
                size: 12,
                color: '#4dffea',
                credits: 25,
                armor: 0,
                spawnWeight: 30
            },
            FIGHTER: {
                name: 'Истребитель',
                health: 200,
                speed: 1.5,
                size: 15,
                color: '#ff9966',
                credits: 40,
                armor: 10,
                spawnWeight: 25
            },
            BOMBER: {
                name: 'Бомбардировщик',
                health: 350,
                speed: 0.8,
                size: 20,
                color: '#ff4d4d',
                credits: 75,
                armor: 20,
                spawnWeight: 15
            }
        },
        
        // Пути для врагов
        PATHS: {
            SET_1: [
                { x: -0.05, y: 0.5 },
                { x: 0.2, y: 0.5 },
                { x: 0.2, y: 0.3 },
                { x: 0.5, y: 0.3 },
                { x: 0.5, y: 0.7 },
                { x: 0.8, y: 0.7 },
                { x: 0.8, y: 0.4 },
                { x: 1.05, y: 0.4 }
            ]
        },
        
        BASE: {
            level: 1,
            maxLevel: 10,
            shields: 1500,
            maxShields: 1500,
            attackBonus: 0,
            incomeBonus: 0,
            availableSlots: 5,
            maxSlots: 12,
            upgradeCost: 500
        }
    };
    
    // ==================== СОСТОЯНИЕ ИГРЫ ====================
    const GameState = {
        shields: CONFIG.GAME.START_SHIELDS,
        credits: CONFIG.GAME.START_CREDITS,
        currentSet: CONFIG.GAME.CURRENT_SET,
        currentWave: 1,
        highScore: parseInt(localStorage.getItem('cosmic_highscore')) || 0,
        
        isWaveActive: false,
        isPaused: false,
        gameOver: false,
        gameWon: false,
        
        selectedStationType: null,
        selectedStation: null,
        
        stations: [],
        enemies: [],
        projectiles: [],
        particles: [],
        cells: [],
        
        enemiesSpawned: 0,
        enemiesKilledThisWave: 0,
        enemiesThisWave: 10,
        enemySpawnTimer: 0,
        waveEnemyTypes: [],
        
        lastTime: 0,
        deltaTime: 0,
        
        base: JSON.parse(JSON.stringify(CONFIG.BASE)),
        currentPath: CONFIG.PATHS.SET_1,
        
        // Случайные места для башен
        availableBuildSpots: [],
        
        // Время для анимаций
        animationTime: 0
    };
    
    // ==================== DOM ЭЛЕМЕНТЫ ====================
    const DOM = {
        canvas: document.getElementById('gameCanvas'),
        ctx: null,
        lives: document.getElementById('lives'),
        gold: document.getElementById('gold'),
        set: document.getElementById('set'),
        highscore: document.getElementById('highscore'),
        waveProgress: document.getElementById('waveProgressMini'),
        enemiesLeft: document.getElementById('enemiesLeftMini'),
        enemiesKilled: document.getElementById('floatingKills'),
        startWaveBtn: document.getElementById('startWave'),
        pauseGameBtn: document.getElementById('pauseGame'),
        infoBtn: document.getElementById('infoBtn'),
        upgradeTowerBtn: document.getElementById('upgradeTower'),
        sellTowerBtn: document.getElementById('sellTower'),
        closeTowerInfoBtn: document.getElementById('closeTowerInfo'),
        towerInfoPanel: document.getElementById('towerInfoPanel'),
        towerName: document.getElementById('towerName'),
        towerLevel: document.getElementById('towerLevel'),
        towerDamage: document.getElementById('towerDamage'),
        towerRange: document.getElementById('towerRange'),
        towerSpeed: document.getElementById('towerSpeed'),
        upgradeCost: document.getElementById('upgradeCost'),
        sellValue: document.getElementById('sellValue'),
        selectionIndicator: document.getElementById('selectionIndicator'),
        selectionText: document.getElementById('selectionText'),
        messageText: document.getElementById('messageText'),
        wavePreview: document.getElementById('wavePreview'),
        baseLevel: document.getElementById('baseLevel'),
        baseAttack: document.getElementById('baseAttack'),
        baseIncome: document.getElementById('baseIncome'),
        availableSlots: document.getElementById('availableSlots'),
        upgradeBaseBtn: document.getElementById('upgradeBase'),
        baseUpgradeCost: document.getElementById('baseUpgradeCost'),
        infoModal: document.getElementById('infoModal'),
        closeModalBtn: document.getElementById('closeModal'),
        modalBody: document.getElementById('modalBody'),
        stationItems: document.querySelectorAll('.station-item'),
        currentWaveSidebar: document.getElementById('currentWaveSidebar'),
        floatingEnemies: document.getElementById('floatingEnemies'),
        gameOverModal: document.getElementById('gameOverModal'),
        restartGameBtn: document.getElementById('restartGame'),
        gameOverSet: document.getElementById('gameOverSet'),
        gameOverWave: document.getElementById('gameOverWave'),
        gameOverCredits: document.getElementById('gameOverCredits'),
        gameOverKills: document.getElementById('gameOverKills')
    };
    
    DOM.ctx = DOM.canvas.getContext('2d');
    
    // ==================== ИНИЦИАЛИЗАЦИЯ ====================
    function init() {
        console.log('🚀 Инициализация игры...');
        
        setupCanvas();
        initGameField();
        generateBuildSpots();
        setupEventListeners();
        
        DOM.highscore.textContent = GameState.highScore;
        updateUI();
        generateWavePreview();
        initInfoModal();
        
        showMessage('🚀 Добро пожаловать в Cosmic Defender! Выберите станцию для установки.', 'info');
        
        requestAnimationFrame(gameLoop);
        console.log('✅ Игра инициализирована!');
    }
    
    function setupCanvas() {
        const container = document.querySelector('.game-board');
        DOM.canvas.width = container.clientWidth;
        DOM.canvas.height = container.clientHeight;
        console.log(`📐 Канвас: ${DOM.canvas.width}x${DOM.canvas.height}`);
    }
    
    function initGameField() {
        const cols = Math.floor(DOM.canvas.width / CONFIG.GAME.CELL_SIZE);
        const rows = Math.floor(DOM.canvas.height / CONFIG.GAME.CELL_SIZE);
        
        GameState.cells = [];
        
        for (let x = 0; x < cols; x++) {
            for (let y = 0; y < rows; y++) {
                GameState.cells.push({
                    x: x * CONFIG.GAME.CELL_SIZE,
                    y: y * CONFIG.GAME.CELL_SIZE,
                    width: CONFIG.GAME.CELL_SIZE,
                    height: CONFIG.GAME.CELL_SIZE,
                    occupied: false,
                    station: null,
                    hovered: false,
                    isBuildSpot: false
                });
            }
        }
        
        // Создаем красивые звезды
        createStars();
    }
    
    function generateBuildSpots() {
        const cols = Math.floor(DOM.canvas.width / CONFIG.GAME.CELL_SIZE);
        const rows = Math.floor(DOM.canvas.height / CONFIG.GAME.CELL_SIZE);
        
        GameState.availableBuildSpots = [];
        
        // Генерируем 5 случайных мест для постройки
        while (GameState.availableBuildSpots.length < GameState.base.availableSlots) {
            const x = Math.floor(Math.random() * (cols - 4)) + 2;
            const y = Math.floor(Math.random() * (rows - 4)) + 2;
            
            const spot = { x, y };
            const exists = GameState.availableBuildSpots.some(s => s.x === x && s.y === y);
            
            if (!exists) {
                GameState.availableBuildSpots.push(spot);
                
                // Помечаем ячейку как место для постройки
                const cellIndex = y * cols + x;
                if (cellIndex < GameState.cells.length) {
                    GameState.cells[cellIndex].isBuildSpot = true;
                }
            }
        }
    }
    
    function createStars() {
        // Создаем медленные красивые звезды
        for (let i = 0; i < 30; i++) {
            GameState.particles.push({
                x: Math.random() * DOM.canvas.width,
                y: Math.random() * DOM.canvas.height,
                size: Math.random() * 1.5 + 0.5,
                speed: 0,
                color: '#ffffff',
                opacity: Math.random() * 0.3 + 0.1,
                twinkle: Math.random() > 0.7,
                twinkleSpeed: Math.random() * 0.02 + 0.01,
                life: -1,
                isStar: true
            });
        }
    }
    
    // ==================== СОБЫТИЯ ====================
    function setupEventListeners() {
        // Выбор станций
        DOM.stationItems.forEach(item => {
            item.addEventListener('click', () => selectTowerFromShop(item));
        });
        
        // Взаимодействие с канвасом
        DOM.canvas.addEventListener('click', handleCanvasClick);
        DOM.canvas.addEventListener('mousemove', handleCanvasMouseMove);
        DOM.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            clearSelection();
        });
        
        // Управление
        DOM.startWaveBtn.addEventListener('click', startWave);
        DOM.pauseGameBtn.addEventListener('click', togglePause);
        DOM.infoBtn.addEventListener('click', () => DOM.infoModal.style.display = 'flex');
        DOM.closeModalBtn.addEventListener('click', () => DOM.infoModal.style.display = 'none');
        DOM.upgradeTowerBtn.addEventListener('click', upgradeSelectedStation);
        DOM.sellTowerBtn.addEventListener('click', sellSelectedStation);
        DOM.closeTowerInfoBtn.addEventListener('click', closeTowerInfo);
        DOM.upgradeBaseBtn.addEventListener('click', upgradeBase);
        DOM.restartGameBtn.addEventListener('click', resetGame);
        
        // Горячие клавиши
        document.addEventListener('keydown', handleKeyPress);
        
        // Ресайз
        window.addEventListener('resize', handleResize);
        
        // Клик по overlay
        DOM.infoModal.addEventListener('click', (e) => {
            if (e.target === DOM.infoModal) {
                DOM.infoModal.style.display = 'none';
            }
        });
        
        DOM.gameOverModal.addEventListener('click', (e) => {
            if (e.target === DOM.gameOverModal) {
                DOM.gameOverModal.style.display = 'none';
            }
        });
    }
    
    function selectTowerFromShop(item) {
        if (GameState.isWaveActive) {
            showMessage('⚠️ Нельзя строить во время волны!', 'warning');
            return;
        }
        
        const type = item.dataset.type;
        const config = getStationConfig(type);
        
        DOM.stationItems.forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
        
        GameState.selectedStationType = type;
        DOM.selectionIndicator.style.display = 'flex';
        DOM.selectionText.textContent = `Установить ${config.name}`;
        
        showMessage(`🎯 Выбрана ${config.name}. Кликните на свободное место для установки.`, 'info');
    }
    
    function handleCanvasClick(e) {
        const rect = DOM.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (GameState.selectedStationType && !GameState.isWaveActive) {
            placeStation(x, y);
            return;
        }
        
        selectStationAtPosition(x, y);
    }
    
    function handleCanvasMouseMove(e) {
        const rect = DOM.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        GameState.cells.forEach(cell => cell.hovered = false);
        
        const cell = findCellAtPosition(x, y);
        if (cell) {
            cell.hovered = true;
        }
    }
    
    function handleKeyPress(e) {
        switch(e.key.toLowerCase()) {
            case 'escape':
                clearSelection();
                break;
            case ' ':
                if (!GameState.isWaveActive && !GameState.gameOver) {
                    startWave();
                }
                break;
            case 'p':
                togglePause();
                break;
            case 'r':
                if (GameState.gameOver) {
                    resetGame();
                }
                break;
            case 'i':
                DOM.infoModal.style.display = 'flex';
                break;
        }
    }
    
    function handleResize() {
        setupCanvas();
        GameState.cells = [];
        GameState.particles = [];
        initGameField();
        generateBuildSpots();
    }
    
    // ==================== ИГРОВАЯ ЛОГИКА ====================
    function gameLoop(timestamp) {
        GameState.deltaTime = timestamp - GameState.lastTime || 0;
        GameState.lastTime = timestamp;
        GameState.animationTime += GameState.deltaTime;
        
        updateParticles();
        
        if (!GameState.isPaused && !GameState.gameOver && !GameState.gameWon) {
            if (GameState.isWaveActive) {
                updateWave();
            }
            
            updateEnemies();
            updateStations();
            updateProjectiles();
            
            if (GameState.isWaveActive && 
                GameState.enemiesSpawned >= GameState.enemiesThisWave && 
                GameState.enemies.length === 0) {
                completeWave();
            }
        }
        
        render();
        requestAnimationFrame(gameLoop);
    }
    
    function updateWave() {
        if (GameState.enemiesSpawned < GameState.enemiesThisWave) {
            GameState.enemySpawnTimer += GameState.deltaTime;
            
            if (GameState.enemySpawnTimer >= CONFIG.GAME.ENEMY_SPAWN_INTERVAL) {
                spawnEnemy();
                GameState.enemySpawnTimer = 0;
            }
        }
        
        // Обновление прогресса
        const progress = (GameState.enemiesSpawned / GameState.enemiesThisWave) * 100;
        DOM.waveProgress.style.width = `${progress}%`;
    }
    
    function spawnEnemy() {
        if (GameState.waveEnemyTypes.length === 0) {
            generateWaveEnemies();
        }
        
        const enemyType = GameState.waveEnemyTypes.pop();
        const path = getPixelPath();
        
        const enemy = {
            x: path[0].x,
            y: path[0].y,
            health: enemyType.health,
            maxHealth: enemyType.health,
            speed: enemyType.speed,
            color: enemyType.color,
            credits: enemyType.credits,
            size: enemyType.size,
            name: enemyType.name,
            pathIndex: 0,
            path: path,
            rotation: 0,
            reachedEnd: false
        };
        
        GameState.enemies.push(enemy);
        GameState.enemiesSpawned++;
        DOM.enemiesLeft.textContent = Math.max(0, GameState.enemiesThisWave - GameState.enemiesKilledThisWave);
        DOM.floatingEnemies.textContent = Math.max(0, GameState.enemiesThisWave - GameState.enemiesKilledThisWave);
    }
    
    function generateWaveEnemies() {
        GameState.waveEnemyTypes = [];
        const wave = GameState.currentWave;
        GameState.enemiesThisWave = 8 + Math.floor(wave * 1.2);
        
        // Простые типы врагов для первых волн
        const types = [CONFIG.ENEMY_TYPES.SCOUT, CONFIG.ENEMY_TYPES.FIGHTER, CONFIG.ENEMY_TYPES.BOMBER];
        const weights = [50, 35, 15];
        
        for (let i = 0; i < GameState.enemiesThisWave; i++) {
            let random = Math.random() * 100;
            let selectedType = types[0];
            
            for (let j = 0; j < types.length; j++) {
                if (random < weights[j]) {
                    selectedType = types[j];
                    break;
                }
                random -= weights[j];
            }
            
            GameState.waveEnemyTypes.push(selectedType);
        }
        
        DOM.enemiesLeft.textContent = GameState.enemiesThisWave;
        DOM.floatingEnemies.textContent = GameState.enemiesThisWave;
    }
    
    function updateEnemies() {
        for (let i = GameState.enemies.length - 1; i >= 0; i--) {
            const enemy = GameState.enemies[i];
            
            if (enemy.reachedEnd) {
                enemyReachedBase(enemy, i);
                continue;
            }
            
            moveEnemy(enemy);
            
            if (enemy.health <= 0) {
                killEnemy(enemy, i);
            }
        }
    }
    
    function moveEnemy(enemy) {
        const targetPoint = enemy.path[enemy.pathIndex + 1];
        
        if (!targetPoint) {
            enemy.reachedEnd = true;
            return;
        }
        
        const dx = targetPoint.x - enemy.x;
        const dy = targetPoint.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 5) {
            enemy.pathIndex++;
            if (enemy.pathIndex >= enemy.path.length - 1) {
                enemy.reachedEnd = true;
            }
        } else {
            const moveDistance = enemy.speed * (GameState.deltaTime / 16) * CONFIG.GAME.GAME_SPEED;
            enemy.x += (dx / distance) * moveDistance;
            enemy.y += (dy / distance) * moveDistance;
            
            // Вращение врага в направлении движения
            enemy.rotation = Math.atan2(dy, dx);
        }
    }
    
    function enemyReachedBase(enemy, index) {
        const damage = enemy.maxHealth * 0.15;
        GameState.shields = Math.max(0, GameState.shields - damage);
        
        // Эффект взрыва
        createExplosion(enemy.x, enemy.y, enemy.color);
        
        GameState.enemies.splice(index, 1);
        
        showMessage(`💥 ${enemy.name} прорвался к базе! -${Math.floor(damage)} щитов.`, 'error');
        updateUI();
        
        if (GameState.shields <= 0) {
            endGame(false);
        }
    }
    
    function killEnemy(enemy, index) {
        const creditsEarned = enemy.credits;
        GameState.credits += creditsEarned;
        GameState.enemiesKilledThisWave++;
        
        // Эффекты
        createExplosion(enemy.x, enemy.y, enemy.color);
        createCreditEffect(enemy.x, enemy.y, creditsEarned);
        
        GameState.enemies.splice(index, 1);
        
        updateUI();
        DOM.enemiesKilled.textContent = GameState.enemiesKilledThisWave;
    }
    
    // ==================== СТАНЦИИ ====================
    function placeStation(x, y) {
        const cell = findCellAtPosition(x, y);
        
        if (!cell) {
            showMessage('❌ Кликните по ячейке!', 'error');
            return;
        }
        
        if (!cell.isBuildSpot) {
            showMessage('❌ Здесь нельзя строить!', 'error');
            return;
        }
        
        if (cell.occupied) {
            showMessage('❌ Эта ячейка занята!', 'error');
            return;
        }
        
        const stationType = getStationConfig(GameState.selectedStationType);
        
        if (GameState.credits < stationType.cost) {
            showMessage(`❌ Недостаточно кредитов! Нужно ${stationType.cost}`, 'error');
            return;
        }
        
        // Создаем станцию
        const station = {
            x: cell.x + cell.width / 2,
            y: cell.y + cell.height / 2,
            type: GameState.selectedStationType,
            name: stationType.name,
            damage: stationType.damage,
            range: stationType.range,
            fireRate: stationType.fireRate,
            color: stationType.color,
            level: 1,
            lastShot: 0,
            target: null,
            rotation: 0,
            cell: cell,
            icon: stationType.icon,
            sellValue: Math.floor(stationType.cost * stationType.sellRatio)
        };
        
        GameState.stations.push(station);
        cell.occupied = true;
        cell.station = station;
        
        GameState.credits -= stationType.cost;
        
        // Эффект установки
        for (let i = 0; i < 12; i++) {
            GameState.particles.push({
                x: station.x,
                y: station.y,
                size: Math.random() * 3 + 1,
                speedX: (Math.random() - 0.5) * 2,
                speedY: (Math.random() - 0.5) * 2,
                color: station.color,
                opacity: 1,
                life: 20
            });
        }
        
        showMessage(`✅ ${stationType.name} установлена!`, 'success');
        updateUI();
        clearSelection();
    }
    
    function findCellAtPosition(x, y) {
        return GameState.cells.find(cell =>
            x >= cell.x && x <= cell.x + cell.width &&
            y >= cell.y && y <= cell.y + cell.height
        );
    }
    
    function selectStationAtPosition(x, y) {
        for (const station of GameState.stations) {
            const dx = x - station.x;
            const dy = y - station.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 20) {
                selectStationForUpgrade(station);
                return;
            }
        }
        
        if (GameState.selectedStation) {
            closeTowerInfo();
        }
    }
    
    function selectStationForUpgrade(station) {
        GameState.selectedStation = station;
        updateStationInfo(station);
        DOM.towerInfoPanel.style.display = 'block';
        DOM.selectionIndicator.style.display = 'flex';
        DOM.selectionText.textContent = station.name;
    }
    
    function updateStationInfo(station) {
        DOM.towerName.textContent = station.name;
        DOM.towerLevel.textContent = station.level;
        DOM.towerDamage.textContent = Math.floor(station.damage * (1 + GameState.base.attackBonus / 100));
        DOM.towerRange.textContent = `${station.range}px`;
        DOM.towerSpeed.textContent = `${(station.fireRate / 1000).toFixed(1)}s`;
        DOM.upgradeCost.textContent = calculateUpgradeCost(station);
        DOM.sellValue.textContent = station.sellValue;
        
        DOM.upgradeTowerBtn.disabled = GameState.isWaveActive || GameState.credits < calculateUpgradeCost(station);
        DOM.sellTowerBtn.disabled = GameState.isWaveActive;
    }
    
    function upgradeSelectedStation() {
        if (!GameState.selectedStation || GameState.isWaveActive) return;
        
        const station = GameState.selectedStation;
        const upgradeCost = calculateUpgradeCost(station);
        
        if (GameState.credits < upgradeCost) {
            showMessage('❌ Недостаточно кредитов для улучшения!', 'error');
            return;
        }
        
        GameState.credits -= upgradeCost;
        
        station.level++;
        station.damage = Math.floor(station.damage * 1.4);
        station.range = Math.floor(station.range * 1.05);
        station.fireRate = Math.max(400, station.fireRate * 0.95);
        station.sellValue = Math.floor(station.sellValue * 1.2);
        
        // Эффект улучшения
        for (let i = 0; i < 15; i++) {
            GameState.particles.push({
                x: station.x,
                y: station.y,
                size: Math.random() * 4 + 2,
                speedX: (Math.random() - 0.5) * 3,
                speedY: (Math.random() - 0.5) * 3,
                color: '#ffd700',
                opacity: 1,
                life: 25
            });
        }
        
        showMessage(`⬆️ ${station.name} улучшена до уровня ${station.level}!`, 'success');
        updateUI();
        updateStationInfo(station);
    }
    
    function sellSelectedStation() {
        if (!GameState.selectedStation || GameState.isWaveActive) return;
        
        const station = GameState.selectedStation;
        
        if (!confirm(`Продать ${station.name} за ${station.sellValue} кредитов?`)) {
            return;
        }
        
        GameState.credits += station.sellValue;
        station.cell.occupied = false;
        station.cell.station = null;
        
        const index = GameState.stations.indexOf(station);
        GameState.stations.splice(index, 1);
        
        // Эффект продажи
        for (let i = 0; i < 10; i++) {
            GameState.particles.push({
                x: station.x,
                y: station.y,
                size: Math.random() * 3 + 1,
                speedX: (Math.random() - 0.5) * 2,
                speedY: Math.random() * -2 - 1,
                color: '#ffd700',
                opacity: 1,
                life: 40,
                isCredit: true
            });
        }
        
        showMessage(`💰 Станция продана за ${station.sellValue} кредитов!`, 'success');
        closeTowerInfo();
        updateUI();
    }
    
    function updateStations() {
        GameState.stations.forEach(station => {
            // Поиск цели
            if (!station.target || station.target.health <= 0) {
                station.target = findTargetForStation(station);
            }
            
            // Стрельба
            if (station.target) {
                const dx = station.target.x - station.x;
                const dy = station.target.y - station.y;
                station.rotation = Math.atan2(dy, dx);
                
                const currentTime = Date.now();
                if (currentTime - station.lastShot > station.fireRate) {
                    shootFromStation(station);
                    station.lastShot = currentTime;
                }
            }
        });
    }
    
    function findTargetForStation(station) {
        let closestEnemy = null;
        let closestDistance = station.range;
        
        for (const enemy of GameState.enemies) {
            const dx = enemy.x - station.x;
            const dy = enemy.y - station.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < closestDistance) {
                closestEnemy = enemy;
                closestDistance = distance;
            }
        }
        
        return closestEnemy;
    }
    
    function shootFromStation(station) {
        if (!station.target) return;
        
        GameState.projectiles.push({
            x: station.x,
            y: station.y,
            target: station.target,
            damage: station.damage * (1 + GameState.base.attackBonus / 100),
            color: station.color,
            speed: 8,
            size: 5,
            fromStation: station
        });
        
        // Эффект выстрела
        const angle = station.rotation;
        for (let i = 0; i < 3; i++) {
            GameState.particles.push({
                x: station.x + Math.cos(angle) * 10,
                y: station.y + Math.sin(angle) * 10,
                size: Math.random() * 2 + 1,
                speedX: Math.cos(angle) * 4 + (Math.random() - 0.5),
                speedY: Math.sin(angle) * 4 + (Math.random() - 0.5),
                color: station.color,
                opacity: 1,
                life: 10
            });
        }
    }
    
    function updateProjectiles() {
        for (let i = GameState.projectiles.length - 1; i >= 0; i--) {
            const projectile = GameState.projectiles[i];
            
            if (!projectile.target || projectile.target.health <= 0) {
                GameState.projectiles.splice(i, 1);
                continue;
            }
            
            const dx = projectile.target.x - projectile.x;
            const dy = projectile.target.y - projectile.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 10) {
                projectile.target.health -= projectile.damage;
                
                // Эффект попадания
                for (let j = 0; j < 6; j++) {
                    GameState.particles.push({
                        x: projectile.target.x,
                        y: projectile.target.y,
                        size: Math.random() * 3 + 1,
                        speedX: (Math.random() - 0.5) * 3,
                        speedY: (Math.random() - 0.5) * 3,
                        color: projectile.color,
                        opacity: 1,
                        life: 15
                    });
                }
                
                GameState.projectiles.splice(i, 1);
            } else {
                const speed = projectile.speed * (GameState.deltaTime / 16) * CONFIG.GAME.GAME_SPEED;
                projectile.x += (dx / distance) * speed;
                projectile.y += (dy / distance) * speed;
            }
        }
    }
    
    // ==================== БАЗА ====================
    function upgradeBase() {
        if (GameState.isWaveActive) return;
        
        const base = GameState.base;
        
        if (GameState.credits < base.upgradeCost) {
            showMessage('❌ Недостаточно кредитов для улучшения базы!', 'error');
            return;
        }
        
        if (base.level >= base.maxLevel) {
            showMessage('✅ База достигла максимального уровня!', 'info');
            return;
        }
        
        GameState.credits -= base.upgradeCost;
        
        base.level++;
        base.maxShields += 300;
        GameState.shields = base.maxShields;
        base.attackBonus += 5;
        base.incomeBonus += 10;
        base.upgradeCost = Math.floor(base.upgradeCost * 1.4);
        
        // Добавляем новые места для строительства
        if (base.availableSlots < base.maxSlots) {
            base.availableSlots = Math.min(base.availableSlots + 1, base.maxSlots);
            generateBuildSpots();
        }
        
        // Эффект улучшения
        const centerX = DOM.canvas.width - 80;
        const centerY = DOM.canvas.height - 80;
        for (let i = 0; i < 20; i++) {
            GameState.particles.push({
                x: centerX,
                y: centerY,
                size: Math.random() * 5 + 2,
                speedX: (Math.random() - 0.5) * 4,
                speedY: (Math.random() - 0.5) * 4,
                color: '#00bfff',
                opacity: 1,
                life: 30
            });
        }
        
        showMessage(`🏢 Командный центр улучшен до уровня ${base.level}!`, 'success');
        updateBaseInfo();
        updateUI();
    }
    
    function updateBaseInfo() {
        const base = GameState.base;
        DOM.baseLevel.textContent = base.level;
        DOM.baseAttack.textContent = `+${base.attackBonus}%`;
        DOM.baseIncome.textContent = `+${CONFIG.GAME.BASE_INCOME + base.incomeBonus}`;
        DOM.availableSlots.textContent = `${base.availableSlots}/${base.maxSlots}`;
        DOM.baseUpgradeCost.textContent = base.upgradeCost;
    }
    
    // ==================== ОТРИСОВКА ====================
    function render() {
        DOM.ctx.clearRect(0, 0, DOM.canvas.width, DOM.canvas.height);
        
        drawBackground();
        drawPath();
        drawBuildSpots();
        drawHoveredCell();
        drawStations();
        drawEnemies();
        drawProjectiles();
        drawParticles();
        drawCommandCenter();
        
        if (GameState.selectedStation && !GameState.isWaveActive) {
            drawStationRange(GameState.selectedStation);
        }
        
        if (GameState.isPaused) drawPauseOverlay();
    }
    
    function drawBackground() {
        // Темный фон
        DOM.ctx.fillStyle = '#0a0a1a';
        DOM.ctx.fillRect(0, 0, DOM.canvas.width, DOM.canvas.height);
        
        // Туманность
        const gradient = DOM.ctx.createRadialGradient(
            DOM.canvas.width / 2, DOM.canvas.height / 2, 0,
            DOM.canvas.width / 2, DOM.canvas.height / 2, DOM.canvas.width
        );
        gradient.addColorStop(0, 'rgba(10, 10, 42, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 0, 16, 0.8)');
        DOM.ctx.fillStyle = gradient;
        DOM.ctx.fillRect(0, 0, DOM.canvas.width, DOM.canvas.height);
    }
    
    function drawPath() {
        const path = getPixelPath();
        if (path.length < 2) return;
        
        // Плавно пульсирующая дорожка
        const pulse = Math.sin(GameState.animationTime * 0.001) * 0.2 + 0.3;
        
        // Основная дорожка
        DOM.ctx.strokeStyle = `rgba(0, 191, 255, ${0.1 + pulse})`;
        DOM.ctx.lineWidth = 25;
        DOM.ctx.lineCap = 'round';
        DOM.ctx.lineJoin = 'round';
        
        DOM.ctx.beginPath();
        DOM.ctx.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length; i++) {
            DOM.ctx.lineTo(path[i].x, path[i].y);
        }
        DOM.ctx.stroke();
        
        // Контур
        DOM.ctx.strokeStyle = `rgba(0, 255, 157, ${0.3 + pulse * 0.5})`;
        DOM.ctx.lineWidth = 3;
        DOM.ctx.setLineDash([10, 5]);
        DOM.ctx.stroke();
        DOM.ctx.setLineDash([]);
        
        // Стрелки направления
        for (let i = 0; i < path.length - 1; i++) {
            const start = path[i];
            const end = path[i + 1];
            const progress = (GameState.animationTime * 0.001 + i * 0.2) % 1;
            
            const arrowX = start.x + (end.x - start.x) * progress;
            const arrowY = start.y + (end.y - start.y) * progress;
            const angle = Math.atan2(end.y - start.y, end.x - start.x);
            
            // Рисуем стрелку
            DOM.ctx.save();
            DOM.ctx.translate(arrowX, arrowY);
            DOM.ctx.rotate(angle);
            
            DOM.ctx.fillStyle = `rgba(255, 215, 0, ${0.5 + Math.sin(GameState.animationTime * 0.002) * 0.3})`;
            DOM.ctx.beginPath();
            DOM.ctx.moveTo(0, 0);
            DOM.ctx.lineTo(-8, -5);
            DOM.ctx.lineTo(-8, 5);
            DOM.ctx.closePath();
            DOM.ctx.fill();
            
            DOM.ctx.restore();
        }
        
        // Точки входа и выхода
        drawPathPoint(path[0], '#ff2e63', 'ВХОД');
        drawPathPoint(path[path.length - 1], '#00bfff', 'БАЗА');
    }
    
    function drawPathPoint(point, color, label) {
        DOM.ctx.fillStyle = color;
        DOM.ctx.beginPath();
        DOM.ctx.arc(point.x, point.y, 10, 0, Math.PI * 2);
        DOM.ctx.fill();
        
        DOM.ctx.strokeStyle = '#ffffff';
        DOM.ctx.lineWidth = 2;
        DOM.ctx.stroke();
        
        DOM.ctx.fillStyle = '#ffffff';
        DOM.ctx.font = 'bold 11px Arial';
        DOM.ctx.textAlign = 'center';
        DOM.ctx.textBaseline = 'middle';
        DOM.ctx.fillText(label, point.x, point.y);
    }
    
    function drawBuildSpots() {
        const pulse = Math.sin(GameState.animationTime * 0.003) * 0.3 + 0.7;
        
        GameState.cells.forEach(cell => {
            if (cell.isBuildSpot && !cell.occupied) {
                // Прозрачная подсветка доступных мест
                DOM.ctx.fillStyle = `rgba(0, 212, 255, ${0.1 + pulse * 0.1})`;
                DOM.ctx.fillRect(cell.x, cell.y, cell.width, cell.height);
                
                // Контур
                DOM.ctx.strokeStyle = `rgba(0, 212, 255, ${0.3 + pulse * 0.2})`;
                DOM.ctx.lineWidth = 1;
                DOM.ctx.strokeRect(cell.x, cell.y, cell.width, cell.height);
            }
        });
    }
    
    function drawHoveredCell() {
        if (!GameState.selectedStationType || GameState.isWaveActive) return;
        
        const hoveredCell = GameState.cells.find(cell => cell.hovered);
        if (!hoveredCell) return;
        
        const stationType = getStationConfig(GameState.selectedStationType);
        const canAfford = GameState.credits >= stationType.cost;
        
        if (hoveredCell.isBuildSpot && !hoveredCell.occupied) {
            DOM.ctx.fillStyle = canAfford 
                ? `rgba(0, 191, 255, 0.3)` 
                : `rgba(255, 46, 99, 0.5)`;
            DOM.ctx.fillRect(hoveredCell.x, hoveredCell.y, hoveredCell.width, hoveredCell.height);
            
            // Предпросмотр станции
            const centerX = hoveredCell.x + hoveredCell.width / 2;
            const centerY = hoveredCell.y + hoveredCell.height / 2;
            
            DOM.ctx.globalAlpha = 0.6;
            DOM.ctx.fillStyle = stationType.color;
            DOM.ctx.beginPath();
            DOM.ctx.arc(centerX, centerY, 12, 0, Math.PI * 2);
            DOM.ctx.fill();
            
            if (!canAfford) {
                DOM.ctx.fillStyle = '#ffffff';
                DOM.ctx.font = 'bold 12px Arial';
                DOM.ctx.textAlign = 'center';
                DOM.ctx.textBaseline = 'middle';
                DOM.ctx.fillText('$', centerX, centerY);
            }
            
            DOM.ctx.globalAlpha = 1;
        }
    }
    
    function drawStations() {
        GameState.stations.forEach(station => {
            // Основание
            DOM.ctx.fillStyle = station.color;
            DOM.ctx.beginPath();
            DOM.ctx.arc(station.x, station.y, 15, 0, Math.PI * 2);
            DOM.ctx.fill();
            
            // Бордюр
            DOM.ctx.strokeStyle = '#ffffff';
            DOM.ctx.lineWidth = 2;
            DOM.ctx.stroke();
            
            // Орудие
            DOM.ctx.save();
            DOM.ctx.translate(station.x, station.y);
            DOM.ctx.rotate(station.rotation);
            
            DOM.ctx.fillStyle = '#2c3e50';
            DOM.ctx.fillRect(0, -4, 20, 8);
            
            DOM.ctx.fillStyle = station.color;
            DOM.ctx.fillRect(0, -3, 15, 6);
            
            DOM.ctx.restore();
            
            // Уровень
            DOM.ctx.fillStyle = '#ffffff';
            DOM.ctx.font = 'bold 11px Orbitron';
            DOM.ctx.textAlign = 'center';
            DOM.ctx.textBaseline = 'middle';
            DOM.ctx.fillText(station.level.toString(), station.x, station.y);
            
            // Выделение
            if (station === GameState.selectedStation) {
                DOM.ctx.strokeStyle = '#ffd700';
                DOM.ctx.lineWidth = 2;
                DOM.ctx.beginPath();
                DOM.ctx.arc(station.x, station.y, 18, 0, Math.PI * 2);
                DOM.ctx.stroke();
            }
        });
    }
    
    function drawStationRange(station) {
        DOM.ctx.strokeStyle = 'rgba(0, 191, 255, 0.3)';
        DOM.ctx.lineWidth = 2;
        DOM.ctx.setLineDash([5, 5]);
        DOM.ctx.beginPath();
        DOM.ctx.arc(station.x, station.y, station.range, 0, Math.PI * 2);
        DOM.ctx.stroke();
        DOM.ctx.setLineDash([]);
    }
    
    function drawEnemies() {
        GameState.enemies.forEach(enemy => {
            DOM.ctx.save();
            DOM.ctx.translate(enemy.x, enemy.y);
            DOM.ctx.rotate(enemy.rotation);
            
            // Корпус врага
            DOM.ctx.fillStyle = enemy.color;
            DOM.ctx.beginPath();
            DOM.ctx.moveTo(0, -enemy.size);
            DOM.ctx.lineTo(enemy.size * 0.8, enemy.size * 0.5);
            DOM.ctx.lineTo(0, enemy.size * 0.3);
            DOM.ctx.lineTo(-enemy.size * 0.8, enemy.size * 0.5);
            DOM.ctx.closePath();
            DOM.ctx.fill();
            
            // Кабина
            DOM.ctx.fillStyle = '#ffffff';
            DOM.ctx.beginPath();
            DOM.ctx.arc(0, -enemy.size * 0.3, enemy.size * 0.3, 0, Math.PI * 2);
            DOM.ctx.fill();
            
            // Двигатели
            DOM.ctx.fillStyle = '#ff9900';
            DOM.ctx.fillRect(-enemy.size * 0.3, enemy.size * 0.3, enemy.size * 0.6, 3);
            
            DOM.ctx.restore();
            
            // Полоска здоровья
            const healthWidth = 40;
            const healthPercent = enemy.health / enemy.maxHealth;
            
            DOM.ctx.fillStyle = '#2c3e50';
            DOM.ctx.fillRect(enemy.x - healthWidth / 2, enemy.y - enemy.size - 15, healthWidth, 6);
            
            DOM.ctx.fillStyle = healthPercent > 0.5 ? '#00ff9d' : 
                               healthPercent > 0.25 ? '#ffd700' : '#ff2e63';
            DOM.ctx.fillRect(enemy.x - healthWidth / 2, enemy.y - enemy.size - 15, healthWidth * healthPercent, 6);
        });
    }
    
    function drawProjectiles() {
        GameState.projectiles.forEach(projectile => {
            DOM.ctx.fillStyle = projectile.color;
            DOM.ctx.beginPath();
            DOM.ctx.arc(projectile.x, projectile.y, projectile.size, 0, Math.PI * 2);
            DOM.ctx.fill();
            
            // Свечение
            const gradient = DOM.ctx.createRadialGradient(
                projectile.x, projectile.y, 0,
                projectile.x, projectile.y, projectile.size * 3
            );
            gradient.addColorStop(0, projectile.color + 'CC');
            gradient.addColorStop(1, projectile.color + '00');
            
            DOM.ctx.fillStyle = gradient;
            DOM.ctx.beginPath();
            DOM.ctx.arc(projectile.x, projectile.y, projectile.size * 3, 0, Math.PI * 2);
            DOM.ctx.fill();
        });
    }
    
    function drawParticles() {
        GameState.particles.forEach(particle => {
            if (particle.life && particle.life <= 0) return;
            
            DOM.ctx.globalAlpha = particle.opacity;
            
            if (particle.isStar) {
                // Звезды
                if (particle.twinkle) {
                    particle.opacity = 0.2 + Math.abs(Math.sin(GameState.animationTime * particle.twinkleSpeed)) * 0.3;
                }
                
                DOM.ctx.fillStyle = particle.color;
                DOM.ctx.beginPath();
                DOM.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                DOM.ctx.fill();
            } else if (particle.isCredit) {
                // Монеты
                DOM.ctx.fillStyle = '#ffd700';
                DOM.ctx.beginPath();
                DOM.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                DOM.ctx.fill();
            } else {
                // Обычные частицы
                DOM.ctx.fillStyle = particle.color;
                DOM.ctx.beginPath();
                DOM.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                DOM.ctx.fill();
            }
            
            DOM.ctx.globalAlpha = 1;
        });
    }
    
    function drawCommandCenter() {
        const centerX = DOM.canvas.width - 80;
        const centerY = DOM.canvas.height - 80;
        
        // Основное здание
        DOM.ctx.fillStyle = '#00bfff';
        DOM.ctx.fillRect(centerX - 40, centerY - 30, 80, 60);
        
        // Купол
        DOM.ctx.beginPath();
        DOM.ctx.ellipse(centerX, centerY - 30, 40, 20, 0, 0, Math.PI * 2);
        DOM.ctx.fill();
        
        // Окна
        DOM.ctx.fillStyle = '#ffd700';
        for (let i = 0; i < 4; i++) {
            DOM.ctx.fillRect(centerX - 30 + i * 20, centerY - 15, 8, 4);
        }
        
        // Антенна
        DOM.ctx.fillStyle = '#ffffff';
        DOM.ctx.fillRect(centerX - 1, centerY - 50, 2, 20);
        DOM.ctx.beginPath();
        DOM.ctx.arc(centerX, centerY - 50, 5, 0, Math.PI * 2);
        DOM.ctx.fill();
        
        // Полоска щитов
        const shieldWidth = 100;
        const shieldPercent = GameState.shields / GameState.base.maxShields;
        
        DOM.ctx.fillStyle = '#2c3e50';
        DOM.ctx.fillRect(centerX - 50, centerY + 40, shieldWidth, 8);
        
        DOM.ctx.fillStyle = shieldPercent > 0.5 ? '#00ff9d' : 
                           shieldPercent > 0.25 ? '#ffd700' : '#ff2e63';
        DOM.ctx.fillRect(centerX - 50, centerY + 40, shieldWidth * shieldPercent, 8);
        
        // Надпись
        DOM.ctx.fillStyle = '#ffffff';
        DOM.ctx.font = 'bold 10px Orbitron';
        DOM.ctx.textAlign = 'center';
        DOM.ctx.fillText('ЦЕНТР', centerX, centerY + 35);
    }
    
    function drawPauseOverlay() {
        DOM.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        DOM.ctx.fillRect(0, 0, DOM.canvas.width, DOM.canvas.height);
        
        DOM.ctx.fillStyle = '#ffffff';
        DOM.ctx.font = 'bold 36px Orbitron';
        DOM.ctx.textAlign = 'center';
        DOM.ctx.textBaseline = 'middle';
        DOM.ctx.fillText('ПАУЗА', DOM.canvas.width / 2, DOM.canvas.height / 2 - 20);
        
        DOM.ctx.font = '18px Arial';
        DOM.ctx.fillText('Нажмите P для продолжения', DOM.canvas.width / 2, DOM.canvas.height / 2 + 20);
    }
    
    // ==================== ЭФФЕКТЫ ====================
    function updateParticles() {
        for (let i = GameState.particles.length - 1; i >= 0; i--) {
            const particle = GameState.particles[i];
            
            if (particle.speedX || particle.speedY) {
                particle.x += particle.speedX * (GameState.deltaTime / 16);
                particle.y += particle.speedY * (GameState.deltaTime / 16);
            }
            
            if (particle.life) {
                particle.life--;
                particle.opacity = particle.life / particle.life;
                
                if (particle.life <= 0) {
                    GameState.particles.splice(i, 1);
                }
            }
        }
    }
    
    function createExplosion(x, y, color) {
        for (let i = 0; i < 15; i++) {
            GameState.particles.push({
                x, y,
                size: Math.random() * 4 + 2,
                speedX: (Math.random() - 0.5) * 4,
                speedY: (Math.random() - 0.5) * 4,
                color: color,
                opacity: 1,
                life: 25
            });
        }
    }
    
    function createCreditEffect(x, y, amount) {
        const coinCount = Math.min(5, Math.floor(amount / 25));
        
        for (let i = 0; i < coinCount; i++) {
            GameState.particles.push({
                x, y,
                size: Math.random() * 3 + 1,
                speedX: (Math.random() - 0.5) * 2,
                speedY: Math.random() * -2 - 1,
                color: '#ffd700',
                opacity: 1,
                life: 40,
                isCredit: true
            });
        }
    }
    
    // ==================== УПРАВЛЕНИЕ ИГРОЙ ====================
    function startWave() {
        if (GameState.isWaveActive || GameState.gameOver) return;
        
        GameState.enemiesSpawned = 0;
        GameState.enemiesKilledThisWave = 0;
        GameState.isWaveActive = true;
        
        DOM.startWaveBtn.disabled = true;
        DOM.startWaveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> БОЙ';
        DOM.enemiesLeft.textContent = GameState.enemiesThisWave;
        DOM.floatingEnemies.textContent = GameState.enemiesThisWave;
        DOM.enemiesKilled.textContent = '0';
        
        showMessage(`⚡ Волна ${GameState.currentWave} началась! Уничтожьте ${GameState.enemiesThisWave} врагов.`, 'warning');
    }
    
    function completeWave() {
        GameState.isWaveActive = false;
        
        const waveReward = CONFIG.GAME.BASE_INCOME + GameState.base.incomeBonus + GameState.currentWave * 10;
        GameState.credits += waveReward;
        
        GameState.currentWave++;
        
        if (GameState.currentSet > GameState.highScore) {
            GameState.highScore = GameState.currentSet;
            localStorage.setItem('cosmic_highscore', GameState.highScore);
            DOM.highscore.textContent = GameState.highScore;
        }
        
        DOM.startWaveBtn.disabled = false;
        DOM.startWaveBtn.innerHTML = '<i class="fas fa-play"></i> СТАРТ';
        DOM.waveProgress.style.width = '0%';
        DOM.currentWaveSidebar.textContent = GameState.currentWave;
        
        generateWavePreview();
        
        showMessage(`✅ Волна завершена! +${waveReward} кредитов. Готовьтесь к следующей волне.`, 'success');
        updateUI();
    }
    
    function togglePause() {
        if (GameState.gameOver) return;
        
        GameState.isPaused = !GameState.isPaused;
        
        if (GameState.isPaused) {
            DOM.pauseGameBtn.innerHTML = '<i class="fas fa-play"></i>';
            showMessage('⏸️ Игра на паузе', 'info');
        } else {
            DOM.pauseGameBtn.innerHTML = '<i class="fas fa-pause"></i>';
            showMessage('▶️ Игра продолжается', 'info');
        }
    }
    
    function endGame(isVictory) {
        GameState.isWaveActive = false;
        GameState.gameOver = true;
        
        DOM.gameOverSet.textContent = GameState.currentSet;
        DOM.gameOverWave.textContent = GameState.currentWave - 1;
        DOM.gameOverCredits.textContent = GameState.credits;
        DOM.gameOverKills.textContent = GameState.enemiesKilledThisWave;
        
        DOM.gameOverModal.style.display = 'flex';
        
        if (isVictory) {
            showMessage('🎉 ПОБЕДА! Вы защитили базу!', 'victory');
        } else {
            showMessage('💀 КОМАНДНЫЙ ЦЕНТР УНИЧТОЖЕН!', 'error');
        }
        
        DOM.startWaveBtn.disabled = true;
        DOM.startWaveBtn.innerHTML = '<i class="fas fa-flag-checkered"></i> ИГРА ЗАВЕРШЕНА';
    }
    
    function resetGame() {
        GameState.shields = CONFIG.GAME.START_SHIELDS;
        GameState.credits = CONFIG.GAME.START_CREDITS;
        GameState.currentSet = CONFIG.GAME.CURRENT_SET;
        GameState.currentWave = 1;
        GameState.isWaveActive = false;
        GameState.isPaused = false;
        GameState.gameOver = false;
        GameState.gameWon = false;
        GameState.enemiesSpawned = 0;
        GameState.enemiesKilledThisWave = 0;
        GameState.base = JSON.parse(JSON.stringify(CONFIG.BASE));
        
        GameState.stations = [];
        GameState.enemies = [];
        GameState.projectiles = [];
        GameState.particles = GameState.particles.filter(p => p.isStar);
        GameState.cells = [];
        
        initGameField();
        generateBuildSpots();
        
        clearSelection();
        closeTowerInfo();
        
        updateUI();
        updateBaseInfo();
        generateWavePreview();
        
        DOM.gameOverModal.style.display = 'none';
        DOM.startWaveBtn.disabled = false;
        DOM.startWaveBtn.innerHTML = '<i class="fas fa-play"></i> СТАРТ';
        DOM.waveProgress.style.width = '0%';
        DOM.enemiesLeft.textContent = '10';
        DOM.floatingEnemies.textContent = '10';
        DOM.enemiesKilled.textContent = '0';
        DOM.set.textContent = '1/5';
        DOM.currentWaveSidebar.textContent = '1';
        
        showMessage('🔄 Игра сброшена! Приготовьтесь к новой битве!', 'info');
    }
    
    // ==================== УТИЛИТЫ ====================
    function getStationConfig(type) {
        return CONFIG.STATIONS[type.toUpperCase()];
    }
    
    function getPixelPath() {
        return GameState.currentPath.map(point => ({
            x: point.x * DOM.canvas.width,
            y: point.y * DOM.canvas.height
        }));
    }
    
    function calculateUpgradeCost(station) {
        return 150 + (station.level - 1) * 100;
    }
    
    function generateWavePreview() {
        DOM.wavePreview.innerHTML = '';
        
        const enemies = [
            { name: 'Разведчик', color: '#4dffea', count: 5 + GameState.currentWave },
            { name: 'Истребитель', color: '#ff9966', count: 3 + Math.floor(GameState.currentWave / 2) },
            { name: 'Бомбардировщик', color: '#ff4d4d', count: 1 + Math.floor(GameState.currentWave / 3) }
        ];
        
        enemies.forEach(enemy => {
            if (enemy.count > 0) {
                const div = document.createElement('div');
                div.className = 'enemy-preview-item';
                div.style.borderLeftColor = enemy.color;
                div.innerHTML = `
                    <i class="fas fa-robot" style="color: ${enemy.color}"></i>
                    <span class="enemy-preview-name">${enemy.name}</span>
                    <span class="enemy-preview-count">×${enemy.count}</span>
                `;
                DOM.wavePreview.appendChild(div);
            }
        });
    }
    
    function showMessage(text, type = 'info') {
        DOM.messageText.textContent = text;
        
        setTimeout(() => {
            if (DOM.messageText.textContent === text) {
                DOM.messageText.textContent = `Готовьтесь к волне ${GameState.currentWave}...`;
            }
        }, 3000);
    }
    
    function clearSelection() {
        DOM.stationItems.forEach(i => i.classList.remove('selected'));
        GameState.selectedStationType = null;
        DOM.selectionIndicator.style.display = 'none';
    }
    
    function closeTowerInfo() {
        DOM.towerInfoPanel.style.display = 'none';
        GameState.selectedStation = null;
        clearSelection();
    }
    
    function updateUI() {
        DOM.lives.textContent = Math.floor(GameState.shields);
        DOM.gold.textContent = GameState.credits;
        DOM.set.textContent = `${GameState.currentSet}/5`;
        
        const shieldPercent = GameState.shields / GameState.base.maxShields;
        DOM.lives.style.color = shieldPercent > 0.5 ? '#00ff9d' : 
                               shieldPercent > 0.25 ? '#ffd700' : '#ff2e63';
        
        DOM.gold.classList.add('pulse');
        setTimeout(() => DOM.gold.classList.remove('pulse'), 300);
    }
    
    function initInfoModal() {
        DOM.modalBody.innerHTML = `
            <div class="modal-section">
                <h3><i class="fas fa-gamepad"></i> КАК ИГРАТЬ</h3>
                <div class="modal-grid">
                    <div class="modal-item">
                        <h4>1. Выберите станцию</h4>
                        <p>Кликните на станцию в магазине. Доступно 4 типа станций.</p>
                    </div>
                    <div class="modal-item">
                        <h4>2. Установите станцию</h4>
                        <p>Кликните на подсвеченное место на карте. Места ограничены!</p>
                    </div>
                    <div class="modal-item">
                        <h4>3. Начните волну</h4>
                        <p>Нажмите "СТАРТ" или ПРОБЕЛ для начала атаки врагов.</p>
                    </div>
                    <div class="modal-item">
                        <h4>4. Улучшайте</h4>
                        <p>Кликните на станцию для улучшения или продажи.</p>
                    </div>
                </div>
            </div>
            
            <div class="modal-section">
                <h3><i class="fas fa-satellite"></i> ТИПЫ СТАНЦИЙ</h3>
                <div class="modal-grid">
                    <div class="modal-item" style="border-left-color: #ff2e63;">
                        <h4 style="color: #ff2e63;">Лазерная</h4>
                        <p>Быстрая атака по одной цели. Хороша против слабых врагов.</p>
                    </div>
                    <div class="modal-item" style="border-left-color: #00ff9d;">
                        <h4 style="color: #00ff9d;">Плазменная</h4>
                        <p>Урон по области. Эффективна против скоплений врагов.</p>
                    </div>
                    <div class="modal-item" style="border-left-color: #00bfff;">
                        <h4 style="color: #00bfff;">Рейлган</h4>
                        <p>Бронебойный урон. Пробивает броню сильных врагов.</p>
                    </div>
                    <div class="modal-item" style="border-left-color: #ffd700;">
                        <h4 style="color: #ffd700;">Тесла</h4>
                        <p>Цепная атака. Поражает нескольких врагов одновременно.</p>
                    </div>
                </div>
            </div>
            
            <div class="modal-section">
                <h3><i class="fas fa-keyboard"></i> ГОРЯЧИЕ КЛАВИШИ</h3>
                <div class="hotkey-grid">
                    <div class="hotkey-item">
                        <span class="hotkey">ПРОБЕЛ</span>
                        <span class="hotkey-text">Старт волны</span>
                    </div>
                    <div class="hotkey-item">
                        <span class="hotkey">P</span>
                        <span class="hotkey-text">Пауза</span>
                    </div>
                    <div class="hotkey-item">
                        <span class="hotkey">ESC</span>
                        <span class="hotkey-text">Отмена выбора</span>
                    </div>
                    <div class="hotkey-item">
                        <span class="hotkey">R</span>
                        <span class="hotkey-text">Перезапуск игры</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Запуск игры
    init();
});