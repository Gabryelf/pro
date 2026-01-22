// game.js - Полностью переработанная версия Tower Defence

document.addEventListener('DOMContentLoaded', function() {
    // ==================== КОНСТАНТЫ И НАСТРОЙКИ ====================
    const CONFIG = {
        canvas: {
            width: 800,
            height: 600
        },
        game: {
            startLives: 20,
            startGold: 100,
            startWave: 1,
            maxWaves: 15,
            baseEnemiesPerWave: 5,
            enemySpawnInterval: 1500,
            gameSpeed: 1.0
        },
        cells: {
            size: 40,
            hoverOpacity: 0.3,
            occupiedColor: 'rgba(231, 76, 60, 0.3)',
            freeColor: 'rgba(0, 173, 181, 0.3)'
        },
        colors: {
            path: '#2ecc71',
            pathBorder: '#27ae60',
            grid: 'rgba(255, 255, 255, 0.05)',
            text: '#ffffff',
            healthGood: '#2ecc71',
            healthMedium: '#f39c12',
            healthLow: '#e74c3c'
        },
        towerTypes: {
            basic: {
                name: 'Базовая',
                cost: 30,
                damage: 8,
                range: 160,
                color: '#3498db',
                upgradeCost: 25,
                fireRate: 800,
                sellRatio: 0.6,
                description: 'Быстрая атака по одной цели'
            },
            sniper: {
                name: 'Снайпер',
                cost: 80,
                damage: 35,
                range: 320,
                color: '#9b59b6',
                upgradeCost: 60,
                fireRate: 2200,
                sellRatio: 0.6,
                description: 'Высокий урон, медленная стрельба'
            },
            splash: {
                name: 'Облачная',
                cost: 60,
                damage: 12,
                range: 140,
                color: '#e74c3c',
                upgradeCost: 45,
                fireRate: 1500,
                splashRadius: 70,
                sellRatio: 0.6,
                description: 'Урон по области, средняя скорость'
            }
        },
        enemyTypes: [
            { health: 25, speed: 1.3, color: '#2ecc71', gold: 8, size: 12, name: 'Быстрый' },
            { health: 60, speed: 0.9, color: '#f39c12', gold: 18, size: 16, name: 'Бронированный' },
            { health: 120, speed: 0.6, color: '#e74c3c', gold: 35, size: 20, name: 'Босс' }
        ]
    };

    // ==================== СОСТОЯНИЕ ИГРЫ ====================
    const GameState = {
        // Основные параметры
        lives: CONFIG.game.startLives,
        gold: CONFIG.game.startGold,
        wave: CONFIG.game.startWave,
        highScore: parseInt(localStorage.getItem('td_highscore')) || 0,
        
        // Статусы
        isWaveActive: false,
        isPaused: false,
        gameOver: false,
        gameWon: false,
        
        // Выбор
        selectedTowerType: null,
        selectedTower: null,
        
        // Объекты игры
        towers: [],
        enemies: [],
        projectiles: [],
        particles: [],
        cells: [],
        
        // Таймеры
        lastTime: 0,
        enemySpawnTimer: 0,
        enemiesSpawned: 0,
        enemiesKilledThisWave: 0,
        
        // Прогресс волны
        enemiesThisWave: CONFIG.game.baseEnemiesPerWave,
        
        // Путь врагов (в координатах от 0 до 1)
        enemyPath: [
            { x: -0.05, y: 0.5 },
            { x: 0.1, y: 0.5 },
            { x: 0.1, y: 0.2 },
            { x: 0.4, y: 0.2 },
            { x: 0.4, y: 0.6 },
            { x: 0.7, y: 0.6 },
            { x: 0.7, y: 0.3 },
            { x: 1.05, y: 0.3 }
        ]
    };

    // ==================== DOM ЭЛЕМЕНТЫ ====================
    const elements = {
        canvas: document.getElementById('gameCanvas'),
        ctx: document.getElementById('gameCanvas').getContext('2d'),
        lives: document.getElementById('lives'),
        gold: document.getElementById('gold'),
        wave: document.getElementById('wave'),
        highScore: document.getElementById('highScore'),
        waveProgress: document.getElementById('waveProgress'),
        startWaveBtn: document.getElementById('startWave'),
        upgradeBtn: document.getElementById('upgradeTower'),
        sellBtn: document.getElementById('sellTower'),
        gameMessages: document.getElementById('gameMessages'),
        towerItems: document.querySelectorAll('.tower-item'),
        selectedTowerInfo: document.getElementById('selectedTowerInfo'),
        towerLevel: document.getElementById('towerLevel'),
        towerDamage: document.getElementById('towerDamage'),
        towerRange: document.getElementById('towerRange'),
        towerUpgradeCost: document.getElementById('towerUpgradeCost'),
        upgradeCostBtn: document.getElementById('upgradeCost'),
        enemyCountBasic: document.getElementById('enemyCountBasic'),
        enemyCountTough: document.getElementById('enemyCountTough'),
        enemyCountBoss: document.getElementById('enemyCountBoss'),
        nextWaveTimer: document.getElementById('nextWaveTimer')
    };

    // ==================== ИНИЦИАЛИЗАЦИЯ ====================
    function init() {
        console.log('🚀 Игра Tower Defence запускается...');
        
        // Настройка canvas
        elements.canvas.width = CONFIG.canvas.width;
        elements.canvas.height = CONFIG.canvas.height;
        
        // Инициализация игрового поля
        initGameField();
        
        // Настройка обработчиков событий
        setupEventListeners();
        
        // Загрузка рекорда
        elements.highScore.textContent = GameState.highScore;
        
        // Начальное обновление UI
        updateUI();
        
        // Показ начального сообщения
        showMessage('🎮 Добро пожаловать в Башенную Оборону! Выберите башню и начните защищаться.', 'info');
        
        // Обновление предпросмотра врагов
        updateEnemyPreview();
        
        // Запуск игрового цикла
        requestAnimationFrame(gameLoop);
        
        console.log('✅ Игра успешно инициализирована!');
    }

    // ==================== ИГРОВОЕ ПОЛЕ ====================
    function initGameField() {
        console.log('🛠️ Создание игрового поля...');
        
        // Создание сетки клеток
        const cols = Math.floor(CONFIG.canvas.width / CONFIG.cells.size);
        const rows = Math.floor(CONFIG.canvas.height / CONFIG.cells.size);
        
        for (let x = 0; x < cols; x++) {
            for (let y = 0; y < rows; y++) {
                GameState.cells.push({
                    x: x * CONFIG.cells.size,
                    y: y * CONFIG.cells.size,
                    width: CONFIG.cells.size,
                    height: CONFIG.cells.size,
                    occupied: false,
                    tower: null,
                    hovered: false
                });
            }
        }
        
        // Отметка пути как занятого
        markPathAsOccupied();
        
        // Создание фоновых частиц
        createBackgroundParticles();
        
        console.log(`✅ Создано ${GameState.cells.length} клеток`);
    }

    function markPathAsOccupied() {
        const pixelPath = getPixelPath();
        const pathWidth = CONFIG.cells.size * 2;
        
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
                    break;
                }
            }
        });
    }

    function createBackgroundParticles() {
        for (let i = 0; i < 40; i++) {
            GameState.particles.push({
                x: Math.random() * CONFIG.canvas.width,
                y: Math.random() * CONFIG.canvas.height,
                size: Math.random() * 1.5 + 0.5,
                speedX: (Math.random() - 0.5) * 0.3,
                speedY: (Math.random() - 0.5) * 0.3,
                opacity: Math.random() * 0.2 + 0.1,
                color: Math.random() > 0.5 ? '#3498db' : '#9b59b6'
            });
        }
    }

    // ==================== ОБРАБОТЧИКИ СОБЫТИЙ ====================
    function setupEventListeners() {
        console.log('🎮 Настройка обработчиков событий...');
        
        // Выбор башни в магазине
        elements.towerItems.forEach(item => {
            item.addEventListener('click', handleTowerSelection);
        });
        
        // Взаимодействие с canvas
        elements.canvas.addEventListener('click', handleCanvasClick);
        elements.canvas.addEventListener('mousemove', handleCanvasMouseMove);
        elements.canvas.addEventListener('contextmenu', handleCanvasRightClick);
        
        // Кнопки управления
        elements.startWaveBtn.addEventListener('click', handleStartWave);
        elements.upgradeBtn.addEventListener('click', handleUpgradeTower);
        elements.sellBtn.addEventListener('click', handleSellTower);
        
        // Горячие клавиши
        document.addEventListener('keydown', handleKeyPress);
        
        // Создание кнопки сброса
        createResetButton();
        
        console.log('✅ Обработчики событий настроены');
    }

    function handleTowerSelection(e) {
        if (GameState.isWaveActive) {
            showMessage('❌ Нельзя покупать башни во время волны!', 'error');
            return;
        }
        
        const towerType = this.dataset.type;
        const towerConfig = CONFIG.towerTypes[towerType];
        
        // Сброс предыдущего выбора
        elements.towerItems.forEach(item => item.classList.remove('selected'));
        
        // Установка нового выбора
        this.classList.add('selected');
        GameState.selectedTowerType = towerType;
        
        // Обновление курсора
        elements.canvas.style.cursor = 'crosshair';
        
        // Сообщение
        showMessage(`🎯 Выбрана ${towerConfig.name}. Кликните на свободную клетку для установки.`, 'info');
        
        // Звуковой эффект
        playSound('select');
    }

    function handleCanvasClick(e) {
        const rect = elements.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Если выбрана башня для установки
        if (GameState.selectedTowerType && !GameState.isWaveActive) {
            placeTowerAt(x, y);
            return;
        }
        
        // Если идет волна или нет выбора башни - выбор существующей башни
        if (!GameState.selectedTowerType) {
            selectTowerAt(x, y);
        }
    }

    function handleCanvasMouseMove(e) {
        const rect = elements.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Сброс состояния наведения
        GameState.cells.forEach(cell => cell.hovered = false);
        
        // Нахождение клетки под курсором
        const cell = GameState.cells.find(c =>
            x >= c.x && x <= c.x + c.width &&
            y >= c.y && y <= c.y + c.height
        );
        
        if (cell) {
            cell.hovered = true;
            
            // Обновление курсора
            if (GameState.selectedTowerType && !GameState.isWaveActive) {
                elements.canvas.style.cursor = (cell.occupied || GameState.gold < CONFIG.towerTypes[GameState.selectedTowerType].cost)
                    ? 'not-allowed'
                    : 'pointer';
            }
        }
    }

    function handleCanvasRightClick(e) {
        e.preventDefault();
        
        const rect = elements.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Поиск башни для показа информации
        for (const tower of GameState.towers) {
            const dx = x - tower.x;
            const dy = y - tower.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 20) {
                showTowerInfo(tower);
                return;
            }
        }
    }

    function handleStartWave() {
        if (GameState.isWaveActive || GameState.gameOver || GameState.gameWon) return;
        
        startWave();
    }

    function handleUpgradeTower() {
        if (!GameState.selectedTower || GameState.isWaveActive) return;
        
        upgradeTower(GameState.selectedTower);
    }

    function handleSellTower() {
        if (!GameState.selectedTower || GameState.isWaveActive) return;
        
        sellTower(GameState.selectedTower);
    }

    function handleKeyPress(e) {
        switch(e.key.toLowerCase()) {
            case 'escape':
                deselectTower();
                resetTowerSelection();
                break;
            case ' ':
                if (!GameState.isWaveActive && !GameState.gameOver && !GameState.gameWon) {
                    startWave();
                }
                break;
            case '1':
                document.querySelector('.tower-item[data-type="basic"]').click();
                break;
            case '2':
                document.querySelector('.tower-item[data-type="sniper"]').click();
                break;
            case '3':
                document.querySelector('.tower-item[data-type="splash"]').click();
                break;
            case 'u':
                if (GameState.selectedTower) {
                    upgradeTower(GameState.selectedTower);
                }
                break;
            case 's':
                if (GameState.selectedTower) {
                    sellTower(GameState.selectedTower);
                }
                break;
            case 'p':
                togglePause();
                break;
        }
    }

    function createResetButton() {
        const resetBtn = document.createElement('button');
        resetBtn.innerHTML = '<i class="fas fa-redo"></i>';
        resetBtn.className = 'btn-reset';
        resetBtn.title = 'Начать заново (R)';
        resetBtn.addEventListener('click', resetGame);
        
        document.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'r' && (GameState.gameOver || GameState.gameWon)) {
                resetGame();
            }
        });
        
        document.querySelector('.game-header').appendChild(resetBtn);
    }

    // ==================== ФУНКЦИИ БАШЕН ====================
    function placeTowerAt(x, y) {
        const cell = GameState.cells.find(c =>
            x >= c.x && x <= c.x + c.width &&
            y >= c.y && y <= c.y + c.height
        );
        
        if (!cell) return;
        
        const towerConfig = CONFIG.towerTypes[GameState.selectedTowerType];
        
        // Проверка возможности установки
        if (cell.occupied) {
            showMessage('❌ Эта клетка занята!', 'error');
            return;
        }
        
        if (GameState.gold < towerConfig.cost) {
            showMessage(`❌ Недостаточно золота! Нужно ${towerConfig.cost}`, 'error');
            return;
        }
        
        // Создание башни
        const tower = {
            x: cell.x + cell.width / 2,
            y: cell.y + cell.height / 2,
            type: GameState.selectedTowerType,
            name: towerConfig.name,
            damage: towerConfig.damage,
            range: towerConfig.range,
            color: towerConfig.color,
            upgradeCost: towerConfig.upgradeCost,
            level: 1,
            fireRate: towerConfig.fireRate,
            lastShot: 0,
            target: null,
            splashRadius: towerConfig.splashRadius || 0,
            sellValue: Math.floor(towerConfig.cost * towerConfig.sellRatio),
            rotation: 0,
            cell: cell
        };
        
        // Добавление башни
        GameState.towers.push(tower);
        cell.occupied = true;
        cell.tower = tower;
        
        // Списание золота
        GameState.gold -= towerConfig.cost;
        
        // Эффекты
        createPlacementEffect(tower.x, tower.y, tower.color);
        playSound('place');
        
        // Сообщение
        showMessage(`✅ ${towerConfig.name} установлена!`, 'success');
        
        // Обновление UI и сброс выбора
        updateUI();
        resetTowerSelection();
    }

    function selectTowerAt(x, y) {
        for (const tower of GameState.towers) {
            const dx = x - tower.x;
            const dy = y - tower.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 20) {
                selectTower(tower);
                playSound('select');
                return;
            }
        }
        
        // Клик мимо башни
        deselectTower();
    }

    function selectTower(tower) {
        GameState.selectedTower = tower;
        elements.selectedTowerInfo.style.display = 'block';
        updateTowerInfo(tower);
        updateUI();
        
        // Подсветка
        drawTowerRange(tower);
    }

    function deselectTower() {
        GameState.selectedTower = null;
        elements.selectedTowerInfo.style.display = 'none';
        updateUI();
    }

    function updateTowerInfo(tower) {
        elements.towerLevel.textContent = tower.level;
        elements.towerDamage.textContent = tower.damage;
        elements.towerRange.textContent = tower.range;
        elements.towerUpgradeCost.textContent = tower.upgradeCost;
        elements.upgradeCostBtn.textContent = tower.upgradeCost;
    }

    function showTowerInfo(tower) {
        const info = `
            <strong>${tower.name} (ур. ${tower.level})</strong><br>
            Урон: ${tower.damage}<br>
            Дальность: ${tower.range}<br>
            Скорость: ${Math.floor(1000 / tower.fireRate)} выстр/сек<br>
            ${tower.splashRadius ? `Область: ${tower.splashRadius}px<br>` : ''}
            Улучшение: ${tower.upgradeCost} золота<br>
            Продажа: ${tower.sellValue} золота
        `;
        
        showMessage(info, 'info', 4000);
    }

    function upgradeTower(tower) {
        if (GameState.gold < tower.upgradeCost) {
            showMessage(`❌ Недостаточно золота! Нужно ${tower.upgradeCost}`, 'error');
            return;
        }
        
        // Списание золота
        GameState.gold -= tower.upgradeCost;
        
        // Улучшение характеристик
        tower.level++;
        tower.damage = Math.floor(tower.damage * 1.7);
        tower.range = Math.floor(tower.range * 1.15);
        tower.upgradeCost = Math.floor(tower.upgradeCost * 1.6);
        tower.sellValue = Math.floor(tower.sellValue * 1.4);
        
        if (tower.splashRadius) {
            tower.splashRadius = Math.floor(tower.splashRadius * 1.1);
        }
        
        tower.fireRate = Math.max(400, tower.fireRate * 0.85);
        
        // Эффекты
        createUpgradeEffect(tower.x, tower.y);
        playSound('upgrade');
        
        // Сообщение
        showMessage(`⬆️ Башня улучшена до уровня ${tower.level}!`, 'success');
        
        // Обновление UI
        updateUI();
        updateTowerInfo(tower);
    }

    function sellTower(tower) {
        if (!confirm(`Продать ${tower.name} за ${tower.sellValue} золота?`)) {
            return;
        }
        
        // Возврат золота
        GameState.gold += tower.sellValue;
        
        // Удаление башни
        const index = GameState.towers.indexOf(tower);
        if (index > -1) {
            GameState.towers.splice(index, 1);
        }
        
        // Освобождение клетки
        if (tower.cell) {
            tower.cell.occupied = false;
            tower.cell.tower = null;
        }
        
        // Эффекты
        createSellEffect(tower.x, tower.y, tower.sellValue);
        playSound('sell');
        
        // Сообщение
        showMessage(`💰 Башня продана за ${tower.sellValue} золота!`, 'success');
        
        // Сброс выбора
        deselectTower();
        updateUI();
    }

    function resetTowerSelection() {
        elements.towerItems.forEach(item => item.classList.remove('selected'));
        GameState.selectedTowerType = null;
        elements.canvas.style.cursor = 'default';
    }

    function updateTowers(deltaTime) {
        GameState.towers.forEach(tower => {
            // Вращение к цели
            if (tower.target && tower.target.health > 0) {
                const dx = tower.target.x - tower.x;
                const dy = tower.target.y - tower.y;
                tower.rotation = Math.atan2(dy, dx);
            }
            
            // Поиск цели
            if (!tower.target || tower.target.health <= 0) {
                tower.target = findTargetForTower(tower);
            }
            
            // Стрельба
            if (tower.target && tower.target.health > 0) {
                const currentTime = Date.now();
                if (currentTime - tower.lastShot > tower.fireRate) {
                    shootFromTower(tower, tower.target);
                    tower.lastShot = currentTime;
                }
            }
        });
    }

    function findTargetForTower(tower) {
        let closestEnemy = null;
        let closestDistance = tower.range;
        
        for (const enemy of GameState.enemies) {
            const dx = enemy.x - tower.x;
            const dy = enemy.y - tower.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < closestDistance) {
                closestEnemy = enemy;
                closestDistance = distance;
            }
        }
        
        return closestEnemy;
    }

    function shootFromTower(tower, target) {
        const projectile = {
            x: tower.x,
            y: tower.y,
            target: target,
            damage: tower.damage,
            color: tower.color,
            speed: 10,
            size: 6,
            splashRadius: tower.splashRadius,
            fromTower: tower
        };
        
        GameState.projectiles.push(projectile);
        
        // Эффект выстрела
        createShotEffect(tower.x, tower.y);
        playSound('shoot');
    }

    // ==================== ФУНКЦИИ ВРАГОВ ====================
    function startWave() {
        if (GameState.isWaveActive) return;
        
        // Расчет количества врагов
        GameState.enemiesThisWave = CONFIG.game.baseEnemiesPerWave + Math.floor((GameState.wave - 1) * 1.5);
        GameState.enemiesSpawned = 0;
        GameState.enemiesKilledThisWave = 0;
        GameState.enemySpawnTimer = 0;
        GameState.isWaveActive = true;
        
        // Обновление UI
        elements.startWaveBtn.disabled = true;
        elements.startWaveBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Волна ${GameState.wave}`;
        
        // Обновление предпросмотра
        updateEnemyPreview();
        
        // Сообщение
        showMessage(`⚡ Началась волна ${GameState.wave}! Уничтожьте ${GameState.enemiesThisWave} врагов.`, 'warning');
        playSound('waveStart');
    }

    function updateEnemyPreview() {
        const totalEnemies = GameState.enemiesThisWave;
        let basicCount = totalEnemies;
        let toughCount = 0;
        let bossCount = 0;
        
        // Расчет типов врагов в зависимости от волны
        if (GameState.wave >= 3) {
            toughCount = Math.min(Math.floor(totalEnemies * 0.3), 5);
            basicCount -= toughCount;
        }
        
        if (GameState.wave >= 6) {
            bossCount = Math.min(Math.floor(totalEnemies * 0.2), 3);
            basicCount -= bossCount;
        }
        
        elements.enemyCountBasic.textContent = Math.max(0, basicCount);
        elements.enemyCountTough.textContent = toughCount;
        elements.enemyCountBoss.textContent = bossCount;
    }

    function spawnEnemy() {
        // Определение типа врага
        let typeIndex = 0;
        const wave = GameState.wave;
        
        if (wave >= 6 && Math.random() < 0.15) {
            typeIndex = 2; // Босс
        } else if (wave >= 3 && Math.random() < 0.3) {
            typeIndex = 1; // Бронированный
        }
        
        const enemyType = CONFIG.enemyTypes[typeIndex];
        const pixelPath = getPixelPath();
        
        // Создание врага
        const enemy = {
            x: pixelPath[0].x,
            y: pixelPath[0].y,
            health: enemyType.health * (1 + (wave - 1) * 0.1),
            maxHealth: enemyType.health * (1 + (wave - 1) * 0.1),
            speed: enemyType.speed,
            color: enemyType.color,
            gold: Math.floor(enemyType.gold * (1 + (wave - 1) * 0.05)),
            size: enemyType.size,
            name: enemyType.name,
            pathIndex: 0,
            path: pixelPath,
            reachedEnd: false,
            typeIndex: typeIndex,
            lastHit: 0,
            isBoss: typeIndex === 2
        };
        
        GameState.enemies.push(enemy);
        GameState.enemiesSpawned++;
        
        // Обновление прогресса волны
        updateWaveProgress();
        
        return enemy;
    }

    function updateEnemies(deltaTime) {
        for (let i = GameState.enemies.length - 1; i >= 0; i--) {
            const enemy = GameState.enemies[i];
            
            // Проверка достижения конца
            if (enemy.reachedEnd) {
                handleEnemyReachedEnd(enemy, i);
                continue;
            }
            
            // Движение по пути
            moveEnemy(enemy, deltaTime);
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
            // Достигли точки, переходим к следующей
            enemy.pathIndex++;
            
            if (enemy.pathIndex >= enemy.path.length - 1) {
                enemy.reachedEnd = true;
            }
        } else {
            // Движение к точке
            const moveDistance = enemy.speed * (deltaTime / 16) * CONFIG.game.gameSpeed;
            enemy.x += (dx / distance) * moveDistance;
            enemy.y += (dy / distance) * moveDistance;
        }
    }

    function handleEnemyReachedEnd(enemy, index) {
        GameState.lives--;
        updateUI();
        
        // Эффект потери жизни
        createDamageEffect(enemy.x, enemy.y, '#e74c3c');
        elements.gameMessages.style.animation = 'shake 0.5s';
        setTimeout(() => elements.gameMessages.style.animation = '', 500);
        
        // Удаление врага
        GameState.enemies.splice(index, 1);
        
        // Сообщение
        showMessage(`💔 Враг достиг цели! Осталось ${GameState.lives} жизней.`, 'error');
        playSound('lifeLost');
        
        // Проверка поражения
        if (GameState.lives <= 0) {
            endGame(false);
        }
    }

    function updateWaveProgress() {
        const progress = (GameState.enemiesSpawned / GameState.enemiesThisWave) * 100;
        elements.waveProgress.style.width = `${progress}%`;
    }

    // ==================== СНАРЯДЫ И УРОН ====================
    function updateProjectiles(deltaTime) {
        for (let i = GameState.projectiles.length - 1; i >= 0; i--) {
            const projectile = GameState.projectiles[i];
            
            // Проверка цели
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
                const speed = projectile.speed * (deltaTime / 16) * CONFIG.game.gameSpeed;
                projectile.x += (dx / distance) * speed;
                projectile.y += (dy / distance) * speed;
            }
        }
    }

    function applyDamage(projectile) {
        if (projectile.splashRadius > 0) {
            // Урон по области
            applySplashDamage(projectile);
        } else {
            // Одиночный урон
            applySingleDamage(projectile);
        }
    }

    function applySplashDamage(projectile) {
        let hitEnemies = 0;
        
        for (const enemy of GameState.enemies) {
            const dx = enemy.x - projectile.target.x;
            const dy = enemy.y - projectile.target.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < projectile.splashRadius) {
                // Уменьшение урона с расстоянием
                const damageMultiplier = 1 - (distance / projectile.splashRadius) * 0.6;
                const damage = Math.floor(projectile.damage * damageMultiplier);
                
                enemy.health -= damage;
                enemy.lastHit = Date.now();
                hitEnemies++;
                
                if (enemy.health <= 0) {
                    killEnemy(enemy);
                }
            }
        }
        
        if (hitEnemies > 1) {
            showMessage(`💥 Попадание по ${hitEnemies} врагам!`, 'info', 1500);
        }
    }

    function applySingleDamage(projectile) {
        projectile.target.health -= projectile.damage;
        projectile.target.lastHit = Date.now();
        
        if (projectile.target.health <= 0) {
            killEnemy(projectile.target);
        }
    }

    function killEnemy(enemy) {
        // Награда
        GameState.gold += enemy.gold;
        GameState.enemiesKilledThisWave++;
        
        // Эффекты
        createDeathEffect(enemy);
        playSound('enemyDeath');
        
        // Сообщение (только для боссов)
        if (enemy.isBoss) {
            showMessage(`👑 Босс уничтожен! +${enemy.gold} золота`, 'success');
        }
        
        updateUI();
    }

    // ==================== ЭФФЕКТЫ И ЧАСТИЦЫ ====================
    function createPlacementEffect(x, y, color) {
        for (let i = 0; i < 12; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 2 + 1;
            GameState.particles.push({
                x, y,
                size: Math.random() * 3 + 1,
                speedX: Math.cos(angle) * speed,
                speedY: Math.sin(angle) * speed,
                color: color,
                opacity: 1,
                life: 25
            });
        }
    }

    function createUpgradeEffect(x, y) {
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 + 1;
            GameState.particles.push({
                x, y,
                size: Math.random() * 3 + 2,
                speedX: Math.cos(angle) * speed,
                speedY: Math.sin(angle) * speed,
                color: '#ffd369',
                opacity: 1,
                life: 30
            });
        }
    }

    function createSellEffect(x, y, amount) {
        for (let i = 0; i < 15; i++) {
            GameState.particles.push({
                x, y,
                size: Math.random() * 4 + 2,
                speedX: (Math.random() - 0.5) * 4,
                speedY: Math.random() * -3 - 2,
                color: '#ffd369',
                opacity: 1,
                life: 40,
                isCoin: true,
                text: i === 0 ? `+${amount}` : null
            });
        }
    }

    function createShotEffect(x, y) {
        // Вспышка
        GameState.particles.push({
            x, y,
            size: 8,
            speedX: 0,
            speedY: 0,
            color: '#ffffff',
            opacity: 1,
            life: 5
        });
        
        // Дым
        for (let i = 0; i < 3; i++) {
            GameState.particles.push({
                x, y,
                size: Math.random() * 3 + 2,
                speedX: (Math.random() - 0.5) * 2,
                speedY: (Math.random() - 0.5) * 2,
                color: '#cccccc',
                opacity: 0.7,
                life: 20
            });
        }
    }

    function createHitEffect(projectile) {
        if (projectile.splashRadius > 0) {
            createExplosionEffect(projectile.target.x, projectile.target.y, projectile.splashRadius, projectile.color);
        } else {
            createDamageEffect(projectile.target.x, projectile.target.y, projectile.color);
        }
    }

    function createExplosionEffect(x, y, radius, color) {
        // Взрыв
        for (let i = 0; i < 25; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 4 + 2;
            GameState.particles.push({
                x, y,
                size: Math.random() * 4 + 2,
                speedX: Math.cos(angle) * speed,
                speedY: Math.sin(angle) * speed,
                color: color,
                opacity: 1,
                life: 35
            });
        }
        
        // Волна
        drawExplosionWave(x, y, radius, color);
    }

    function createDamageEffect(x, y, color) {
        for (let i = 0; i < 8; i++) {
            GameState.particles.push({
                x, y,
                size: Math.random() * 3 + 1,
                speedX: (Math.random() - 0.5) * 5,
                speedY: (Math.random() - 0.5) * 5,
                color: color,
                opacity: 1,
                life: 20
            });
        }
    }

    function createDeathEffect(enemy) {
        // Частицы смерти
        for (let i = 0; i < 20; i++) {
            GameState.particles.push({
                x: enemy.x,
                y: enemy.y,
                size: Math.random() * 4 + 1,
                speedX: (Math.random() - 0.5) * 4,
                speedY: (Math.random() - 0.5) * 4,
                color: enemy.color,
                opacity: 1,
                life: 30
            });
        }
        
        // Золотые монеты
        const coinCount = Math.min(10, Math.floor(enemy.gold / 5));
        for (let i = 0; i < coinCount; i++) {
            GameState.particles.push({
                x: enemy.x,
                y: enemy.y,
                size: Math.random() * 3 + 2,
                speedX: (Math.random() - 0.5) * 3,
                speedY: Math.random() * -4 - 2,
                color: '#ffd369',
                opacity: 1,
                life: 40,
                isCoin: true
            });
        }
    }

    function updateParticles(deltaTime) {
        for (let i = GameState.particles.length - 1; i >= 0; i--) {
            const particle = GameState.particles[i];
            
            // Обновление позиции
            particle.x += particle.speedX * (deltaTime / 16);
            particle.y += particle.speedY * (deltaTime / 16);
            
            // Обновление жизни
            if (particle.life) {
                particle.life--;
                particle.opacity = particle.life / (particle.isCoin ? 40 : 30);
                
                // Гравитация для монет
                if (particle.isCoin) {
                    particle.speedY += 0.15;
                }
                
                if (particle.life <= 0) {
                    GameState.particles.splice(i, 1);
                }
            } else {
                // Фоновые частицы
                particle.x += particle.speedX * (deltaTime / 16);
                particle.y += particle.speedY * (deltaTime / 16);
                
                // Возврат частиц
                if (particle.x < -10) particle.x = CONFIG.canvas.width + 10;
                if (particle.x > CONFIG.canvas.width + 10) particle.x = -10;
                if (particle.y < -10) particle.y = CONFIG.canvas.height + 10;
                if (particle.y > CONFIG.canvas.height + 10) particle.y = -10;
            }
        }
    }

    // ==================== ОТРИСОВКА ====================
    function draw() {
        // Очистка
        elements.ctx.clearRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);
        
        // Фоновые частицы
        drawParticles();
        
        // Сетка
        drawGrid();
        
        // Путь
        drawPath();
        
        // Подсветка клеток
        drawHoveredCells();
        
        // Башни
        GameState.towers.forEach(drawTower);
        
        // Враги
        GameState.enemies.forEach(drawEnemy);
        
        // Снаряды
        GameState.projectiles.forEach(drawProjectile);
        
        // Радиус выбранной башни
        if (GameState.selectedTower && !GameState.isWaveActive) {
            drawTowerRange(GameState.selectedTower);
        }
        
        // Эффект паузы
        if (GameState.isPaused) {
            drawPauseOverlay();
        }
        
        // Эффект победы/поражения
        if (GameState.gameOver) {
            drawGameOverOverlay();
        } else if (GameState.gameWon) {
            drawVictoryOverlay();
        }
    }

    function drawParticles() {
        GameState.particles.forEach(particle => {
            elements.ctx.globalAlpha = particle.opacity || 0.3;
            
            if (particle.isCoin) {
                // Монетка
                elements.ctx.fillStyle = particle.color;
                elements.ctx.beginPath();
                elements.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                elements.ctx.fill();
                
                // Обводка
                elements.ctx.strokeStyle = '#ff9f1a';
                elements.ctx.lineWidth = 1;
                elements.ctx.stroke();
                
                // Блеск
                elements.ctx.fillStyle = '#ffffff';
                elements.ctx.fillRect(particle.x - 1, particle.y - 1, 2, 2);
                
                // Текст с суммой
                if (particle.text) {
                    elements.ctx.fillStyle = '#ffd369';
                    elements.ctx.font = 'bold 14px Arial';
                    elements.ctx.textAlign = 'center';
                    elements.ctx.fillText(particle.text, particle.x, particle.y - 15);
                }
            } else {
                // Обычная частица
                elements.ctx.fillStyle = particle.color;
                elements.ctx.beginPath();
                elements.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                elements.ctx.fill();
            }
            
            elements.ctx.globalAlpha = 1;
        });
    }

    function drawGrid() {
        elements.ctx.strokeStyle = CONFIG.colors.grid;
        elements.ctx.lineWidth = 1;
        
        // Вертикальные линии
        for (let x = 0; x <= CONFIG.canvas.width; x += CONFIG.cells.size) {
            elements.ctx.beginPath();
            elements.ctx.moveTo(x, 0);
            elements.ctx.lineTo(x, CONFIG.canvas.height);
            elements.ctx.stroke();
        }
        
        // Горизонтальные линии
        for (let y = 0; y <= CONFIG.canvas.height; y += CONFIG.cells.size) {
            elements.ctx.beginPath();
            elements.ctx.moveTo(0, y);
            elements.ctx.lineTo(CONFIG.canvas.width, y);
            elements.ctx.stroke();
        }
    }

    function drawPath() {
        const path = getPixelPath();
        
        if (path.length < 2) return;
        
        // Основной путь
        elements.ctx.strokeStyle = CONFIG.colors.path;
        elements.ctx.lineWidth = 40;
        elements.ctx.lineCap = 'round';
        elements.ctx.lineJoin = 'round';
        
        elements.ctx.beginPath();
        elements.ctx.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length; i++) {
            elements.ctx.lineTo(path[i].x, path[i].y);
        }
        elements.ctx.stroke();
        
        // Обводка пути
        elements.ctx.strokeStyle = CONFIG.colors.pathBorder;
        elements.ctx.lineWidth = 3;
        elements.ctx.stroke();
        
        // Точки пути
        path.forEach((point, i) => {
            let color, label;
            
            if (i === 0) {
                color = '#e74c3c';
                label = 'Старт';
            } else if (i === path.length - 1) {
                color = '#3498db';
                label = 'Финиш';
            } else {
                color = '#f1c40f';
            }
            
            // Точка
            elements.ctx.fillStyle = color;
            elements.ctx.beginPath();
            elements.ctx.arc(point.x, point.y, 12, 0, Math.PI * 2);
            elements.ctx.fill();
            
            // Обводка
            elements.ctx.strokeStyle = '#2c3e50';
            elements.ctx.lineWidth = 2;
            elements.ctx.stroke();
            
            // Метка
            if (label) {
                elements.ctx.fillStyle = '#ffffff';
                elements.ctx.font = 'bold 11px Arial';
                elements.ctx.textAlign = 'center';
                elements.ctx.textBaseline = 'middle';
                elements.ctx.fillText(label, point.x, point.y);
            }
        });
    }

    function drawHoveredCells() {
        if (!GameState.selectedTowerType || GameState.isWaveActive) return;
        
        const towerConfig = CONFIG.towerTypes[GameState.selectedTowerType];
        
        GameState.cells.forEach(cell => {
            if (cell.hovered) {
                if (cell.occupied) {
                    // Занятая клетка
                    elements.ctx.fillStyle = CONFIG.cells.occupiedColor;
                    elements.ctx.fillRect(cell.x, cell.y, cell.width, cell.height);
                    
                    // Красный крест
                    elements.ctx.strokeStyle = '#e74c3c';
                    elements.ctx.lineWidth = 3;
                    elements.ctx.beginPath();
                    elements.ctx.moveTo(cell.x + 10, cell.y + 10);
                    elements.ctx.lineTo(cell.x + cell.width - 10, cell.y + cell.height - 10);
                    elements.ctx.moveTo(cell.x + cell.width - 10, cell.y + 10);
                    elements.ctx.lineTo(cell.x + 10, cell.y + cell.height - 10);
                    elements.ctx.stroke();
                } else {
                    // Свободная клетка
                    elements.ctx.fillStyle = GameState.gold >= towerConfig.cost 
                        ? CONFIG.cells.freeColor 
                        : 'rgba(231, 76, 60, 0.5)';
                    elements.ctx.fillRect(cell.x, cell.y, cell.width, cell.height);
                    
                    // Предпросмотр башни
                    const centerX = cell.x + cell.width / 2;
                    const centerY = cell.y + cell.height / 2;
                    
                    elements.ctx.globalAlpha = 0.6;
                    elements.ctx.fillStyle = towerConfig.color;
                    elements.ctx.beginPath();
                    elements.ctx.arc(centerX, centerY, 16, 0, Math.PI * 2);
                    elements.ctx.fill();
                    
                    // Значок доллара если недостаточно золота
                    if (GameState.gold < towerConfig.cost) {
                        elements.ctx.fillStyle = '#ffffff';
                        elements.ctx.font = 'bold 14px Arial';
                        elements.ctx.textAlign = 'center';
                        elements.ctx.textBaseline = 'middle';
                        elements.ctx.fillText('$', centerX, centerY);
                    }
                    
                    elements.ctx.globalAlpha = 1;
                }
            }
        });
    }

    function drawTower(tower) {
        // Основание
        elements.ctx.fillStyle = tower.color;
        elements.ctx.beginPath();
        elements.ctx.arc(tower.x, tower.y, 20, 0, Math.PI * 2);
        elements.ctx.fill();
        
        // Обводка
        elements.ctx.strokeStyle = '#2c3e50';
        elements.ctx.lineWidth = 4;
        elements.ctx.stroke();
        
        // Ствол (поворачивается)
        elements.ctx.save();
        elements.ctx.translate(tower.x, tower.y);
        elements.ctx.rotate(tower.rotation);
        
        elements.ctx.fillStyle = '#2c3e50';
        elements.ctx.fillRect(0, -4, 30, 8);
        
        elements.ctx.fillStyle = tower.color;
        elements.ctx.fillRect(0, -3, 24, 6);
        
        elements.ctx.restore();
        
        // Уровень
        elements.ctx.fillStyle = '#ffffff';
        elements.ctx.font = 'bold 16px Arial';
        elements.ctx.textAlign = 'center';
        elements.ctx.textBaseline = 'middle';
        elements.ctx.fillText(tower.level.toString(), tower.x, tower.y);
        
        // Мерцание при атаке
        if (tower.target && Date.now() - tower.lastShot < 100) {
            elements.ctx.globalAlpha = 0.7;
            elements.ctx.strokeStyle = '#ffffff';
            elements.ctx.lineWidth = 2;
            elements.ctx.beginPath();
            elements.ctx.arc(tower.x, tower.y, 25, 0, Math.PI * 2);
            elements.ctx.stroke();
            elements.ctx.globalAlpha = 1;
        }
    }

    function drawTowerRange(tower) {
        // Радиус
        elements.ctx.strokeStyle = 'rgba(52, 152, 219, 0.8)';
        elements.ctx.lineWidth = 2;
        elements.ctx.setLineDash([5, 5]);
        elements.ctx.beginPath();
        elements.ctx.arc(tower.x, tower.y, tower.range, 0, Math.PI * 2);
        elements.ctx.stroke();
        elements.ctx.setLineDash([]);
        
        // Заливка
        elements.ctx.fillStyle = 'rgba(52, 152, 219, 0.1)';
        elements.ctx.fill();
    }

    function drawEnemy(enemy) {
        // Мерцание при получении урона
        if (Date.now() - enemy.lastHit < 150) {
            elements.ctx.globalAlpha = 0.7;
        }
        
        // Тело
        elements.ctx.fillStyle = enemy.color;
        elements.ctx.beginPath();
        elements.ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
        elements.ctx.fill();
        
        // Обводка
        elements.ctx.strokeStyle = '#2c3e50';
        elements.ctx.lineWidth = 3;
        elements.ctx.stroke();
        
        // Детали для босса
        if (enemy.isBoss) {
            // Корона
            elements.ctx.fillStyle = '#ffd369';
            elements.ctx.beginPath();
            elements.ctx.moveTo(enemy.x - 10, enemy.y - enemy.size);
            elements.ctx.lineTo(enemy.x, enemy.y - enemy.size - 8);
            elements.ctx.lineTo(enemy.x + 10, enemy.y - enemy.size);
            elements.ctx.closePath();
            elements.ctx.fill();
            
            // Глаза
            elements.ctx.fillStyle = '#ffffff';
            elements.ctx.beginPath();
            elements.ctx.arc(enemy.x - 5, enemy.y - 3, 3, 0, Math.PI * 2);
            elements.ctx.arc(enemy.x + 5, enemy.y - 3, 3, 0, Math.PI * 2);
            elements.ctx.fill();
            
            elements.ctx.fillStyle = '#000000';
            elements.ctx.beginPath();
            elements.ctx.arc(enemy.x - 5, enemy.y - 3, 1.5, 0, Math.PI * 2);
            elements.ctx.arc(enemy.x + 5, enemy.y - 3, 1.5, 0, Math.PI * 2);
            elements.ctx.fill();
        }
        
        // Полоска здоровья
        const healthWidth = 50;
        const healthHeight = 6;
        const healthPercent = enemy.health / enemy.maxHealth;
        
        // Фон
        elements.ctx.fillStyle = '#2c3e50';
        elements.ctx.fillRect(
            enemy.x - healthWidth / 2,
            enemy.y - enemy.size - 18,
            healthWidth,
            healthHeight
        );
        
        // Здоровье
        let healthColor;
        if (healthPercent > 0.6) {
            healthColor = CONFIG.colors.healthGood;
        } else if (healthPercent > 0.3) {
            healthColor = CONFIG.colors.healthMedium;
        } else {
            healthColor = CONFIG.colors.healthLow;
        }
        
        elements.ctx.fillStyle = healthColor;
        elements.ctx.fillRect(
            enemy.x - healthWidth / 2,
            enemy.y - enemy.size - 18,
            healthWidth * healthPercent,
            healthHeight
        );
        
        // Обводка
        elements.ctx.strokeStyle = '#34495e';
        elements.ctx.lineWidth = 1;
        elements.ctx.strokeRect(
            enemy.x - healthWidth / 2,
            enemy.y - enemy.size - 18,
            healthWidth,
            healthHeight
        );
        
        // Имя для босса
        if (enemy.isBoss) {
            elements.ctx.fillStyle = '#ffffff';
            elements.ctx.font = 'bold 12px Arial';
            elements.ctx.textAlign = 'center';
            elements.ctx.fillText(enemy.name, enemy.x, enemy.y - enemy.size - 25);
        }
        
        elements.ctx.globalAlpha = 1;
    }

    function drawProjectile(projectile) {
        // Ядро
        elements.ctx.fillStyle = projectile.color;
        elements.ctx.beginPath();
        elements.ctx.arc(projectile.x, projectile.y, projectile.size, 0, Math.PI * 2);
        elements.ctx.fill();
        
        // Свечение
        const gradient = elements.ctx.createRadialGradient(
            projectile.x, projectile.y, 0,
            projectile.x, projectile.y, projectile.size * 3
        );
        gradient.addColorStop(0, projectile.color + 'CC');
        gradient.addColorStop(1, projectile.color + '00');
        
        elements.ctx.fillStyle = gradient;
        elements.ctx.beginPath();
        elements.ctx.arc(projectile.x, projectile.y, projectile.size * 3, 0, Math.PI * 2);
        elements.ctx.fill();
        
        // Обводка
        elements.ctx.strokeStyle = '#2c3e50';
        elements.ctx.lineWidth = 2;
        elements.ctx.stroke();
    }

    function drawExplosionWave(x, y, radius, color) {
        elements.ctx.strokeStyle = color + '80';
        elements.ctx.lineWidth = 3;
        elements.ctx.beginPath();
        elements.ctx.arc(x, y, radius, 0, Math.PI * 2);
        elements.ctx.stroke();
    }

    function drawPauseOverlay() {
        elements.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        elements.ctx.fillRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);
        
        elements.ctx.fillStyle = '#ffffff';
        elements.ctx.font = 'bold 48px Arial';
        elements.ctx.textAlign = 'center';
        elements.ctx.textBaseline = 'middle';
        elements.ctx.fillText('ПАУЗА', CONFIG.canvas.width / 2, CONFIG.canvas.height / 2);
        
        elements.ctx.font = '24px Arial';
        elements.ctx.fillText('Нажмите P для продолжения', CONFIG.canvas.width / 2, CONFIG.canvas.height / 2 + 50);
    }

    function drawGameOverOverlay() {
        elements.ctx.fillStyle = 'rgba(231, 76, 60, 0.8)';
        elements.ctx.fillRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);
        
        elements.ctx.fillStyle = '#ffffff';
        elements.ctx.font = 'bold 48px Arial';
        elements.ctx.textAlign = 'center';
        elements.ctx.textBaseline = 'middle';
        elements.ctx.fillText('ИГРА ОКОНЧЕНА', CONFIG.canvas.width / 2, CONFIG.canvas.height / 2 - 50);
        
        elements.ctx.font = '28px Arial';
        elements.ctx.fillText(`Волна: ${GameState.wave}`, CONFIG.canvas.width / 2, CONFIG.canvas.height / 2);
        elements.ctx.fillText(`Золото: ${GameState.gold}`, CONFIG.canvas.width / 2, CONFIG.canvas.height / 2 + 40);
        
        elements.ctx.font = '22px Arial';
        elements.ctx.fillText('Нажмите R для рестарта', CONFIG.canvas.width / 2, CONFIG.canvas.height / 2 + 100);
    }

    function drawVictoryOverlay() {
        elements.ctx.fillStyle = 'rgba(46, 204, 113, 0.8)';
        elements.ctx.fillRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);
        
        elements.ctx.fillStyle = '#ffffff';
        elements.ctx.font = 'bold 48px Arial';
        elements.ctx.textAlign = 'center';
        elements.ctx.textBaseline = 'middle';
        elements.ctx.fillText('ПОБЕДА!', CONFIG.canvas.width / 2, CONFIG.canvas.height / 2 - 50);
        
        elements.ctx.font = '28px Arial';
        elements.ctx.fillText('Все волны пройдены!', CONFIG.canvas.width / 2, CONFIG.canvas.height / 2);
        elements.ctx.fillText(`Финальный счёт: ${GameState.gold}`, CONFIG.canvas.width / 2, CONFIG.canvas.height / 2 + 40);
        
        elements.ctx.font = '22px Arial';
        elements.ctx.fillText('Нажмите R для рестарта', CONFIG.canvas.width / 2, CONFIG.canvas.height / 2 + 100);
        
        // Фейерверк
        if (Math.random() < 0.3) {
            createFirework(Math.random() * CONFIG.canvas.width, Math.random() * CONFIG.canvas.height);
        }
    }

    function createFirework(x, y) {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        for (let i = 0; i < 40; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 2;
            GameState.particles.push({
                x, y,
                size: Math.random() * 3 + 2,
                speedX: Math.cos(angle) * speed,
                speedY: Math.sin(angle) * speed,
                color: color,
                opacity: 1,
                life: 50
            });
        }
    }

    // ==================== ИГРОВОЙ ЦИКЛ ====================
    function gameLoop(timestamp) {
        const deltaTime = timestamp - GameState.lastTime || 0;
        GameState.lastTime = timestamp;
        
        // Обновление частиц
        updateParticles(deltaTime);
        
        if (!GameState.isPaused && !GameState.gameOver && !GameState.gameWon) {
            // Спавн врагов
            if (GameState.isWaveActive && GameState.enemiesSpawned < GameState.enemiesThisWave) {
                GameState.enemySpawnTimer += deltaTime;
                
                if (GameState.enemySpawnTimer >= CONFIG.game.enemySpawnInterval) {
                    spawnEnemy();
                    GameState.enemySpawnTimer = 0;
                    
                    // Ускорение спавна с волнами
                    const speedUp = Math.max(500, CONFIG.game.enemySpawnInterval - (GameState.wave * 50));
                }
            }
            
            // Обновление врагов
            updateEnemies(deltaTime);
            
            // Обновление башен
            updateTowers(deltaTime);
            
            // Обновление снарядов
            updateProjectiles(deltaTime);
            
            // Проверка завершения волны
            if (GameState.isWaveActive && 
                GameState.enemiesSpawned >= GameState.enemiesThisWave && 
                GameState.enemies.length === 0) {
                endWave();
            }
        }
        
        // Отрисовка
        draw();
        
        // Продолжение цикла
        requestAnimationFrame(gameLoop);
    }

    function endWave() {
        GameState.isWaveActive = false;
        
        // Награда за волну
        const waveReward = 25 + GameState.wave * 10;
        GameState.gold += waveReward;
        
        // Обновление рекорда
        if (GameState.wave > GameState.highScore) {
            GameState.highScore = GameState.wave;
            localStorage.setItem('td_highscore', GameState.highScore);
            elements.highScore.textContent = GameState.highScore;
        }
        
        GameState.wave++;
        
        // Сброс UI
        elements.startWaveBtn.disabled = false;
        elements.startWaveBtn.innerHTML = `<i class="fas fa-play"></i> Волна ${GameState.wave}`;
        elements.waveProgress.style.width = '0%';
        
        // Обновление предпросмотра
        updateEnemyPreview();
        updateUI();
        
        // Сообщение
        const performance = GameState.enemiesKilledThisWave === GameState.enemiesThisWave 
            ? 'Отлично! Все враги уничтожены!'
            : `Хорошо! Убито ${GameState.enemiesKilledThisWave} из ${GameState.enemiesThisWave} врагов`;
        
        showMessage(`✅ Волна завершена! +${waveReward} золота. ${performance}`, 'success');
        playSound('waveComplete');
        
        // Проверка победы
        if (GameState.wave > CONFIG.game.maxWaves) {
            setTimeout(() => endGame(true), 1000);
        }
    }

    function endGame(isVictory) {
        GameState.isWaveActive = false;
        
        if (isVictory) {
            GameState.gameWon = true;
            showMessage('🎉 Поздравляем! Вы прошли все волны!', 'victory');
            playSound('victory');
            
            // Фейерверк
            for (let i = 0; i < 10; i++) {
                setTimeout(() => {
                    createFirework(
                        Math.random() * CONFIG.canvas.width,
                        Math.random() * CONFIG.canvas.height
                    );
                }, i * 200);
            }
        } else {
            GameState.gameOver = true;
            showMessage('💀 Вы проиграли! Попробуйте еще раз.', 'defeat');
            playSound('defeat');
        }
        
        elements.startWaveBtn.disabled = true;
        elements.startWaveBtn.innerHTML = `<i class="fas fa-redo"></i> Игра завершена`;
    }

    function togglePause() {
        if (GameState.gameOver || GameState.gameWon) return;
        
        GameState.isPaused = !GameState.isPaused;
        
        if (GameState.isPaused) {
            showMessage('⏸️ Игра на паузе', 'info');
        } else {
            showMessage('▶️ Игра продолжается', 'info');
        }
    }

    function resetGame() {
        console.log('🔄 Сброс игры...');
        
        // Сброс состояния
        GameState.lives = CONFIG.game.startLives;
        GameState.gold = CONFIG.game.startGold;
        GameState.wave = CONFIG.game.startWave;
        GameState.isWaveActive = false;
        GameState.isPaused = false;
        GameState.gameOver = false;
        GameState.gameWon = false;
        GameState.selectedTowerType = null;
        GameState.selectedTower = null;
        
        // Очистка объектов
        GameState.towers = [];
        GameState.enemies = [];
        GameState.projectiles = [];
        GameState.particles = GameState.particles.filter(p => !p.life); // Оставляем фоновые
        
        // Сброс клеток
        GameState.cells.forEach(cell => {
            cell.occupied = false;
            cell.tower = null;
        });
        
        // Разметка пути
        markPathAsOccupied();
        
        // Сброс выбора
        deselectTower();
        resetTowerSelection();
        
        // Обновление UI
        updateUI();
        updateEnemyPreview();
        
        // Восстановление кнопок
        elements.startWaveBtn.disabled = false;
        elements.startWaveBtn.innerHTML = `<i class="fas fa-play"></i> Волна ${GameState.wave}`;
        elements.waveProgress.style.width = '0%';
        
        // Сообщение
        showMessage('🔄 Игра сброшена! Готовьтесь к новой битве!', 'info');
        playSound('reset');
        
        console.log('✅ Игра сброшена');
    }

    // ==================== UI ФУНКЦИИ ====================
    function updateUI() {
        // Обновление значений
        elements.lives.textContent = GameState.lives;
        elements.gold.textContent = GameState.gold;
        elements.wave.textContent = `${GameState.wave}/${CONFIG.game.maxWaves}`;
        
        // Цвет жизни
        if (GameState.lives <= 5) {
            elements.lives.style.color = CONFIG.colors.healthLow;
        } else if (GameState.lives <= 10) {
            elements.lives.style.color = CONFIG.colors.healthMedium;
        } else {
            elements.lives.style.color = CONFIG.colors.healthGood;
        }
        
        // Анимация золота при изменении
        elements.gold.style.transform = 'scale(1.1)';
        setTimeout(() => {
            elements.gold.style.transform = 'scale(1)';
        }, 200);
        
        // Состояние кнопок
        elements.upgradeBtn.disabled = !GameState.selectedTower || GameState.isWaveActive;
        elements.sellBtn.disabled = !GameState.selectedTower || GameState.isWaveActive;
        
        // Стоимость улучшения
        if (GameState.selectedTower) {
            elements.upgradeCostBtn.textContent = GameState.selectedTower.upgradeCost;
            
            // Подсветка кнопки улучшения
            if (GameState.gold >= GameState.selectedTower.upgradeCost && !GameState.isWaveActive) {
                elements.upgradeBtn.style.opacity = '1';
                elements.upgradeBtn.title = `Улучшить за ${GameState.selectedTower.upgradeCost} золота`;
            } else {
                elements.upgradeBtn.style.opacity = '0.6';
                elements.upgradeBtn.title = GameState.isWaveActive 
                    ? 'Нельзя улучшать во время волны' 
                    : `Недостаточно золота (нужно ${GameState.selectedTower.upgradeCost})`;
            }
        }
    }

    function showMessage(text, type = 'info', duration = 3000) {
        const icons = {
            info: 'info-circle',
            success: 'check-circle',
            warning: 'exclamation-triangle',
            error: 'times-circle',
            victory: 'trophy',
            defeat: 'skull'
        };
        
        const colors = {
            info: '#3498db',
            success: '#2ecc71',
            warning: '#f39c12',
            error: '#e74c3c',
            victory: '#ffd369',
            defeat: '#e74c3c'
        };
        
        elements.gameMessages.innerHTML = `
            <p style="color: ${colors[type] || colors.info}">
                <i class="fas fa-${icons[type] || icons.info}"></i> ${text}
            </p>
        `;
        
        // Анимация
        elements.gameMessages.style.animation = 'none';
        setTimeout(() => {
            elements.gameMessages.style.animation = 'slideIn 0.3s ease';
        }, 10);
        
        // Автоочистка
        if (!['victory', 'defeat'].includes(type)) {
            setTimeout(() => {
                if (elements.gameMessages.innerHTML.includes(text)) {
                    elements.gameMessages.innerHTML = 
                        '<p><i class="fas fa-info-circle"></i> Готовьтесь к следующей волне...</p>';
                }
            }, duration);
        }
    }

    // ==================== АУДИО ФУНКЦИИ ====================
    function playSound(type) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            const sounds = {
                'select': { frequency: 523.25, duration: 0.1, type: 'sine' },
                'place': { frequency: 659.25, duration: 0.15, type: 'sine' },
                'shoot': { frequency: 880, duration: 0.05, type: 'square' },
                'hit': { frequency: 220, duration: 0.1, type: 'sawtooth' },
                'enemyDeath': { frequencies: [440, 329.63, 261.63], duration: 0.3, type: 'sine' },
                'waveStart': { frequencies: [523.25, 659.25, 783.99], duration: 0.5, type: 'sine' },
                'waveComplete': { frequencies: [783.99, 659.25, 523.25, 659.25, 783.99], duration: 0.7, type: 'sine' },
                'lifeLost': { frequency: 110, duration: 0.4, type: 'sawtooth' },
                'upgrade': { frequencies: [523.25, 659.25, 783.99, 1046.5], duration: 0.4, type: 'sine' },
                'sell': { frequency: 349.23, duration: 0.2, type: 'sine' },
                'victory': { frequencies: [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98], duration: 1.2, type: 'triangle' },
                'defeat': { frequencies: [392, 349.23, 329.63, 293.66, 261.63], duration: 0.8, type: 'sawtooth' },
                'reset': { frequency: 440, duration: 0.15, type: 'sine' }
            };
            
            const sound = sounds[type];
            if (!sound) return;
            
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.type = sound.type;
            
            if (sound.frequencies) {
                const startTime = audioContext.currentTime;
                sound.frequencies.forEach((freq, i) => {
                    oscillator.frequency.setValueAtTime(freq, startTime + i * 0.1);
                });
                oscillator.start(startTime);
                oscillator.stop(startTime + sound.duration);
            } else {
                oscillator.frequency.setValueAtTime(sound.frequency, audioContext.currentTime);
                oscillator.start();
                oscillator.stop(audioContext.currentTime + sound.duration);
            }
            
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + sound.duration);
            
        } catch (e) {
            console.log('Аудио не поддерживается:', e);
        }
    }

    // ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================
    function getPixelPath() {
        return GameState.enemyPath.map(point => ({
            x: point.x * CONFIG.canvas.width,
            y: point.y * CONFIG.canvas.height
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

    // ==================== ЗАПУСК ИГРЫ ====================
    init();
});
