// game.js - Улучшенная версия

document.addEventListener('DOMContentLoaded', function() {
    // Получаем элементы DOM
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const livesElement = document.getElementById('lives');
    const goldElement = document.getElementById('gold');
    const waveElement = document.getElementById('wave');
    const highScoreElement = document.getElementById('highScore');
    const waveProgressElement = document.getElementById('waveProgress');
    const startWaveButton = document.getElementById('startWave');
    const upgradeButton = document.getElementById('upgradeTower');
    const sellButton = document.getElementById('sellTower');
    const gameMessages = document.getElementById('gameMessages');
    const towerItems = document.querySelectorAll('.tower-item');
    const selectedTowerInfo = document.getElementById('selectedTowerInfo');
    
    // Элементы информации о башне
    const towerLevelElement = document.getElementById('towerLevel');
    const towerDamageElement = document.getElementById('towerDamage');
    const towerRangeElement = document.getElementById('towerRange');
    const towerUpgradeCostElement = document.getElementById('towerUpgradeCost');
    const upgradeCostButtonElement = document.getElementById('upgradeCost');
    
    // Состояние игры
    const gameState = {
        lives: 20,
        gold: 100,
        wave: 1,
        maxWave: 10,
        highScore: localStorage.getItem('td_highscore') || 0,
        isWaveActive: false,
        isPaused: false,
        selectedTowerType: null,
        selectedTowerCost: 0,
        selectedTower: null,
        towers: [],
        enemies: [],
        projectiles: [],
        particles: [],
        cells: [],
        cellSize: 40,
        lastTime: 0,
        enemySpawnTimer: 0,
        enemySpawnInterval: 2000,
        enemiesInWave: 5,
        enemiesSpawned: 0,
        enemiesKilled: 0,
        gameSpeed: 1
    };
    
    // Цвета игры
    const colors = {
        path: '#2ecc71',
        pathBorder: '#27ae60',
        grid: 'rgba(255, 255, 255, 0.05)',
        cellHighlight: 'rgba(0, 173, 181, 0.3)',
        rangeCircle: 'rgba(52, 152, 219, 0.2)',
        rangeBorder: 'rgba(52, 152, 219, 0.5)'
    };
    
    // Путь для врагов
    const enemyPath = [
        {x: -20, y: 0.5},
        {x: 0.1, y: 0.5},
        {x: 0.1, y: 0.2},
        {x: 0.4, y: 0.2},
        {x: 0.4, y: 0.6},
        {x: 0.7, y: 0.6},
        {x: 0.7, y: 0.3},
        {x: 1.1, y: 0.3}
    ];
    
    // Инициализация игры
    function init() {
        // Загружаем рекорд
        highScoreElement.textContent = gameState.highScore;
        
        // Инициализируем поле
        initGameField();
        
        // Настраиваем события
        setupEventListeners();
        
        // Запускаем игровой цикл
        requestAnimationFrame(gameLoop);
        
        // Показываем приветственное сообщение
        showMessage('Добро пожаловать в Башенную Оборону! Выберите башню в магазине и установите её на поле.', 'info');
        
        // Анимация появления
        animateIntro();
    }
    
    function initGameField() {
        // Создаем сетку
        const cols = Math.floor(canvas.width / gameState.cellSize);
        const rows = Math.floor(canvas.height / gameState.cellSize);
        
        for (let x = 0; x < cols; x++) {
            for (let y = 0; y < rows; y++) {
                gameState.cells.push({
                    x: x * gameState.cellSize,
                    y: y * gameState.cellSize,
                    width: gameState.cellSize,
                    height: gameState.cellSize,
                    occupied: false,
                    tower: null,
                    hovered: false
                });
            }
        }
        
        // Отмечаем путь как занятый
        markPathAsOccupied();
        
        // Создаем эффектные частицы для фона
        createBackgroundParticles();
    }
    
    function markPathAsOccupied() {
        const path = getPixelPath();
        const pathWidth = gameState.cellSize * 1.8;
        
        gameState.cells.forEach(cell => {
            const cellCenterX = cell.x + cell.width/2;
            const cellCenterY = cell.y + cell.height/2;
            
            for (let i = 0; i < path.length - 1; i++) {
                const start = path[i];
                const end = path[i+1];
                
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
        for (let i = 0; i < 50; i++) {
            gameState.particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 2 + 1,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: (Math.random() - 0.5) * 0.5,
                opacity: Math.random() * 0.3 + 0.1,
                color: Math.random() > 0.5 ? '#3498db' : '#9b59b6'
            });
        }
    }
    
    function setupEventListeners() {
        // Выбор башни в магазине
        towerItems.forEach(item => {
            item.addEventListener('click', function() {
                if (gameState.isWaveActive) {
                    showMessage('Нельзя покупать башни во время волны!', 'warning');
                    return;
                }
                
                towerItems.forEach(i => i.classList.remove('selected'));
                this.classList.add('selected');
                
                gameState.selectedTowerType = this.dataset.type;
                gameState.selectedTowerCost = parseInt(this.dataset.cost);
                
                showMessage(`Выбрана ${this.querySelector('h3').textContent}. Кликните на поле для установки.`, 'info');
                canvas.style.cursor = 'crosshair';
                
                // Звуковой эффект
                playSound('select');
            });
        });
        
        // Размещение башни
        canvas.addEventListener('click', function(e) {
            if (!gameState.selectedTowerType || gameState.isWaveActive) return;
            
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const cell = gameState.cells.find(c => 
                x >= c.x && x <= c.x + c.width && 
                y >= c.y && y <= c.y + c.height
            );
            
            if (cell && !cell.occupied) {
                if (gameState.gold >= gameState.selectedTowerCost) {
                    placeTower(cell);
                    playSound('place');
                } else {
                    showMessage(`Недостаточно золота! Нужно ${gameState.selectedTowerCost} золота.`, 'error');
                    canvas.style.cursor = 'not-allowed';
                    setTimeout(() => {
                        if (gameState.selectedTowerType) {
                            canvas.style.cursor = 'crosshair';
                        }
                    }, 1000);
                }
            }
        });
        
        // Клик по башне для выбора
        canvas.addEventListener('click', function(e) {
            if (gameState.isWaveActive || gameState.selectedTowerType) return;
            
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Ищем башню по клику
            for (const tower of gameState.towers) {
                const dx = x - tower.x;
                const dy = y - tower.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 20) {
                    selectTower(tower);
                    playSound('select');
                    return;
                }
            }
            
            // Клик мимо башни - снимаем выделение
            if (gameState.selectedTower) {
                deselectTower();
            }
        });
        
        // Правый клик по башне для информации
        canvas.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            for (const tower of gameState.towers) {
                const dx = x - tower.x;
                const dy = y - tower.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 20) {
                    showTowerInfo(tower);
                    return;
                }
            }
        });
        
        // Наведение на клетки
        canvas.addEventListener('mousemove', function(e) {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Сброс hover состояния
            gameState.cells.forEach(cell => cell.hovered = false);
            
            // Поиск клетки под курсором
            const cell = gameState.cells.find(c => 
                x >= c.x && x <= c.x + c.width && 
                y >= c.y && y <= c.y + c.height
            );
            
            if (cell) {
                cell.hovered = true;
                
                // Меняем курсор если можно поставить башню
                if (gameState.selectedTowerType && !cell.occupied && !gameState.isWaveActive) {
                    canvas.style.cursor = gameState.gold >= gameState.selectedTowerCost ? 'pointer' : 'not-allowed';
                }
            }
        });
        
        // Кнопка начала волны
        startWaveButton.addEventListener('click', startWave);
        
        // Кнопка улучшения
        upgradeButton.addEventListener('click', function() {
            if (gameState.selectedTower && !gameState.isWaveActive) {
                upgradeSelectedTower();
            }
        });
        
        // Кнопка продажи
        sellButton.addEventListener('click', function() {
            if (gameState.selectedTower && !gameState.isWaveActive) {
                sellSelectedTower();
            }
        });
        
        // Горячие клавиши
        document.addEventListener('keydown', function(e) {
            switch(e.key) {
                case 'Escape':
                    deselectTower();
                    resetTowerSelection();
                    break;
                case ' ':
                    if (!gameState.isWaveActive) {
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
                    if (gameState.selectedTower) {
                        upgradeSelectedTower();
                    }
                    break;
                case 's':
                    if (gameState.selectedTower) {
                        sellSelectedTower();
                    }
                    break;
            }
        });
        
        // Кнопка сброса игры
        const resetButton = document.createElement('button');
        resetButton.innerHTML = '<i class="fas fa-redo"></i>';
        resetButton.className = 'btn-reset';
        resetButton.addEventListener('click', resetGame);
        document.querySelector('.game-header').appendChild(resetButton);
    }
    
    function placeTower(cell) {
        const tower = createTower(
            cell.x + cell.width/2, 
            cell.y + cell.height/2, 
            gameState.selectedTowerType
        );
        
        gameState.towers.push(tower);
        cell.occupied = true;
        cell.tower = tower;
        
        gameState.gold -= gameState.selectedTowerCost;
        updateUI();
        
        showMessage(`Башня установлена! Осталось ${gameState.gold} золота.`, 'success');
        createParticles(cell.x + cell.width/2, cell.y + cell.height/2, tower.color, 15);
        
        resetTowerSelection();
    }
    
    function createTower(x, y, type) {
        const towerTypes = {
            basic: {
                name: 'Базовая',
                damage: 5,
                range: 150,
                color: '#3498db',
                upgradeCost: 25,
                level: 1,
                fireRate: 800,
                sellValue: 15
            },
            sniper: {
                name: 'Снайпер',
                damage: 25,
                range: 300,
                color: '#9b59b6',
                upgradeCost: 50,
                level: 1,
                fireRate: 2000,
                sellValue: 40
            },
            splash: {
                name: 'Облачная',
                damage: 10,
                range: 120,
                color: '#e74c3c',
                upgradeCost: 40,
                level: 1,
                fireRate: 1200,
                splashRadius: 60,
                sellValue: 30
            }
        };
        
        const config = towerTypes[type];
        
        return {
            x, y,
            type,
            name: config.name,
            damage: config.damage,
            range: config.range,
            color: config.color,
            upgradeCost: config.upgradeCost,
            level: config.level,
            fireRate: config.fireRate,
            lastShot: 0,
            target: null,
            splashRadius: config.splashRadius || 0,
            sellValue: config.sellValue,
            rotation: 0
        };
    }
    
    function selectTower(tower) {
        gameState.selectedTower = tower;
        selectedTowerInfo.style.display = 'block';
        updateTowerInfo(tower);
        updateUI();
        
        // Подсвечиваем радиус башни
        drawTowerRange(tower);
    }
    
    function deselectTower() {
        gameState.selectedTower = null;
        selectedTowerInfo.style.display = 'none';
        updateUI();
    }
    
    function updateTowerInfo(tower) {
        towerLevelElement.textContent = tower.level;
        towerDamageElement.textContent = tower.damage;
        towerRangeElement.textContent = tower.range;
        towerUpgradeCostElement.textContent = tower.upgradeCost;
        upgradeCostButtonElement.textContent = tower.upgradeCost;
    }
    
    function showTowerInfo(tower) {
        const info = `
            <strong>${tower.name}</strong><br>
            Уровень: ${tower.level}<br>
            Урон: ${tower.damage}<br>
            Дальность: ${tower.range}<br>
            ${tower.splashRadius ? `Радиус взрыва: ${tower.splashRadius}<br>` : ''}
            Улучшение: ${tower.upgradeCost} золота
        `;
        
        showMessage(info, 'info', 5000);
    }
    
    function upgradeSelectedTower() {
        const tower = gameState.selectedTower;
        
        if (gameState.gold >= tower.upgradeCost) {
            gameState.gold -= tower.upgradeCost;
            
            tower.level++;
            tower.damage = Math.floor(tower.damage * 1.6);
            tower.range = Math.floor(tower.range * 1.15);
            tower.upgradeCost = Math.floor(tower.upgradeCost * 1.5);
            tower.sellValue = Math.floor(tower.sellValue * 1.3);
            
            if (tower.type === 'splash') {
                tower.splashRadius = Math.floor(tower.splashRadius * 1.1);
            }
            
            tower.fireRate = Math.max(400, tower.fireRate * 0.85);
            
            updateUI();
            updateTowerInfo(tower);
            showMessage(`Башня улучшена до уровня ${tower.level}!`, 'success');
            createParticles(tower.x, tower.y, '#ffd369', 10);
            playSound('upgrade');
        } else {
            showMessage(`Недостаточно золота для улучшения! Нужно ${tower.upgradeCost} золота.`, 'error');
        }
    }
    
    function sellSelectedTower() {
        const tower = gameState.selectedTower;
        const cell = gameState.cells.find(c => c.tower === tower);
        
        if (cell) {
            const sellPrice = tower.sellValue;
            gameState.gold += sellPrice;
            
            const index = gameState.towers.indexOf(tower);
            if (index > -1) {
                gameState.towers.splice(index, 1);
            }
            
            cell.occupied = false;
            cell.tower = null;
            
            deselectTower();
            updateUI();
            showMessage(`Башня продана за ${sellPrice} золота!`, 'success');
            createParticles(tower.x, tower.y, '#ffd369', 20);
            playSound('sell');
        }
    }
    
    function startWave() {
        if (gameState.isWaveActive) return;
        
        gameState.isWaveActive = true;
        gameState.enemiesSpawned = 0;
        gameState.enemiesKilled = 0;
        gameState.enemySpawnTimer = 0;
        
        // Обновляем количество врагов в зависимости от волны
        const baseEnemies = 5;
        const toughEnemies = Math.floor((gameState.wave - 3) / 2);
        const bossEnemies = Math.floor((gameState.wave - 6) / 3);
        
        gameState.enemiesInWave = baseEnemies + Math.max(0, toughEnemies) + Math.max(0, bossEnemies);
        
        startWaveButton.disabled = true;
        startWaveButton.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Волна ${gameState.wave}`;
        
        showMessage(`Волна ${gameState.wave} началась! Уничтожьте ${gameState.enemiesInWave} врагов.`, 'warning');
        playSound('waveStart');
        
        // Обновляем превью врагов
        updateEnemyPreview();
    }
    
    function updateEnemyPreview() {
        const basicCount = Math.min(5, gameState.enemiesInWave);
        const toughCount = Math.max(0, Math.min(3, Math.floor((gameState.wave - 3) / 2)));
        const bossCount = Math.max(0, Math.min(2, Math.floor((gameState.wave - 6) / 3)));
        
        document.getElementById('enemyCountBasic').textContent = basicCount;
        document.getElementById('enemyCountTough').textContent = toughCount;
        document.getElementById('enemyCountBoss').textContent = bossCount;
    }
    
    function createEnemy() {
        const enemyTypes = [
            {health: 20, speed: 1.2, color: '#2ecc71', gold: 5, size: 12},
            {health: 50, speed: 0.8, color: '#f39c12', gold: 15, size: 16},
            {health: 100, speed: 0.5, color: '#e74c3c', gold: 30, size: 20}
        ];
        
        let typeIndex = 0;
        if (gameState.wave > 3) {
            const toughChance = Math.min(0.3, (gameState.wave - 3) * 0.1);
            if (Math.random() < toughChance) typeIndex = 1;
        }
        if (gameState.wave > 6) {
            const bossChance = Math.min(0.2, (gameState.wave - 6) * 0.05);
            if (Math.random() < bossChance) typeIndex = 2;
        }
        
        const type = enemyTypes[typeIndex];
        const path = getPixelPath();
        
        return {
            x: path[0].x,
            y: path[0].y,
            health: type.health * (1 + (gameState.wave - 1) * 0.1),
            maxHealth: type.health * (1 + (gameState.wave - 1) * 0.1),
            speed: type.speed,
            color: type.color,
            gold: type.gold,
            size: type.size,
            pathIndex: 0,
            path: path,
            reachedEnd: false,
            typeIndex: typeIndex,
            lastHit: 0
        };
    }
    
    // Игровой цикл
    function gameLoop(timestamp) {
        const deltaTime = timestamp - gameState.lastTime || 0;
        gameState.lastTime = timestamp;
        
        // Обновление частиц фона
        updateParticles(deltaTime);
        
        if (gameState.isWaveActive && !gameState.isPaused) {
            // Спавн врагов
            if (gameState.enemiesSpawned < gameState.enemiesInWave) {
                gameState.enemySpawnTimer += deltaTime * gameState.gameSpeed;
                
                if (gameState.enemySpawnTimer >= gameState.enemySpawnInterval) {
                    gameState.enemies.push(createEnemy());
                    gameState.enemiesSpawned++;
                    gameState.enemySpawnTimer = 0;
                    
                    // Обновляем прогресс волны
                    updateWaveProgress();
                }
            }
            
            // Обновление игры
            updateEnemies(deltaTime * gameState.gameSpeed);
            updateTowers(deltaTime * gameState.gameSpeed);
            updateProjectiles(deltaTime * gameState.gameSpeed);
            
            // Удаление мертвых врагов
            for (let i = gameState.enemies.length - 1; i >= 0; i--) {
                if (gameState.enemies[i].health <= 0) {
                    createDeathEffect(gameState.enemies[i]);
                    gameState.enemies.splice(i, 1);
                    gameState.enemiesKilled++;
                }
            }
            
            // Проверка завершения волны
            if (gameState.enemiesSpawned >= gameState.enemiesInWave && 
                gameState.enemies.length === 0) {
                endWave();
            }
        }
        
        // Отрисовка
        draw();
        requestAnimationFrame(gameLoop);
    }
    
    function updateWaveProgress() {
        const progress = (gameState.enemiesSpawned / gameState.enemiesInWave) * 100;
        waveProgressElement.style.width = `${progress}%`;
    }
    
    function updateEnemies(deltaTime) {
        for (let i = gameState.enemies.length - 1; i >= 0; i--) {
            const enemy = gameState.enemies[i];
            
            if (enemy.reachedEnd) {
                gameState.lives--;
                updateUI();
                
                // Эффект потери жизни
                createDamageEffect(enemy.x, enemy.y, '#e74c3c');
                gameMessages.style.animation = 'shake 0.5s';
                setTimeout(() => gameMessages.style.animation = '', 500);
                
                gameState.enemies.splice(i, 1);
                
                showMessage(`Враг достиг цели! Осталось ${gameState.lives} жизней.`, 'error');
                playSound('lifeLost');
                
                if (gameState.lives <= 0) {
                    endGame(false);
                }
                continue;
            }
            
            moveEnemy(enemy, deltaTime);
        }
    }
    
    function moveEnemy(enemy, deltaTime) {
        const targetPoint = enemy.path[enemy.pathIndex + 1];
        
        if (targetPoint) {
            const dx = targetPoint.x - enemy.x;
            const dy = targetPoint.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 2) {
                enemy.pathIndex++;
                if (enemy.pathIndex >= enemy.path.length - 1) {
                    enemy.reachedEnd = true;
                }
            } else {
                const moveDistance = enemy.speed * (deltaTime / 16);
                enemy.x += (dx / distance) * moveDistance;
                enemy.y += (dy / distance) * moveDistance;
            }
        }
    }
    
    function updateTowers(deltaTime) {
        gameState.towers.forEach(tower => {
            // Вращение башни к цели
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
                    shootAtTarget(tower, tower.target);
                    tower.lastShot = currentTime;
                }
            }
        });
    }
    
    function findTargetForTower(tower) {
        let closestEnemy = null;
        let closestDistance = tower.range;
        
        for (const enemy of gameState.enemies) {
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
    
    function shootAtTarget(tower, target) {
        const projectile = {
            x: tower.x,
            y: tower.y,
            target: target,
            damage: tower.damage,
            color: tower.color,
            speed: 8,
            size: 6,
            splashRadius: tower.splashRadius,
            fromTower: tower
        };
        
        gameState.projectiles.push(projectile);
        
        // Эффект выстрела
        createShotEffect(tower.x, tower.y, target.x, target.y, tower.color);
        playSound('shoot');
    }
    
    function createShotEffect(fromX, fromY, toX, toY, color) {
        // Линия выстрела
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.stroke();
        
        // Исчезающий эффект
        setTimeout(() => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }, 50);
    }
    
    function updateProjectiles(deltaTime) {
        for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
            const projectile = gameState.projectiles[i];
            
            if (!projectile.target || projectile.target.health <= 0) {
                gameState.projectiles.splice(i, 1);
                continue;
            }
            
            const dx = projectile.target.x - projectile.x;
            const dy = projectile.target.y - projectile.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 10) {
                applyDamage(projectile);
                createHitEffect(projectile);
                gameState.projectiles.splice(i, 1);
            } else {
                projectile.x += (dx / distance) * projectile.speed * (deltaTime / 16);
                projectile.y += (dy / distance) * projectile.speed * (deltaTime / 16);
            }
        }
    }
    
    function applyDamage(projectile) {
        if (projectile.splashRadius > 0) {
            // Сплэш урон
            for (const enemy of gameState.enemies) {
                const dx = enemy.x - projectile.target.x;
                const dy = enemy.y - projectile.target.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < projectile.splashRadius) {
                    const damageMultiplier = 1 - (distance / projectile.splashRadius) * 0.7;
                    enemy.health -= projectile.damage * damageMultiplier;
                    enemy.lastHit = Date.now();
                    
                    if (enemy.health <= 0) {
                        gameState.gold += enemy.gold;
                        updateUI();
                    }
                }
            }
        } else {
            // Одиночный урон
            projectile.target.health -= projectile.damage;
            projectile.target.lastHit = Date.now();
            
            if (projectile.target.health <= 0) {
                gameState.gold += projectile.target.gold;
                updateUI();
            }
        }
    }
    
    function createHitEffect(projectile) {
        if (projectile.splashRadius > 0) {
            // Эффект взрыва
            createExplosionEffect(projectile.target.x, projectile.target.y, projectile.splashRadius, projectile.color);
        } else {
            // Эффект попадания
            createDamageEffect(projectile.target.x, projectile.target.y, projectile.color);
        }
    }
    
    function createExplosionEffect(x, y, radius, color) {
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 + 1;
            gameState.particles.push({
                x, y,
                size: Math.random() * 4 + 2,
                speedX: Math.cos(angle) * speed,
                speedY: Math.sin(angle) * speed,
                color: color,
                opacity: 1,
                life: 30
            });
        }
        
        // Круг взрыва
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `${color}40`;
        ctx.fill();
        ctx.strokeStyle = `${color}80`;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    function createDamageEffect(x, y, color) {
        for (let i = 0; i < 8; i++) {
            gameState.particles.push({
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
        for (let i = 0; i < 15; i++) {
            gameState.particles.push({
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
        
        // Золотые монеты при смерти
        for (let i = 0; i < enemy.gold / 5; i++) {
            gameState.particles.push({
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
        
        playSound('enemyDeath');
    }
    
    function createParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            gameState.particles.push({
                x, y,
                size: Math.random() * 3 + 1,
                speedX: (Math.random() - 0.5) * 3,
                speedY: (Math.random() - 0.5) * 3,
                color: color,
                opacity: 1,
                life: 30
            });
        }
    }
    
    function updateParticles(deltaTime) {
        for (let i = gameState.particles.length - 1; i >= 0; i--) {
            const particle = gameState.particles[i];
            
            particle.x += particle.speedX * (deltaTime / 16);
            particle.y += particle.speedY * (deltaTime / 16);
            
            if (particle.life) {
                particle.life--;
                particle.opacity = particle.life / 30;
                
                if (particle.life <= 0) {
                    gameState.particles.splice(i, 1);
                }
            } else {
                // Фоновые частицы
                particle.x += particle.speedX * (deltaTime / 16);
                particle.y += particle.speedY * (deltaTime / 16);
                
                // Возвращаем частицы на поле
                if (particle.x < 0) particle.x = canvas.width;
                if (particle.x > canvas.width) particle.x = 0;
                if (particle.y < 0) particle.y = canvas.height;
                if (particle.y > canvas.height) particle.y = 0;
            }
        }
    }
    
    // Отрисовка
    function draw() {
        // Очистка canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Фоновые частицы
        drawParticles();
        
        // Сетка
        drawGrid();
        
        // Путь
        drawPath();
        
        // Клетки при наведении
        drawHoveredCells();
        
        // Башни
        gameState.towers.forEach(drawTower);
        
        // Враги
        gameState.enemies.forEach(drawEnemy);
        
        // Снаряды
        gameState.projectiles.forEach(drawProjectile);
        
        // Радиус выбранной башни
        if (gameState.selectedTower && !gameState.isWaveActive) {
            drawTowerRange(gameState.selectedTower);
        }
    }
    
    function drawParticles() {
        gameState.particles.forEach(particle => {
            ctx.globalAlpha = particle.opacity || 0.3;
            ctx.fillStyle = particle.color;
            
            if (particle.isCoin) {
                // Рисуем монетку
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.strokeStyle = '#ff9f1a';
                ctx.lineWidth = 1;
                ctx.stroke();
                
                ctx.fillStyle = '#ff9f1a';
                ctx.fillRect(particle.x - 1, particle.y - 1, 2, 2);
            } else {
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.globalAlpha = 1;
        });
    }
    
    function drawGrid() {
        ctx.strokeStyle = colors.grid;
        ctx.lineWidth = 1;
        
        // Вертикальные линии
        for (let x = 0; x <= canvas.width; x += gameState.cellSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        
        // Горизонтальные линии
        for (let y = 0; y <= canvas.height; y += gameState.cellSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
    }
    
    function drawPath() {
        const path = getPixelPath();
        
        // Основной путь
        ctx.strokeStyle = colors.path;
        ctx.lineWidth = 35;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length; i++) {
            ctx.lineTo(path[i].x, path[i].y);
        }
        ctx.stroke();
        
        // Обводка пути
        ctx.strokeStyle = colors.pathBorder;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Точки пути
        path.forEach((point, i) => {
            ctx.fillStyle = i === 0 ? '#e74c3c' : (i === path.length - 1 ? '#3498db' : '#f1c40f');
            ctx.beginPath();
            ctx.arc(point.x, point.y, 10, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#2c3e50';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Иконки точек
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            if (i === 0) {
                ctx.fillText('Вход', point.x, point.y);
            } else if (i === path.length - 1) {
                ctx.fillText('Выход', point.x, point.y);
            }
        });
    }
    
    function drawHoveredCells() {
        if (!gameState.selectedTowerType || gameState.isWaveActive) return;
        
        gameState.cells.forEach(cell => {
            if (cell.hovered) {
                ctx.fillStyle = cell.occupied ? 'rgba(231, 76, 60, 0.3)' : colors.cellHighlight;
                ctx.fillRect(cell.x, cell.y, cell.width, cell.height);
                
                if (!cell.occupied) {
                    // Предпросмотр башни
                    const centerX = cell.x + cell.width/2;
                    const centerY = cell.y + cell.height/2;
                    
                    let towerColor;
                    switch(gameState.selectedTowerType) {
                        case 'basic': towerColor = '#3498db'; break;
                        case 'sniper': towerColor = '#9b59b6'; break;
                        case 'splash': towerColor = '#e74c3c'; break;
                    }
                    
                    ctx.globalAlpha = 0.6;
                    ctx.fillStyle = towerColor;
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, 15, 0, Math.PI * 2);
                    ctx.fill();
                    
                    if (gameState.gold < gameState.selectedTowerCost) {
                        ctx.fillStyle = 'rgba(231, 76, 60, 0.7)';
                        ctx.beginPath();
                        ctx.moveTo(centerX - 10, centerY - 10);
                        ctx.lineTo(centerX + 10, centerY + 10);
                        ctx.moveTo(centerX + 10, centerY - 10);
                        ctx.lineTo(centerX - 10, centerY + 10);
                        ctx.lineWidth = 3;
                        ctx.stroke();
                    }
                    
                    ctx.globalAlpha = 1;
                }
            }
        });
    }
    
    function drawTower(tower) {
        // Основание
        ctx.fillStyle = tower.color;
        ctx.beginPath();
        ctx.arc(tower.x, tower.y, 18, 0, Math.PI * 2);
        ctx.fill();
        
        // Обводка
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Уровень
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(tower.level.toString(), tower.x, tower.y);
        
        // Ствол (поворачивается к цели)
        ctx.save();
        ctx.translate(tower.x, tower.y);
        ctx.rotate(tower.rotation);
        
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(0, -3, 25, 6);
        
        ctx.fillStyle = tower.color;
        ctx.fillRect(0, -2, 20, 4);
        ctx.restore();
    }
    
    function drawTowerRange(tower) {
        ctx.strokeStyle = colors.rangeBorder;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(tower.x, tower.y, tower.range, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = colors.rangeCircle;
        ctx.fill();
    }
    
    function drawEnemy(enemy) {
        // Эффект получения урона
        if (Date.now() - enemy.lastHit < 200) {
            ctx.globalAlpha = 0.7;
        }
        
        // Тело врага
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Обводка
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Глаза для босса
        if (enemy.typeIndex === 2) {
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(enemy.x - 4, enemy.y - 4, 3, 0, Math.PI * 2);
            ctx.arc(enemy.x + 4, enemy.y - 4, 3, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(enemy.x - 4, enemy.y - 4, 1.5, 0, Math.PI * 2);
            ctx.arc(enemy.x + 4, enemy.y - 4, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Полоска здоровья
        const healthWidth = 40;
        const healthPercent = enemy.health / enemy.maxHealth;
        
        // Фон
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(enemy.x - healthWidth/2, enemy.y - enemy.size - 15, healthWidth, 6);
        
        // Здоровье
        const gradient = ctx.createLinearGradient(
            enemy.x - healthWidth/2, 0,
            enemy.x + healthWidth/2, 0
        );
        
        if (healthPercent > 0.6) {
            gradient.addColorStop(0, '#2ecc71');
            gradient.addColorStop(1, '#27ae60');
        } else if (healthPercent > 0.3) {
            gradient.add
                                gradient.addColorStop(0, '#f39c12');
            gradient.addColorStop(1, '#d35400');
        } else {
            gradient.addColorStop(0, '#e74c3c');
            gradient.addColorStop(1, '#c0392b');
        }
        
        ctx.fillStyle = gradient;
        ctx.fillRect(enemy.x - healthWidth/2, enemy.y - enemy.size - 15, healthWidth * healthPercent, 6);
        
        // Обводка полоски
        ctx.strokeStyle = '#34495e';
        ctx.lineWidth = 1;
        ctx.strokeRect(enemy.x - healthWidth/2, enemy.y - enemy.size - 15, healthWidth, 6);
        
        // Восстанавливаем прозрачность
        ctx.globalAlpha = 1;
    }
    
    function drawProjectile(projectile) {
        // Ядро снаряда
        ctx.fillStyle = projectile.color;
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, projectile.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Свечение
        const gradient = ctx.createRadialGradient(
            projectile.x, projectile.y, 0,
            projectile.x, projectile.y, projectile.size * 2
        );
        gradient.addColorStop(0, projectile.color + '80');
        gradient.addColorStop(1, projectile.color + '00');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, projectile.size * 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Обводка
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Хвост снаряда
        if (projectile.fromTower) {
            ctx.strokeStyle = projectile.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(projectile.x, projectile.y);
            const tailLength = 15;
            const dx = projectile.x - projectile.fromTower.x;
            const dy = projectile.y - projectile.fromTower.y;
            const angle = Math.atan2(dy, dx);
            ctx.lineTo(
                projectile.x - Math.cos(angle) * tailLength,
                projectile.y - Math.sin(angle) * tailLength
            );
            ctx.stroke();
        }
    }
    
    function endWave() {
        gameState.isWaveActive = false;
        
        // Награда за волну
        const waveReward = 20 + gameState.wave * 8;
        gameState.gold += waveReward;
        
        // Обновление рекорда
        if (gameState.wave > gameState.highScore) {
            gameState.highScore = gameState.wave;
            localStorage.setItem('td_highscore', gameState.highScore);
            highScoreElement.textContent = gameState.highScore;
        }
        
        gameState.wave++;
        updateUI();
        
        // Сброс кнопки волны
        startWaveButton.disabled = false;
        startWaveButton.innerHTML = `<i class="fas fa-play"></i> Волна ${gameState.wave}`;
        
        // Сброс прогресса
        waveProgressElement.style.width = '0%';
        
        // Обновляем превью врагов
        updateEnemyPreview();
        
        // Сообщение о завершении
        const enemiesLeft = gameState.enemiesInWave - gameState.enemiesKilled;
        let message = `Волна завершена! Получено ${waveReward} золота.`;
        
        if (enemiesLeft === 0) {
            message += ' Все враги уничтожены!';
            playSound('waveComplete');
        } else {
            message += ` Пропущено врагов: ${enemiesLeft}`;
            playSound('waveEnd');
        }
        
        showMessage(message, 'success');
        
        // Проверяем победу
        if (gameState.wave > gameState.maxWave) {
            setTimeout(() => endGame(true), 1000);
        }
    }
    
    function endGame(isWin) {
        gameState.isWaveActive = false;
        startWaveButton.disabled = true;
        
        if (isWin) {
            showMessage(`🎉 Победа! Вы прошли все ${gameState.maxWave} волн! Финальный счёт: ${gameState.gold} золота`, 'victory');
            playSound('victory');
            
            // Эффект победы
            createVictoryEffect();
        } else {
            showMessage(`💀 Игра окончена! Вы продержались ${gameState.wave - 1} волн.`, 'defeat');
            playSound('defeat');
            
            // Эффект поражения
            createDefeatEffect();
        }
        
        // Кнопка перезапуска
        startWaveButton.innerHTML = `<i class="fas fa-redo"></i> Начать заново`;
        startWaveButton.onclick = resetGame;
        startWaveButton.disabled = false;
    }
    
    function createVictoryEffect() {
        // Фейерверк
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                const x = Math.random() * canvas.width;
                const y = Math.random() * canvas.height;
                createFirework(x, y);
            }, i * 100);
        }
        
        // Золотой дождь
        setInterval(() => {
            for (let i = 0; i < 5; i++) {
                const x = Math.random() * canvas.width;
                gameState.particles.push({
                    x,
                    y: -10,
                    size: Math.random() * 4 + 2,
                    speedX: (Math.random() - 0.5) * 2,
                    speedY: Math.random() * 3 + 2,
                    color: '#ffd369',
                    opacity: 1,
                    life: 100,
                    isCoin: true
                });
            }
        }, 200);
    }
    
    function createDefeatEffect() {
        // Красные вспышки
        for (let i = 0; i < 10; i++) {
            setTimeout(() => {
                const x = Math.random() * canvas.width;
                const y = Math.random() * canvas.height;
                createExplosionEffect(x, y, 50, '#e74c3c');
            }, i * 200);
        }
    }
    
    function createFirework(x, y) {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 4 + 2;
            gameState.particles.push({
                x, y,
                size: Math.random() * 3 + 1,
                speedX: Math.cos(angle) * speed,
                speedY: Math.sin(angle) * speed,
                color: color,
                opacity: 1,
                life: 60
            });
        }
    }
    
    function resetGame() {
        gameState.lives = 20;
        gameState.gold = 100;
        gameState.wave = 1;
        gameState.isWaveActive = false;
        gameState.towers = [];
        gameState.enemies = [];
        gameState.projectiles = [];
        gameState.particles = gameState.particles.filter(p => !p.life); // Оставляем только фоновые
        
        // Сброс клеток
        gameState.cells.forEach(cell => {
            cell.occupied = false;
            cell.tower = null;
        });
        
        // Размечаем путь
        markPathAsOccupied();
        
        // Сброс выбора
        deselectTower();
        resetTowerSelection();
        
        // Обновление UI
        updateUI();
        updateEnemyPreview();
        
        // Восстановление кнопки
        startWaveButton.innerHTML = `<i class="fas fa-play"></i> Начать волну`;
        startWaveButton.onclick = startWave;
        
        showMessage('Игра сброшена! Начните новую игру.', 'info');
        playSound('reset');
    }
    
    function resetTowerSelection() {
        towerItems.forEach(i => i.classList.remove('selected'));
        gameState.selectedTowerType = null;
        gameState.selectedTowerCost = 0;
        canvas.style.cursor = 'default';
    }
    
    function updateUI() {
        // Обновляем цифры
        livesElement.textContent = gameState.lives;
        goldElement.textContent = gameState.gold;
        waveElement.textContent = `${gameState.wave}/${gameState.maxWave}`;
        
        // Цвет жизни в зависимости от количества
        if (gameState.lives <= 5) {
            livesElement.style.color = '#e74c3c';
        } else if (gameState.lives <= 10) {
            livesElement.style.color = '#f39c12';
        } else {
            livesElement.style.color = '#ffd369';
        }
        
        // Цвет золота при изменении
        goldElement.style.transform = 'scale(1.2)';
        setTimeout(() => goldElement.style.transform = 'scale(1)', 300);
        
        // Обновляем состояние кнопок
        upgradeButton.disabled = !gameState.selectedTower || gameState.isWaveActive;
        sellButton.disabled = !gameState.selectedTower || gameState.isWaveActive;
        
        // Обновляем стоимость улучшения
        if (gameState.selectedTower) {
            upgradeCostButtonElement.textContent = gameState.selectedTower.upgradeCost;
            
            // Цвет кнопки в зависимости от доступности улучшения
            if (gameState.gold >= gameState.selectedTower.upgradeCost && !gameState.isWaveActive) {
                upgradeButton.style.opacity = '1';
            } else {
                upgradeButton.style.opacity = '0.7';
            }
        }
    }
    
    function showMessage(text, type = 'info', duration = 3000) {
        const icon = {
            'info': 'info-circle',
            'success': 'check-circle',
            'warning': 'exclamation-triangle',
            'error': 'times-circle',
            'victory': 'trophy',
            'defeat': 'skull'
        }[type];
        
        const color = {
            'info': '#3498db',
            'success': '#2ecc71',
            'warning': '#f39c12',
            'error': '#e74c3c',
            'victory': '#ffd369',
            'defeat': '#e74c3c'
        }[type];
        
        gameMessages.innerHTML = `
            <p style="color: ${color}">
                <i class="fas fa-${icon}"></i> ${text}
            </p>
        `;
        
        // Анимация появления
        gameMessages.style.animation = 'none';
        setTimeout(() => {
            gameMessages.style.animation = 'slideIn 0.3s ease';
        }, 10);
        
        // Автоочистка (кроме важных сообщений)
        if (!['victory', 'defeat', 'error'].includes(type)) {
            setTimeout(() => {
                if (gameMessages.innerHTML.includes(text)) {
                    gameMessages.innerHTML = '<p><i class="fas fa-info-circle"></i> Игра продолжается...</p>';
                }
            }, duration);
        }
    }
    
    function animateIntro() {
        // Анимация появления элементов
        const elements = document.querySelectorAll('.game-header, .game-board, .game-sidebar');
        elements.forEach((el, i) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                el.style.transition = 'all 0.6s ease';
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, i * 200);
        });
        
        // Анимация башен в магазине
        towerItems.forEach((item, i) => {
            item.style.opacity = '0';
            item.style.transform = 'scale(0.8)';
            
            setTimeout(() => {
                item.style.transition = 'all 0.5s ease';
                item.style.opacity = '1';
                item.style.transform = 'scale(1)';
            }, 1000 + i * 200);
        });
    }
    
    function playSound(type) {
        // Создаем аудио контекст для звуков
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Параметры звуков
            const sounds = {
                'select': { frequency: 523.25, duration: 0.1, type: 'sine' },
                'place': { frequency: 659.25, duration: 0.2, type: 'sine' },
                'shoot': { frequency: 880, duration: 0.05, type: 'square' },
                'hit': { frequency: 220, duration: 0.1, type: 'sawtooth' },
                'enemyDeath': { 
                    frequencies: [440, 329.63, 261.63], 
                    duration: 0.3, 
                    type: 'sine' 
                },
                'waveStart': { 
                    frequencies: [523.25, 659.25, 783.99], 
                    duration: 0.5, 
                    type: 'sine' 
                },
                'waveComplete': { 
                    frequencies: [783.99, 659.25, 523.25, 659.25, 783.99], 
                    duration: 0.8, 
                    type: 'sine' 
                },
                'waveEnd': { frequency: 392, duration: 0.3, type: 'sine' },
                'lifeLost': { frequency: 110, duration: 0.5, type: 'sawtooth' },
                'upgrade': { 
                    frequencies: [523.25, 659.25, 783.99, 1046.5], 
                    duration: 0.4, 
                    type: 'sine' 
                },
                'sell': { frequency: 349.23, duration: 0.2, type: 'sine' },
                'victory': { 
                    frequencies: [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98], 
                    duration: 1.5, 
                    type: 'triangle' 
                },
                'defeat': { 
                    frequencies: [392, 349.23, 329.63, 293.66, 261.63], 
                    duration: 1, 
                    type: 'sawtooth' 
                },
                'reset': { frequency: 440, duration: 0.2, type: 'sine' }
            };
            
            const sound = sounds[type];
            if (!sound) return;
            
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.type = sound.type;
            
            // Обработка аккордов
            if (sound.frequencies) {
                // Проигрываем последовательно частоты
                let time = audioContext.currentTime;
                sound.frequencies.forEach((freq, index) => {
                    oscillator.frequency.setValueAtTime(freq, time + index * 0.1);
                });
                oscillator.start(time);
                oscillator.stop(time + sound.duration);
            } else {
                oscillator.frequency.setValueAtTime(sound.frequency, audioContext.currentTime);
                oscillator.start();
                oscillator.stop(audioContext.currentTime + sound.duration);
            }
            
            // Фейд-аут
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + sound.duration);
            
        } catch (e) {
            console.log('Audio not supported:', e);
        }
    }
    
    // Вспомогательные функции
    function getPixelPath() {
        return enemyPath.map(point => ({
            x: point.x * canvas.width,
            y: point.y * canvas.height
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
        
        if (lenSq !== 0) {
            param = dot / lenSq;
        }

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
    
    // Запуск игры
    init();
});
