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
        
        // Типы космических станций
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
        
        // 10 типов космических врагов
        ENEMY_TYPES: {
            SCOUT: {
                name: 'Разведчик',
                health: 100,
                speed: 2.0,
                size: 12,
                color: '#4dffea',
                credits: 25,
                armor: 0,
                ability: null,
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
                ability: null,
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
                ability: 'explosive',
                spawnWeight: 15
            },
            STEALTH: {
                name: 'Стелс-корабль',
                health: 150,
                speed: 1.8,
                size: 13,
                color: '#9999ff',
                credits: 60,
                armor: 5,
                ability: 'invisible',
                spawnWeight: 10
            },
            TANK: {
                name: 'Танкер',
                health: 800,
                speed: 0.5,
                size: 25,
                color: '#ffcc00',
                credits: 150,
                armor: 50,
                ability: 'armored',
                spawnWeight: 8
            },
            SUPPORT: {
                name: 'Корабль поддержки',
                health: 250,
                speed: 1.2,
                size: 18,
                color: '#66ff66',
                credits: 55,
                armor: 15,
                ability: 'healer',
                spawnWeight: 7
            },
            SWARMER: {
                name: 'Ройный',
                health: 50,
                speed: 2.5,
                size: 10,
                color: '#ff66b2',
                credits: 15,
                armor: 0,
                ability: 'swarm',
                spawnWeight: 20
            },
            PSIONIC: {
                name: 'Псионик',
                health: 300,
                speed: 1.0,
                size: 17,
                color: '#cc66ff',
                credits: 90,
                armor: 25,
                ability: 'disable',
                spawnWeight: 5
            },
            MOTHERSHIP: {
                name: 'Материнский корабль',
                health: 2000,
                speed: 0.3,
                size: 35,
                color: '#ff3333',
                credits: 400,
                armor: 100,
                ability: 'spawner',
                spawnWeight: 2
            },
            BOSS: {
                name: 'Командный корабль',
                health: 5000,
                speed: 0.4,
                size: 40,
                color: '#ff0000',
                credits: 1000,
                armor: 150,
                ability: 'boss',
                spawnWeight: 1
            }
        },
        
        // Пути для каждого сета
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
            ],
            SET_2: [
                { x: 0.5, y: -0.05 },
                { x: 0.5, y: 0.3 },
                { x: 0.3, y: 0.3 },
                { x: 0.3, y: 0.6 },
                { x: 0.7, y: 0.6 },
                { x: 0.7, y: 0.4 },
                { x: 0.5, y: 0.4 },
                { x: 0.5, y: 1.05 }
            ],
            SET_3: [
                { x: -0.05, y: 0.2 },
                { x: 0.4, y: 0.2 },
                { x: 0.4, y: 0.6 },
                { x: 0.1, y: 0.6 },
                { x: 0.1, y: 0.8 },
                { x: 0.9, y: 0.8 },
                { x: 0.9, y: 0.3 },
                { x: 1.05, y: 0.3 }
            ]
        },
        
        // Базовая станция
        BASE: {
            level: 1,
            maxLevel: 10,
            shields: 1500,
            maxShields: 1500,
            attackBonus: 0,
            incomeBonus: 0,
            drones: 0,
            maxDrones: 3,
            droneDamage: 20,
            upgradeCost: 500
        }
    };
    
    // ==================== СОСТОЯНИЕ ИГРЫ ====================
    const GameState = {
        // Основные показатели
        shields: CONFIG.GAME.START_SHIELDS,
        credits: CONFIG.GAME.START_CREDITS,
        currentSet: CONFIG.GAME.CURRENT_SET,
        currentWave: 1,
        highScore: parseInt(localStorage.getItem('cosmic_highscore')) || 0,
        
        // Состояние игры
        isWaveActive: false,
        isPaused: false,
        gameOver: false,
        gameWon: false,
        
        // Выбор
        selectedStationType: null,
        selectedStation: null,
        
        // Игровые объекты
        stations: [],
        enemies: [],
        projectiles: [],
        particles: [],
        cells: [],
        drones: [],
        
        // Волна
        enemiesSpawned: 0,
        enemiesKilledThisWave: 0,
        enemiesThisWave: 10,
        enemySpawnTimer: 0,
        waveEnemyTypes: [],
        
        // Время
        lastTime: 0,
        deltaTime: 0,
        
        // База
        base: JSON.parse(JSON.stringify(CONFIG.BASE)),
        
        // Текущий путь
        currentPath: CONFIG.PATHS.SET_1
    };
    
    // ==================== DOM ЭЛЕМЕНТЫ ====================
    const DOM = {
        canvas: document.getElementById('gameCanvas'),
        ctx: document.getElementById('gameCanvas').getContext('2d'),
        lives: document.getElementById('lives'),
        gold: document.getElementById('gold'),
        set: document.getElementById('set'),
        highscore: document.getElementById('highscore'),
        waveProgress: document.getElementById('waveProgress'),
        enemiesLeft: document.getElementById('enemiesLeft'),
        enemiesKilled: document.getElementById('enemiesKilled'),
        startWaveBtn: document.getElementById('startWave'),
        pauseGameBtn: document.getElementById('pauseGame'),
        resetGameBtn: document.getElementById('resetGame'),
        infoBtn: document.getElementById('infoBtn'),
        upgradeTowerBtn: document.getElementById('upgradeTower'),
        sellTowerBtn: document.getElementById('sellTower'),
        closeTowerInfoBtn: document.getElementById('closeTowerInfo'),
        towerInfoPanel: document.getElementById('towerInfoPanel'),
        towerPreview: document.getElementById('towerPreview'),
        towerName: document.getElementById('towerName'),
        towerLevel: document.getElementById('towerLevel'),
        towerDamage: document.getElementById('towerDamage'),
        towerRange: document.getElementById('towerRange'),
        towerSpeed: document.getElementById('towerSpeed'),
        towerEffect: document.getElementById('towerEffect'),
        upgradeCost: document.getElementById('upgradeCost'),
        sellValue: document.getElementById('sellValue'),
        selectionMode: document.getElementById('selectionMode'),
        selectionText: document.getElementById('selectionText'),
        messageArea: document.getElementById('messageArea'),
        messageText: document.getElementById('messageText'),
        wavePreview: document.getElementById('wavePreview'),
        baseLevel: document.getElementById('baseLevel'),
        baseAttack: document.getElementById('baseAttack'),
        baseIncome: document.getElementById('baseIncome'),
        baseDrones: document.getElementById('baseDrones'),
        upgradeBaseBtn: document.getElementById('upgradeBase'),
        baseUpgradeCost: document.getElementById('baseUpgradeCost'),
        infoModal: document.getElementById('infoModal'),
        closeModalBtn: document.getElementById('closeModal'),
        modalBody: document.getElementById('modalBody'),
        towerCards: document.querySelectorAll('.tower-card'),
        buyButtons: document.querySelectorAll('.buy-btn')
    };
    
    // ==================== ИНИЦИАЛИЗАЦИЯ ====================
    function init() {
        console.log('🚀 Инициализация игры...');
        
        // Настройка канваса
        setupCanvas();
        
        // Инициализация игрового поля
        initGameField();
        
        // Настройка событий
        setupEventListeners();
        
        // Загрузка рекорда
        DOM.highscore.textContent = GameState.highScore;
        
        // Обновление интерфейса
        updateUI();
        generateWavePreview();
        initInfoModal();
        
        // Приветственное сообщение
        showMessage('🚀 Добро пожаловать в Cosmic Defender! Выберите станцию для установки.', 'info');
        
        // Запуск игрового цикла
        requestAnimationFrame(gameLoop);
        
        console.log('✅ Игра инициализирована!');
    }
    
    function setupCanvas() {
        const container = document.querySelector('.game-board');
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        DOM.canvas.width = width;
        DOM.canvas.height = height;
        
        console.log(`📐 Канвас: ${width}x${height}`);
    }
    
    function initGameField() {
        const cols = Math.floor(DOM.canvas.width / CONFIG.GAME.CELL_SIZE);
        const rows = Math.floor(DOM.canvas.height / CONFIG.GAME.CELL_SIZE);
        
        // Создание ячеек
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
                    isPath: false
                });
            }
        }
        
        // Пометка пути как занятого
        markPathAsOccupied();
        
        // Создание звездного фона
        createStarfield();
    }
    
    function markPathAsOccupied() {
        const pixelPath = getPixelPath();
        const pathWidth = CONFIG.GAME.CELL_SIZE * 1.5;
        
        GameState.cells.forEach(cell => {
            const cellCenterX = cell.x + cell.width / 2;
            const cellCenterY = cell.y + cell.height / 2;
            
            for (let i = 0; i < pixelPath.length - 1; i++) {
                const start = pixelPath[i];
                const end = pixelPath[i + 1];
                
                const distance = pointToSegmentDistance(
                    cellCenterX, cellCenterY,
                    start.x, start.y,
                    end.x, end.y
                );
                
                if (distance < pathWidth) {
                    cell.occupied = true;
                    cell.isPath = true;
                    break;
                }
            }
        });
    }
    
    function createStarfield() {
        for (let i = 0; i < 30; i++) {
            GameState.particles.push({
                x: Math.random() * DOM.canvas.width,
                y: Math.random() * DOM.canvas.height,
                size: Math.random() * 2 + 0.5,
                speedX: (Math.random() - 0.5) * 0.1,
                speedY: (Math.random() - 0.5) * 0.1,
                opacity: Math.random() * 0.3 + 0.1,
                color: Math.random() > 0.5 ? '#ffffff' : '#b0b8ff',
                twinkle: Math.random() > 0.5,
                twinkleSpeed: Math.random() * 0.05 + 0.01
            });
        }
    }
    
    // ==================== СОБЫТИЯ ====================
    function setupEventListeners() {
        console.log('🎮 Настройка обработчиков событий...');
        
        // Выбор станции
        DOM.towerCards.forEach(card => {
            card.addEventListener('click', () => selectTowerFromShop(card));
        });
        
        DOM.buyButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const card = btn.closest('.tower-card');
                selectTowerFromShop(card);
            });
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
        DOM.resetGameBtn.addEventListener('click', resetGame);
        DOM.infoBtn.addEventListener('click', () => DOM.infoModal.style.display = 'flex');
        DOM.closeModalBtn.addEventListener('click', () => DOM.infoModal.style.display = 'none');
        DOM.upgradeTowerBtn.addEventListener('click', upgradeSelectedStation);
        DOM.sellTowerBtn.addEventListener('click', sellSelectedStation);
        DOM.closeTowerInfoBtn.addEventListener('click', closeTowerInfo);
        DOM.upgradeBaseBtn.addEventListener('click', upgradeBase);
        
        // Горячие клавиши
        document.addEventListener('keydown', handleKeyPress);
        
        // Изменение размера окна
        window.addEventListener('resize', handleResize);
        
        // Клик по overlay для закрытия модалки
        DOM.infoModal.addEventListener('click', (e) => {
            if (e.target === DOM.infoModal) {
                DOM.infoModal.style.display = 'none';
            }
        });
        
        console.log('✅ Обработчики событий настроены');
    }
    
    function selectTowerFromShop(card) {
        if (GameState.isWaveActive) {
            showMessage('⚠️ Нельзя строить во время волны!', 'warning');
            return;
        }
        
        const towerType = card.dataset.type;
        const towerConfig = getStationConfig(towerType);
        
        // Снятие предыдущего выделения
        DOM.towerCards.forEach(c => c.classList.remove('selected'));
        
        // Выделение выбранной карты
        card.classList.add('selected');
        
        // Обновление выбора
        GameState.selectedStationType = towerType;
        updateSelectionMode(`Установить ${towerConfig.name}`);
        
        // Обновление курсора
        DOM.canvas.style.cursor = 'crosshair';
        
        // Сообщение
        showMessage(`🎯 Выбрана ${towerConfig.name}. Кликните на свободное место для установки.`, 'info');
    }
    
    function handleCanvasClick(e) {
        const rect = DOM.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Если устанавливаем станцию
        if (GameState.selectedStationType && !GameState.isWaveActive) {
            placeStationAt(x, y);
            return;
        }
        
        // Если выбираем существующую станцию
        selectStationAtPosition(x, y);
    }
    
    function handleCanvasMouseMove(e) {
        const rect = DOM.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Сброс состояния наведения
        GameState.cells.forEach(cell => cell.hovered = false);
        
        // Поиск ячейки под курсором
        const cell = findCellAtPosition(x, y);
        
        if (cell) {
            cell.hovered = true;
            
            // Обновление курсора
            if (GameState.selectedStationType && !GameState.isWaveActive) {
                const config = getStationConfig(GameState.selectedStationType);
                DOM.canvas.style.cursor = (cell.occupied || GameState.credits < config.cost)
                    ? 'not-allowed'
                    : 'pointer';
            } else {
                DOM.canvas.style.cursor = 'default';
            }
        }
    }
    
    function handleKeyPress(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        switch(e.key.toLowerCase()) {
            case 'escape':
                clearSelection();
                break;
            case ' ':
                if (!GameState.isWaveActive && !GameState.gameOver && !GameState.gameWon) {
                    startWave();
                }
                break;
            case '1':
                selectTowerByHotkey('laser');
                break;
            case '2':
                selectTowerByHotkey('plasma');
                break;
            case '3':
                selectTowerByHotkey('railgun');
                break;
            case '4':
                selectTowerByHotkey('tesla');
                break;
            case 'p':
                togglePause();
                break;
            case 'r':
                if (GameState.gameOver || GameState.gameWon) {
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
        initGameField();
        render(); // Немедленная отрисовка
    }
    
    // ==================== ИГРОВАЯ ЛОГИКА ====================
    function gameLoop(timestamp) {
        GameState.deltaTime = timestamp - GameState.lastTime || 0;
        GameState.lastTime = timestamp;
        
        // Обновление частиц
        updateParticles(GameState.deltaTime);
        
        if (!GameState.isPaused && !GameState.gameOver && !GameState.gameWon) {
            // Спавн врагов если волна активна
            if (GameState.isWaveActive) {
                updateWave(GameState.deltaTime);
            }
            
            // Обновление игровых объектов
            updateEnemies(GameState.deltaTime);
            updateStations(GameState.deltaTime);
            updateProjectiles(GameState.deltaTime);
            updateDrones(GameState.deltaTime);
            
            // Проверка завершения волны
            if (GameState.isWaveActive && 
                GameState.enemiesSpawned >= GameState.enemiesThisWave && 
                GameState.enemies.length === 0) {
                completeWave();
            }
        }
        
        // Отрисовка
        render();
        
        // Продолжение цикла
        requestAnimationFrame(gameLoop);
    }
    
    function updateWave(deltaTime) {
        // Спавн врагов
        if (GameState.enemiesSpawned < GameState.enemiesThisWave) {
            GameState.enemySpawnTimer += deltaTime;
            
            if (GameState.enemySpawnTimer >= CONFIG.GAME.ENEMY_SPAWN_INTERVAL) {
                spawnEnemy();
                GameState.enemySpawnTimer = 0;
            }
        }
        
        // Обновление прогресса волны
        updateWaveProgress();
    }
    
    function spawnEnemy() {
        // Выбор типа врага
        if (GameState.waveEnemyTypes.length === 0) {
            generateWaveEnemies();
        }
        
        const enemyType = GameState.waveEnemyTypes.pop();
        const pixelPath = getPixelPath();
        
        // Создание врага
        const enemy = {
            x: pixelPath[0].x,
            y: pixelPath[0].y,
            health: enemyType.health * (1 + (GameState.currentWave - 1) * 0.1),
            maxHealth: enemyType.health * (1 + (GameState.currentWave - 1) * 0.1),
            speed: enemyType.speed,
            color: enemyType.color,
            credits: Math.floor(enemyType.credits * (1 + (GameState.currentWave - 1) * 0.05)),
            size: enemyType.size,
            name: enemyType.name,
            armor: enemyType.armor * (1 + (GameState.currentWave - 1) * 0.05),
            ability: enemyType.ability,
            pathIndex: 0,
            path: pixelPath,
            reachedEnd: false,
            type: enemyType,
            lastHit: 0
        };
        
        GameState.enemies.push(enemy);
        GameState.enemiesSpawned++;
        DOM.enemiesLeft.textContent = Math.max(0, GameState.enemiesThisWave - GameState.enemiesKilledThisWave);
    }
    
    function generateWaveEnemies() {
        GameState.waveEnemyTypes = [];
        const wave = GameState.currentWave;
        GameState.enemiesThisWave = 8 + Math.floor(wave * 1.5);
        
        // Расчет весов спавна
        let totalWeight = 0;
        Object.values(CONFIG.ENEMY_TYPES).forEach(type => {
            if (wave < 3 && type.spawnWeight < 5) return;
            if (wave < 6 && type.spawnWeight < 2) return;
            totalWeight += type.spawnWeight;
        });
        
        for (let i = 0; i < GameState.enemiesThisWave; i++) {
            let random = Math.random() * totalWeight;
            let selectedType = CONFIG.ENEMY_TYPES.SCOUT;
            
            Object.values(CONFIG.ENEMY_TYPES).forEach(type => {
                if (wave < 3 && type.spawnWeight < 5) return;
                if (wave < 6 && type.spawnWeight < 2) return;
                
                if (random < type.spawnWeight) {
                    selectedType = type;
                }
                random -= type.spawnWeight;
            });
            
            GameState.waveEnemyTypes.push(selectedType);
        }
        
        // Гарантированный босс на 10 волне
        if (wave % 10 === 0) {
            GameState.waveEnemyTypes.push(CONFIG.ENEMY_TYPES.BOSS);
            GameState.enemiesThisWave++;
        }
    }
    
    function updateEnemies(deltaTime) {
        for (let i = GameState.enemies.length - 1; i >= 0; i--) {
            const enemy = GameState.enemies[i];
            
            // Проверка достижения базы
            if (enemy.reachedEnd) {
                enemyReachedBase(enemy, i);
                continue;
            }
            
            // Движение врага
            moveEnemy(enemy, deltaTime);
            
            // Удаление мертвых врагов
            if (enemy.health <= 0) {
                killEnemy(enemy, i);
            }
        }
    }
    
    function moveEnemy(enemy, deltaTime) {
        const targetPoint = enemy.path[enemy.pathIndex + 1];
        
        if (!targetPoint) {
            enemy.reachedEnd = true;
            return;
        }
        
        const dx = targetPoint.x - enemy.x;
        const dy = targetPoint.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 2) {
            // Достигнута точка пути
            enemy.pathIndex++;
            
            if (enemy.pathIndex >= enemy.path.length - 1) {
                enemy.reachedEnd = true;
            }
        } else {
            // Движение к точке
            const moveDistance = enemy.speed * (deltaTime / 16) * CONFIG.GAME.GAME_SPEED;
            enemy.x += (dx / distance) * moveDistance;
            enemy.y += (dy / distance) * moveDistance;
        }
    }
    
    function enemyReachedBase(enemy, index) {
        // Урон щитам базы
        const damage = enemy.maxHealth * 0.2;
        GameState.shields = Math.max(0, GameState.shields - damage);
        updateUI();
        
        // Эффект повреждения
        createExplosionEffect(enemy.x, enemy.y, enemy.size * 2, enemy.color);
        
        // Анимация
        DOM.messageArea.classList.add('shake');
        setTimeout(() => DOM.messageArea.classList.remove('shake'), 500);
        
        // Удаление врага
        GameState.enemies.splice(index, 1);
        
        // Сообщение
        showMessage(`💥 ${enemy.name} прорвался к базе! -${Math.floor(damage)} щитов.`, 'error');
        
        // Проверка поражения
        if (GameState.shields <= 0) {
            endGame(false);
        }
    }
    
    function killEnemy(enemy, index) {
        // Начисление кредитов
        const creditsEarned = enemy.credits + GameState.base.incomeBonus;
        GameState.credits += creditsEarned;
        GameState.enemiesKilledThisWave++;
        
        // Эффект смерти
        createExplosionEffect(enemy.x, enemy.y, enemy.size * 3, enemy.color);
        
        // Эффект монет
        createCreditEffect(enemy.x, enemy.y, creditsEarned);
        
        // Способность взрыва
        if (enemy.ability === 'explosive') {
            createAOEExplosion(enemy.x, enemy.y, 80);
        }
        
        // Удаление врага
        GameState.enemies.splice(index, 1);
        
        // Обновление интерфейса
        updateUI();
        DOM.enemiesKilled.textContent = GameState.enemiesKilledThisWave;
        
        // Сообщение для боссов
        if (enemy.ability === 'boss') {
            showMessage(`👑 Босс уничтожен! +${creditsEarned} кредитов`, 'success');
        }
    }
    
    function createAOEExplosion(x, y, radius) {
        // Урон по всем врагам в радиусе
        GameState.enemies.forEach(enemy => {
            const dx = enemy.x - x;
            const dy = enemy.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < radius) {
                enemy.health -= 50;
                enemy.lastHit = Date.now();
            }
        });
        
        // Эффект взрыва
        for (let i = 0; i < 20; i++) {
            GameState.particles.push({
                x, y,
                size: Math.random() * 4 + 2,
                speedX: (Math.random() - 0.5) * 4,
                speedY: (Math.random() - 0.5) * 4,
                color: '#ff9900',
                opacity: 1,
                life: 30
            });
        }
    }
    
    // ==================== СТАНЦИИ ====================
    function placeStationAt(x, y) {
        const cell = findCellAtPosition(x, y);
        
        if (!cell) {
            showMessage('❌ Кликните по ячейке!', 'error');
            return;
        }
        
        const stationConfig = getStationConfig(GameState.selectedStationType);
        
        // Проверка занятости
        if (cell.occupied) {
            showMessage('❌ Эта ячейка занята!', 'error');
            return;
        }
        
        // Проверка кредитов
        if (GameState.credits < stationConfig.cost) {
            showMessage(`❌ Недостаточно кредитов! Нужно ${stationConfig.cost}`, 'error');
            return;
        }
        
        // Создание станции
        const station = {
            x: cell.x + cell.width / 2,
            y: cell.y + cell.height / 2,
            type: GameState.selectedStationType,
            name: stationConfig.name,
            damage: stationConfig.damage,
            range: stationConfig.range,
            fireRate: stationConfig.fireRate,
            color: stationConfig.color,
            level: 1,
            lastShot: 0,
            target: null,
            rotation: 0,
            cell: cell,
            icon: stationConfig.icon,
            splashRadius: stationConfig.splashRadius,
            armorPenetration: stationConfig.armorPenetration || 0,
            chainTargets: stationConfig.chainTargets || 0,
            sellValue: Math.floor(stationConfig.cost * stationConfig.sellRatio)
        };
        
        // Добавление в игру
        GameState.stations.push(station);
        cell.occupied = true;
        cell.station = station;
        
        // Списание кредитов
        GameState.credits -= stationConfig.cost;
        
        // Эффект установки
        createPlacementEffect(station.x, station.y, station.color);
        
        // Сообщение
        showMessage(`✅ ${stationConfig.name} установлена!`, 'success');
        
        // Обновление интерфейса и сброс выбора
        updateUI();
        clearSelection();
    }
    
    function selectStationAtPosition(x, y) {
        const station = findStationAtPosition(x, y);
        
        if (station) {
            selectStationForUpgrade(station);
        } else {
            // Клик по пустому месту
            if (GameState.selectedStation) {
                clearStationSelection();
            }
        }
    }
    
    function findStationAtPosition(x, y) {
        for (const station of GameState.stations) {
            const dx = x - station.x;
            const dy = y - station.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 25) {
                return station;
            }
        }
        return null;
    }
    
    function findCellAtPosition(x, y) {
        return GameState.cells.find(cell =>
            x >= cell.x && x <= cell.x + cell.width &&
            y >= cell.y && y <= cell.y + cell.height
        );
    }
    
    function selectStationForUpgrade(station) {
        GameState.selectedStation = station;
        
        // Обновление панели информации
        updateStationInfo(station);
        DOM.towerInfoPanel.style.display = 'block';
    }
    
    function updateStationInfo(station) {
        // Обновление превью
        DOM.towerPreview.style.background = `linear-gradient(135deg, ${station.color}, ${darkenColor(station.color, 20)})`;
        DOM.towerPreview.innerHTML = `<i class="fas fa-${station.icon}"></i>`;
        
        // Обновление деталей
        DOM.towerName.textContent = station.name;
        DOM.towerLevel.textContent = station.level;
        DOM.towerDamage.textContent = Math.floor(station.damage * (1 + GameState.base.attackBonus / 100));
        DOM.towerRange.textContent = `${station.range}px`;
        DOM.towerSpeed.textContent = `${(station.fireRate / 1000).toFixed(1)}s`;
        
        // Спецэффекты
        let effect = 'Нет';
        if (station.splashRadius) effect = `Взрыв ${station.splashRadius}px`;
        else if (station.armorPenetration) effect = `Пробитие ${Math.floor(station.armorPenetration * 100)}%`;
        else if (station.chainTargets) effect = `Цепь ${station.chainTargets} целей`;
        DOM.towerEffect.textContent = effect;
        
        // Стоимости
        DOM.upgradeCost.textContent = calculateUpgradeCost(station);
        DOM.sellValue.textContent = station.sellValue;
        
        // Состояние кнопок
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
        
        // Списание кредитов
        GameState.credits -= upgradeCost;
        
        // Улучшение станции
        station.level++;
        station.damage = Math.floor(station.damage * 1.5);
        station.range = Math.floor(station.range * 1.1);
        station.fireRate = Math.max(400, station.fireRate * 0.9);
        station.sellValue = Math.floor(station.sellValue * 1.3);
        
        if (station.splashRadius) {
            station.splashRadius = Math.floor(station.splashRadius * 1.1);
        }
        
        // Эффект улучшения
        createUpgradeEffect(station.x, station.y);
        
        // Сообщение
        showMessage(`⬆️ ${station.name} улучшена до уровня ${station.level}!`, 'success');
        
        // Обновление интерфейса
        updateUI();
        updateStationInfo(station);
    }
    
    function sellSelectedStation() {
        if (!GameState.selectedStation || GameState.isWaveActive) return;
        
        const station = GameState.selectedStation;
        
        if (!confirm(`Продать ${station.name} за ${station.sellValue} кредитов?`)) {
            return;
        }
        
        // Добавление кредитов
        GameState.credits += station.sellValue;
        
        // Освобождение ячейки
        if (station.cell) {
            station.cell.occupied = false;
            station.cell.station = null;
        }
        
        // Удаление станции
        const index = GameState.stations.indexOf(station);
        if (index > -1) {
            GameState.stations.splice(index, 1);
        }
        
        // Эффект продажи
        createSellEffect(station.x, station.y, station.sellValue);
        
        // Сообщение
        showMessage(`💰 Станция продана за ${station.sellValue} кредитов!`, 'success');
        
        // Сброс выбора и обновление интерфейса
        clearStationSelection();
        updateUI();
    }
    
    function updateStations(deltaTime) {
        GameState.stations.forEach(station => {
            // Вращение станции к цели
            if (station.target && station.target.health > 0) {
                const dx = station.target.x - station.x;
                const dy = station.target.y - station.y;
                station.rotation = Math.atan2(dy, dx);
            }
            
            // Поиск цели
            if (!station.target || station.target.health <= 0) {
                station.target = findTargetForStation(station);
            }
            
            // Стрельба по цели
            if (station.target && station.target.health > 0) {
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
        
        // Создание снаряда
        const projectile = {
            x: station.x,
            y: station.y,
            target: station.target,
            damage: station.damage * (1 + GameState.base.attackBonus / 100),
            color: station.color,
            speed: 10,
            size: 6,
            splashRadius: station.splashRadius,
            armorPenetration: station.armorPenetration,
            chainTargets: station.chainTargets,
            fromStation: station
        };
        
        GameState.projectiles.push(projectile);
        
        // Эффект выстрела
        createMuzzleFlash(station.x, station.y, station.rotation, station.color);
    }
    
    function updateProjectiles(deltaTime) {
        for (let i = GameState.projectiles.length - 1; i >= 0; i--) {
            const projectile = GameState.projectiles[i];
            
            // Проверка существования цели
            if (!projectile.target || projectile.target.health <= 0) {
                GameState.projectiles.splice(i, 1);
                continue;
            }
            
            // Движение к цели
            const dx = projectile.target.x - projectile.x;
            const dy = projectile.target.y - projectile.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 10) {
                // Попадание
                applyDamage(projectile);
                createHitEffect(projectile);
                GameState.projectiles.splice(i, 1);
            } else {
                // Продолжение движения
                const speed = projectile.speed * (deltaTime / 16) * CONFIG.GAME.GAME_SPEED;
                projectile.x += (dx / distance) * speed;
                projectile.y += (dy / distance) * speed;
            }
        }
    }
    
    function applyDamage(projectile) {
        // Пробитие брони
        let effectiveDamage = projectile.damage;
        if (projectile.target.armor > 0 && projectile.armorPenetration) {
            effectiveDamage *= (1 + projectile.armorPenetration);
        }
        
        if (projectile.splashRadius) {
            // Урон по области
            applySplashDamage(projectile, effectiveDamage);
        } else {
            // Одиночный урон
            projectile.target.health -= effectiveDamage;
            projectile.target.lastHit = Date.now();
        }
    }
    
    function applySplashDamage(projectile, baseDamage) {
        let hitCount = 0;
        
        for (const enemy of GameState.enemies) {
            const dx = enemy.x - projectile.target.x;
            const dy = enemy.y - projectile.target.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < projectile.splashRadius) {
                // Уменьшение урона с расстоянием
                const damageMultiplier = 1 - (distance / projectile.splashRadius) * 0.5;
                enemy.health -= baseDamage * damageMultiplier;
                enemy.lastHit = Date.now();
                hitCount++;
            }
        }
        
        if (hitCount > 1) {
            showMessage(`💥 Попадание по ${hitCount} целям!`, 'info', 1000);
        }
    }
    
    // ==================== БАЗА ====================
    function upgradeBase() {
        if (GameState.isWaveActive) return;
        
        const base = GameState.base;
        const upgradeCost = base.upgradeCost;
        
        if (GameState.credits < upgradeCost) {
            showMessage('❌ Недостаточно кредитов для улучшения базы!', 'error');
            return;
        }
        
        if (base.level >= base.maxLevel) {
            showMessage('✅ База достигла максимального уровня!', 'info');
            return;
        }
        
        // Списание кредитов
        GameState.credits -= upgradeCost;
        
        // Улучшение базы
        base.level++;
        base.maxShields += 500;
        base.shields = base.maxShields;
        base.attackBonus += 5;
        base.incomeBonus += 10;
        base.upgradeCost = Math.floor(base.upgradeCost * 1.5);
        
        // Разблокировка дрона на каждом 3 уровне
        if (base.level % 3 === 0 && base.drones < base.maxDrones) {
            base.drones++;
            spawnDrone();
        }
        
        // Эффект улучшения
        createBaseUpgradeEffect();
        
        // Сообщение
        showMessage(`🏢 Командный центр улучшен до уровня ${base.level}!`, 'success');
        
        // Обновление интерфейса
        updateBaseInfo();
        updateUI();
    }
    
    function updateBaseInfo() {
        const base = GameState.base;
        DOM.baseLevel.textContent = base.level;
        DOM.baseAttack.textContent = `+${base.attackBonus}%`;
        DOM.baseIncome.textContent = `+${CONFIG.GAME.BASE_INCOME + base.incomeBonus}`;
        DOM.baseDrones.textContent = `${base.drones}/${base.maxDrones}`;
        DOM.baseUpgradeCost.textContent = base.upgradeCost;
    }
    
    function spawnDrone() {
        const drone = {
            x: DOM.canvas.width - 100,
            y: DOM.canvas.height - 100,
            target: null,
            damage: GameState.base.droneDamage,
            speed: 2.0,
            size: 8,
            color: '#00bfff',
            lastAttack: 0,
            attackRate: 1000
        };
        
        GameState.drones.push(drone);
        showMessage(`🚀 Запущен дрон-защитник!`, 'info');
    }
    
    function updateDrones(deltaTime) {
        GameState.drones.forEach(drone => {
            // Поиск цели
            if (!drone.target || drone.target.health <= 0) {
                drone.target = findTargetForDrone(drone);
            }
            
            // Движение к цели
            if (drone.target) {
                const dx = drone.target.x - drone.x;
                const dy = drone.target.y - drone.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > 50) {
                    const moveDistance = drone.speed * (deltaTime / 16) * CONFIG.GAME.GAME_SPEED;
                    drone.x += (dx / distance) * moveDistance;
                    drone.y += (dy / distance) * moveDistance;
                }
                
                // Атака
                const currentTime = Date.now();
                if (currentTime - drone.lastAttack > drone.attackRate && distance < 60) {
                    drone.target.health -= drone.damage;
                    drone.target.lastHit = currentTime;
                    drone.lastAttack = currentTime;
                    createDroneAttackEffect(drone.x, drone.y, drone.target.x, drone.target.y);
                }
            }
        });
    }
    
    function findTargetForDrone(drone) {
        let closestEnemy = null;
        let closestDistance = 300;
        
        for (const enemy of GameState.enemies) {
            const dx = enemy.x - drone.x;
            const dy = enemy.y - drone.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < closestDistance) {
                closestEnemy = enemy;
                closestDistance = distance;
            }
        }
        
        return closestEnemy;
    }
    
    // ==================== ОТРИСОВКА ====================
    function render() {
        // Очистка канваса
        DOM.ctx.clearRect(0, 0, DOM.canvas.width, DOM.canvas.height);
        
        // Фон
        drawBackground();
        
        // Космический путь
        drawSpacePath();
        
        // Подсветка ячеек при наведении
        drawHoveredCells();
        
        // Станции
        GameState.stations.forEach(drawStation);
        
        // Враги
        GameState.enemies.forEach(drawEnemy);
        
        // Снаряды
        GameState.projectiles.forEach(drawProjectile);
        
        // Дроны
        GameState.drones.forEach(drawDrone);
        
        // Частицы
        GameState.particles.forEach(drawParticle);
        
        // Радиус выбранной станции
        if (GameState.selectedStation && !GameState.isWaveActive) {
            drawStationRange(GameState.selectedStation);
        }
        
        // Командный центр
        drawCommandCenter();
        
        // Оверлеи состояния
        if (GameState.isPaused) drawPauseOverlay();
        if (GameState.gameOver) drawGameOverOverlay();
        if (GameState.gameWon) drawVictoryOverlay();
    }
    
    function drawBackground() {
        // Звездное небо
        const gradient = DOM.ctx.createRadialGradient(
            DOM.canvas.width / 2, DOM.canvas.height / 2, 0,
            DOM.canvas.width / 2, DOM.canvas.height / 2, Math.max(DOM.canvas.width, DOM.canvas.height)
        );
        gradient.addColorStop(0, 'rgba(10, 10, 42, 0.9)');
        gradient.addColorStop(1, 'rgba(0, 0, 16, 1)');
        
        DOM.ctx.fillStyle = gradient;
        DOM.ctx.fillRect(0, 0, DOM.canvas.width, DOM.canvas.height);
    }
    
    function drawSpacePath() {
        const path = getPixelPath();
        if (path.length < 2) return;
        
        // Энергетическая дорожка
        DOM.ctx.strokeStyle = 'rgba(0, 191, 255, 0.4)';
        DOM.ctx.lineWidth = 35;
        DOM.ctx.lineCap = 'round';
        DOM.ctx.lineJoin = 'round';
        DOM.ctx.shadowBlur = 15;
        DOM.ctx.shadowColor = '#00bfff';
        
        DOM.ctx.beginPath();
        DOM.ctx.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length; i++) {
            DOM.ctx.lineTo(path[i].x, path[i].y);
        }
        DOM.ctx.stroke();
        
        DOM.ctx.shadowBlur = 0;
        
        // Контур дорожки
        DOM.ctx.strokeStyle = 'rgba(0, 255, 157, 0.6)';
        DOM.ctx.lineWidth = 3;
        DOM.ctx.setLineDash([15, 5]);
        DOM.ctx.stroke();
        DOM.ctx.setLineDash([]);
        
        // Контрольные точки
        path.forEach((point, i) => {
            let color, label;
            if (i === 0) {
                color = '#ff2e63';
                label = 'ВХОД';
            } else if (i === path.length - 1) {
                color = '#00bfff';
                label = 'БАЗА';
            } else {
                color = '#ffd700';
            }
            
            DOM.ctx.fillStyle = color;
            DOM.ctx.beginPath();
            DOM.ctx.arc(point.x, point.y, 8, 0, Math.PI * 2);
            DOM.ctx.fill();
            
            DOM.ctx.strokeStyle = '#ffffff';
            DOM.ctx.lineWidth = 2;
            DOM.ctx.stroke();
            
            if (label) {
                DOM.ctx.fillStyle = '#ffffff';
                DOM.ctx.font = 'bold 10px Arial';
                DOM.ctx.textAlign = 'center';
                DOM.ctx.textBaseline = 'middle';
                DOM.ctx.fillText(label, point.x, point.y);
            }
        });
    }
    
    function drawHoveredCells() {
        if (!GameState.selectedStationType || GameState.isWaveActive) return;
        
        const stationConfig = getStationConfig(GameState.selectedStationType);
        
        GameState.cells.forEach(cell => {
            if (cell.hovered) {
                if (cell.occupied) {
                    // Занятая ячейка
                    DOM.ctx.fillStyle = 'rgba(255, 46, 99, 0.3)';
                    DOM.ctx.fillRect(cell.x, cell.y, cell.width, cell.height);
                    
                    // Красный крест
                    DOM.ctx.strokeStyle = '#ff2e63';
                    DOM.ctx.lineWidth = 2;
                    DOM.ctx.beginPath();
                    DOM.ctx.moveTo(cell.x + 5, cell.y + 5);
                    DOM.ctx.lineTo(cell.x + cell.width - 5, cell.y + cell.height - 5);
                    DOM.ctx.moveTo(cell.x + cell.width - 5, cell.y + 5);
                    DOM.ctx.lineTo(cell.x + 5, cell.y + cell.height - 5);
                    DOM.ctx.stroke();
                } else {
                    // Свободная ячейка
                    const canAfford = GameState.credits >= stationConfig.cost;
                    DOM.ctx.fillStyle = canAfford 
                        ? 'rgba(0, 191, 255, 0.3)' 
                        : 'rgba(255, 46, 99, 0.5)';
                    DOM.ctx.fillRect(cell.x, cell.y, cell.width, cell.height);
                    
                    // Предпросмотр станции
                    const centerX = cell.x + cell.width / 2;
                    const centerY = cell.y + cell.height / 2;
                    
                    DOM.ctx.globalAlpha = 0.6;
                    DOM.ctx.fillStyle = stationConfig.color;
                    DOM.ctx.beginPath();
                    DOM.ctx.arc(centerX, centerY, 12, 0, Math.PI * 2);
                    DOM.ctx.fill();
                    
                    if (!canAfford) {
                        // Знак кредита если не хватает денег
                        DOM.ctx.fillStyle = '#ffffff';
                        DOM.ctx.font = 'bold 12px Arial';
                        DOM.ctx.textAlign = 'center';
                        DOM.ctx.textBaseline = 'middle';
                        DOM.ctx.fillText('$', centerX, centerY);
                    }
                    
                    DOM.ctx.globalAlpha = 1;
                }
            }
        });
    }
    
    function drawStation(station) {
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
        
        // Эффект выбора
        if (station === GameState.selectedStation) {
            DOM.ctx.strokeStyle = '#ffd700';
            DOM.ctx.lineWidth = 2;
            DOM.ctx.beginPath();
            DOM.ctx.arc(station.x, station.y, 18, 0, Math.PI * 2);
            DOM.ctx.stroke();
        }
    }
    
    function drawStationRange(station) {
        // Круг дальности
        DOM.ctx.strokeStyle = 'rgba(0, 191, 255, 0.4)';
        DOM.ctx.lineWidth = 2;
        DOM.ctx.setLineDash([5, 5]);
        DOM.ctx.beginPath();
        DOM.ctx.arc(station.x, station.y, station.range, 0, Math.PI * 2);
        DOM.ctx.stroke();
        DOM.ctx.setLineDash([]);
        
        // Заполнение
        DOM.ctx.fillStyle = 'rgba(0, 191, 255, 0.1)';
        DOM.ctx.fill();
    }
    
    function drawEnemy(enemy) {
        // Мерцание при получении урона
        if (Date.now() - enemy.lastHit < 200) {
            DOM.ctx.globalAlpha = 0.7;
        }
        
        // Корпус врага (космический корабль)
        DOM.ctx.fillStyle = enemy.color;
        DOM.ctx.beginPath();
        
        // Форма корабля
        DOM.ctx.moveTo(enemy.x, enemy.y - enemy.size);
        DOM.ctx.lineTo(enemy.x + enemy.size * 0.8, enemy.y + enemy.size * 0.5);
        DOM.ctx.lineTo(enemy.x, enemy.y + enemy.size * 0.3);
        DOM.ctx.lineTo(enemy.x - enemy.size * 0.8, enemy.y + enemy.size * 0.5);
        DOM.ctx.closePath();
        DOM.ctx.fill();
        
        // Кабина
        DOM.ctx.fillStyle = '#ffffff';
        DOM.ctx.beginPath();
        DOM.ctx.arc(enemy.x, enemy.y - enemy.size * 0.3, enemy.size * 0.3, 0, Math.PI * 2);
        DOM.ctx.fill();
        
        // Двигатели
        DOM.ctx.fillStyle = '#ff9900';
        DOM.ctx.fillRect(enemy.x - enemy.size * 0.3, enemy.y + enemy.size * 0.3, enemy.size * 0.6, 3);
        
        // Бордюр
        DOM.ctx.strokeStyle = '#2c3e50';
        DOM.ctx.lineWidth = 1;
        DOM.ctx.stroke();
        
        // Полоска здоровья
        const healthWidth = 40;
        const healthPercent = enemy.health / enemy.maxHealth;
        
        DOM.ctx.fillStyle = '#2c3e50';
        DOM.ctx.fillRect(
            enemy.x - healthWidth / 2,
            enemy.y - enemy.size - 12,
            healthWidth,
            6
        );
        
        DOM.ctx.fillStyle = healthPercent > 0.5 ? '#00ff9d' : 
                           healthPercent > 0.25 ? '#ffd700' : '#ff2e63';
        DOM.ctx.fillRect(
            enemy.x - healthWidth / 2,
            enemy.y - enemy.size - 12,
            healthWidth * healthPercent,
            6
        );
        
        DOM.ctx.globalAlpha = 1;
    }
    
    function drawProjectile(projectile) {
        // Ядро снаряда
        DOM.ctx.fillStyle = projectile.color;
        DOM.ctx.beginPath();
        DOM.ctx.arc(projectile.x, projectile.y, projectile.size, 0, Math.PI * 2);
        DOM.ctx.fill();
        
        // Свечение
        const gradient = DOM.ctx.createRadialGradient(
            projectile.x, projectile.y, 0,
            projectile.x, projectile.y, projectile.size * 2
        );
        gradient.addColorStop(0, projectile.color + 'CC');
        gradient.addColorStop(1, projectile.color + '00');
        
        DOM.ctx.fillStyle = gradient;
        DOM.ctx.beginPath();
        DOM.ctx.arc(projectile.x, projectile.y, projectile.size * 2, 0, Math.PI * 2);
        DOM.ctx.fill();
    }
    
    function drawDrone(drone) {
        // Корпус дрона
        DOM.ctx.fillStyle = drone.color;
        DOM.ctx.beginPath();
        DOM.ctx.arc(drone.x, drone.y, drone.size, 0, Math.PI * 2);
        DOM.ctx.fill();
        
        // Бордюр
        DOM.ctx.strokeStyle = '#ffffff';
        DOM.ctx.lineWidth = 1;
        DOM.ctx.stroke();
        
        // Антенна
        DOM.ctx.fillStyle = '#ffffff';
        DOM.ctx.fillRect(drone.x - 1, drone.y - drone.size - 3, 2, 5);
        
        // Вращение
        DOM.ctx.save();
        DOM.ctx.translate(drone.x, drone.y);
        DOM.ctx.rotate(Date.now() * 0.001);
        
        DOM.ctx.strokeStyle = drone.color;
        DOM.ctx.lineWidth = 1;
        DOM.ctx.beginPath();
        DOM.ctx.arc(0, 0, drone.size + 2, 0, Math.PI * 1.5);
        DOM.ctx.stroke();
        
        DOM.ctx.restore();
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
    
    function drawParticle(particle) {
        DOM.ctx.globalAlpha = particle.opacity;
        
        if (particle.isCredit) {
            // Монета
            DOM.ctx.fillStyle = '#ffd700';
            DOM.ctx.beginPath();
            DOM.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            DOM.ctx.fill();
            
            // Блеск
            DOM.ctx.fillStyle = '#ffffff';
            DOM.ctx.fillRect(particle.x - 1, particle.y - 1, 2, 2);
            
            // Значение
            if (particle.value) {
                DOM.ctx.fillStyle = '#ffd700';
                DOM.ctx.font = 'bold 10px Arial';
                DOM.ctx.textAlign = 'center';
                DOM.ctx.fillText(`+${particle.value}`, particle.x, particle.y - 12);
            }
        } else {
            // Обычная частица
            DOM.ctx.fillStyle = particle.color;
            DOM.ctx.beginPath();
            DOM.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            DOM.ctx.fill();
        }
        
        DOM.ctx.globalAlpha = 1;
    }
    
    function drawPauseOverlay() {
        DOM.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        DOM.ctx.fillRect(0, 0, DOM.canvas.width, DOM.canvas.height);
        
        DOM.ctx.fillStyle = '#ffffff';
        DOM.ctx.font = 'bold 36px Orbitron';
        DOM.ctx.textAlign = 'center';
        DOM.ctx.textBaseline = 'middle';
        DOM.ctx.fillText('ПАУЗА', DOM.canvas.width / 2, DOM.canvas.height / 2 - 20);
        
        DOM.ctx.font = '18px Roboto';
        DOM.ctx.fillText('Нажмите P для продолжения', DOM.canvas.width / 2, DOM.canvas.height / 2 + 20);
    }
    
    function drawGameOverOverlay() {
        DOM.ctx.fillStyle = 'rgba(255, 46, 99, 0.8)';
        DOM.ctx.fillRect(0, 0, DOM.canvas.width, DOM.canvas.height);
        
        DOM.ctx.fillStyle = '#ffffff';
        DOM.ctx.font = 'bold 36px Orbitron';
        DOM.ctx.textAlign = 'center';
        DOM.ctx.textBaseline = 'middle';
        DOM.ctx.fillText('ПОРАЖЕНИЕ', DOM.canvas.width / 2, DOM.canvas.height / 2 - 40);
        
        DOM.ctx.font = '20px Roboto';
        DOM.ctx.fillText(`Достигнут сет: ${GameState.currentSet}`, DOM.canvas.width / 2, DOM.canvas.height / 2);
        DOM.ctx.fillText(`Волна: ${GameState.currentWave - 1}`, DOM.canvas.width / 2, DOM.canvas.height / 2 + 30);
        
        DOM.ctx.font = '16px Roboto';
        DOM.ctx.fillText('Нажмите R для перезапуска', DOM.canvas.width / 2, DOM.canvas.height / 2 + 80);
    }
    
    function drawVictoryOverlay() {
        DOM.ctx.fillStyle = 'rgba(0, 255, 157, 0.8)';
        DOM.ctx.fillRect(0, 0, DOM.canvas.width, DOM.canvas.height);
        
        DOM.ctx.fillStyle = '#ffffff';
        DOM.ctx.font = 'bold 36px Orbitron';
        DOM.ctx.textAlign = 'center';
        DOM.ctx.textBaseline = 'middle';
        DOM.ctx.fillText('ПОБЕДА!', DOM.canvas.width / 2, DOM.canvas.height / 2 - 40);
        
        DOM.ctx.font = '20px Roboto';
        DOM.ctx.fillText('Все сеты пройдены!', DOM.canvas.width / 2, DOM.canvas.height / 2);
        DOM.ctx.fillText(`Финальный счет: ${GameState.credits} кредитов`, DOM.canvas.width / 2, DOM.canvas.height / 2 + 30);
        
        DOM.ctx.font = '16px Roboto';
        DOM.ctx.fillText('Нажмите R для перезапуска', DOM.canvas.width / 2, DOM.canvas.height / 2 + 80);
    }
    
    // ==================== ЭФФЕКТЫ ====================
    function createPlacementEffect(x, y, color) {
        for (let i = 0; i < 8; i++) {
            GameState.particles.push({
                x, y,
                size: Math.random() * 3 + 1,
                speedX: (Math.random() - 0.5) * 2,
                speedY: (Math.random() - 0.5) * 2,
                color: color,
                opacity: 1,
                life: 20
            });
        }
    }
    
    function createUpgradeEffect(x, y) {
        for (let i = 0; i < 12; i++) {
            GameState.particles.push({
                x, y,
                size: Math.random() * 4 + 2,
                speedX: (Math.random() - 0.5) * 3,
                speedY: (Math.random() - 0.5) * 3,
                color: '#ffd700',
                opacity: 1,
                life: 30
            });
        }
    }
    
    function createBaseUpgradeEffect() {
        const centerX = DOM.canvas.width - 80;
        const centerY = DOM.canvas.height - 80;
        
        for (let i = 0; i < 15; i++) {
            GameState.particles.push({
                x: centerX,
                y: centerY,
                size: Math.random() * 5 + 3,
                speedX: (Math.random() - 0.5) * 4,
                speedY: (Math.random() - 0.5) * 4,
                color: '#00bfff',
                opacity: 1,
                life: 40
            });
        }
    }
    
    function createSellEffect(x, y, amount) {
        for (let i = 0; i < 10; i++) {
            GameState.particles.push({
                x, y,
                size: Math.random() * 3 + 2,
                speedX: (Math.random() - 0.5) * 2,
                speedY: Math.random() * -3 - 1,
                color: '#ffd700',
                opacity: 1,
                life: 40,
                isCredit: true,
                value: i === 0 ? amount : null
            });
        }
    }
    
    function createExplosionEffect(x, y, radius, color) {
        for (let i = 0; i < 12; i++) {
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
        
        // Волна взрыва
        DOM.ctx.strokeStyle = color + '80';
        DOM.ctx.lineWidth = 3;
        DOM.ctx.beginPath();
        DOM.ctx.arc(x, y, radius, 0, Math.PI * 2);
        DOM.ctx.stroke();
    }
    
    function createCreditEffect(x, y, amount) {
        const coinCount = Math.min(6, Math.floor(amount / 50));
        
        for (let i = 0; i < coinCount; i++) {
            GameState.particles.push({
                x, y,
                size: Math.random() * 3 + 2,
                speedX: (Math.random() - 0.5) * 2,
                speedY: Math.random() * -3 - 1,
                color: '#ffd700',
                opacity: 1,
                life: 40,
                isCredit: true
            });
        }
    }
    
    function createMuzzleFlash(x, y, rotation, color) {
        DOM.ctx.save();
        DOM.ctx.translate(x, y);
        DOM.ctx.rotate(rotation);
        
        const gradient = DOM.ctx.createLinearGradient(0, 0, 20, 0);
        gradient.addColorStop(0, color + 'FF');
        gradient.addColorStop(1, color + '00');
        
        DOM.ctx.fillStyle = gradient;
        DOM.ctx.fillRect(0, -3, 20, 6);
        
        DOM.ctx.restore();
    }
    
    function createHitEffect(projectile) {
        if (projectile.splashRadius) {
            createExplosionEffect(projectile.target.x, projectile.target.y, projectile.splashRadius, projectile.color);
        } else {
            for (let i = 0; i < 6; i++) {
                GameState.particles.push({
                    x: projectile.target.x,
                    y: projectile.target.y,
                    size: Math.random() * 3 + 1,
                    speedX: (Math.random() - 0.5) * 3,
                    speedY: (Math.random() - 0.5) * 3,
                    color: projectile.color,
                    opacity: 1,
                    life: 20
                });
            }
        }
    }
    
    function createDroneAttackEffect(fromX, fromY, toX, toY) {
        // Лазерный луч
        DOM.ctx.strokeStyle = '#00bfff';
        DOM.ctx.lineWidth = 2;
        DOM.ctx.beginPath();
        DOM.ctx.moveTo(fromX, fromY);
        DOM.ctx.lineTo(toX, toY);
        DOM.ctx.stroke();
        
        // Искры
        for (let i = 0; i < 3; i++) {
            GameState.particles.push({
                x: toX,
                y: toY,
                size: Math.random() * 2 + 1,
                speedX: (Math.random() - 0.5) * 2,
                speedY: (Math.random() - 0.5) * 2,
                color: '#00bfff',
                opacity: 1,
                life: 15
            });
        }
    }
    
    function updateParticles(deltaTime) {
        for (let i = GameState.particles.length - 1; i >= 0; i--) {
            const particle = GameState.particles[i];
            
            // Обновление позиции
            particle.x += particle.speedX * (deltaTime / 16);
            particle.y += particle.speedY * (deltaTime / 16);
            
            // Гравитация для монет
            if (particle.isCredit) {
                particle.speedY += 0.08;
            }
            
            // Мерцание звезд
            if (particle.twinkle) {
                particle.opacity = 0.2 + Math.abs(Math.sin(Date.now() * particle.twinkleSpeed)) * 0.3;
            }
            
            // Уменьшение жизни
            if (particle.life) {
                particle.life--;
                particle.opacity = particle.life / particle.life;
                
                if (particle.life <= 0) {
                    GameState.particles.splice(i, 1);
                }
            } else {
                // Обертка фоновых частиц
                if (particle.x < -10) particle.x = DOM.canvas.width + 10;
                if (particle.x > DOM.canvas.width + 10) particle.x = -10;
                if (particle.y < -10) particle.y = DOM.canvas.height + 10;
                if (particle.y > DOM.canvas.height + 10) particle.y = -10;
            }
        }
    }
    
    // ==================== УПРАВЛЕНИЕ ИГРОЙ ====================
    function startWave() {
        if (GameState.isWaveActive || GameState.gameOver || GameState.gameWon) return;
        
        GameState.enemiesSpawned = 0;
        GameState.enemiesKilledThisWave = 0;
        GameState.isWaveActive = true;
        
        // Обновление интерфейса
        DOM.startWaveBtn.disabled = true;
        DOM.startWaveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> БОЙ';
        DOM.enemiesLeft.textContent = GameState.enemiesThisWave;
        DOM.enemiesKilled.textContent = '0';
        
        // Сообщение
        showMessage(`⚡ Волна ${GameState.currentWave} началась! Уничтожьте ${GameState.enemiesThisWave} врагов.`, 'warning');
    }
    
    function completeWave() {
        GameState.isWaveActive = false;
        
        // Награда за волну
        const waveReward = CONFIG.GAME.BASE_INCOME + GameState.base.incomeBonus + GameState.currentWave * 10;
        GameState.credits += waveReward;
        
        // Обновление рекорда
        if (GameState.currentSet > GameState.highScore) {
            GameState.highScore = GameState.currentSet;
            localStorage.setItem('cosmic_highscore', GameState.highScore);
            DOM.highscore.textContent = GameState.highScore;
        }
        
        // Следующая волна
        GameState.currentWave++;
        
        // Смена сета каждые 10 волн
        if (GameState.currentWave > CONFIG.GAME.WAVES_PER_SET) {
            GameState.currentSet++;
            GameState.currentWave = 1;
            if (GameState.currentSet > CONFIG.GAME.MAX_SETS) {
                endGame(true);
                return;
            }
            changePathSet();
        }
        
        // Обновление интерфейса
        DOM.startWaveBtn.disabled = false;
        DOM.startWaveBtn.innerHTML = '<i class="fas fa-play"></i> СТАРТ ВОЛНЫ';
        DOM.waveProgress.style.width = '0%';
        DOM.set.textContent = `${GameState.currentSet}/${CONFIG.GAME.MAX_SETS}`;
        
        // Обновление предпросмотра
        generateWavePreview();
        
        // Сообщение
        showMessage(`✅ Волна завершена! +${waveReward} кредитов. Готовьтесь к следующей волне.`, 'success');
    }
    
    function changePathSet() {
        const sets = ['SET_1', 'SET_2', 'SET_3'];
        const setIndex = (GameState.currentSet - 1) % sets.length;
        GameState.currentPath = CONFIG.PATHS[sets[setIndex]];
        
        // Перегенерация поля
        GameState.cells = [];
        initGameField();
        
        // Очистка станций на пути
        GameState.stations = GameState.stations.filter(station => {
            if (station.cell.isPath) {
                station.cell.occupied = false;
                station.cell.station = null;
                return false;
            }
            return true;
        });
        
        showMessage(`🔄 Новый космический сектор! Путь изменен.`, 'info');
    }
    
    function togglePause() {
        if (GameState.gameOver || GameState.gameWon) return;
        
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
        
        if (isVictory) {
            GameState.gameWon = true;
            showMessage('🎉 ПОБЕДА! Вы защитили все космические сектора!', 'victory');
        } else {
            GameState.gameOver = true;
            showMessage('💀 КОМАНДНЫЙ ЦЕНТР УНИЧТОЖЕН!', 'error');
        }
        
        DOM.startWaveBtn.disabled = true;
        DOM.startWaveBtn.innerHTML = '<i class="fas fa-flag-checkered"></i> ИГРА ЗАВЕРШЕНА';
    }
    
    function resetGame() {
        console.log('🔄 Сброс игры...');
        
        // Сброс состояния игры
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
        GameState.currentPath = CONFIG.PATHS.SET_1;
        GameState.base = JSON.parse(JSON.stringify(CONFIG.BASE));
        
        // Очистка игровых объектов
        GameState.stations = [];
        GameState.enemies = [];
        GameState.projectiles = [];
        GameState.particles = GameState.particles.filter(p => !p.life);
        GameState.drones = [];
        
        // Очистка ячеек
        GameState.cells = [];
        initGameField();
        
        // Сброс выбора
        clearSelection();
        
        // Обновление интерфейса
        updateUI();
        updateBaseInfo();
        generateWavePreview();
        
        // Сброс кнопок
        DOM.startWaveBtn.disabled = false;
        DOM.startWaveBtn.innerHTML = '<i class="fas fa-play"></i> СТАРТ ВОЛНЫ';
        DOM.waveProgress.style.width = '0%';
        DOM.enemiesLeft.textContent = '10';
        DOM.enemiesKilled.textContent = '0';
        DOM.set.textContent = '1/5';
        
        // Сообщение
        showMessage('🔄 Игра сброшена! Приготовьтесь к новой битве!', 'info');
    }
    
    // ==================== УТИЛИТЫ ====================
    function getStationConfig(type) {
        switch(type) {
            case 'laser': return CONFIG.STATIONS.LASER;
            case 'plasma': return CONFIG.STATIONS.PLASMA;
            case 'railgun': return CONFIG.STATIONS.RAILGUN;
            case 'tesla': return CONFIG.STATIONS.TESLA;
            default: return CONFIG.STATIONS.LASER;
        }
    }
    
    function getPixelPath() {
        return GameState.currentPath.map(point => ({
            x: point.x * DOM.canvas.width,
            y: point.y * DOM.canvas.height
        }));
    }
    
    function pointToSegmentDistance(px, py, x1, y1, x2, y2) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        
        if (lenSq !== 0) param = dot / lenSq;

        let xx, yy;

        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        const dx = px - xx;
        const dy = py - yy;
        
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    function darkenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        
        return '#' + (
            0x1000000 +
            (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)
        ).toString(16).slice(1);
    }
    
    function calculateUpgradeCost(station) {
        return 150 + (station.level - 1) * 100;
    }
    
    function generateWavePreview() {
        DOM.wavePreview.innerHTML = '';
        const enemyCounts = {};
        
        // Временная генерация для предпросмотра
        const previewTypes = [
            CONFIG.ENEMY_TYPES.SCOUT,
            CONFIG.ENEMY_TYPES.FIGHTER,
            CONFIG.ENEMY_TYPES.BOMBER,
            CONFIG.ENEMY_TYPES.TANK
        ];
        
        for (let i = 0; i < 4; i++) {
            const type = previewTypes[i];
            const count = 2 + Math.floor(Math.random() * 3);
            enemyCounts[type.name] = count;
        }
        
        // Отображение
        Object.entries(enemyCounts).forEach(([name, count]) => {
            const enemy = Object.values(CONFIG.ENEMY_TYPES).find(e => e.name === name);
            const div = document.createElement('div');
            div.className = 'enemy-item';
            div.innerHTML = `
                <div class="enemy-dot" style="background: ${enemy.color}"></div>
                <span class="enemy-name">${name}</span>
                <span class="enemy-count">×${count}</span>
            `;
            DOM.wavePreview.appendChild(div);
        });
    }
    
    function updateWaveProgress() {
        const progress = (GameState.enemiesSpawned / GameState.enemiesThisWave) * 100;
        DOM.waveProgress.style.width = `${progress}%`;
    }
    
    function showMessage(text, type = 'info', duration = 3000) {
        const icons = {
            'info': 'info-circle',
            'success': 'check-circle',
            'warning': 'exclamation-triangle',
            'error': 'times-circle',
            'victory': 'trophy'
        };
        
        const colors = {
            'info': '#00bfff',
            'success': '#00ff9d',
            'warning': '#ffd700',
            'error': '#ff2e63',
            'victory': '#ffd700'
        };
        
        DOM.messageText.textContent = text;
        DOM.messageArea.querySelector('i').className = `fas fa-${icons[type]}`;
        DOM.messageArea.style.borderLeftColor = colors[type];
        
        // Автоочистка
        if (!['victory', 'error'].includes(type)) {
            setTimeout(() => {
                if (DOM.messageText.textContent === text) {
                    DOM.messageText.textContent = `Готовьтесь к волне ${GameState.currentWave}...`;
                    DOM.messageArea.querySelector('i').className = 'fas fa-info-circle';
                    DOM.messageArea.style.borderLeftColor = '#00bfff';
                }
            }, duration);
        }
    }
    
    function updateSelectionMode(text) {
        DOM.selectionText.textContent = text;
    }
    
    function clearSelection() {
        DOM.towerCards.forEach(card => card.classList.remove('selected'));
        GameState.selectedStationType = null;
        clearStationSelection();
        DOM.canvas.style.cursor = 'default';
        updateSelectionMode('Выберите станцию');
    }
    
    function clearStationSelection() {
        GameState.selectedStation = null;
        DOM.towerInfoPanel.style.display = 'none';
    }
    
    function closeTowerInfo() {
        clearStationSelection();
    }
    
    function selectTowerByHotkey(type) {
        if (GameState.isWaveActive) return;
        
        const card = document.querySelector(`.tower-card[data-type="${type}"]`);
        if (card) {
            selectTowerFromShop(card);
        }
    }
    
    function updateUI() {
        DOM.lives.textContent = GameState.shields;
        DOM.gold.textContent = GameState.credits;
        
        // Цвет щитов
        const shieldPercent = GameState.shields / GameState.base.maxShields;
        DOM.lives.style.color = shieldPercent > 0.5 ? '#00ff9d' : 
                               shieldPercent > 0.25 ? '#ffd700' : '#ff2e63';
        
        // Анимация изменения кредитов
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
                        <p>Кликните на станцию в магазине или используйте горячие клавиши 1-4</p>
                    </div>
                    <div class="modal-item">
                        <h4>2. Установите станцию</h4>
                        <p>Кликните на свободное место на карте. Красные клетки - заняты</p>
                    </div>
                    <div class="modal-item">
                        <h4>3. Начните волну</h4>
                        <p>Нажмите "СТАРТ ВОЛНЫ" или ПРОБЕЛ для начала атаки</p>
                    </div>
                    <div class="modal-item">
                        <h4>4. Улучшайте</h4>
                        <p>Кликните на станцию для улучшения или продажи</p>
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
                        <span class="hotkey">1-4</span>
                        <span class="hotkey-text">Выбор станции</span>
                    </div>
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
                        <span class="hotkey">I</span>
                        <span class="hotkey-text">Открыть справку</span>
                    </div>
                    <div class="hotkey-item">
                        <span class="hotkey">R</span>
                        <span class="hotkey-text">Перезапуск игры</span>
                    </div>
                </div>
            </div>
            
            <div class="modal-section">
                <h3><i class="fas fa-star"></i> СИСТЕМА ИГРЫ</h3>
                <ul style="padding-left: 20px; margin-bottom: 15px;">
                    <li>Игра состоит из <strong>5 сетов</strong> по <strong>10 волн</strong></li>
                    <li>Каждый сет меняет расположение космического пути</li>
                    <li>Улучшайте командный центр для получения бонусов</li>
                    <li><strong>10 типов врагов</strong> с уникальными способностями</li>
                    <li>Дроны-защитники помогают в бою</li>
                    <li>Бесконечная сложность - враги становятся сильнее</li>
                </ul>
                <p style="color: #ffd700; font-weight: bold;">🎯 Цель: Пройти все 5 сетов и защитить командный центр!</p>
            </div>
        `;
    }
    
    // ==================== ЗАПУСК ИГРЫ ====================
    init();
});