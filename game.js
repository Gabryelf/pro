// game.js

// Инициализация игры
document.addEventListener('DOMContentLoaded', function() {
    // Получаем элементы DOM
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const livesElement = document.getElementById('lives');
    const goldElement = document.getElementById('gold');
    const waveElement = document.getElementById('wave');
    const startWaveButton = document.getElementById('startWave');
    const upgradeButton = document.getElementById('upgradeTower');
    const sellButton = document.getElementById('sellTower');
    const gameMessages = document.getElementById('gameMessages');
    const towerItems = document.querySelectorAll('.tower-item');
    
    // Состояние игры
    const gameState = {
        lives: 20,
        gold: 100,
        wave: 1,
        isWaveActive: false,
        selectedTowerType: null,
        selectedTowerCost: 0,
        selectedTower: null,
        towers: [],
        enemies: [],
        projectiles: [],
        cells: [],
        cellSize: 40,
        lastTime: 0,
        enemySpawnTimer: 0,
        enemySpawnInterval: 2000, // мс между появлением врагов
        enemiesInWave: 5,
        enemiesSpawned: 0
    };
    
    // Путь для врагов (точки в процентах от ширины/высоты canvas)
    const enemyPath = [
        {x: 0, y: 0.5},          // Начало пути (левая сторона)
        {x: 0.4, y: 0.5},        // Первая точка
        {x: 0.4, y: 0.2},        // Вверх
        {x: 0.7, y: 0.2},        // Вправо
        {x: 0.7, y: 0.7},        // Вниз
        {x: 1, y: 0.7}           // Конец пути (правая сторона)
    ];
    
    // Конвертируем процентные координаты в пиксельные
    function getPixelPath() {
        return enemyPath.map(point => ({
            x: point.x * canvas.width,
            y: point.y * canvas.height
        }));
    }
    
    // Инициализация игрового поля
    function initGameField() {
        // Создаем сетку клеток для размещения башен
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
                    tower: null
                });
            }
        }
        
        // Отмечаем клетки на пути врагов как занятые
        const path = getPixelPath();
        const pathWidth = gameState.cellSize * 1.5; // Ширина пути
        
        gameState.cells.forEach(cell => {
            // Проверяем, находится ли клетка рядом с путем
            const cellCenterX = cell.x + cell.width/2;
            const cellCenterY = cell.y + cell.height/2;
            
            for (let i = 0; i < path.length - 1; i++) {
                const start = path[i];
                const end = path[i+1];
                
                // Упрощенная проверка расстояния от точки до отрезка
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
    
    // Функция расчета расстояния от точки до отрезка
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
    
    // Выбор башни в магазине
    towerItems.forEach(item => {
        item.addEventListener('click', function() {
            // Снимаем выделение со всех башен
            towerItems.forEach(i => i.classList.remove('selected'));
            
            // Выделяем выбранную башню
            this.classList.add('selected');
            
            // Сохраняем тип и стоимость выбранной башни
            gameState.selectedTowerType = this.dataset.type;
            gameState.selectedTowerCost = parseInt(this.dataset.cost);
            
            showMessage(`Выбрана ${this.querySelector('h3').textContent}. Кликните на поле для установки.`);
            
            // Активируем режим размещения башни
            canvas.style.cursor = 'crosshair';
        });
    });
    
    // Размещение башни на поле
    canvas.addEventListener('click', function(e) {
        if (!gameState.selectedTowerType || gameState.isWaveActive) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Находим клетку, по которой кликнули
        const cell = gameState.cells.find(c => 
            x >= c.x && x <= c.x + c.width && 
            y >= c.y && y <= c.y + c.height
        );
        
        if (cell && !cell.occupied) {
            // Проверяем, хватает ли золота
            if (gameState.gold >= gameState.selectedTowerCost) {
                // Создаем башню
                const tower = createTower(
                    cell.x + cell.width/2, 
                    cell.y + cell.height/2, 
                    gameState.selectedTowerType
                );
                
                // Добавляем башню в игру
                gameState.towers.push(tower);
                
                // Обновляем клетку
                cell.occupied = true;
                cell.tower = tower;
                
                // Вычитаем стоимость
                gameState.gold -= gameState.selectedTowerCost;
                updateUI();
                
                showMessage(`Башня установлена! Осталось ${gameState.gold} золота.`);
                
                // Сбрасываем выбор
                resetTowerSelection();
            } else {
                showMessage(`Недостаточно золота! Нужно ${gameState.selectedTowerCost}, а у вас ${gameState.gold}.`);
            }
        }
    });
    
    // Создание башни
    function createTower(x, y, type) {
        const towerTypes = {
            basic: {
                damage: 5,
                range: 150,
                color: '#3498db',
                upgradeCost: 25,
                level: 1,
                fireRate: 1000 // мс между выстрелами
            },
            sniper: {
                damage: 25,
                range: 300,
                color: '#9b59b6',
                upgradeCost: 50,
                level: 1,
                fireRate: 2000
            },
            splash: {
                damage: 10,
                range: 120,
                color: '#e74c3c',
                upgradeCost: 40,
                level: 1,
                fireRate: 1500,
                splashRadius: 60
            }
        };
        
        const config = towerTypes[type];
        
        return {
            x, y,
            type,
            damage: config.damage,
            range: config.range,
            color: config.color,
            upgradeCost: config.upgradeCost,
            level: config.level,
            fireRate: config.fireRate,
            lastShot: 0,
            target: null,
            splashRadius: config.splashRadius || 0
        };
    }
    
    // Сброс выбора башни
    function resetTowerSelection() {
        towerItems.forEach(i => i.classList.remove('selected'));
        gameState.selectedTowerType = null;
        gameState.selectedTowerCost = 0;
        canvas.style.cursor = 'default';
    }
    
    // Создание врага
    function createEnemy() {
        const enemyTypes = [
            {health: 20, speed: 1, color: '#2ecc71', gold: 5},
            {health: 40, speed: 0.7, color: '#f39c12', gold: 10},
            {health: 60, speed: 0.5, color: '#e74c3c', gold: 15}
        ];
        
        // Выбираем тип врага в зависимости от волны
        let typeIndex = 0;
        if (gameState.wave > 3) typeIndex = 1;
        if (gameState.wave > 6) typeIndex = 2;
        
        const type = enemyTypes[typeIndex];
        
        // Начинаем с первой точки пути
        const path = getPixelPath();
        
        return {
            x: path[0].x,
            y: path[0].y,
            health: type.health + (gameState.wave * 2), // Увеличиваем здоровье с волнами
            maxHealth: type.health + (gameState.wave * 2),
            speed: type.speed,
            color: type.color,
            gold: type.gold + Math.floor(gameState.wave / 2),
            pathIndex: 0,
            path: path,
            reachedEnd: false
        };
    }
    
    // Обновление врагов
    function updateEnemies(deltaTime) {
        for (let i = gameState.enemies.length - 1; i >= 0; i--) {
            const enemy = gameState.enemies[i];
            
            // Проверяем, дошел ли враг до конца
            if (enemy.reachedEnd) {
                // Уменьшаем жизни
                gameState.lives--;
                updateUI();
                
                // Удаляем врага
                gameState.enemies.splice(i, 1);
                
                showMessage(`Враг достиг цели! Осталось ${gameState.lives} жизней.`);
                
                // Проверяем окончание игры
                if (gameState.lives <= 0) {
                    endGame(false);
                }
                
                continue;
            }
            
            // Двигаем врага по пути
            const targetPoint = enemy.path[enemy.pathIndex + 1];
            
            if (targetPoint) {
                const dx = targetPoint.x - enemy.x;
                const dy = targetPoint.y - enemy.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 2) {
                    // Достигли точки пути, переходим к следующей
                    enemy.pathIndex++;
                    
                    // Проверяем, дошли ли до конца пути
                    if (enemy.pathIndex >= enemy.path.length - 1) {
                        enemy.reachedEnd = true;
                    }
                } else {
                    // Двигаемся к точке
                    const moveDistance = enemy.speed * (deltaTime / 16);
                    enemy.x += (dx / distance) * moveDistance;
                    enemy.y += (dy / distance) * moveDistance;
                }
            }
        }
    }
    
    // Обновление башен
    function updateTowers(deltaTime) {
        gameState.towers.forEach(tower => {
            // Ищем цель для башни
            if (!tower.target || tower.target.health <= 0) {
                tower.target = findTargetForTower(tower);
            }
            
            // Стреляем по цели
            if (tower.target && tower.target.health > 0) {
                const currentTime = Date.now();
                
                if (currentTime - tower.lastShot > tower.fireRate) {
                    shootAtTarget(tower, tower.target);
                    tower.lastShot = currentTime;
                }
            }
        });
    }
    
    // Поиск цели для башни
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
    
    // Выстрел по цели
    function shootAtTarget(tower, target) {
        // Создаем снаряд
        const projectile = {
            x: tower.x,
            y: tower.y,
            target: target,
            damage: tower.damage,
            color: tower.color,
            speed: 5,
            splashRadius: tower.splashRadius
        };
        
        gameState.projectiles.push(projectile);
        
        // Эффект выстрела
        drawShotEffect(tower.x, tower.y, target.x, target.y, tower.color);
    }
    
    // Обновление снарядов
    function updateProjectiles() {
        for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
            const projectile = gameState.projectiles[i];
            
            // Проверяем, существует ли еще цель
            if (!projectile.target || projectile.target.health <= 0) {
                gameState.projectiles.splice(i, 1);
                continue;
            }
            
            // Двигаем снаряд к цели
            const dx = projectile.target.x - projectile.x;
            const dy = projectile.target.y - projectile.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 10) {
                // Попадание!
                applyDamage(projectile);
                gameState.projectiles.splice(i, 1);
            } else {
                // Продолжаем движение
                projectile.x += (dx / distance) * projectile.speed;
                projectile.y += (dy / distance) * projectile.speed;
            }
        }
    }
    
    // Нанесение урона
    function applyDamage(projectile) {
        if (projectile.splashRadius > 0) {
            // Сплэш-урон по области
            for (const enemy of gameState.enemies) {
                const dx = enemy.x - projectile.target.x;
                const dy = enemy.y - projectile.target.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < projectile.splashRadius) {
                    // Урон уменьшается с расстоянием
                    const damageMultiplier = 1 - (distance / projectile.splashRadius) * 0.5;
                    enemy.health -= projectile.damage * damageMultiplier;
                    
                    // Проверяем, убит ли враг
                    if (enemy.health <= 0) {
                        gameState.gold += enemy.gold;
                        showMessage(`Враг убит! Получено ${enemy.gold} золота.`);
                    }
                }
            }
        } else {
            // Обычный урон по одной цели
            projectile.target.health -= projectile.damage;
            
            // Проверяем, убит ли враг
            if (projectile.target.health <= 0) {
                gameState.gold += projectile.target.gold;
                showMessage(`Враг убит! Получено ${projectile.target.gold} золота.`);
            }
        }
        
        updateUI();
    }
    
    // Отрисовка игры
    function draw() {
        // Очищаем canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Рисуем сетку
        drawGrid();
        
        // Рисуем путь врагов
        drawPath();
        
        // Рисуем башни
        gameState.towers.forEach(drawTower);
        
        // Рисуем врагов
        gameState.enemies.forEach(drawEnemy);
        
        // Рисуем снаряды
        gameState.projectiles.forEach(drawProjectile);
        
        // Рисуем информацию о выбранной башне
        if (gameState.selectedTower) {
            drawTowerRange(gameState.selectedTower);
        }
    }
    
    // Рисуем сетку
    function drawGrid() {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
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
    
    // Рисуем путь врагов
    function drawPath() {
        const path = getPixelPath();
        
        ctx.strokeStyle = 'rgba(46, 204, 113, 0.6)';
        ctx.lineWidth = 30;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        
        for (let i = 1; i < path.length; i++) {
            ctx.lineTo(path[i].x, path[i].y);
        }
        
        ctx.stroke();
        
        // Рисуем границы пути
        ctx.strokeStyle = 'rgba(46, 204, 113, 0.9)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Рисуем точки пути
        for (let i = 0; i < path.length; i++) {
            ctx.fillStyle = i === 0 ? '#e74c3c' : (i === path.length - 1 ? '#3498db' : '#f1c40f');
            ctx.beginPath();
            ctx.arc(path[i].x, path[i].y, 8, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#2c3e50';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }
    
    // Рисуем башню
    function drawTower(tower) {
        // Основание башни
        ctx.fillStyle = tower.color;
        ctx.beginPath();
        ctx.arc(tower.x, tower.y, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // Обводка
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Уровень башни
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(tower.level.toString(), tower.x, tower.y);
        
        // Если башня выбрана, показываем радиус
        if (gameState.selectedTower === tower) {
            drawTowerRange(tower);
        }
    }
    
    // Рисуем радиус башни
    function drawTowerRange(tower) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(tower.x, tower.y, tower.range, 0, Math.PI * 2);
        ctx.stroke();
        
        // Заливка радиуса
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fill();
    }
    
    // Рисуем врага
    function drawEnemy(enemy) {
        // Тело врага
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // Обводка
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Полоска здоровья
        const healthWidth = 30;
        const healthPercent = enemy.health / enemy.maxHealth;
        
        // Фон полоски
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(enemy.x - healthWidth/2, enemy.y - 25, healthWidth, 5);
        
        // Здоровье
        ctx.fillStyle = healthPercent > 0.5 ? '#2ecc71' : (healthPercent > 0.25 ? '#f39c12' : '#e74c3c');
        ctx.fillRect(enemy.x - healthWidth/2, enemy.y - 25, healthWidth * healthPercent, 5);
        
        // Обводка полоски
        ctx.strokeStyle = '#34495e';
        ctx.lineWidth = 1;
        ctx.strokeRect(enemy.x - healthWidth/2, enemy.y - 25, healthWidth, 5);
    }
    
    // Рисуем снаряд
    function drawProjectile(projectile) {
        ctx.fillStyle = projectile.color;
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    // Эффект выстрела
    function drawShotEffect(fromX, fromY, toX, toY, color) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.stroke();
        
        // Исчезающий эффект
        setTimeout(() => {
            // Перерисовываем игру
            draw();
        }, 50);
    }
    
    // Обновление интерфейса
    function updateUI() {
        livesElement.textContent = gameState.lives;
        goldElement.textContent = gameState.gold;
        waveElement.textContent = gameState.wave;
        
        // Обновляем состояние кнопок
        upgradeButton.disabled = !gameState.selectedTower || gameState.isWaveActive;
        sellButton.disabled = !gameState.selectedTower || gameState.isWaveActive;
    }
    
    // Показ сообщений
    function showMessage(message) {
        gameMessages.innerHTML = `<p><i class="fas fa-info-circle"></i> ${message}</p>`;
        
        // Автоочистка через 3 секунды (кроме критических сообщений)
        if (!message.includes('жизней') && !message.includes('победили') && !message.includes('проиграли')) {
            setTimeout(() => {
                if (gameMessages.innerHTML.includes(message)) {
                    gameMessages.innerHTML = '<p>Игра продолжается...</p>';
                }
            }, 3000);
        }
    }
    
    // Начало волны
    startWaveButton.addEventListener('click', function() {
        if (!gameState.isWaveActive) {
            startWave();
        }
    });
    
    // Улучшение башни
    upgradeButton.addEventListener('click', function() {
        if (gameState.selectedTower && !gameState.isWaveActive) {
            upgradeTower(gameState.selectedTower);
        }
    });
    
    // Продажа башни
    sellButton.addEventListener('click', function() {
        if (gameState.selectedTower && !gameState.isWaveActive) {
            sellTower(gameState.selectedTower);
        }
    });
    
    // Выбор башни на поле (по клику)
    canvas.addEventListener('click', function(e) {
        if (gameState.isWaveActive) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Ищем башню по клику
        for (const tower of gameState.towers) {
            const dx = x - tower.x;
            const dy = y - tower.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 20) {
                // Выбираем башню
                gameState.selectedTower = tower;
                updateUI();
                showMessage(`Выбрана ${tower.type} башня (уровень ${tower.level}).`);
                return;
            }
        }
        
        // Если кликнули не по башне, снимаем выделение
        gameState.selectedTower = null;
        updateUI();
    });
    
    // Улучшение башни
    function upgradeTower(tower) {
        if (gameState.gold >= tower.upgradeCost) {
            gameState.gold -= tower.upgradeCost;
            
            // Улучшаем характеристики
            tower.level++;
            tower.damage = Math.floor(tower.damage * 1.5);
            tower.range = Math.floor(tower.range * 1.2);
            tower.upgradeCost = Math.floor(tower.upgradeCost * 1.8);
            
            // Улучшаем скорострельность
            tower.fireRate = Math.max(300, tower.fireRate * 0.9);
            
            updateUI();
            showMessage(`Башня улучшена до уровня ${tower.level}!`);
        } else {
            showMessage(`Недостаточно золота для улучшения! Нужно ${tower.upgradeCost}.`);
        }
    }
    
    // Продажа башни
    function sellTower(tower) {
        // Находим клетку с этой башней
        const cell = gameState.cells.find(c => c.tower === tower);
        
        if (cell) {
            // Возвращаем часть стоимости
            const sellPrice = Math.floor((tower.upgradeCost / 2) + (tower.level * 10));
            gameState.gold += sellPrice;
            
            // Удаляем башню
            const index = gameState.towers.indexOf(tower);
            if (index > -1) {
                gameState.towers.splice(index, 1);
            }
            
            // Освобождаем клетку
            cell.occupied = false;
            cell.tower = null;
            
            // Снимаем выделение
            gameState.selectedTower = null;
            
            updateUI();
            showMessage(`Башня продана за ${sellPrice} золота.`);
        }
    }
    
    // Начало волны врагов
    function startWave() {
        gameState.isWaveActive = true;
        gameState.enemiesSpawned = 0;
        gameState.enemySpawnTimer = 0;
        
        startWaveButton.disabled = true;
        startWaveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Волна в процессе';
        
        showMessage(`Волна ${gameState.wave} началась! Уничтожьте всех врагов.`);
    }
    
    // Завершение волны
    function endWave() {
        gameState.isWaveActive = false;
        gameState.wave++;
        
        // Награда за завершение волны
        const waveReward = 20 + gameState.wave * 5;
        gameState.gold += waveReward;
        
        startWaveButton.disabled = false;
        startWaveButton.innerHTML = '<i class="fas fa-play"></i> Начать волну';
        
        updateUI();
        showMessage(`Волна завершена! Получено ${waveReward} золота. Готовьтесь к волне ${gameState.wave}.`);
    }
    
    // Конец игры
    function endGame(isWin) {
        gameState.isWaveActive = false;
        
        if (isWin) {
            showMessage(`Поздравляем! Вы победили в игре! Уничтожено ${gameState.wave} волн врагов.`);
        } else {
            showMessage(`Игра окончена! Вы проиграли на волне ${gameState.wave}. Попробуйте еще раз!`);
        }
        
        // Блокируем кнопку начала волны
        startWaveButton.disabled = true;
        startWaveButton.innerHTML = '<i class="fas fa-redo"></i> Игра завершена';
        
        // Предлагаем перезапустить игру
        setTimeout(() => {
            if (confirm(isWin ? 
                "Вы победили! Хотите начать заново?" : 
                "Игра окончена. Хотите попробовать еще раз?")) {
                resetGame();
            }
        }, 1000);
    }
    
    // Сброс игры
    function resetGame() {
        gameState.lives = 20;
        gameState.gold = 100;
        gameState.wave = 1;
        gameState.isWaveActive = false;
        gameState.towers = [];
        gameState.enemies = [];
        gameState.projectiles = [];
        gameState.selectedTower = null;
        
        // Сбрасываем клетки
        gameState.cells.forEach(cell => {
            cell.occupied = false;
            cell.tower = null;
        });
        
        // Размечаем путь как занятый
        const path = getPixelPath();
        const pathWidth = gameState.cellSize * 1.5;
        
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
        
        updateUI();
        resetTowerSelection();
        showMessage("Игра сброшена! Купите первую башню и начните волну.");
    }
    
    // Игровой цикл
    function gameLoop(timestamp) {
        const deltaTime = timestamp - gameState.lastTime || 0;
        gameState.lastTime = timestamp;
        
        // Обновляем состояние игры
        if (gameState.isWaveActive) {
            // Спавн врагов
            if (gameState.enemiesSpawned < gameState.enemiesInWave + gameState.wave) {
                gameState.enemySpawnTimer += deltaTime;
                
                if (gameState.enemySpawnTimer >= gameState.enemySpawnInterval) {
                    gameState.enemies.push(createEnemy());
                    gameState.enemiesSpawned++;
                    gameState.enemySpawnTimer = 0;
                    
                    // Ускоряем спавн с каждой волной
                    gameState.enemySpawnInterval = Math.max(500, 2000 - (gameState.wave * 100));
                }
            }
            
            // Обновляем врагов
            updateEnemies(deltaTime);
            
            // Обновляем башни
            updateTowers(deltaTime);
            
            // Обновляем снаряды
            updateProjectiles();
            
            // Удаляем мертвых врагов
            for (let i = gameState.enemies.length - 1; i >= 0; i--) {
                if (gameState.enemies[i].health <= 0) {
                    gameState.enemies.splice(i, 1);
                }
            }
            
            // Проверяем завершение волны
            if (gameState.enemiesSpawned >= gameState.enemiesInWave + gameState.wave && 
                gameState.enemies.length === 0) {
                endWave();
            }
        }
        
        // Отрисовываем игру
        draw();
        
        // Проверяем победу (дошли до 10 волны)
        if (gameState.wave > 10) {
            endGame(true);
        }
        
        // Продолжаем игровой цикл
        requestAnimationFrame(gameLoop);
    }
    
    // Инициализация игры
    initGameField();
    updateUI();
    showMessage("Добро пожаловать в Tower Defence! Выберите башню в магазине и установите её на поле.");
    
    // Запуск игрового цикла
    requestAnimationFrame(gameLoop);
});
