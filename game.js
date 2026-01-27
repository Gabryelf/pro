// Cosmic Defender - Полностью переписанная версия со всеми улучшениями
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Cosmic Defender загружается...');
    
    // ==================== КОНСТАНТЫ ====================
    const CONFIG = {
        GAME: {
            START_SHIELDS: 1500,
            START_CREDITS: 1000,
            START_CRYSTALS: parseInt(localStorage.getItem('cosmic_crystals')) || 0,
            MAX_SETS: 5,
            WAVES_PER_SET: 10,
            BASE_INCOME: 50,
            DRONES_PER_LEVEL: 2,
            ENEMY_SPAWN_INTERVAL: 2000,
            GAME_SPEED: 1.0,
            MIN_BUILD_SPOT_DISTANCE: 100,
            MAX_BUILD_SPOT_DISTANCE: 300,
            MIN_SPOT_DISTANCE: 60 // Минимальное расстояние между местами для пушек
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
            },
            QUANTUM: {
                name: 'Квантовый луч',
                cost: 800,
                damage: 60,
                range: 200,
                fireRate: 1500,
                color: '#9d4edd',
                icon: 'atom',
                sellRatio: 0.6,
                isPremium: true,
                crystalCost: 50
            }
        },
        
        ENEMY_TYPES: {
            SCOUT: {
                name: 'Разведчик',
                health: 150,
                speed: 0.8,
                size: 12,
                color: '#4dffea',
                credits: 35,
                crystals: 1,
                armor: 0,
                spawnWeight: 30
            },
            FIGHTER: {
                name: 'Истребитель',
                health: 300,
                speed: 0.5,
                size: 15,
                color: '#ff9966',
                credits: 60,
                crystals: 2,
                armor: 15,
                spawnWeight: 25
            },
            TANK: {
                name: 'Танк',
                health: 800,
                speed: 0.3,
                size: 20,
                color: '#ff3333',
                credits: 150,
                crystals: 5,
                armor: 40,
                spawnWeight: 10
            }
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
            upgradeCost: 500,
            drones: 0,
            maxDrones: 2
        },
        
        SHOP_ITEMS: {
            weapons: [
                {
                    id: 'quantum',
                    name: 'Квантовый луч',
                    description: 'Мощный луч с проникающей способностью',
                    crystalCost: 50,
                    type: 'weapon',
                    effect: 'unlock_station'
                }
            ],
            satellites: [
                {
                    id: 'satellite1',
                    name: 'Базовый спутник',
                    description: 'Автономный защитник с лазерным вооружением',
                    crystalCost: 25,
                    type: 'satellite',
                    effect: 'add_satellite',
                    damage: 20,
                    range: 150,
                    fireRate: 1000,
                    speed: 0.4,
                    color: '#00bfff'
                }
            ],
            harvesters: [
                {
                    id: 'harvester1',
                    name: 'Базовый харвестер',
                    description: 'Собирает кристаллы из космоса',
                    crystalCost: 30,
                    type: 'harvester',
                    effect: 'add_harvester',
                    speed: 0.3,
                    collectionRate: 1,
                    color: '#ffd700'
                }
            ],
            cosmetics: [
                {
                    id: 'gold_base',
                    name: 'Золотая база',
                    description: 'Эксклюзивный скин для базы',
                    crystalCost: 150,
                    type: 'cosmetic',
                    effect: 'gold_base_skin'
                },
                {
                    id: 'nebula_base',
                    name: 'Туманность',
                    description: 'Эффект туманности вокруг базы',
                    crystalCost: 100,
                    type: 'cosmetic',
                    effect: 'nebula_effect'
                }
            ]
        }
    };
    
    // ==================== СОСТОЯНИЕ ИГРЫ ====================
    const GameState = {
        shields: CONFIG.GAME.START_SHIELDS,
        credits: CONFIG.GAME.START_CREDITS,
        crystals: CONFIG.GAME.START_CRYSTALS,
        currentSet: 1,
        currentWave: 1,
        highScore: parseInt(localStorage.getItem('cosmic_highscore')) || 0,
        
        isWaveActive: false,
        isPaused: false,
        isFastForward: false,
        gameOver: false,
        gameWon: false,
        
        selectedStationType: null,
        selectedStation: null,
        
        stations: [],
        enemies: [],
        projectiles: [],
        particles: [],
        baseDrones: [],
        satellites: [],
        harvesters: [],
        
        enemiesSpawned: 0,
        enemiesKilledThisWave: 0,
        enemiesThisWave: 10,
        waveEnemiesAlive: 10,
        waveEnemiesKilled: 0,
        enemySpawnTimer: 0,
        waveEnemyTypes: [],
        waveDamageTaken: 0,
        
        lastTime: 0,
        deltaTime: 0,
        animationTime: 0,
        
        base: JSON.parse(JSON.stringify(CONFIG.BASE)),
        
        currentPaths: [],
        pathArrows: [],
        
        buildSpots: [],
        hoveredBuildSpot: null,
        
        unlockedStations: {
            LASER: true,
            PLASMA: true,
            RAILGUN: true,
            TESLA: true,
            QUANTUM: false
        },
        purchasedItems: JSON.parse(localStorage.getItem('cosmic_purchases')) || {},
        
        cosmeticEffects: JSON.parse(localStorage.getItem('cosmic_cosmetics')) || {},
        
        isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
        touchStartX: 0,
        touchStartY: 0,
        
        stars: []
    };
    
    // ==================== DOM ЭЛЕМЕНТЫ ====================
    let DOM = {};
    let canvasRect = { left: 0, top: 0, width: 0, height: 0 };
    
    function initDOM() {
        DOM = {
            canvas: document.getElementById('gameCanvas'),
            ctx: null,
            lives: document.getElementById('lives'),
            gold: document.getElementById('gold'),
            crystalsCount: document.getElementById('crystalsCount'),
            set: document.getElementById('set'),
            currentWave: document.getElementById('currentWave'),
            enemiesLeftMini: document.getElementById('enemiesLeftMini'),
            highscore: document.getElementById('highscore'),
            startWaveBtn: document.getElementById('startWave'),
            pauseGameBtn: document.getElementById('pauseGame'),
            fastForwardBtn: document.getElementById('fastForward'),
            infoBtn: document.getElementById('infoBtn'),
            shopBtn: document.getElementById('shopBtn'),
            upgradeTowerBtn: document.getElementById('upgradeTower'),
            sellTowerBtn: document.getElementById('sellTower'),
            closeTowerInfoBtn: document.getElementById('closeTowerInfo'),
            towerInfoPanel: document.getElementById('towerInfoPanel'),
            towerName: document.getElementById('towerName'),
            towerLevel: document.getElementById('towerLevelCenter'),
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
            shopModal: document.getElementById('shopModal'),
            closeShopBtn: document.getElementById('closeShop'),
            shopItems: document.getElementById('shopItems'),
            crystalsAmount: document.getElementById('crystalsAmount'),
            stationsGrid: document.getElementById('stationsGrid'),
            currentWaveSidebar: document.getElementById('currentWaveSidebar'),
            waveAttacking: document.getElementById('waveAttacking'),
            waveKilled: document.getElementById('waveKilled'),
            gameOverModal: document.getElementById('gameOverModal'),
            restartGameBtn: document.getElementById('restartGame'),
            gameOverSet: document.getElementById('gameOverSet'),
            gameOverWave: document.getElementById('gameOverWave'),
            gameOverCredits: document.getElementById('gameOverCredits'),
            gameOverKills: document.getElementById('gameOverKills'),
            gameOverCrystals: document.getElementById('gameOverCrystals'),
            dronesCountMini: document.getElementById('dronesCountMini'),
            maxDronesMini: document.getElementById('maxDronesMini')
        };
        
        DOM.ctx = DOM.canvas.getContext('2d');
        updateCanvasRect();
    }
    
    function updateCanvasRect() {
        const rect = DOM.canvas.getBoundingClientRect();
        canvasRect = {
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
            scaleX: DOM.canvas.width / rect.width,
            scaleY: DOM.canvas.height / rect.height
        };
    }
    
    function getCanvasCoordinates(x, y) {
        return {
            x: (x - canvasRect.left) * canvasRect.scaleX,
            y: (y - canvasRect.top) * canvasRect.scaleY
        };
    }
    
    // ==================== ИНИЦИАЛИЗАЦИЯ ====================
    function init() {
        console.log('🚀 Инициализация игры...');
        
        initDOM();
        setupCanvas();
        setupEventListeners();
        
        generateBuildSpots();
        generatePaths();
        createBaseDrones();
        createStars();
        
        loadPurchasedItems();
        loadCosmeticEffects();
        updateStationsShop();
        
        DOM.highscore.textContent = GameState.highScore;
        DOM.crystalsAmount.textContent = GameState.crystals;
        DOM.crystalsCount.textContent = GameState.crystals;
        updateUI();
        generateWavePreview();
        initInfoModal();
        updateBaseInfo();
        
        showMessage('🚀 Добро пожаловать! Выберите станцию и начните волну', 'info');
        
        requestAnimationFrame(gameLoop);
        console.log('✅ Игра инициализирована!');
    }
    
    function setupCanvas() {
        const container = document.querySelector('.game-board');
        const header = document.querySelector('.header');
        const footer = document.querySelector('.game-footer-mini');
        
        const updateCanvasSize = () => {
            const availableHeight = window.innerHeight - header.offsetHeight - (footer ? footer.offsetHeight : 0) - 16;
            const availableWidth = container.clientWidth - 16;
            
            const isPortrait = window.innerHeight > window.innerWidth;
            
            if (isPortrait && GameState.isMobile) {
                DOM.canvas.width = Math.max(400, availableWidth);
                DOM.canvas.height = Math.max(500, availableHeight * 0.7);
            } else {
                DOM.canvas.width = Math.max(600, availableWidth);
                DOM.canvas.height = Math.max(400, availableHeight);
            }
            
            console.log(`📐 Канвас: ${DOM.canvas.width}x${DOM.canvas.height}`);
            
            generateBuildSpots();
            generatePaths();
            
            GameState.stations.forEach(station => {
                if (station.buildSpot) {
                    station.x = station.buildSpot.x;
                    station.y = station.buildSpot.y;
                }
            });
            
            updateCanvasRect();
        };
        
        updateCanvasSize();
        
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                updateCanvasSize();
                updateCanvasRect();
            }, 100);
        });
        
        window.addEventListener('scroll', updateCanvasRect);
    }
    
    function generateBuildSpots() {
        GameState.buildSpots = [];
        
        const centerX = DOM.canvas.width / 2;
        const centerY = DOM.canvas.height / 2;
        const minRadius = CONFIG.GAME.MIN_BUILD_SPOT_DISTANCE;
        const maxRadius = Math.min(CONFIG.GAME.MAX_BUILD_SPOT_DISTANCE, 
                                 Math.min(centerX, centerY) - 50);
        
        const spots = [];
        const maxAttempts = 100;
        let attempts = 0;
        
        while (spots.length < GameState.base.availableSlots && attempts < maxAttempts) {
            attempts++;
            
            const angle = Math.random() * Math.PI * 2;
            const radius = minRadius + Math.random() * (maxRadius - minRadius);
            
            const newSpot = {
                x: centerX + Math.cos(angle) * radius,
                y: centerY + Math.sin(angle) * radius,
                radius: 25,
                occupied: false,
                station: null,
                angle: angle
            };
            
            // Проверяем, что новое место не пересекается с существующими
            let isValid = true;
            for (const spot of spots) {
                const dx = spot.x - newSpot.x;
                const dy = spot.y - newSpot.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < CONFIG.GAME.MIN_SPOT_DISTANCE) {
                    isValid = false;
                    break;
                }
            }
            
            if (isValid) {
                spots.push(newSpot);
            }
        }
        
        GameState.buildSpots = spots;
        
        // Если не удалось создать нужное количество мест
        if (GameState.buildSpots.length < GameState.base.availableSlots) {
            const remaining = GameState.base.availableSlots - GameState.buildSpots.length;
            const angleStep = (Math.PI * 2) / remaining;
            
            for (let i = 0; i < remaining; i++) {
                const angle = i * angleStep;
                const radius = minRadius + (maxRadius - minRadius) * (i / remaining);
                
                GameState.buildSpots.push({
                    x: centerX + Math.cos(angle) * radius,
                    y: centerY + Math.sin(angle) * radius,
                    radius: 25,
                    occupied: false,
                    station: null,
                    angle: angle
                });
            }
        }
    }
    
    function createStars() {
        GameState.stars = [];
        const starCount = 200;
        
        for (let i = 0; i < starCount; i++) {
            GameState.stars.push({
                x: Math.random() * DOM.canvas.width,
                y: Math.random() * DOM.canvas.height,
                size: Math.random() * 1.5 + 0.5,
                brightness: Math.random() * 0.5 + 0.3,
                twinkleSpeed: Math.random() * 0.02 + 0.01
            });
        }
    }
    
    function createBaseDrones() {
        GameState.baseDrones = [];
        GameState.base.maxDrones = CONFIG.GAME.DRONES_PER_LEVEL * GameState.base.level;
        GameState.base.drones = GameState.base.maxDrones;
        
        for (let i = 0; i < GameState.base.maxDrones; i++) {
            GameState.baseDrones.push({
                x: DOM.canvas.width / 2,
                y: DOM.canvas.height / 2,
                target: null,
                speed: 1.2,
                range: 200,
                damage: 15,
                fireRate: 1000,
                lastShot: 0,
                health: 50,
                maxHealth: 50,
                angle: Math.random() * Math.PI * 2
            });
        }
        
        updateDronesUI();
    }
    
    function generatePaths() {
        GameState.currentPaths = [];
        GameState.pathArrows = [];
        
        const centerX = DOM.canvas.width / 2;
        const centerY = DOM.canvas.height / 2;
        const baseRadius = 60;
        const pathCount = Math.min(4, GameState.currentSet);
        const maxPathLength = Math.min(DOM.canvas.width, DOM.canvas.height) * 0.4;
        
        for (let i = 0; i < pathCount; i++) {
            const startAngle = (i / pathCount) * Math.PI * 2;
            const endAngle = startAngle + Math.PI;
            
            // Создаем длинный извилистый путь
            const path = [];
            const segments = 8; // Увеличиваем количество сегментов для более длинного пути
            
            for (let j = 0; j <= segments; j++) {
                const progress = j / segments;
                const angleVariation = Math.sin(progress * Math.PI * 2) * 0.5;
                const currentAngle = startAngle + (endAngle - startAngle) * progress + angleVariation;
                
                // Постепенно уменьшаем радиус к базе
                const radius = maxPathLength * (1 - progress * 0.8) + baseRadius;
                
                const point = {
                    x: centerX + Math.cos(currentAngle) * radius,
                    y: centerY + Math.sin(currentAngle) * radius
                };
                
                // Добавляем случайное смещение для извилистости
                if (j > 0 && j < segments) {
                    point.x += (Math.random() - 0.5) * 50;
                    point.y += (Math.random() - 0.5) * 50;
                }
                
                path.push(point);
            }
            
            // Добавляем точку у базы
            path.push({
                x: centerX + Math.cos(endAngle) * baseRadius,
                y: centerY + Math.sin(endAngle) * baseRadius
            });
            
            GameState.currentPaths.push(path);
            
            // Добавляем стрелки для пути
            for (let j = 0; j < 8; j++) {
                GameState.pathArrows.push({
                    pathIndex: i,
                    progress: j / 8,
                    offset: Math.random() * 0.2,
                    alpha: 0.3 + Math.random() * 0.4,
                    pulseSpeed: 0.5 + Math.random() * 0.5
                });
            }
        }
    }
    
    // ==================== СОБЫТИЯ ====================
    function setupEventListeners() {
        // Управление
        DOM.startWaveBtn.addEventListener('click', startWave);
        DOM.pauseGameBtn.addEventListener('click', togglePause);
        DOM.fastForwardBtn.addEventListener('click', toggleFastForward);
        DOM.infoBtn.addEventListener('click', () => DOM.infoModal.style.display = 'flex');
        DOM.shopBtn.addEventListener('click', () => {
            updateShop();
            DOM.shopModal.style.display = 'flex';
        });
        DOM.closeModalBtn.addEventListener('click', () => DOM.infoModal.style.display = 'none');
        DOM.closeShopBtn.addEventListener('click', () => DOM.shopModal.style.display = 'none');
        DOM.upgradeTowerBtn.addEventListener('click', upgradeSelectedStation);
        DOM.sellTowerBtn.addEventListener('click', sellSelectedStation);
        DOM.closeTowerInfoBtn.addEventListener('click', closeTowerInfo);
        DOM.upgradeBaseBtn.addEventListener('click', upgradeBase);
        DOM.restartGameBtn.addEventListener('click', resetGame);
        
        // Взаимодействие с канвасом
        if (GameState.isMobile) {
            setupTouchEvents();
        } else {
            setupMouseEvents();
        }
        
        // Горячие клавиши
        document.addEventListener('keydown', handleKeyPress);
        
        // Клик по overlay
        DOM.infoModal.addEventListener('click', (e) => {
            if (e.target === DOM.infoModal) {
                DOM.infoModal.style.display = 'none';
            }
        });
        
        DOM.shopModal.addEventListener('click', (e) => {
            if (e.target === DOM.shopModal) {
                DOM.shopModal.style.display = 'none';
            }
        });
        
        DOM.gameOverModal.addEventListener('click', (e) => {
            if (e.target === DOM.gameOverModal) {
                DOM.gameOverModal.style.display = 'none';
            }
        });
        
        // Табы магазина
        document.querySelectorAll('.shop-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                updateShop(tab.dataset.tab);
            });
        });
        
        // Выбор станций
        document.addEventListener('click', (e) => {
            const stationItem = e.target.closest('.station-item');
            if (stationItem && !stationItem.classList.contains('locked')) {
                selectTowerFromShop(stationItem);
            }
        });
    }
    
    function setupMouseEvents() {
        DOM.canvas.addEventListener('mousedown', handleCanvasMouseDown);
        DOM.canvas.addEventListener('mousemove', handleCanvasMouseMove);
        DOM.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            clearSelection();
        });
    }
    
    function setupTouchEvents() {
        DOM.canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
        DOM.canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
        DOM.canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
        
        // Предотвращаем масштабирование на канвасе
        DOM.canvas.addEventListener('gesturestart', (e) => e.preventDefault());
        DOM.canvas.addEventListener('gesturechange', (e) => e.preventDefault());
        DOM.canvas.addEventListener('gestureend', (e) => e.preventDefault());
    }
    
    function handleCanvasMouseDown(e) {
        const coords = getCanvasCoordinates(e.clientX, e.clientY);
        
        if (e.button === 2) { // Правая кнопка
            clearSelection();
            return;
        }
        
        if (GameState.selectedStationType && !GameState.isWaveActive) {
            placeStation(coords.x, coords.y);
            return;
        }
        
        selectStationAtPosition(coords.x, coords.y);
    }
    
    function handleCanvasMouseMove(e) {
        const coords = getCanvasCoordinates(e.clientX, e.clientY);
        
        GameState.hoveredBuildSpot = null;
        
        if (GameState.selectedStationType && !GameState.isWaveActive) {
            let closestSpot = null;
            let closestDistance = Infinity;
            
            for (const spot of GameState.buildSpots) {
                if (!spot.occupied) {
                    const dx = spot.x - coords.x;
                    const dy = spot.y - coords.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < 40 && distance < closestDistance) {
                        closestDistance = distance;
                        closestSpot = spot;
                    }
                }
            }
            
            GameState.hoveredBuildSpot = closestSpot;
        }
    }
    
    function handleTouchStart(e) {
        e.preventDefault();
        updateCanvasRect();
        
        const touch = e.touches[0];
        GameState.touchStartX = touch.clientX;
        GameState.touchStartY = touch.clientY;
        
        const coords = getCanvasCoordinates(touch.clientX, touch.clientY);
        
        // Проверяем, не нажали ли мы на существующую станцию
        if (!selectStationAtPosition(coords.x, coords.y)) {
            // Если нет, и выбрана станция для постройки - ставим её
            if (GameState.selectedStationType && !GameState.isWaveActive) {
                placeStation(coords.x, coords.y);
            }
        }
    }
    
    function handleTouchMove(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const coords = getCanvasCoordinates(touch.clientX, touch.clientY);
        
        GameState.hoveredBuildSpot = null;
        
        if (GameState.selectedStationType && !GameState.isWaveActive) {
            let closestSpot = null;
            let closestDistance = Infinity;
            
            for (const spot of GameState.buildSpots) {
                if (!spot.occupied) {
                    const dx = spot.x - coords.x;
                    const dy = spot.y - coords.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < 50 && distance < closestDistance) {
                        closestDistance = distance;
                        closestSpot = spot;
                    }
                }
            }
            
            GameState.hoveredBuildSpot = closestSpot;
        }
    }
    
    function handleTouchEnd(e) {
        e.preventDefault();
    }
    
    function selectTowerFromShop(item) {
        if (GameState.isWaveActive) {
            showMessage('⚠️ Нельзя строить во время волны!', 'warning');
            return;
        }
        
        const type = item.dataset.type.toUpperCase();
        const config = getStationConfig(type);
        
        if (!config) {
            showMessage('❌ Конфигурация не найдена!', 'error');
            return;
        }
        
        if (config.isPremium && !GameState.unlockedStations[type]) {
            showMessage('❌ Эта станция не разблокирована! Купите в магазине.', 'error');
            return;
        }
        
        document.querySelectorAll('.station-item').forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
        
        GameState.selectedStationType = type;
        DOM.selectionIndicator.style.display = 'flex';
        DOM.selectionText.textContent = `Установить ${config.name}`;
        
        showMessage(`🎯 Выбрана ${config.name}. Кликните на свободное место для установки.`, 'info');
    }
    
    function selectStationAtPosition(x, y) {
        for (const station of GameState.stations) {
            const dx = x - station.x;
            const dy = y - station.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 25) {
                selectStationForUpgrade(station);
                return true;
            }
        }
        
        if (GameState.selectedStation) {
            closeTowerInfo();
        }
        
        return false;
    }
    
    function togglePause() {
        GameState.isPaused = !GameState.isPaused;
        if (GameState.isPaused) {
            DOM.pauseGameBtn.innerHTML = '<i class="fas fa-play"></i>';
            showMessage('⏸️ Игра на паузе', 'info');
        } else {
            DOM.pauseGameBtn.innerHTML = '<i class="fas fa-pause"></i>';
            showMessage('▶️ Игра продолжается', 'info');
        }
    }
    
    function toggleFastForward() {
        if (GameState.gameOver) return;
        
        GameState.isFastForward = !GameState.isFastForward;
        CONFIG.GAME.GAME_SPEED = GameState.isFastForward ? 2.0 : 1.0;
        
        if (GameState.isFastForward) {
            DOM.fastForwardBtn.classList.add('active');
            showMessage('⏩ Ускорение включено', 'info');
        } else {
            DOM.fastForwardBtn.classList.remove('active');
            showMessage('⏺️ Обычная скорость', 'info');
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
            case 'f':
                toggleFastForward();
                break;
            case 'r':
                if (GameState.gameOver) {
                    resetGame();
                }
                break;
            case 'i':
                DOM.infoModal.style.display = 'flex';
                break;
            case 's':
                DOM.shopModal.style.display = 'flex';
                break;
        }
    }
    
    // ==================== ИГРОВАЯ ЛОГИКА ====================
    function gameLoop(timestamp) {
        GameState.deltaTime = timestamp - GameState.lastTime || 0;
        GameState.lastTime = timestamp;
        GameState.animationTime += GameState.deltaTime;
        
        if (!GameState.isPaused && !GameState.gameOver && !GameState.gameWon) {
            if (GameState.isWaveActive) {
                updateWave();
            }
            
            updateEnemies();
            updateStations();
            updateProjectiles();
            updateBaseDrones();
            updateSatellites();
            updateHarvesters();
            
            if (DOM.waveAttacking) DOM.waveAttacking.textContent = GameState.waveEnemiesAlive;
            if (DOM.waveKilled) DOM.waveKilled.textContent = GameState.waveEnemiesKilled;
            
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
        
        GameState.waveEnemiesAlive = GameState.enemies.length;
        updateEnemiesUI();
    }
    
    function spawnEnemy() {
        if (GameState.waveEnemyTypes.length === 0) {
            generateWaveEnemies();
        }
        
        if (GameState.waveEnemyTypes.length === 0) return;
        
        const enemyType = GameState.waveEnemyTypes.pop();
        const pathIndex = Math.floor(Math.random() * GameState.currentPaths.length);
        const path = GameState.currentPaths[pathIndex];
        
        const enemy = {
            x: path[0].x,
            y: path[0].y,
            health: enemyType.health,
            maxHealth: enemyType.health,
            speed: enemyType.speed,
            color: enemyType.color,
            credits: enemyType.credits,
            crystals: enemyType.crystals,
            size: enemyType.size,
            name: enemyType.name,
            pathIndex: 0,
            path: path,
            rotation: 0,
            reachedEnd: false,
            pathId: pathIndex,
            type: enemyType
        };
        
        GameState.enemies.push(enemy);
        GameState.enemiesSpawned++;
        updateEnemiesUI();
    }
    
    function generateWaveEnemies() {
        GameState.waveEnemyTypes = [];
        const wave = GameState.currentWave;
        const set = GameState.currentSet;
        
        const multiplier = 1 + (set - 1) * 0.3;
        GameState.enemiesThisWave = Math.floor((8 + Math.floor(wave * 1.2)) * multiplier);
        GameState.waveEnemiesAlive = GameState.enemiesThisWave;
        
        let types = [];
        let weights = [];
        
        if (wave < 3) {
            types = [CONFIG.ENEMY_TYPES.SCOUT];
            weights = [100];
        } else if (wave < 5) {
            types = [CONFIG.ENEMY_TYPES.SCOUT, CONFIG.ENEMY_TYPES.FIGHTER];
            weights = [70, 30];
        } else if (wave < 8) {
            types = [CONFIG.ENEMY_TYPES.SCOUT, CONFIG.ENEMY_TYPES.FIGHTER];
            weights = [50, 50];
        } else {
            types = [CONFIG.ENEMY_TYPES.SCOUT, CONFIG.ENEMY_TYPES.FIGHTER, CONFIG.ENEMY_TYPES.TANK];
            weights = [40, 40, 20];
        }
        
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
        
        updateEnemiesUI();
    }
    
    function updateEnemiesUI() {
        const enemiesLeft = Math.max(0, GameState.enemiesThisWave - GameState.enemiesKilledThisWave);
        if (DOM.enemiesLeftMini) DOM.enemiesLeftMini.textContent = enemiesLeft;
    }
    
    function updateEnemies() {
        for (let i = GameState.enemies.length - 1; i >= 0; i--) {
            const enemy = GameState.enemies[i];
            
            if (enemy.reachedEnd) {
                enemyReachedBase(enemy, i);
                continue;
            }
            
            moveEnemy(enemy);
            
            checkDroneCollision(enemy);
            checkSatelliteCollision(enemy);
            
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
            
            enemy.rotation = Math.atan2(dy, dx);
        }
    }
    
    function enemyReachedBase(enemy, index) {
        const damage = enemy.maxHealth * 0.2;
        GameState.shields = Math.max(0, GameState.shields - damage);
        GameState.waveDamageTaken += damage;
        
        createExplosion(enemy.x, enemy.y, enemy.color);
        
        GameState.enemies.splice(index, 1);
        GameState.waveEnemiesAlive = GameState.enemies.length;
        
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
        GameState.waveEnemiesKilled++;
        
        if (Math.random() < 0.3) {
            const crystals = enemy.crystals;
            GameState.crystals += crystals;
            if (DOM.crystalsAmount) DOM.crystalsAmount.textContent = GameState.crystals;
            if (DOM.crystalsCount) DOM.crystalsCount.textContent = GameState.crystals;
            createCrystalEffect(enemy.x, enemy.y, crystals);
        }
        
        createExplosion(enemy.x, enemy.y, enemy.color);
        createCreditEffect(enemy.x, enemy.y, creditsEarned);
        
        GameState.enemies.splice(index, 1);
        GameState.waveEnemiesAlive = GameState.enemies.length;
        
        updateUI();
        updateEnemiesUI();
    }
    
    function checkDroneCollision(enemy) {
        for (let i = GameState.baseDrones.length - 1; i >= 0; i--) {
            const drone = GameState.baseDrones[i];
            
            const dx = enemy.x - drone.x;
            const dy = enemy.y - drone.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 20 && drone.target === null) {
                drone.target = enemy;
                break;
            }
        }
    }
    
    function checkSatelliteCollision(enemy) {
        for (let i = GameState.satellites.length - 1; i >= 0; i--) {
            const satellite = GameState.satellites[i];
            
            const dx = enemy.x - satellite.x;
            const dy = enemy.y - satellite.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < satellite.range && satellite.target === null) {
                satellite.target = enemy;
                break;
            }
        }
    }
    
    function createExplosion(x, y, color) {
        for (let i = 0; i < 15; i++) {
            GameState.particles.push({
                x,
                y,
                size: Math.random() * 4 + 2,
                speedX: (Math.random() - 0.5) * 8,
                speedY: (Math.random() - 0.5) * 8,
                color,
                opacity: 1,
                life: 20
            });
        }
    }
    
    function createCreditEffect(x, y, amount) {
        for (let i = 0; i < 3; i++) {
            GameState.particles.push({
                x,
                y,
                size: Math.random() * 3 + 1,
                speedX: (Math.random() - 0.5) * 2,
                speedY: Math.random() * -3 - 1,
                color: '#ffd700',
                opacity: 1,
                life: 40,
                isCredit: true
            });
        }
    }
    
    function createCrystalEffect(x, y, amount) {
        for (let i = 0; i < 5; i++) {
            GameState.particles.push({
                x,
                y,
                size: Math.random() * 4 + 2,
                speedX: (Math.random() - 0.5) * 3,
                speedY: Math.random() * -4 - 1,
                color: '#9d4edd',
                opacity: 1,
                life: 50,
                isCrystal: true
            });
        }
    }
    
    // ==================== СТАНЦИИ ====================
    function placeStation(x, y) {
        if (!GameState.selectedStationType || GameState.isWaveActive) return;
        
        // Находим ближайшее свободное место для постройки
        let closestSpot = null;
        let closestDistance = Infinity;
        
        for (const spot of GameState.buildSpots) {
            if (!spot.occupied) {
                const dx = spot.x - x;
                const dy = spot.y - y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 40 && distance < closestDistance) {
                    closestDistance = distance;
                    closestSpot = spot;
                }
            }
        }
        
        if (!closestSpot) {
            showMessage('❌ Нет свободных мест для постройки!', 'error');
            return;
        }
        
        const config = getStationConfig(GameState.selectedStationType);
        
        if (!config) {
            showMessage('❌ Ошибка конфигурации станции!', 'error');
            return;
        }
        
        const cost = config.cost;
        
        if (GameState.credits < cost) {
            showMessage(`❌ Недостаточно кредитов! Нужно ${cost}`, 'error');
            return;
        }
        
        const station = {
            id: Date.now() + Math.random(),
            x: closestSpot.x,
            y: closestSpot.y,
            type: GameState.selectedStationType,
            name: config.name,
            damage: config.damage,
            range: config.range,
            fireRate: config.fireRate,
            color: config.color,
            level: 1,
            lastShot: 0,
            target: null,
            rotation: 0,
            buildSpot: closestSpot,
            icon: config.icon,
            sellValue: Math.floor(cost * 0.6),
            isPremium: config.isPremium || false,
            upgradeCount: 0
        };
        
        GameState.stations.push(station);
        closestSpot.occupied = true;
        closestSpot.station = station;
        
        GameState.credits -= cost;
        
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
        
        showMessage(`✅ ${config.name} установлена!`, 'success');
        updateUI();
        clearSelection();
        updateAvailableSlots();
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
        station.upgradeCount++;
        station.damage = Math.floor(station.damage * 1.4);
        station.range = Math.floor(station.range * 1.05);
        station.fireRate = Math.max(400, station.fireRate * 0.95);
        station.sellValue = Math.floor(station.sellValue * 1.2);
        
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
        
        GameState.credits += station.sellValue;
        station.buildSpot.occupied = false;
        station.buildSpot.station = null;
        
        const index = GameState.stations.indexOf(station);
        GameState.stations.splice(index, 1);
        
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
        updateAvailableSlots();
    }
    
    function updateStations() {
        GameState.stations.forEach(station => {
            if (!station.target || station.target.health <= 0) {
                station.target = findTargetForStation(station);
            }
            
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
                if (projectile.target) {
                    projectile.target.health -= projectile.damage;
                }
                
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
    
    // ==================== СПУТНИКИ ====================
    function updateSatellites() {
        GameState.satellites.forEach(satellite => {
            // Обновляем патрон
            if (satellite.patrolTimer <= 0) {
                // Генерируем новую случайную точку для патрулирования
                const centerX = DOM.canvas.width / 2;
                const centerY = DOM.canvas.height / 2;
                const patrolRadius = 300;
                
                satellite.targetX = centerX + (Math.random() - 0.5) * patrolRadius;
                satellite.targetY = centerY + (Math.random() - 0.5) * patrolRadius;
                
                // Проверяем, чтобы точка не была слишком близко к базе
                const dx = satellite.targetX - centerX;
                const dy = satellite.targetY - centerY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < 100) {
                    satellite.targetX = centerX + (dx / distance) * 100;
                    satellite.targetY = centerY + (dy / distance) * 100;
                }
                
                satellite.patrolTimer = 2000 + Math.random() * 3000; // 2-5 секунд
            } else {
                satellite.patrolTimer -= GameState.deltaTime;
            }
            
            // Двигаемся к целевой точке
            if (satellite.targetX && satellite.targetY) {
                const dx = satellite.targetX - satellite.x;
                const dy = satellite.targetY - satellite.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > 10) {
                    const moveDistance = satellite.speed * (GameState.deltaTime / 16) * CONFIG.GAME.GAME_SPEED;
                    satellite.x += (dx / distance) * moveDistance;
                    satellite.y += (dy / distance) * moveDistance;
                }
            }
            
            // Ищем врагов для атаки
            if (!satellite.target || satellite.target.health <= 0) {
                satellite.target = findTargetForSatellite(satellite);
            }
            
            // Атакуем врага
            if (satellite.target) {
                const dx = satellite.target.x - satellite.x;
                const dy = satellite.target.y - satellite.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > satellite.range) {
                    satellite.target = null;
                } else {
                    const currentTime = Date.now();
                    if (currentTime - satellite.lastShot > satellite.fireRate) {
                        shootFromSatellite(satellite);
                        satellite.lastShot = currentTime;
                    }
                }
            }
        });
    }
    
    function findTargetForSatellite(satellite) {
        let closestEnemy = null;
        let closestDistance = satellite.range;
        
        for (const enemy of GameState.enemies) {
            const dx = enemy.x - satellite.x;
            const dy = enemy.y - satellite.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < closestDistance) {
                closestEnemy = enemy;
                closestDistance = distance;
            }
        }
        
        return closestEnemy;
    }
    
    function shootFromSatellite(satellite) {
        if (!satellite.target) return;
        
        GameState.projectiles.push({
            x: satellite.x,
            y: satellite.y,
            target: satellite.target,
            damage: satellite.damage,
            color: satellite.color,
            speed: 7,
            size: 4,
            fromSatellite: satellite
        });
        
        const dx = satellite.target.x - satellite.x;
        const dy = satellite.target.y - satellite.y;
        const angle = Math.atan2(dy, dx);
        
        for (let i = 0; i < 2; i++) {
            GameState.particles.push({
                x: satellite.x,
                y: satellite.y,
                size: Math.random() * 2 + 1,
                speedX: Math.cos(angle) * 3 + (Math.random() - 0.5),
                speedY: Math.sin(angle) * 3 + (Math.random() - 0.5),
                color: satellite.color,
                opacity: 1,
                life: 15
            });
        }
    }
    
    function addSatellite(config) {
        const centerX = DOM.canvas.width / 2;
        const centerY = DOM.canvas.height / 2;
        const patrolRadius = 200;
        
        const satellite = {
            id: Date.now() + Math.random(),
            x: centerX + (Math.random() - 0.5) * patrolRadius,
            y: centerY + (Math.random() - 0.5) * patrolRadius,
            target: null,
            targetX: null,
            targetY: null,
            speed: config.speed || 0.4,
            range: config.range || 150,
            damage: config.damage || 20,
            fireRate: config.fireRate || 1000,
            lastShot: 0,
            color: config.color || '#00bfff',
            patrolTimer: 0
        };
        
        GameState.satellites.push(satellite);
        
        showMessage(`🛰️ Спутник "${config.name}" активирован!`, 'success');
    }
    
    // ==================== ХАРВЕСТЕРЫ ====================
    function updateHarvesters() {
        const centerX = DOM.canvas.width / 2;
        const centerY = DOM.canvas.height / 2;
        const baseRadius = 60;
        
        GameState.harvesters.forEach(harvester => {
            // Обновляем таймер сбора
            if (harvester.collectionTimer <= 0) {
                harvester.collectionTimer = harvester.collectionInterval;
                // Проверяем, достаточно ли близко к базе для сбора
                const dx = centerX - harvester.x;
                const dy = centerY - harvester.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < baseRadius + 20) {
                    // Собираем кристаллы
                    GameState.crystals += harvester.collectionRate;
                    DOM.crystalsAmount.textContent = GameState.crystals;
                    DOM.crystalsCount.textContent = GameState.crystals;
                    
                    createCrystalEffect(harvester.x, harvester.y, harvester.collectionRate);
                    
                    // Отлетаем от базы
                    harvester.avoidBase = true;
                    harvester.avoidTimer = 1000;
                }
            } else {
                harvester.collectionTimer -= GameState.deltaTime;
            }
            
            // Проверяем врагов поблизости
            let enemyNearby = false;
            for (const enemy of GameState.enemies) {
                const dx = enemy.x - harvester.x;
                const dy = enemy.y - harvester.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 150) {
                    enemyNearby = true;
                    harvester.avoidEnemy = enemy;
                    harvester.avoidTimer = 1500;
                    break;
                }
            }
            
            // Избегаем врагов
            if (harvester.avoidEnemy && harvester.avoidTimer > 0) {
                const dx = harvester.x - harvester.avoidEnemy.x;
                const dy = harvester.y - harvester.avoidEnemy.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > 0) {
                    const moveDistance = harvester.speed * 1.5 * (GameState.deltaTime / 16) * CONFIG.GAME.GAME_SPEED;
                    harvester.x += (dx / distance) * moveDistance;
                    harvester.y += (dy / distance) * moveDistance;
                }
                
                harvester.avoidTimer -= GameState.deltaTime;
                if (harvester.avoidTimer <= 0) {
                    harvester.avoidEnemy = null;
                }
            }
            // Избегаем базы, если нужно
            else if (harvester.avoidBase && harvester.avoidTimer > 0) {
                const dx = harvester.x - centerX;
                const dy = harvester.y - centerY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > 0) {
                    const moveDistance = harvester.speed * 1.2 * (GameState.deltaTime / 16) * CONFIG.GAME.GAME_SPEED;
                    harvester.x += (dx / distance) * moveDistance;
                    harvester.y += (dy / distance) * moveDistance;
                }
                
                harvester.avoidTimer -= GameState.deltaTime;
                if (harvester.avoidTimer <= 0) {
                    harvester.avoidBase = false;
                }
            }
            // Иначе патрулируем
            else {
                // Обновляем патрулирование
                if (harvester.patrolTimer <= 0) {
                    // Генерируем новую случайную точку
                    const patrolRadius = 400;
                    
                    harvester.targetX = centerX + (Math.random() - 0.5) * patrolRadius;
                    harvester.targetY = centerY + (Math.random() - 0.5) * patrolRadius;
                    
                    harvester.patrolTimer = 3000 + Math.random() * 4000; // 3-7 секунд
                } else {
                    harvester.patrolTimer -= GameState.deltaTime;
                }
                
                // Двигаемся к целевой точке
                if (harvester.targetX && harvester.targetY) {
                    const dx = harvester.targetX - harvester.x;
                    const dy = harvester.targetY - harvester.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance > 10) {
                        const moveDistance = harvester.speed * (GameState.deltaTime / 16) * CONFIG.GAME.GAME_SPEED;
                        harvester.x += (dx / distance) * moveDistance;
                        harvester.y += (dy / distance) * moveDistance;
                    }
                }
            }
            
            // Ограничиваем движение в пределах поля
            harvester.x = Math.max(20, Math.min(DOM.canvas.width - 20, harvester.x));
            harvester.y = Math.max(20, Math.min(DOM.canvas.height - 20, harvester.y));
        });
    }
    
    function addHarvester(config) {
        const centerX = DOM.canvas.width / 2;
        const centerY = DOM.canvas.height / 2;
        const patrolRadius = 300;
        
        const harvester = {
            id: Date.now() + Math.random(),
            x: centerX + (Math.random() - 0.5) * patrolRadius,
            y: centerY + (Math.random() - 0.5) * patrolRadius,
            speed: config.speed || 0.3,
            collectionRate: config.collectionRate || 1,
            collectionInterval: 3000, // Собирает каждые 3 секунды
            collectionTimer: 0,
            color: config.color || '#ffd700',
            targetX: null,
            targetY: null,
            patrolTimer: 0,
            avoidEnemy: null,
            avoidBase: false,
            avoidTimer: 0
        };
        
        GameState.harvesters.push(harvester);
        
        showMessage(`⛏️ Харвестер "${config.name}" активирован!`, 'success');
    }
    
    // ==================== БАЗА И ДРОНЫ ====================
    function updateBaseDrones() {
        GameState.baseDrones.forEach((drone, index) => {
            if (drone.health <= 0) {
                createExplosion(drone.x, drone.y, '#ff2e63');
                GameState.baseDrones.splice(index, 1);
                GameState.base.drones--;
                updateDronesUI();
                return;
            }
            
            if (drone.target) {
                const dx = drone.target.x - drone.x;
                const dy = drone.target.y - drone.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > drone.range || drone.target.health <= 0) {
                    drone.target = null;
                    return;
                }
                
                if (distance > 15) {
                    const moveDistance = drone.speed * (GameState.deltaTime / 16) * CONFIG.GAME.GAME_SPEED;
                    drone.x += (dx / distance) * moveDistance;
                    drone.y += (dy / distance) * moveDistance;
                }
                
                const currentTime = Date.now();
                if (currentTime - drone.lastShot > drone.fireRate) {
                    if (drone.target) {
                        drone.target.health -= drone.damage;
                    }
                    drone.lastShot = currentTime;
                    
                    GameState.projectiles.push({
                        x: drone.x,
                        y: drone.y,
                        target: drone.target,
                        damage: drone.damage,
                        color: '#9d4edd',
                        speed: 6,
                        size: 3,
                        fromDrone: true
                    });
                }
            } else {
                drone.angle += 0.02;
                const patrolRadius = 100;
                const baseX = DOM.canvas.width / 2;
                const baseY = DOM.canvas.height / 2;
                
                drone.x = baseX + Math.cos(drone.angle) * patrolRadius;
                drone.y = baseY + Math.sin(drone.angle) * patrolRadius;
                
                for (const enemy of GameState.enemies) {
                    const dx = enemy.x - drone.x;
                    const dy = enemy.y - drone.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < drone.range) {
                        drone.target = enemy;
                        break;
                    }
                }
            }
        });
    }
    
    function updateDronesUI() {
        if (DOM.dronesCountMini) DOM.dronesCountMini.textContent = GameState.base.drones;
        if (DOM.maxDronesMini) DOM.maxDronesMini.textContent = GameState.base.maxDrones;
    }
    
    // ==================== МАГАЗИН ====================
    function updateShop(tab = 'weapons') {
        if (!DOM.shopItems) return;
        
        DOM.shopItems.innerHTML = '';
        
        const items = CONFIG.SHOP_ITEMS[tab] || [];
        
        items.forEach(item => {
            const owned = GameState.purchasedItems[item.id] || false;
            const canAfford = GameState.crystals >= item.crystalCost;
            
            const div = document.createElement('div');
            div.className = `shop-item ${owned ? 'owned' : ''} ${!canAfford && !owned ? 'locked' : ''}`;
            
            div.innerHTML = `
                <div class="shop-item-icon ${item.type}">
                    <i class="fas fa-${getShopItemIcon(item)}"></i>
                </div>
                <div class="shop-item-name">${item.name}</div>
                <div class="shop-item-desc">${item.description}</div>
                <div class="shop-item-price">
                    ${owned ? '<i class="fas fa-check"></i> КУПЛЕНО' : 
                    `${item.crystalCost} <i class="fas fa-gem"></i>`}
                </div>
                ${!owned ? `
                    <button class="buy-btn" ${canAfford ? '' : 'disabled'}>
                        ${canAfford ? 'КУПИТЬ' : 'НЕДОСТАТОЧНО'}
                    </button>
                ` : ''}
            `;
            
            const buyBtn = div.querySelector('.buy-btn');
            if (buyBtn && !owned) {
                buyBtn.addEventListener('click', () => {
                    buyItem(item);
                });
            }
            
            DOM.shopItems.appendChild(div);
        });
    }
    
    function getShopItemIcon(item) {
        switch(item.type) {
            case 'weapon': return 'gun';
            case 'satellite': return 'satellite';
            case 'harvester': return 'coins';
            case 'cosmetic': return 'palette';
            default: return 'shopping-cart';
        }
    }
    
    function updateStationsShop() {
        if (!DOM.stationsGrid) return;
        
        DOM.stationsGrid.innerHTML = '';
        
        const baseStations = [
            { key: 'LASER', config: CONFIG.STATIONS.LASER },
            { key: 'PLASMA', config: CONFIG.STATIONS.PLASMA },
            { key: 'RAILGUN', config: CONFIG.STATIONS.RAILGUN },
            { key: 'TESLA', config: CONFIG.STATIONS.TESLA }
        ];
        
        baseStations.forEach(({ key, config }) => {
            const isUnlocked = GameState.unlockedStations[key];
            const div = document.createElement('div');
            div.className = `station-item ${isUnlocked ? 'unlocked' : ''}`;
            div.dataset.type = key.toLowerCase();
            div.dataset.cost = config.cost;
            
            div.innerHTML = `
                <div class="station-icon ${key.toLowerCase()}-station">
                    <i class="fas fa-${config.icon}"></i>
                </div>
                <div class="station-info">
                    <span class="station-name">${config.name.split(' ')[0]}</span>
                    <span class="station-cost">${config.cost} <i class="fas fa-coins"></i></span>
                </div>
                <div class="station-stats">
                    <span class="stat-tag">⚡ ${config.damage} урон</span>
                    <span class="stat-tag">📡 ${config.range}</span>
                </div>
            `;
            
            if (isUnlocked) {
                div.addEventListener('click', () => selectTowerFromShop(div));
            } else {
                div.innerHTML += '<div class="station-locked">🔒</div>';
                div.style.opacity = '0.6';
                div.style.cursor = 'not-allowed';
            }
            
            DOM.stationsGrid.appendChild(div);
        });
        
        const premiumStations = [
            { key: 'QUANTUM', config: CONFIG.STATIONS.QUANTUM }
        ];
        
        premiumStations.forEach(({ key, config }) => {
            if (!config) return;
            
            const isUnlocked = GameState.unlockedStations[key];
            if (!isUnlocked) return;
            
            const div = document.createElement('div');
            div.className = 'station-item unlocked premium';
            div.dataset.type = key.toLowerCase();
            div.dataset.cost = config.cost;
            
            div.innerHTML = `
                <div class="station-icon ${key.toLowerCase()}-station">
                    <i class="fas fa-${config.icon}"></i>
                </div>
                <div class="station-info">
                    <span class="station-name">${config.name.split(' ')[0]}</span>
                    <span class="station-cost">${config.cost} <i class="fas fa-coins"></i></span>
                </div>
                <div class="station-stats">
                    <span class="stat-tag">⚡ ${config.damage} урон</span>
                    <span class="stat-tag">💎 премиум</span>
                </div>
            `;
            
            div.addEventListener('click', () => selectTowerFromShop(div));
            
            DOM.stationsGrid.appendChild(div);
        });
    }
    
    function buyItem(item) {
        if (GameState.crystals < item.crystalCost) {
            showNotification('❌ Недостаточно кристаллов!', 'error');
            return;
        }
        
        GameState.crystals -= item.crystalCost;
        if (DOM.crystalsAmount) DOM.crystalsAmount.textContent = GameState.crystals;
        if (DOM.crystalsCount) DOM.crystalsCount.textContent = GameState.crystals;
        
        GameState.purchasedItems[item.id] = true;
        savePurchasedItems();
        
        // Применяем эффект покупки
        applyPurchaseEffect(item);
        
        updateShop();
        showMessage(`💎 Куплено: ${item.name}`, 'success');
    }
    
    function applyPurchaseEffect(item) {
        switch(item.effect) {
            case 'unlock_station':
                GameState.unlockedStations.QUANTUM = true;
                updateStationsShop();
                showNotification(`✅ ${item.name} разблокирована!`, 'success');
                break;
                
            case 'add_satellite':
                addSatellite(item);
                showNotification(`🛰️ ${item.name} добавлен!`, 'success');
                break;
                
            case 'add_harvester':
                addHarvester(item);
                showNotification(`⛏️ ${item.name} добавлен!`, 'success');
                break;
                
            case 'gold_base_skin':
            case 'nebula_effect':
                GameState.cosmeticEffects[item.id] = true;
                saveCosmeticEffects();
                showNotification(`🎨 ${item.name} применён!`, 'success');
                break;
        }
    }
    
    function loadPurchasedItems() {
        try {
            const saved = JSON.parse(localStorage.getItem('cosmic_purchases')) || {};
            GameState.purchasedItems = saved;
            
            Object.keys(saved).forEach(key => {
                const weaponKey = key.toUpperCase();
                if (CONFIG.STATIONS[weaponKey]) {
                    GameState.unlockedStations[weaponKey] = true;
                }
                
                // Активируем купленные предметы
                const item = findShopItemById(key);
                if (item && item.effect) {
                    setTimeout(() => applyPurchaseEffect(item), 100);
                }
            });
        } catch (e) {
            console.error('Ошибка загрузки покупок:', e);
        }
    }
    
    function loadCosmeticEffects() {
        try {
            const saved = JSON.parse(localStorage.getItem('cosmic_cosmetics')) || {};
            GameState.cosmeticEffects = saved;
        } catch (e) {
            console.error('Ошибка загрузки косметики:', e);
        }
    }
    
    function findShopItemById(id) {
        for (const category in CONFIG.SHOP_ITEMS) {
            const item = CONFIG.SHOP_ITEMS[category].find(item => item.id === id);
            if (item) return item;
        }
        return null;
    }
    
    function savePurchasedItems() {
        try {
            localStorage.setItem('cosmic_purchases', JSON.stringify(GameState.purchasedItems));
        } catch (e) {
            console.error('Ошибка сохранения покупок:', e);
        }
    }
    
    function saveCosmeticEffects() {
        try {
            localStorage.setItem('cosmic_cosmetics', JSON.stringify(GameState.cosmeticEffects));
        } catch (e) {
            console.error('Ошибка сохранения косметики:', e);
        }
    }
    
    function initInfoModal() {
        if (!DOM.modalBody) return;
        
        DOM.modalBody.innerHTML = `
            <div class="modal-section">
                <h3><i class="fas fa-gamepad"></i> Управление</h3>
                <div class="hotkey-grid">
                    <div class="hotkey-item">
                        <span class="hotkey">ESC</span>
                        <span class="hotkey-text">Отмена выбора</span>
                    </div>
                    <div class="hotkey-item">
                        <span class="hotkey">P</span>
                        <span class="hotkey-text">Пауза</span>
                    </div>
                    <div class="hotkey-item">
                        <span class="hotkey">F</span>
                        <span class="hotkey-text">Ускорение</span>
                    </div>
                    <div class="hotkey-item">
                        <span class="hotkey">Пробел</span>
                        <span class="hotkey-text">Начать волну</span>
                    </div>
                    <div class="hotkey-item">
                        <span class="hotkey">I</span>
                        <span class="hotkey-text">Информация</span>
                    </div>
                    <div class="hotkey-item">
                        <span class="hotkey">S</span>
                        <span class="hotkey-text">Магазин</span>
                    </div>
                    <div class="hotkey-item">
                        <span class="hotkey">R</span>
                        <span class="hotkey-text">Рестарт (при поражении)</span>
                    </div>
                </div>
            </div>
            
            <div class="modal-section">
                <h3><i class="fas fa-lightbulb"></i> Советы</h3>
                <div class="modal-grid">
                    <div class="modal-item">
                        <h4>Стратегия построек</h4>
                        <p>Ставьте станции вокруг базы для максимальной защиты всех путей.</p>
                    </div>
                    <div class="modal-item">
                        <h4>Улучшение базы</h4>
                        <p>Улучшайте базу для увеличения щитов, дохода и получения новых дронов.</p>
                    </div>
                    <div class="modal-item">
                        <h4>Продажа станций</h4>
                        <p>Вы можете продать станцию за 60% от стоимости для перестройки обороны.</p>
                    </div>
                    <div class="modal-item">
                        <h4>Кристаллы</h4>
                        <p>Кристаллы можно получить за безупречную защиту волны или в магазине.</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    // ==================== УПРАВЛЕНИЕ ИГРОЙ ====================
    function startWave() {
        if (GameState.isWaveActive || GameState.gameOver) {
            return;
        }
        
        GameState.enemiesSpawned = 0;
        GameState.enemiesKilledThisWave = 0;
        GameState.waveEnemiesKilled = 0;
        GameState.waveEnemiesAlive = GameState.enemiesThisWave;
        GameState.waveDamageTaken = 0;
        GameState.isWaveActive = true;
        GameState.waveEnemyTypes = [];
        
        DOM.startWaveBtn.disabled = true;
        DOM.startWaveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> БОЙ';
        
        showMessage(`⚡ Волна ${GameState.currentWave} началась! Уничтожьте ${GameState.enemiesThisWave} врагов.`, 'warning');
    }
    
    function completeWave() {
        GameState.isWaveActive = false;
        
        const waveReward = CONFIG.GAME.BASE_INCOME + GameState.base.incomeBonus + GameState.currentWave * 10;
        GameState.credits += waveReward;
        
        if (GameState.waveDamageTaken === 0) {
            const crystalReward = Math.floor(GameState.currentWave / 2) + 5;
            GameState.crystals += crystalReward;
            if (DOM.crystalsAmount) DOM.crystalsAmount.textContent = GameState.crystals;
            if (DOM.crystalsCount) DOM.crystalsCount.textContent = GameState.crystals;
            
            showNotification(`💎 +${crystalReward} кристаллов за безупречную защиту!`, 'crystal');
        }
        
        GameState.currentWave++;
        
        if (GameState.currentWave > CONFIG.GAME.WAVES_PER_SET) {
            completeSet();
            return;
        }
        
        if (GameState.currentSet > GameState.highScore) {
            GameState.highScore = GameState.currentSet;
            localStorage.setItem('cosmic_highscore', GameState.highScore);
            if (DOM.highscore) DOM.highscore.textContent = GameState.highScore;
        }
        
        localStorage.setItem('cosmic_crystals', GameState.crystals);
        
        DOM.startWaveBtn.disabled = false;
        DOM.startWaveBtn.innerHTML = '<i class="fas fa-play"></i> СТАРТ';
        if (DOM.currentWaveSidebar) DOM.currentWaveSidebar.textContent = GameState.currentWave;
        if (DOM.currentWave) DOM.currentWave.textContent = GameState.currentWave;
        
        generateWavePreview();
        
        showMessage(`✅ Волна завершена! +${waveReward} кредитов.`, 'success');
        updateUI();
    }
    
    function completeSet() {
        GameState.currentSet++;
        
        if (GameState.currentSet > CONFIG.GAME.MAX_SETS) {
            endGame(true);
            return;
        }
        
        GameState.currentWave = 1;
        generatePaths();
        createBaseDrones();
        
        showMessage(`🎉 Сет ${GameState.currentSet - 1} пройден! Начинается сет ${GameState.currentSet}`, 'victory');
        
        updateUI();
        generateWavePreview();
        
        DOM.startWaveBtn.disabled = false;
        DOM.startWaveBtn.innerHTML = '<i class="fas fa-play"></i> СТАРТ';
        if (DOM.set) DOM.set.textContent = `${GameState.currentSet}/${CONFIG.GAME.MAX_SETS}`;
    }
    
    function endGame(isVictory) {
        GameState.isWaveActive = false;
        GameState.gameOver = true;
        GameState.gameWon = isVictory;
        
        if (DOM.gameOverSet) DOM.gameOverSet.textContent = GameState.currentSet - (isVictory ? 1 : 0);
        if (DOM.gameOverWave) DOM.gameOverWave.textContent = GameState.currentWave - 1;
        if (DOM.gameOverCredits) DOM.gameOverCredits.textContent = GameState.credits;
        if (DOM.gameOverKills) DOM.gameOverKills.textContent = GameState.enemiesKilledThisWave;
        if (DOM.gameOverCrystals) DOM.gameOverCrystals.textContent = GameState.crystals;
        
        localStorage.setItem('cosmic_crystals', GameState.crystals);
        
        if (DOM.gameOverModal) DOM.gameOverModal.style.display = 'flex';
        
        if (isVictory) {
            showMessage('🎉 ПОБЕДА! Все сеты пройдены!', 'victory');
        } else {
            showMessage('💀 БАЗА УНИЧТОЖЕНА!', 'error');
        }
        
        DOM.startWaveBtn.disabled = true;
        DOM.startWaveBtn.innerHTML = '<i class="fas fa-flag-checkered"></i> ИГРА ЗАВЕРШЕНА';
    }
    
    function resetGame() {
        GameState.shields = CONFIG.GAME.START_SHIELDS;
        GameState.credits = CONFIG.GAME.START_CREDITS;
        GameState.crystals = CONFIG.GAME.START_CRYSTALS;
        GameState.currentSet = 1;
        GameState.currentWave = 1;
        GameState.isWaveActive = false;
        GameState.isPaused = false;
        GameState.isFastForward = false;
        GameState.gameOver = false;
        GameState.gameWon = false;
        GameState.enemiesSpawned = 0;
        GameState.enemiesKilledThisWave = 0;
        GameState.waveEnemiesKilled = 0;
        GameState.waveEnemiesAlive = 10;
        GameState.base = JSON.parse(JSON.stringify(CONFIG.BASE));
        
        GameState.stations = [];
        GameState.enemies = [];
        GameState.projectiles = [];
        GameState.particles = [];
        GameState.baseDrones = [];
        GameState.satellites = [];
        GameState.harvesters = [];
        
        createStars();
        generateBuildSpots();
        generatePaths();
        createBaseDrones();
        
        clearSelection();
        closeTowerInfo();
        
        updateUI();
        updateBaseInfo();
        generateWavePreview();
        
        if (DOM.fastForwardBtn) DOM.fastForwardBtn.classList.remove('active');
        if (DOM.gameOverModal) DOM.gameOverModal.style.display = 'none';
        DOM.startWaveBtn.disabled = false;
        DOM.startWaveBtn.innerHTML = '<i class="fas fa-play"></i> СТАРТ';
        if (DOM.enemiesLeftMini) DOM.enemiesLeftMini.textContent = '10';
        if (DOM.set) DOM.set.textContent = `1/${CONFIG.GAME.MAX_SETS}`;
        if (DOM.currentWaveSidebar) DOM.currentWaveSidebar.textContent = '1';
        if (DOM.currentWave) DOM.currentWave.textContent = '1';
        if (DOM.waveAttacking) DOM.waveAttacking.textContent = '10';
        if (DOM.waveKilled) DOM.waveKilled.textContent = '0';
        if (DOM.crystalsAmount) DOM.crystalsAmount.textContent = GameState.crystals;
        if (DOM.crystalsCount) DOM.crystalsCount.textContent = GameState.crystals;
        
        showMessage('🔄 Игра сброшена! Приготовьтесь к новой битве!', 'info');
    }
    
    // ==================== ОТРИСОВКА ====================
    function render() {
        DOM.ctx.clearRect(0, 0, DOM.canvas.width, DOM.canvas.height);
        
        drawBackground();
        drawPaths();
        drawBuildSpots();
        drawSatellites();
        drawHarvesters();
        drawStations();
        drawEnemies();
        drawProjectiles();
        drawParticles();
        drawBase();
        drawDrones();
        
        if (GameState.selectedStation && !GameState.isWaveActive) {
            drawStationRange(GameState.selectedStation);
        }
        
        if (GameState.isPaused) drawPauseOverlay();
    }
    
    function drawBackground() {
        // Фон
        DOM.ctx.fillStyle = '#0a0a1a';
        DOM.ctx.fillRect(0, 0, DOM.canvas.width, DOM.canvas.height);
        
        const gradient = DOM.ctx.createRadialGradient(
            DOM.canvas.width / 2, DOM.canvas.height / 2, 0,
            DOM.canvas.width / 2, DOM.canvas.height / 2, Math.max(DOM.canvas.width, DOM.canvas.height)
        );
        gradient.addColorStop(0, 'rgba(10, 10, 42, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 0, 16, 0.8)');
        DOM.ctx.fillStyle = gradient;
        DOM.ctx.fillRect(0, 0, DOM.canvas.width, DOM.canvas.height);
        
        // Звезды
        GameState.stars.forEach(star => {
            const twinkle = Math.sin(GameState.animationTime * star.twinkleSpeed) * 0.2 + 0.8;
            DOM.ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness * twinkle})`;
            DOM.ctx.beginPath();
            DOM.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            DOM.ctx.fill();
        });
    }
    
    function drawPaths() {
        GameState.currentPaths.forEach((path, pathIndex) => {
            if (path.length < 2) return;
            
            DOM.ctx.strokeStyle = `rgba(0, 212, 255, 0.08)`;
            DOM.ctx.lineWidth = 30;
            DOM.ctx.lineCap = 'round';
            DOM.ctx.lineJoin = 'round';
            
            DOM.ctx.beginPath();
            DOM.ctx.moveTo(path[0].x, path[0].y);
            for (let i = 1; i < path.length; i++) {
                DOM.ctx.lineTo(path[i].x, path[i].y);
            }
            DOM.ctx.stroke();
            
            DOM.ctx.strokeStyle = `rgba(0, 255, 157, 0.15)`;
            DOM.ctx.lineWidth = 2;
            DOM.ctx.setLineDash([10, 5]);
            DOM.ctx.stroke();
            DOM.ctx.setLineDash([]);
        });
    }
    
    function drawBuildSpots() {
        GameState.buildSpots.forEach(spot => {
            if (spot.occupied) {
                DOM.ctx.fillStyle = 'rgba(255, 46, 99, 0.3)';
            } else if (GameState.hoveredBuildSpot === spot && GameState.selectedStationType && !GameState.isWaveActive) {
                DOM.ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
            } else {
                DOM.ctx.fillStyle = 'rgba(0, 212, 255, 0.1)';
            }
            
            DOM.ctx.beginPath();
            DOM.ctx.arc(spot.x, spot.y, spot.radius, 0, Math.PI * 2);
            DOM.ctx.fill();
            
            if (spot.occupied) {
                DOM.ctx.strokeStyle = '#ff2e63';
            } else if (GameState.hoveredBuildSpot === spot && GameState.selectedStationType && !GameState.isWaveActive) {
                DOM.ctx.strokeStyle = '#ffd700';
                DOM.ctx.lineWidth = 2;
            } else {
                DOM.ctx.strokeStyle = 'rgba(0, 212, 255, 0.5)';
                DOM.ctx.lineWidth = 1;
            }
            
            DOM.ctx.beginPath();
            DOM.ctx.arc(spot.x, spot.y, spot.radius, 0, Math.PI * 2);
            DOM.ctx.stroke();
            DOM.ctx.lineWidth = 1;
        });
    }
    
    function drawStations() {
        GameState.stations.forEach(station => {
            DOM.ctx.save();
            DOM.ctx.translate(station.x, station.y);
            DOM.ctx.rotate(station.rotation);
            
            // Основа станции
            DOM.ctx.fillStyle = station.color;
            DOM.ctx.beginPath();
            DOM.ctx.arc(0, 0, 18, 0, Math.PI * 2);
            DOM.ctx.fill();
            
            // Ствол
            DOM.ctx.fillStyle = '#ffffff';
            DOM.ctx.fillRect(12, -5, 15, 10);
            
            // Уровень в центре
            DOM.ctx.save();
            DOM.ctx.rotate(-station.rotation);
            DOM.ctx.fillStyle = '#ffffff';
            DOM.ctx.font = 'bold 14px Arial';
            DOM.ctx.textAlign = 'center';
            DOM.ctx.textBaseline = 'middle';
            DOM.ctx.fillText(station.level, 0, 0);
            DOM.ctx.restore();
            
            DOM.ctx.restore();
        });
    }
    
    function drawStationRange(station) {
        DOM.ctx.strokeStyle = 'rgba(255, 215, 0, 0.2)';
        DOM.ctx.lineWidth = 1;
        DOM.ctx.beginPath();
        DOM.ctx.arc(station.x, station.y, station.range, 0, Math.PI * 2);
        DOM.ctx.stroke();
    }
    
    function drawSatellites() {
        GameState.satellites.forEach(satellite => {
            DOM.ctx.save();
            DOM.ctx.translate(satellite.x, satellite.y);
            
            // Основной корпус
            DOM.ctx.fillStyle = satellite.color;
            DOM.ctx.beginPath();
            DOM.ctx.arc(0, 0, 12, 0, Math.PI * 2);
            DOM.ctx.fill();
            
            // Панели
            DOM.ctx.strokeStyle = '#ffffff';
            DOM.ctx.lineWidth = 2;
            for (let i = 0; i < 4; i++) {
                const angle = i * Math.PI / 2 + GameState.animationTime * 0.01;
                DOM.ctx.beginPath();
                DOM.ctx.moveTo(0, 0);
                DOM.ctx.lineTo(Math.cos(angle) * 20, Math.sin(angle) * 20);
                DOM.ctx.stroke();
            }
            
            // Антенна
            DOM.ctx.fillStyle = '#ffffff';
            DOM.ctx.beginPath();
            DOM.ctx.arc(0, 0, 4, 0, Math.PI * 2);
            DOM.ctx.fill();
            
            DOM.ctx.restore();
            
            // Рисуем луч, если есть цель
            if (satellite.target) {
                DOM.ctx.strokeStyle = satellite.color;
                DOM.ctx.lineWidth = 2;
                DOM.ctx.beginPath();
                DOM.ctx.moveTo(satellite.x, satellite.y);
                DOM.ctx.lineTo(satellite.target.x, satellite.target.y);
                DOM.ctx.stroke();
            }
        });
    }
    
    function drawHarvesters() {
        GameState.harvesters.forEach(harvester => {
            DOM.ctx.save();
            DOM.ctx.translate(harvester.x, harvester.y);
            
            // Корпус
            DOM.ctx.fillStyle = harvester.color;
            DOM.ctx.beginPath();
            DOM.ctx.arc(0, 0, 10, 0, Math.PI * 2);
            DOM.ctx.fill();
            
            // Вращающиеся элементы
            for (let i = 0; i < 3; i++) {
                const angle = i * (Math.PI * 2 / 3) + GameState.animationTime * 0.02;
                DOM.ctx.fillStyle = '#ffffff';
                DOM.ctx.beginPath();
                DOM.ctx.arc(
                    Math.cos(angle) * 15,
                    Math.sin(angle) * 15,
                    4,
                    0,
                    Math.PI * 2
                );
                DOM.ctx.fill();
            }
            
            // Центральная часть
            DOM.ctx.fillStyle = '#ffffff';
            DOM.ctx.beginPath();
            DOM.ctx.arc(0, 0, 5, 0, Math.PI * 2);
            DOM.ctx.fill();
            
            DOM.ctx.restore();
        });
    }
    
    function drawEnemies() {
        GameState.enemies.forEach(enemy => {
            DOM.ctx.save();
            DOM.ctx.translate(enemy.x, enemy.y);
            DOM.ctx.rotate(enemy.rotation);
            
            DOM.ctx.fillStyle = enemy.color;
            DOM.ctx.beginPath();
            DOM.ctx.moveTo(enemy.size, 0);
            DOM.ctx.lineTo(-enemy.size, -enemy.size / 2);
            DOM.ctx.lineTo(-enemy.size, enemy.size / 2);
            DOM.ctx.closePath();
            DOM.ctx.fill();
            
            DOM.ctx.restore();
            
            // Здоровье
            const healthPercent = enemy.health / enemy.maxHealth;
            const healthWidth = 30;
            
            DOM.ctx.fillStyle = '#2c3e50';
            DOM.ctx.fillRect(enemy.x - healthWidth / 2, enemy.y - 25, healthWidth, 4);
            
            DOM.ctx.fillStyle = healthPercent > 0.5 ? '#00ff9d' : 
                               healthPercent > 0.25 ? '#ffd700' : '#ff2e63';
            DOM.ctx.fillRect(enemy.x - healthWidth / 2, enemy.y - 25, healthWidth * healthPercent, 4);
        });
    }
    
    function drawProjectiles() {
        GameState.projectiles.forEach(projectile => {
            DOM.ctx.fillStyle = projectile.color;
            DOM.ctx.beginPath();
            DOM.ctx.arc(projectile.x, projectile.y, projectile.size, 0, Math.PI * 2);
            DOM.ctx.fill();
        });
    }
    
    function drawParticles() {
        GameState.particles.forEach(particle => {
            DOM.ctx.fillStyle = particle.color;
            DOM.ctx.globalAlpha = particle.opacity;
            DOM.ctx.beginPath();
            DOM.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            DOM.ctx.fill();
            DOM.ctx.globalAlpha = 1.0;
        });
    }
    
    function drawBase() {
        const centerX = DOM.canvas.width / 2;
        const centerY = DOM.canvas.height / 2;
        
        DOM.ctx.save();
        DOM.ctx.translate(centerX, centerY);
        
        const pulse = Math.sin(GameState.animationTime * 0.001) * 3;
        
        // Эффекты косметики
        if (GameState.cosmeticEffects.gold_base) {
            DOM.ctx.fillStyle = '#ffd700';
            DOM.ctx.shadowColor = '#ffd700';
            DOM.ctx.shadowBlur = 15;
        } else {
            DOM.ctx.fillStyle = '#00bfff';
            DOM.ctx.shadowColor = '#00bfff';
            DOM.ctx.shadowBlur = 10;
        }
        
        DOM.ctx.beginPath();
        DOM.ctx.arc(0, 0, 40 + pulse, 0, Math.PI * 2);
        DOM.ctx.fill();
        
        // Эффект туманности
        if (GameState.cosmeticEffects.nebula_effect) {
            DOM.ctx.strokeStyle = `rgba(157, 78, 221, 0.2)`;
            DOM.ctx.lineWidth = 4;
            DOM.ctx.beginPath();
            DOM.ctx.arc(0, 0, 60 + pulse * 1.5, 0, Math.PI * 2);
            DOM.ctx.stroke();
            
            DOM.ctx.strokeStyle = `rgba(0, 212, 255, 0.3)`;
            DOM.ctx.lineWidth = 2;
            DOM.ctx.beginPath();
            DOM.ctx.arc(0, 0, 70 + pulse, 0, Math.PI * 2);
            DOM.ctx.stroke();
        } else {
            DOM.ctx.strokeStyle = `rgba(0, 212, 255, 0.3)`;
            DOM.ctx.lineWidth = 2;
            DOM.ctx.setLineDash([5, 3]);
            DOM.ctx.beginPath();
            DOM.ctx.arc(0, 0, 60 + pulse, 0, Math.PI * 2);
            DOM.ctx.stroke();
            DOM.ctx.setLineDash([]);
        }
        
        // Антенна
        DOM.ctx.fillStyle = '#ffffff';
        DOM.ctx.fillRect(-1, -60, 2, 20);
        DOM.ctx.beginPath();
        DOM.ctx.arc(0, -60, 5, 0, Math.PI * 2);
        DOM.ctx.fill();
        
        DOM.ctx.restore();
        DOM.ctx.shadowBlur = 0;
        
        // Щиты
        const shieldWidth = 100;
        const shieldPercent = GameState.shields / GameState.base.maxShields;
        
        DOM.ctx.fillStyle = '#2c3e50';
        DOM.ctx.fillRect(centerX - 50, centerY + 60, shieldWidth, 8);
        
        DOM.ctx.fillStyle = shieldPercent > 0.5 ? '#00ff9d' : 
                           shieldPercent > 0.25 ? '#ffd700' : '#ff2e63';
        DOM.ctx.fillRect(centerX - 50, centerY + 60, shieldWidth * shieldPercent, 8);
    }
    
    function drawDrones() {
        GameState.baseDrones.forEach(drone => {
            DOM.ctx.save();
            DOM.ctx.translate(drone.x, drone.y);
            
            DOM.ctx.fillStyle = '#9d4edd';
            DOM.ctx.beginPath();
            DOM.ctx.arc(0, 0, 8, 0, Math.PI * 2);
            DOM.ctx.fill();
            
            DOM.ctx.fillStyle = '#ffffff';
            DOM.ctx.beginPath();
            DOM.ctx.arc(0, 0, 3, 0, Math.PI * 2);
            DOM.ctx.fill();
            
            DOM.ctx.strokeStyle = '#ffffff';
            DOM.ctx.lineWidth = 2;
            for (let i = 0; i < 4; i++) {
                const angle = i * Math.PI / 2 + GameState.animationTime * 0.01;
                DOM.ctx.beginPath();
                DOM.ctx.moveTo(0, 0);
                DOM.ctx.lineTo(Math.cos(angle) * 12, Math.sin(angle) * 12);
                DOM.ctx.stroke();
            }
            
            DOM.ctx.restore();
        });
    }
    
    function drawPauseOverlay() {
        DOM.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        DOM.ctx.fillRect(0, 0, DOM.canvas.width, DOM.canvas.height);
        
        DOM.ctx.fillStyle = '#ffffff';
        DOM.ctx.font = 'bold 48px Arial';
        DOM.ctx.textAlign = 'center';
        DOM.ctx.textBaseline = 'middle';
        DOM.ctx.fillText('ПАУЗА', DOM.canvas.width / 2, DOM.canvas.height / 2);
    }
    
    // ==================== УТИЛИТЫ ====================
    function getStationConfig(type) {
        if (!type) return null;
        
        const upperType = type.toUpperCase();
        if (upperType in CONFIG.STATIONS) {
            return CONFIG.STATIONS[upperType];
        }
        
        return null;
    }
    
    function calculateUpgradeCost(station) {
        return 150 + (station.upgradeCount * 100);
    }
    
    function generateWavePreview() {
        if (!DOM.wavePreview) return;
        
        DOM.wavePreview.innerHTML = '';
        
        const enemyCounts = {
            SCOUT: Math.max(5, Math.floor(GameState.currentWave * 1.5)),
            FIGHTER: GameState.currentWave >= 2 ? Math.max(2, Math.floor(GameState.currentWave * 0.8)) : 0,
            TANK: GameState.currentWave >= 5 ? Math.max(1, Math.floor(GameState.currentWave * 0.3)) : 0
        };
        
        Object.entries(enemyCounts).forEach(([type, count]) => {
            if (count > 0 && CONFIG.ENEMY_TYPES[type]) {
                const enemy = CONFIG.ENEMY_TYPES[type];
                const div = document.createElement('div');
                div.className = 'enemy-preview-item';
                div.style.borderLeftColor = enemy.color;
                div.innerHTML = `
                    <i class="fas fa-robot" style="color: ${enemy.color}"></i>
                    <span class="enemy-preview-name">${enemy.name}</span>
                    <span class="enemy-preview-count">×${count}</span>
                `;
                DOM.wavePreview.appendChild(div);
            }
        });
        
        const crystalDiv = document.createElement('div');
        crystalDiv.className = 'wave-crystals-indicator';
        crystalDiv.innerHTML = `
            <i class="fas fa-gem"></i>
            <span>Кристаллы за волну: <strong>${Math.floor(GameState.currentWave / 2) + 5}</strong></span>
        `;
        DOM.wavePreview.appendChild(crystalDiv);
    }
    
    function showMessage(text, type = 'info') {
        if (DOM.messageText) {
            DOM.messageText.textContent = text;
            
            setTimeout(() => {
                if (DOM.messageText && DOM.messageText.textContent === text) {
                    DOM.messageText.textContent = `Сет ${GameState.currentSet}, Волна ${GameState.currentWave}`;
                }
            }, 3000);
        }
    }
    
    function showNotification(text, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'crystal' ? 'gem' : 
                           type === 'success' ? 'check-circle' : 
                           type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${text}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    function clearSelection() {
        document.querySelectorAll('.station-item').forEach(i => i.classList.remove('selected'));
        GameState.selectedStationType = null;
        if (DOM.selectionIndicator) DOM.selectionIndicator.style.display = 'none';
        GameState.hoveredBuildSpot = null;
    }
    
    function closeTowerInfo() {
        if (DOM.towerInfoPanel) DOM.towerInfoPanel.style.display = 'none';
        GameState.selectedStation = null;
        clearSelection();
    }
    
    function updateUI() {
        if (DOM.lives) DOM.lives.textContent = Math.floor(GameState.shields);
        if (DOM.gold) DOM.gold.textContent = GameState.credits;
        if (DOM.crystalsCount) DOM.crystalsCount.textContent = GameState.crystals;
        if (DOM.set) DOM.set.textContent = `${GameState.currentSet}/${CONFIG.GAME.MAX_SETS}`;
        if (DOM.currentWave) DOM.currentWave.textContent = GameState.currentWave;
        if (DOM.crystalsAmount) DOM.crystalsAmount.textContent = GameState.crystals;
        
        const shieldPercent = GameState.shields / GameState.base.maxShields;
        if (DOM.lives) {
            DOM.lives.style.color = shieldPercent > 0.5 ? '#00ff9d' : 
                                   shieldPercent > 0.25 ? '#ffd700' : '#ff2e63';
        }
        
        if (DOM.gold) {
            DOM.gold.classList.add('pulse');
            setTimeout(() => {
                if (DOM.gold) DOM.gold.classList.remove('pulse');
            }, 300);
        }
    }
    
    function updateBaseInfo() {
        const base = GameState.base;
        if (DOM.baseLevel) DOM.baseLevel.textContent = base.level;
        if (DOM.baseAttack) DOM.baseAttack.textContent = `+${base.attackBonus}%`;
        if (DOM.baseIncome) DOM.baseIncome.textContent = `+${CONFIG.GAME.BASE_INCOME + base.incomeBonus}`;
        if (DOM.baseUpgradeCost) DOM.baseUpgradeCost.textContent = base.upgradeCost;
        updateAvailableSlots();
        updateDronesUI();
    }
    
    function updateAvailableSlots() {
        const occupied = GameState.buildSpots.filter(spot => spot.occupied).length;
        if (DOM.availableSlots) DOM.availableSlots.textContent = `${occupied}/${GameState.base.availableSlots}`;
    }
    
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
        
        base.maxDrones = CONFIG.GAME.DRONES_PER_LEVEL * base.level;
        createBaseDrones();
        
        if (base.availableSlots < base.maxSlots) {
            base.availableSlots = Math.min(base.availableSlots + 1, base.maxSlots);
            generateBuildSpots();
        }
        
        const centerX = DOM.canvas.width / 2;
        const centerY = DOM.canvas.height / 2;
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
        
        showMessage(`🏢 База улучшена до уровня ${base.level}!`, 'success');
        updateBaseInfo();
        updateUI();
    }
    
    // Запуск игры
    init();
});
