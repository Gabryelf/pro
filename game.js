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
