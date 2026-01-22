// Tower Defence Game - Complete Working Version

document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 Tower Defence Game Loading...');
    
    // ==================== CONSTANTS ====================
    const CONFIG = {
        GAME: {
            START_LIVES: 20,
            START_GOLD: 100,
            START_WAVE: 1,
            MAX_WAVES: 10,
            CELL_SIZE: 40,
            GAME_SPEED: 1.0,
            ENEMY_SPAWN_INTERVAL: 1500,
            ENEMIES_PER_WAVE: 5
        },
        
        TOWERS: {
            BASIC: {
                name: 'Базовая башня',
                cost: 30,
                damage: 5,
                range: 150,
                color: '#3498db',
                upgradeCost: 25,
                fireRate: 800,
                sellRatio: 0.6,
                icon: 'crosshairs'
            },
            SNIPER: {
                name: 'Снайперская башня',
                cost: 80,
                damage: 25,
                range: 300,
                color: '#9b59b6',
                upgradeCost: 50,
                fireRate: 2000,
                sellRatio: 0.6,
                icon: 'eye'
            },
            SPLASH: {
                name: 'Облачная башня',
                cost: 60,
                damage: 10,
                range: 120,
                color: '#e74c3c',
                upgradeCost: 40,
                fireRate: 1500,
                splashRadius: 60,
                sellRatio: 0.6,
                icon: 'bomb'
            }
        },
        
        ENEMIES: {
            BASIC: {
                health: 25,
                speed: 1.3,
                color: '#2ecc71',
                gold: 8,
                size: 12,
                name: 'Быстрый враг'
            },
            TOUGH: {
                health: 60,
                speed: 0.9,
                color: '#f39c12',
                gold: 18,
                size: 16,
                name: 'Бронированный'
            },
            BOSS: {
                health: 120,
                speed: 0.6,
                color: '#e74c3c',
                gold: 35,
                size: 20,
                name: 'БОСС'
            }
        },
        
        COLORS: {
            PATH: '#2ecc71',
            PATH_BORDER: '#27ae60',
            GRID: 'rgba(255, 255, 255, 0.05)',
            RANGE: 'rgba(52, 152, 219, 0.2)'
        }
    };
    
    // ==================== GAME STATE ====================
    const GameState = {
        // Core stats
        lives: CONFIG.GAME.START_LIVES,
        gold: CONFIG.GAME.START_GOLD,
        wave: CONFIG.GAME.START_WAVE,
        highScore: localStorage.getItem('td_highscore') || 0,
        
        // Game status
        isWaveActive: false,
        isPaused: false,
        gameOver: false,
        gameWon: false,
        
        // Selection
        selectedTowerType: null,
        selectedTower: null,
        
        // Game objects
        towers: [],
        enemies: [],
        projectiles: [],
        particles: [],
        cells: [],
        
        // Wave tracking
        enemiesSpawned: 0,
        enemiesKilledThisWave: 0,
        enemiesThisWave: CONFIG.GAME.ENEMIES_PER_WAVE,
        enemySpawnTimer: 0,
        
        // Timing
        lastTime: 0,
        deltaTime: 0,
        
        // Path for enemies (relative coordinates 0-1)
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
    
    // ==================== DOM ELEMENTS ====================
    const DOM = {
        canvas: document.getElementById('gameCanvas'),
        ctx: document.getElementById('gameCanvas').getContext('2d'),
        lives: document.getElementById('lives'),
        gold: document.getElementById('gold'),
        wave: document.getElementById('wave'),
        highscore: document.getElementById('highscore'),
        waveProgress: document.getElementById('waveProgress'),
        startWaveBtn: document.getElementById('startWave'),
        pauseGameBtn: document.getElementById('pauseGame'),
        resetGameBtn: document.getElementById('resetGame'),
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
        enemiesLeft: document.getElementById('enemiesLeft'),
        enemiesKilled: document.getElementById('enemiesKilled'),
        basicEnemies: document.getElementById('basicEnemies'),
        toughEnemies: document.getElementById('toughEnemies'),
        bossEnemies: document.getElementById('bossEnemies'),
        selectionMode: document.getElementById('selectionMode'),
        selectionText: document.getElementById('selectionText'),
        messageArea: document.getElementById('messageArea'),
        towerCards: document.querySelectorAll('.tower-card'),
        buyButtons: document.querySelectorAll('.buy-btn')
    };
    
    // ==================== INITIALIZATION ====================
    function init() {
        console.log('🚀 Initializing Tower Defence Game...');
        
        // Set canvas size
        setupCanvas();
        
        // Initialize game field
        initGameField();
        
        // Set up event listeners
        setupEventListeners();
        
        // Load high score
        DOM.highscore.textContent = GameState.highScore;
        
        // Update UI
        updateUI();
        updateEnemyPreview();
        
        // Show welcome message
        showMessage('🎮 Добро пожаловать в Tower Defence! Выберите башню для начала игры.', 'info');
        
        // Start game loop
        requestAnimationFrame(gameLoop);
        
        console.log('✅ Game initialized successfully!');
    }
    
    function setupCanvas() {
        // Get container size
        const container = document.querySelector('.game-board');
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        // Set canvas dimensions
        DOM.canvas.width = containerWidth;
        DOM.canvas.height = containerHeight;
        
        console.log(`📐 Canvas size: ${DOM.canvas.width}x${DOM.canvas.height}`);
    }
    
    function initGameField() {
        // Calculate grid dimensions
        const cols = Math.floor(DOM.canvas.width / CONFIG.GAME.CELL_SIZE);
        const rows = Math.floor(DOM.canvas.height / CONFIG.GAME.CELL_SIZE);
        
        // Create cells
        for (let x = 0; x < cols; x++) {
            for (let y = 0; y < rows; y++) {
                GameState.cells.push({
                    x: x * CONFIG.GAME.CELL_SIZE,
                    y: y * CONFIG.GAME.CELL_SIZE,
                    width: CONFIG.GAME.CELL_SIZE,
                    height: CONFIG.GAME.CELL_SIZE,
                    occupied: false,
                    tower: null,
                    hovered: false
                });
            }
        }
        
        // Mark path as occupied
        markPathAsOccupied();
        
        // Create background particles
        createBackgroundParticles();
        
        console.log(`🔄 Created ${GameState.cells.length} cells`);
    }
    
    function markPathAsOccupied() {
        const pixelPath = getPixelPath();
        const pathWidth = CONFIG.GAME.CELL_SIZE * 2;
        
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
        for (let i = 0; i < 30; i++) {
            GameState.particles.push({
                x: Math.random() * DOM.canvas.width,
                y: Math.random() * DOM.canvas.height,
                size: Math.random() * 1.5 + 0.5,
                speedX: (Math.random() - 0.5) * 0.3,
                speedY: (Math.random() - 0.5) * 0.3,
                opacity: Math.random() * 0.2 + 0.1,
                color: Math.random() > 0.5 ? '#3498db' : '#9b59b6'
            });
        }
    }
    
    // ==================== EVENT LISTENERS ====================
    function setupEventListeners() {
        console.log('🎮 Setting up event listeners...');
        
        // Tower selection
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
        
        // Canvas interactions
        DOM.canvas.addEventListener('click', handleCanvasClick);
        DOM.canvas.addEventListener('mousemove', handleCanvasMouseMove);
        DOM.canvas.addEventListener('contextmenu', handleCanvasRightClick);
        
        // Control buttons
        DOM.startWaveBtn.addEventListener('click', startWave);
        DOM.pauseGameBtn.addEventListener('click', togglePause);
        DOM.resetGameBtn.addEventListener('click', resetGame);
        DOM.upgradeTowerBtn.addEventListener('click', upgradeSelectedTower);
        DOM.sellTowerBtn.addEventListener('click', sellSelectedTower);
        DOM.closeTowerInfoBtn.addEventListener('click', closeTowerInfo);
        
        // Hotkeys
        document.addEventListener('keydown', handleKeyPress);
        
        // Window resize
        window.addEventListener('resize', handleResize);
        
        console.log('✅ Event listeners set up');
    }
    
    function selectTowerFromShop(card) {
        if (GameState.isWaveActive) {
            showMessage('⚠️ Нельзя покупать башни во время волны!', 'warning');
            return;
        }
        
        const towerType = card.dataset.type;
        const towerConfig = getTowerConfig(towerType);
        
        // Clear previous selection
        DOM.towerCards.forEach(c => c.classList.remove('selected'));
        
        // Mark as selected
        card.classList.add('selected');
        
        // Update selection
        GameState.selectedTowerType = towerType;
        updateSelectionMode(`Установить ${towerConfig.name}`);
        
        // Update cursor
        DOM.canvas.style.cursor = 'crosshair';
        
        // Show message
        showMessage(`🎯 Выбрана ${towerConfig.name}. Кликните на свободную клетку для установки.`, 'info');
        
        // Play sound
        playSound('select');
    }
    
    function handleCanvasClick(e) {
        const rect = DOM.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // If placing a tower
        if (GameState.selectedTowerType && !GameState.isWaveActive) {
            placeTowerAt(x, y);
            return;
        }
        
        // If selecting an existing tower
        selectTowerAtPosition(x, y);
    }
    
    function handleCanvasMouseMove(e) {
        const rect = DOM.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Clear hover state
        GameState.cells.forEach(cell => cell.hovered = false);
        
        // Find cell under cursor
        const cell = findCellAtPosition(x, y);
        
        if (cell) {
            cell.hovered = true;
            
            // Update cursor based on context
            if (GameState.selectedTowerType && !GameState.isWaveActive) {
                const towerConfig = getTowerConfig(GameState.selectedTowerType);
                DOM.canvas.style.cursor = (cell.occupied || GameState.gold < towerConfig.cost)
                    ? 'not-allowed'
                    : 'pointer';
            } else {
                DOM.canvas.style.cursor = 'default';
            }
        }
    }
    
    function handleCanvasRightClick(e) {
        e.preventDefault();
        
        const rect = DOM.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Find tower at position
        const tower = findTowerAtPosition(x, y);
        
        if (tower) {
            selectTower(tower);
            playSound('select');
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
                selectTowerByHotkey('basic');
                break;
            case '2':
                selectTowerByHotkey('sniper');
                break;
            case '3':
                selectTowerByHotkey('splash');
                break;
            case 'p':
                togglePause();
                break;
            case 'r':
                if (GameState.gameOver || GameState.gameWon) {
                    resetGame();
                }
                break;
        }
    }
    
    function handleResize() {
        setupCanvas();
        initGameField();
    }
    
    // ==================== GAME LOGIC ====================
    function gameLoop(timestamp) {
        // Calculate delta time
        GameState.deltaTime = timestamp - GameState.lastTime || 0;
        GameState.lastTime = timestamp;
        
        // Update particles
        updateParticles(GameState.deltaTime);
        
        if (!GameState.isPaused && !GameState.gameOver && !GameState.gameWon) {
            // Spawn enemies if wave is active
            if (GameState.isWaveActive) {
                updateWave(GameState.deltaTime);
            }
            
            // Update game objects
            updateEnemies(GameState.deltaTime);
            updateTowers(GameState.deltaTime);
            updateProjectiles(GameState.deltaTime);
            
            // Check wave completion
            if (GameState.isWaveActive && 
                GameState.enemiesSpawned >= GameState.enemiesThisWave && 
                GameState.enemies.length === 0) {
                completeWave();
            }
        }
        
        // Render everything
        render();
        
        // Continue game loop
        requestAnimationFrame(gameLoop);
    }
    
    function updateWave(deltaTime) {
        // Spawn enemies
        if (GameState.enemiesSpawned < GameState.enemiesThisWave) {
            GameState.enemySpawnTimer += deltaTime;
            
            if (GameState.enemySpawnTimer >= CONFIG.GAME.ENEMY_SPAWN_INTERVAL) {
                spawnEnemy();
                GameState.enemySpawnTimer = 0;
            }
        }
        
        // Update wave progress
        updateWaveProgress();
    }
    
    function spawnEnemy() {
        // Determine enemy type based on wave
        let enemyType;
        const wave = GameState.wave;
        
        if (wave >= 6 && Math.random() < 0.15) {
            enemyType = CONFIG.ENEMIES.BOSS;
        } else if (wave >= 3 && Math.random() < 0.3) {
            enemyType = CONFIG.ENEMIES.TOUGH;
        } else {
            enemyType = CONFIG.ENEMIES.BASIC;
        }
        
        // Get pixel path
        const pixelPath = getPixelPath();
        
        // Create enemy
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
            type: enemyType === CONFIG.ENEMIES.BOSS ? 'boss' : 
                  enemyType === CONFIG.ENEMIES.TOUGH ? 'tough' : 'basic',
            lastHit: 0
        };
        
        GameState.enemies.push(enemy);
        GameState.enemiesSpawned++;
        
        // Update UI
        DOM.enemiesLeft.textContent = Math.max(0, GameState.enemiesThisWave - GameState.enemiesKilledThisWave);
    }
    
    function updateEnemies(deltaTime) {
        for (let i = GameState.enemies.length - 1; i >= 0; i--) {
            const enemy = GameState.enemies[i];
            
            // Check if enemy reached the end
            if (enemy.reachedEnd) {
                enemyReachedEnd(enemy, i);
                continue;
            }
            
            // Move enemy along path
            moveEnemy(enemy, deltaTime);
            
            // Remove dead enemies
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
            // Reached waypoint, move to next
            enemy.pathIndex++;
            
            if (enemy.pathIndex >= enemy.path.length - 1) {
                enemy.reachedEnd = true;
            }
        } else {
            // Move towards waypoint
            const moveDistance = enemy.speed * (deltaTime / 16) * CONFIG.GAME.GAME_SPEED;
            enemy.x += (dx / distance) * moveDistance;
            enemy.y += (dy / distance) * moveDistance;
        }
    }
    
    function enemyReachedEnd(enemy, index) {
        // Reduce lives
        GameState.lives--;
        updateUI();
        
        // Create damage effect
        createParticleEffect(enemy.x, enemy.y, enemy.color, 10);
        
        // Shake message area
        DOM.messageArea.classList.add('shake');
        setTimeout(() => DOM.messageArea.classList.remove('shake'), 500);
        
        // Remove enemy
        GameState.enemies.splice(index, 1);
        
        // Update message
        showMessage(`💔 Враг достиг базы! Осталось ${GameState.lives} жизней.`, 'error');
        playSound('damage');
        
        // Check game over
        if (GameState.lives <= 0) {
            endGame(false);
        }
    }
    
    function killEnemy(enemy, index) {
        // Award gold
        GameState.gold += enemy.gold;
        GameState.enemiesKilledThisWave++;
        
        // Create death effect
        createParticleEffect(enemy.x, enemy.y, enemy.color, 15);
        
        // Add coin particles
        createCoinEffect(enemy.x, enemy.y, enemy.gold);
        
        // Remove enemy
        GameState.enemies.splice(index, 1);
        
        // Update UI
        updateUI();
        DOM.enemiesKilled.textContent = GameState.enemiesKilledThisWave;
        
        // Play sound
        playSound('kill');
        
        // Show message for bosses
        if (enemy.type === 'boss') {
            showMessage(`👑 Босс уничтожен! +${enemy.gold} золота`, 'success');
        }
    }
    
    function updateTowers(deltaTime) {
        GameState.towers.forEach(tower => {
            // Rotate tower towards target
            if (tower.target && tower.target.health > 0) {
                const dx = tower.target.x - tower.x;
                const dy = tower.target.y - tower.y;
                tower.rotation = Math.atan2(dy, dx);
            }
            
            // Find target
            if (!tower.target || tower.target.health <= 0) {
                tower.target = findTargetForTower(tower);
            }
            
            // Shoot at target
            if (tower.target && tower.target.health > 0) {
                const currentTime = Date.now();
                if (currentTime - tower.lastShot > tower.fireRate) {
                    shootFromTower(tower);
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
    
    function shootFromTower(tower) {
        if (!tower.target) return;
        
        // Create projectile
        const projectile = {
            x: tower.x,
            y: tower.y,
            target: tower.target,
            damage: tower.damage,
            color: tower.color,
            speed: 12,
            size: 5,
            splashRadius: tower.splashRadius,
            fromTower: tower
        };
        
        GameState.projectiles.push(projectile);
        
        // Create muzzle flash
        createParticleEffect(tower.x, tower.y, tower.color, 5);
        
        // Play sound
        playSound('shoot');
    }
    
    function updateProjectiles(deltaTime) {
        for (let i = GameState.projectiles.length - 1; i >= 0; i--) {
            const projectile = GameState.projectiles[i];
            
            // Check if target still exists
            if (!projectile.target || projectile.target.health <= 0) {
                GameState.projectiles.splice(i, 1);
                continue;
            }
            
            // Move towards target
            const dx = projectile.target.x - projectile.x;
            const dy = projectile.target.y - projectile.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 8) {
                // Hit target
                applyDamage(projectile);
                createHitEffect(projectile);
                GameState.projectiles.splice(i, 1);
            } else {
                // Continue moving
                const speed = projectile.speed * (deltaTime / 16) * CONFIG.GAME.GAME_SPEED;
                projectile.x += (dx / distance) * speed;
                projectile.y += (dy / distance) * speed;
            }
        }
    }
    
    function applyDamage(projectile) {
        if (projectile.splashRadius) {
            // Area damage
            applySplashDamage(projectile);
        } else {
            // Single target damage
            projectile.target.health -= projectile.damage;
            projectile.target.lastHit = Date.now();
        }
    }
    
    function applySplashDamage(projectile) {
        let hitCount = 0;
        
        for (const enemy of GameState.enemies) {
            const dx = enemy.x - projectile.target.x;
            const dy = enemy.y - projectile.target.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < projectile.splashRadius) {
                // Reduced damage based on distance
                const damageMultiplier = 1 - (distance / projectile.splashRadius) * 0.5;
                enemy.health -= projectile.damage * damageMultiplier;
                enemy.lastHit = Date.now();
                hitCount++;
            }
        }
        
        if (hitCount > 1) {
            showMessage(`💥 Попадание по ${hitCount} целям!`, 'info', 1000);
        }
    }
    
    function updateParticles(deltaTime) {
        for (let i = GameState.particles.length - 1; i >= 0; i--) {
            const particle = GameState.particles[i];
            
            // Update position
            particle.x += particle.speedX * (deltaTime / 16);
            particle.y += particle.speedY * (deltaTime / 16);
            
            // Apply gravity to coins
            if (particle.isCoin) {
                particle.speedY += 0.1;
            }
            
            // Reduce life
            if (particle.life) {
                particle.life--;
                particle.opacity = particle.life / 50;
                
                if (particle.life <= 0) {
                    GameState.particles.splice(i, 1);
                }
            } else {
                // Wrap background particles
                if (particle.x < -10) particle.x = DOM.canvas.width + 10;
                if (particle.x > DOM.canvas.width + 10) particle.x = -10;
                if (particle.y < -10) particle.y = DOM.canvas.height + 10;
                if (particle.y > DOM.canvas.height + 10) particle.y = -10;
            }
        }
    }
    
    // ==================== TOWER MANAGEMENT ====================
    function placeTowerAt(x, y) {
        const cell = findCellAtPosition(x, y);
        
        if (!cell) {
            showMessage('❌ Кликните по клетке!', 'error');
            return;
        }
        
        const towerConfig = getTowerConfig(GameState.selectedTowerType);
        
        // Check if cell is occupied
        if (cell.occupied) {
            showMessage('❌ Эта клетка уже занята!', 'error');
            return;
        }
        
        // Check gold
        if (GameState.gold < towerConfig.cost) {
            showMessage(`❌ Недостаточно золота! Нужно ${towerConfig.cost}`, 'error');
            return;
        }
        
        // Create tower
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
            cell: cell,
            icon: towerConfig.icon
        };
        
        // Add to game
        GameState.towers.push(tower);
        cell.occupied = true;
        cell.tower = tower;
        
        // Deduct gold
        GameState.gold -= towerConfig.cost;
        
        // Create placement effect
        createPlacementEffect(tower.x, tower.y, tower.color);
        
        // Show message
        showMessage(`✅ ${towerConfig.name} установлена!`, 'success');
        playSound('place');
        
        // Update UI and clear selection
        updateUI();
        clearSelection();
    }
    
    function selectTowerAtPosition(x, y) {
        const tower = findTowerAtPosition(x, y);
        
        if (tower) {
            selectTower(tower);
            playSound('select');
        } else {
            // Clicked empty space
            if (GameState.selectedTower) {
                clearTowerSelection();
            }
        }
    }
    
    function findTowerAtPosition(x, y) {
        for (const tower of GameState.towers) {
            const dx = x - tower.x;
            const dy = y - tower.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 20) {
                return tower;
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
    
    function selectTower(tower) {
        GameState.selectedTower = tower;
        
        // Update tower info panel
        updateTowerInfo(tower);
        DOM.towerInfoPanel.style.display = 'block';
        
        // Update selection mode
        updateSelectionMode(`Выбрана: ${tower.name}`);
    }
    
    function updateTowerInfo(tower) {
        // Update preview
        DOM.towerPreview.style.background = `linear-gradient(135deg, ${tower.color}, ${darkenColor(tower.color, 20)})`;
        DOM.towerPreview.innerHTML = `<i class="fas fa-${tower.icon}"></i>`;
        
        // Update details
        DOM.towerName.textContent = tower.name;
        DOM.towerLevel.textContent = tower.level;
        DOM.towerDamage.textContent = tower.damage;
        DOM.towerRange.textContent = `${tower.range}px`;
        DOM.towerSpeed.textContent = getSpeedDescription(tower.fireRate);
        DOM.towerEffect.textContent = tower.splashRadius ? `Область ${tower.splashRadius}px` : 'Нет';
        
        // Update costs
        DOM.upgradeCost.textContent = tower.upgradeCost;
        DOM.sellValue.textContent = tower.sellValue;
        
        // Update button states
        DOM.upgradeTowerBtn.disabled = GameState.isWaveActive || GameState.gold < tower.upgradeCost;
        DOM.sellTowerBtn.disabled = GameState.isWaveActive;
    }
    
    function upgradeSelectedTower() {
        if (!GameState.selectedTower || GameState.isWaveActive) return;
        
        const tower = GameState.selectedTower;
        
        if (GameState.gold < tower.upgradeCost) {
            showMessage(`❌ Недостаточно золота для улучшения!`, 'error');
            return;
        }
        
        // Deduct gold
        GameState.gold -= tower.upgradeCost;
        
        // Upgrade tower
        tower.level++;
        tower.damage = Math.floor(tower.damage * 1.5);
        tower.range = Math.floor(tower.range * 1.1);
        tower.upgradeCost = Math.floor(tower.upgradeCost * 1.5);
        tower.sellValue = Math.floor(tower.sellValue * 1.3);
        
        if (tower.splashRadius) {
            tower.splashRadius = Math.floor(tower.splashRadius * 1.1);
        }
        
        // Improve fire rate
        tower.fireRate = Math.max(400, tower.fireRate * 0.9);
        
        // Create upgrade effect
        createUpgradeEffect(tower.x, tower.y);
        
        // Show message
        showMessage(`⬆️ Башня улучшена до уровня ${tower.level}!`, 'success');
        playSound('upgrade');
        
        // Update UI
        updateUI();
        updateTowerInfo(tower);
    }
    
    function sellSelectedTower() {
        if (!GameState.selectedTower || GameState.isWaveActive) return;
        
        const tower = GameState.selectedTower;
        
        if (!confirm(`Продать ${tower.name} за ${tower.sellValue} золота?`)) {
            return;
        }
        
        // Add gold
        GameState.gold += tower.sellValue;
        
        // Free cell
        if (tower.cell) {
            tower.cell.occupied = false;
            tower.cell.tower = null;
        }
        
        // Remove tower
        const index = GameState.towers.indexOf(tower);
        if (index > -1) {
            GameState.towers.splice(index, 1);
        }
        
        // Create sell effect
        createSellEffect(tower.x, tower.y, tower.sellValue);
        
        // Show message
        showMessage(`💰 Башня продана за ${tower.sellValue} золота!`, 'success');
        playSound('sell');
        
        // Clear selection and update UI
        clearTowerSelection();
        updateUI();
    }
    
    function clearTowerSelection() {
        GameState.selectedTower = null;
        DOM.towerInfoPanel.style.display = 'none';
    }
    
    function closeTowerInfo() {
        clearTowerSelection();
    }
    
    function clearSelection() {
        // Clear tower selection from shop
        DOM.towerCards.forEach(card => card.classList.remove('selected'));
        GameState.selectedTowerType = null;
        
        // Clear selected tower
        clearTowerSelection();
        
        // Update selection mode
        updateSelectionMode('Выберите башню');
        
        // Reset cursor
        DOM.canvas.style.cursor = 'default';
    }
    
    function selectTowerByHotkey(type) {
        if (GameState.isWaveActive) return;
        
        const card = document.querySelector(`.tower-card[data-type="${type}"]`);
        if (card) {
            selectTowerFromShop(card);
        }
    }
    
    // ==================== GAME CONTROLS ====================
    function startWave() {
        if (GameState.isWaveActive || GameState.gameOver || GameState.gameWon) return;
        
        // Calculate enemies for this wave
        GameState.enemiesThisWave = CONFIG.GAME.ENEMIES_PER_WAVE + Math.floor((GameState.wave - 1) * 1.5);
        GameState.enemiesSpawned = 0;
        GameState.enemiesKilledThisWave = 0;
        GameState.isWaveActive = true;
        
        // Update UI
        DOM.startWaveBtn.disabled = true;
        DOM.startWaveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ВОЛНА ИДЕТ';
        
        // Update enemy preview
        updateEnemyPreview();
        
        // Show message
        showMessage(`⚡ Волна ${GameState.wave} началась! Уничтожьте ${GameState.enemiesThisWave} врагов.`, 'warning');
        playSound('waveStart');
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
    
    function completeWave() {
        GameState.isWaveActive = false;
        
        // Calculate reward
        const waveReward = 20 + GameState.wave * 10;
        GameState.gold += waveReward;
        
        // Update high score
        if (GameState.wave > GameState.highScore) {
            GameState.highScore = GameState.wave;
            localStorage.setItem('td_highscore', GameState.highScore);
            DOM.highscore.textContent = GameState.highScore;
        }
        
        // Next wave
        GameState.wave++;
        
        // Reset UI
        DOM.startWaveBtn.disabled = false;
        DOM.startWaveBtn.innerHTML = '<i class="fas fa-play"></i> СТАРТ ВОЛНЫ';
        DOM.waveProgress.style.width = '0%';
        
        // Update wave display
        DOM.wave.textContent = `${GameState.wave}/${CONFIG.GAME.MAX_WAVES}`;
        
        // Update enemy preview
        updateEnemyPreview();
        
        // Show message
        const performance = GameState.enemiesKilledThisWave === GameState.enemiesThisWave
            ? 'Отлично! Все враги уничтожены!'
            : `Хорошая работа! Убито ${GameState.enemiesKilledThisWave} из ${GameState.enemiesThisWave} врагов`;
        
        showMessage(`✅ Волна завершена! +${waveReward} золота. ${performance}`, 'success');
        playSound('waveComplete');
        
        // Check for victory
        if (GameState.wave > CONFIG.GAME.MAX_WAVES) {
            setTimeout(() => endGame(true), 1000);
        }
    }
    
    function endGame(isVictory) {
        GameState.isWaveActive = false;
        
        if (isVictory) {
            GameState.gameWon = true;
            showMessage('🎉 ПОБЕДА! Вы прошли все волны! Молодец!', 'victory');
            playSound('victory');
            
            // Create victory effects
            createVictoryEffects();
        } else {
            GameState.gameOver = true;
            showMessage('💀 ИГРА ОКОНЧЕНА! Попробуйте еще раз!', 'defeat');
            playSound('defeat');
        }
        
        // Update button
        DOM.startWaveBtn.disabled = true;
        DOM.startWaveBtn.innerHTML = '<i class="fas fa-flag-checkered"></i> ИГРА ЗАВЕРШЕНА';
    }
    
    function resetGame() {
        console.log('🔄 Resetting game...');
        
        // Reset game state
        GameState.lives = CONFIG.GAME.START_LIVES;
        GameState.gold = CONFIG.GAME.START_GOLD;
        GameState.wave = CONFIG.GAME.START_WAVE;
        GameState.isWaveActive = false;
        GameState.isPaused = false;
        GameState.gameOver = false;
        GameState.gameWon = false;
        GameState.enemiesSpawned = 0;
        GameState.enemiesKilledThisWave = 0;
        
        // Clear game objects
        GameState.towers = [];
        GameState.enemies = [];
        GameState.projectiles = [];
        GameState.particles = GameState.particles.filter(p => !p.life);
        
        // Clear cells
        GameState.cells.forEach(cell => {
            cell.occupied = false;
            cell.tower = null;
        });
        
        // Mark path
        markPathAsOccupied();
        
        // Clear selection
        clearSelection();
        
        // Update UI
        updateUI();
        updateEnemyPreview();
        
        // Reset buttons
        DOM.startWaveBtn.disabled = false;
        DOM.startWaveBtn.innerHTML = '<i class="fas fa-play"></i> СТАРТ ВОЛНЫ';
        DOM.waveProgress.style.width = '0%';
        DOM.enemiesLeft.textContent = CONFIG.GAME.ENEMIES_PER_WAVE;
        DOM.enemiesKilled.textContent = '0';
        
        // Show message
        showMessage('🔄 Игра сброшена! Приготовьтесь к новой битве!', 'info');
        playSound('reset');
        
        console.log('✅ Game reset complete');
    }
    
    // ==================== UI UPDATES ====================
    function updateUI() {
        // Update stats
        DOM.lives.textContent = GameState.lives;
        DOM.gold.textContent = GameState.gold;
        DOM.wave.textContent = `${GameState.wave}/${CONFIG.GAME.MAX_WAVES}`;
        
        // Color lives based on amount
        if (GameState.lives <= 5) {
            DOM.lives.style.color = '#ff4757';
        } else if (GameState.lives <= 10) {
            DOM.lives.style.color = '#ffa502';
        } else {
            DOM.lives.style.color = '#2ed573';
        }
        
        // Animate gold change
        DOM.gold.classList.add('pulse');
        setTimeout(() => DOM.gold.classList.remove('pulse'), 300);
    }
    
    function updateEnemyPreview() {
        const totalEnemies = CONFIG.GAME.ENEMIES_PER_WAVE + Math.floor((GameState.wave - 1) * 1.5);
        let basicCount = totalEnemies;
        let toughCount = 0;
        let bossCount = 0;
        
        // Calculate enemy distribution
        if (GameState.wave >= 3) {
            toughCount = Math.min(Math.floor(totalEnemies * 0.3), 5);
            basicCount -= toughCount;
        }
        
        if (GameState.wave >= 6) {
            bossCount = Math.min(Math.floor(totalEnemies * 0.2), 3);
            basicCount -= bossCount;
        }
        
        // Update display
        DOM.basicEnemies.textContent = Math.max(0, basicCount);
        DOM.toughEnemies.textContent = toughCount;
        DOM.bossEnemies.textContent = bossCount;
        
        // Update current wave info
        GameState.enemiesThisWave = totalEnemies;
        DOM.enemiesLeft.textContent = totalEnemies;
    }
    
    function updateWaveProgress() {
        const progress = (GameState.enemiesSpawned / GameState.enemiesThisWave) * 100;
        DOM.waveProgress.style.width = `${progress}%`;
    }
    
    function updateSelectionMode(text) {
        DOM.selectionText.textContent = text;
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
        
        DOM.messageArea.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <span>${text}</span>
        `;
        
        // Add type-specific styling
        DOM.messageArea.style.borderLeftColor = {
            'info': '#3498db',
            'success': '#2ecc71',
            'warning': '#f39c12',
            'error': '#e74c3c',
            'victory': '#ffd369',
            'defeat': '#e74c3c'
        }[type];
        
        // Auto-clear for non-important messages
        if (!['victory', 'defeat'].includes(type)) {
            setTimeout(() => {
                if (DOM.messageArea.innerHTML.includes(text)) {
                    DOM.messageArea.innerHTML = `
                        <i class="fas fa-info-circle"></i>
                        <span>Готовьтесь к волне ${GameState.wave}...</span>
                    `;
                    DOM.messageArea.style.borderLeftColor = '#3498db';
                }
            }, duration);
        }
    }
    
    // ==================== RENDERING ====================
    function render() {
        // Clear canvas
        DOM.ctx.clearRect(0, 0, DOM.canvas.width, DOM.canvas.height);
        
        // Draw background
        drawBackground();
        
        // Draw grid
        drawGrid();
        
        // Draw path
        drawPath();
        
        // Draw hovered cells
        drawHoveredCells();
        
        // Draw towers
        GameState.towers.forEach(drawTower);
        
        // Draw enemies
        GameState.enemies.forEach(drawEnemy);
        
        // Draw projectiles
        GameState.projectiles.forEach(drawProjectile);
        
        // Draw particles
        GameState.particles.forEach(drawParticle);
        
        // Draw tower range if selected
        if (GameState.selectedTower && !GameState.isWaveActive) {
            drawTowerRange(GameState.selectedTower);
        }
        
        // Draw game state overlays
        if (GameState.isPaused) {
            drawPauseOverlay();
        }
        
        if (GameState.gameOver) {
            drawGameOverOverlay();
        } else if (GameState.gameWon) {
            drawVictoryOverlay();
        }
    }
    
    function drawBackground() {
        // Gradient background
        const gradient = DOM.ctx.createLinearGradient(0, 0, DOM.canvas.width, DOM.canvas.height);
        gradient.addColorStop(0, '#0f172a');
        gradient.addColorStop(1, '#1e293b');
        
        DOM.ctx.fillStyle = gradient;
        DOM.ctx.fillRect(0, 0, DOM.canvas.width, DOM.canvas.height);
    }
    
    function drawGrid() {
        DOM.ctx.strokeStyle = CONFIG.COLORS.GRID;
        DOM.ctx.lineWidth = 1;
        
        // Vertical lines
        for (let x = 0; x <= DOM.canvas.width; x += CONFIG.GAME.CELL_SIZE) {
            DOM.ctx.beginPath();
            DOM.ctx.moveTo(x, 0);
            DOM.ctx.lineTo(x, DOM.canvas.height);
            DOM.ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = 0; y <= DOM.canvas.height; y += CONFIG.GAME.CELL_SIZE) {
            DOM.ctx.beginPath();
            DOM.ctx.moveTo(0, y);
            DOM.ctx.lineTo(DOM.canvas.width, y);
            DOM.ctx.stroke();
        }
    }
    
    function drawPath() {
        const path = getPixelPath();
        
        if (path.length < 2) return;
        
        // Draw path line
        DOM.ctx.strokeStyle = CONFIG.COLORS.PATH;
        DOM.ctx.lineWidth = 40;
        DOM.ctx.lineCap = 'round';
        DOM.ctx.lineJoin = 'round';
        
        DOM.ctx.beginPath();
        DOM.ctx.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length; i++) {
            DOM.ctx.lineTo(path[i].x, path[i].y);
        }
        DOM.ctx.stroke();
        
        // Draw path border
        DOM.ctx.strokeStyle = CONFIG.COLORS.PATH_BORDER;
        DOM.ctx.lineWidth = 3;
        DOM.ctx.stroke();
        
        // Draw path points
        path.forEach((point, i) => {
            let color, label;
            
            if (i === 0) {
                color = '#e74c3c';
                label = 'СТАРТ';
            } else if (i === path.length - 1) {
                color = '#3498db';
                label = 'БАЗА';
            } else {
                color = '#f1c40f';
            }
            
            // Draw point
            DOM.ctx.fillStyle = color;
            DOM.ctx.beginPath();
            DOM.ctx.arc(point.x, point.y, 10, 0, Math.PI * 2);
            DOM.ctx.fill();
            
            // Draw border
            DOM.ctx.strokeStyle = '#2c3e50';
            DOM.ctx.lineWidth = 2;
            DOM.ctx.stroke();
            
            // Draw label
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
        if (!GameState.selectedTowerType || GameState.isWaveActive) return;
        
        const towerConfig = getTowerConfig(GameState.selectedTowerType);
        
        GameState.cells.forEach(cell => {
            if (cell.hovered) {
                if (cell.occupied) {
                    // Occupied cell
                    DOM.ctx.fillStyle = 'rgba(231, 76, 60, 0.3)';
                    DOM.ctx.fillRect(cell.x, cell.y, cell.width, cell.height);
                    
                    // Red X
                    DOM.ctx.strokeStyle = '#e74c3c';
                    DOM.ctx.lineWidth = 3;
                    DOM.ctx.beginPath();
                    DOM.ctx.moveTo(cell.x + 10, cell.y + 10);
                    DOM.ctx.lineTo(cell.x + cell.width - 10, cell.y + cell.height - 10);
                    DOM.ctx.moveTo(cell.x + cell.width - 10, cell.y + 10);
                    DOM.ctx.lineTo(cell.x + 10, cell.y + cell.height - 10);
                    DOM.ctx.stroke();
                } else {
                    // Available cell
                    const canAfford = GameState.gold >= towerConfig.cost;
                    DOM.ctx.fillStyle = canAfford 
                        ? 'rgba(0, 173, 181, 0.3)' 
                        : 'rgba(231, 76, 60, 0.5)';
                    DOM.ctx.fillRect(cell.x, cell.y, cell.width, cell.height);
                    
                    // Tower preview
                    const centerX = cell.x + cell.width / 2;
                    const centerY = cell.y + cell.height / 2;
                    
                    DOM.ctx.globalAlpha = 0.6;
                    DOM.ctx.fillStyle = towerConfig.color;
                    DOM.ctx.beginPath();
                    DOM.ctx.arc(centerX, centerY, 15, 0, Math.PI * 2);
                    DOM.ctx.fill();
                    
                    if (!canAfford) {
                        // Dollar sign if can't afford
                        DOM.ctx.fillStyle = '#ffffff';
                        DOM.ctx.font = 'bold 14px Arial';
                        DOM.ctx.textAlign = 'center';
                        DOM.ctx.textBaseline = 'middle';
                        DOM.ctx.fillText('$', centerX, centerY);
                    }
                    
                    DOM.ctx.globalAlpha = 1;
                }
            }
        });
    }
    
    function drawTower(tower) {
        // Draw base
        DOM.ctx.fillStyle = tower.color;
        DOM.ctx.beginPath();
        DOM.ctx.arc(tower.x, tower.y, 18, 0, Math.PI * 2);
        DOM.ctx.fill();
        
        // Draw border
        DOM.ctx.strokeStyle = '#2c3e50';
        DOM.ctx.lineWidth = 3;
        DOM.ctx.stroke();
        
        // Draw barrel (rotates)
        DOM.ctx.save();
        DOM.ctx.translate(tower.x, tower.y);
        DOM.ctx.rotate(tower.rotation);
        
        DOM.ctx.fillStyle = '#2c3e50';
        DOM.ctx.fillRect(0, -4, 25, 8);
        
        DOM.ctx.fillStyle = tower.color;
        DOM.ctx.fillRect(0, -3, 20, 6);
        
        DOM.ctx.restore();
        
        // Draw level
        DOM.ctx.fillStyle = '#ffffff';
        DOM.ctx.font = 'bold 14px Arial';
        DOM.ctx.textAlign = 'center';
        DOM.ctx.textBaseline = 'middle';
        DOM.ctx.fillText(tower.level.toString(), tower.x, tower.y);
        
        // Draw selection effect
        if (tower === GameState.selectedTower) {
            DOM.ctx.strokeStyle = '#ffd369';
            DOM.ctx.lineWidth = 2;
            DOM.ctx.beginPath();
            DOM.ctx.arc(tower.x, tower.y, 22, 0, Math.PI * 2);
            DOM.ctx.stroke();
        }
    }
    
    function drawTowerRange(tower) {
        // Draw range circle
        DOM.ctx.strokeStyle = 'rgba(52, 152, 219, 0.6)';
        DOM.ctx.lineWidth = 2;
        DOM.ctx.setLineDash([5, 5]);
        DOM.ctx.beginPath();
        DOM.ctx.arc(tower.x, tower.y, tower.range, 0, Math.PI * 2);
        DOM.ctx.stroke();
        DOM.ctx.setLineDash([]);
        
        // Fill range
        DOM.ctx.fillStyle = 'rgba(52, 152, 219, 0.1)';
        DOM.ctx.fill();
    }
    
    function drawEnemy(enemy) {
        // Flicker when hit
        if (Date.now() - enemy.lastHit < 200) {
            DOM.ctx.globalAlpha = 0.7;
        }
        
        // Draw body
        DOM.ctx.fillStyle = enemy.color;
        DOM.ctx.beginPath();
        DOM.ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
        DOM.ctx.fill();
        
        // Draw border
        DOM.ctx.strokeStyle = '#2c3e50';
        DOM.ctx.lineWidth = 2;
        DOM.ctx.stroke();
        
        // Draw health bar
        const healthWidth = 40;
        const healthPercent = enemy.health / enemy.maxHealth;
        
        // Background
        DOM.ctx.fillStyle = '#2c3e50';
        DOM.ctx.fillRect(
            enemy.x - healthWidth / 2,
            enemy.y - enemy.size - 15,
            healthWidth,
            6
        );
        
        // Health
        DOM.ctx.fillStyle = healthPercent > 0.5 ? '#2ecc71' : 
                           healthPercent > 0.25 ? '#f39c12' : '#e74c3c';
        DOM.ctx.fillRect(
            enemy.x - healthWidth / 2,
            enemy.y - enemy.size - 15,
            healthWidth * healthPercent,
            6
        );
        
        // Border
        DOM.ctx.strokeStyle = '#34495e';
        DOM.ctx.lineWidth = 1;
        DOM.ctx.strokeRect(
            enemy.x - healthWidth / 2,
            enemy.y - enemy.size - 15,
            healthWidth,
            6
        );
        
        DOM.ctx.globalAlpha = 1;
    }
    
    function drawProjectile(projectile) {
        // Draw core
        DOM.ctx.fillStyle = projectile.color;
        DOM.ctx.beginPath();
        DOM.ctx.arc(projectile.x, projectile.y, projectile.size, 0, Math.PI * 2);
        DOM.ctx.fill();
        
        // Draw glow
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
    
    function drawParticle(particle) {
        DOM.ctx.globalAlpha = particle.opacity;
        
        if (particle.isCoin) {
            // Draw coin
            DOM.ctx.fillStyle = '#ffd369';
            DOM.ctx.beginPath();
            DOM.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            DOM.ctx.fill();
            
            // Draw coin shine
            DOM.ctx.fillStyle = '#ffffff';
            DOM.ctx.fillRect(particle.x - 1, particle.y - 1, 2, 2);
            
            // Draw value if exists
            if (particle.value) {
                DOM.ctx.fillStyle = '#ffd369';
                DOM.ctx.font = 'bold 12px Arial';
                DOM.ctx.textAlign = 'center';
                DOM.ctx.fillText(`+${particle.value}`, particle.x, particle.y - 15);
            }
        } else {
            // Draw regular particle
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
        DOM.ctx.font = 'bold 48px Orbitron';
        DOM.ctx.textAlign = 'center';
        DOM.ctx.textBaseline = 'middle';
        DOM.ctx.fillText('ПАУЗА', DOM.canvas.width / 2, DOM.canvas.height / 2 - 30);
        
        DOM.ctx.font = '24px Roboto';
        DOM.ctx.fillText('Нажмите P для продолжения', DOM.canvas.width / 2, DOM.canvas.height / 2 + 30);
    }
    
    function drawGameOverOverlay() {
        DOM.ctx.fillStyle = 'rgba(231, 76, 60, 0.8)';
        DOM.ctx.fillRect(0, 0, DOM.canvas.width, DOM.canvas.height);
        
        DOM.ctx.fillStyle = '#ffffff';
        DOM.ctx.font = 'bold 48px Orbitron';
        DOM.ctx.textAlign = 'center';
        DOM.ctx.textBaseline = 'middle';
        DOM.ctx.fillText('ПОРАЖЕНИЕ', DOM.canvas.width / 2, DOM.canvas.height / 2 - 50);
        
        DOM.ctx.font = '28px Roboto';
        DOM.ctx.fillText(`Достигнута волна: ${GameState.wave - 1}`, DOM.canvas.width / 2, DOM.canvas.height / 2);
        DOM.ctx.fillText(`Золото: ${GameState.gold}`, DOM.canvas.width / 2, DOM.canvas.height / 2 + 40);
        
        DOM.ctx.font = '22px Roboto';
        DOM.ctx.fillText('Нажмите R для перезапуска', DOM.canvas.width / 2, DOM.canvas.height / 2 + 100);
    }
    
    function drawVictoryOverlay() {
        DOM.ctx.fillStyle = 'rgba(46, 204, 113, 0.8)';
        DOM.ctx.fillRect(0, 0, DOM.canvas.width, DOM.canvas.height);
        
        DOM.ctx.fillStyle = '#ffffff';
        DOM.ctx.font = 'bold 48px Orbitron';
        DOM.ctx.textAlign = 'center';
        DOM.ctx.textBaseline = 'middle';
        DOM.ctx.fillText('ПОБЕДА!', DOM.canvas.width / 2, DOM.canvas.height / 2 - 50);
        
        DOM.ctx.font = '28px Roboto';
        DOM.ctx.fillText('Все волны пройдены!', DOM.canvas.width / 2, DOM.canvas.height / 2);
        DOM.ctx.fillText(`Финальный счёт: ${GameState.gold} золота`, DOM.canvas.width / 2, DOM.canvas.height / 2 + 40);
        
        DOM.ctx.font = '22px Roboto';
        DOM.ctx.fillText('Нажмите R для перезапуска', DOM.canvas.width / 2, DOM.canvas.height / 2 + 100);
        
        // Draw fireworks occasionally
        if (Math.random() < 0.3) {
            createFirework(Math.random() * DOM.canvas.width, Math.random() * DOM.canvas.height);
        }
    }
    
    // ==================== EFFECTS ====================
    function createPlacementEffect(x, y, color) {
        for (let i = 0; i < 12; i++) {
            GameState.particles.push({
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
    
    function createUpgradeEffect(x, y) {
        for (let i = 0; i < 20; i++) {
            GameState.particles.push({
                x, y,
                size: Math.random() * 3 + 2,
                speedX: (Math.random() - 0.5) * 4,
                speedY: (Math.random() - 0.5) * 4,
                color: '#ffd369',
                opacity: 1,
                life: 40
            });
        }
    }
    
    function createSellEffect(x, y, amount) {
        for (let i = 0; i < 15; i++) {
            GameState.particles.push({
                x, y,
                size: Math.random() * 3 + 2,
                speedX: (Math.random() - 0.5) * 3,
                speedY: Math.random() * -4 - 2,
                color: '#ffd369',
                opacity: 1,
                life: 50,
                isCoin: true,
                value: i === 0 ? amount : null
            });
        }
    }
    
    function createParticleEffect(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            GameState.particles.push({
                x, y,
                size: Math.random() * 3 + 1,
                speedX: (Math.random() - 0.5) * 4,
                speedY: (Math.random() - 0.5) * 4,
                color: color,
                opacity: 1,
                life: 25
            });
        }
    }
    
    function createCoinEffect(x, y, amount) {
        const coinCount = Math.min(10, Math.floor(amount / 5));
        
        for (let i = 0; i < coinCount; i++) {
            GameState.particles.push({
                x, y,
                size: Math.random() * 3 + 2,
                speedX: (Math.random() - 0.5) * 3,
                speedY: Math.random() * -4 - 2,
                color: '#ffd369',
                opacity: 1,
                life: 50,
                isCoin: true
            });
        }
    }
    
    function createHitEffect(projectile) {
        if (projectile.splashRadius) {
            createExplosionEffect(projectile.target.x, projectile.target.y, projectile.splashRadius, projectile.color);
        } else {
            createParticleEffect(projectile.target.x, projectile.target.y, projectile.color, 8);
        }
    }
    
    function createExplosionEffect(x, y, radius, color) {
        // Explosion particles
        for (let i = 0; i < 20; i++) {
            GameState.particles.push({
                x, y,
                size: Math.random() * 4 + 2,
                speedX: (Math.random() - 0.5) * 6,
                speedY: (Math.random() - 0.5) * 6,
                color: color,
                opacity: 1,
                life: 30
            });
        }
        
        // Draw explosion wave
        DOM.ctx.strokeStyle = color + '80';
        DOM.ctx.lineWidth = 3;
        DOM.ctx.beginPath();
        DOM.ctx.arc(x, y, radius, 0, Math.PI * 2);
        DOM.ctx.stroke();
    }
    
    function createVictoryEffects() {
        // Create fireworks
        for (let i = 0; i < 8; i++) {
            setTimeout(() => {
                createFirework(
                    Math.random() * DOM.canvas.width,
                    Math.random() * DOM.canvas.height
                );
            }, i * 300);
        }
        
        // Create coin rain
        setInterval(() => {
            for (let i = 0; i < 3; i++) {
                GameState.particles.push({
                    x: Math.random() * DOM.canvas.width,
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
        }, 500);
    }
    
    function createFirework(x, y) {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        for (let i = 0; i < 30; i++) {
            GameState.particles.push({
                x, y,
                size: Math.random() * 3 + 2,
                speedX: (Math.random() - 0.5) * 5,
                speedY: (Math.random() - 0.5) * 5,
                color: color,
                opacity: 1,
                life: 60
            });
        }
    }
    
    // ==================== AUDIO ====================
    function playSound(type) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            const sounds = {
                'select': { frequency: 523.25, duration: 0.1, type: 'sine' },
                'place': { frequency: 659.25, duration: 0.15, type: 'sine' },
                'shoot': { frequency: 880, duration: 0.05, type: 'square' },
                'kill': { frequency: 440, duration: 0.1, type: 'sine' },
                'damage': { frequency: 110, duration: 0.3, type: 'sawtooth' },
                'waveStart': { frequencies: [523.25, 659.25, 783.99], duration: 0.5, type: 'sine' },
                'waveComplete': { frequencies: [783.99, 659.25, 523.25, 659.25, 783.99], duration: 0.7, type: 'sine' },
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
            console.log('Audio not supported:', e);
        }
    }
    
    // ==================== UTILITY FUNCTIONS ====================
    function getTowerConfig(type) {
        switch(type) {
            case 'basic': return CONFIG.TOWERS.BASIC;
            case 'sniper': return CONFIG.TOWERS.SNIPER;
            case 'splash': return CONFIG.TOWERS.SPLASH;
            default: return CONFIG.TOWERS.BASIC;
        }
    }
    
    function getPixelPath() {
        return GameState.enemyPath.map(point => ({
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
    
    function getSpeedDescription(fireRate) {
        if (fireRate < 1000) return 'Очень быстрая';
        if (fireRate < 1500) return 'Быстрая';
        if (fireRate < 2000) return 'Средняя';
        return 'Медленная';
    }
    
    // ==================== START THE GAME ====================
    init();
});
