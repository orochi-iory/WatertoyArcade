// NO USAR DOMContentLoaded AQUÍ SI EL SCRIPT ESTÁ AL FINAL DEL BODY CON 'defer'
// document.addEventListener('DOMContentLoaded', () => { 
// El atributo 'defer' ya asegura que el script se ejecute después de parsear el HTML.

    console.log(">>>> script.js execution started. Document readyState:", document.readyState);

    const canvas = document.getElementById('gameCanvas');
    if (!canvas) { console.error("!!!!!!!! FATAL: canvas NOT FOUND !!!!!!!"); return; } 
    else { console.log(">>>> canvas found"); }
    const ctx = canvas.getContext('2d');

    const messageBoard = document.getElementById('messageBoard');
    if (!messageBoard) { console.error("ERROR: messageBoard NOT FOUND"); } else { console.log(">>>> messageBoard found"); }
    const leftJetButton = document.getElementById('leftJetButton');
    if (!leftJetButton) { console.error("ERROR: leftJetButton NOT FOUND"); } else { console.log(">>>> leftJetButton found"); }
    const rightJetButton = document.getElementById('rightJetButton');
    if (!rightJetButton) { console.error("ERROR: rightJetButton NOT FOUND"); } else { console.log(">>>> rightJetButton found"); }
    const tiltLeftButton = document.getElementById('tiltLeftButton');
    if (!tiltLeftButton) { console.error("ERROR: tiltLeftButton NOT FOUND"); } else { console.log(">>>> tiltLeftButton found"); }
    const tiltRightButton = document.getElementById('tiltRightButton');
    if (!tiltRightButton) { console.error("ERROR: tiltRightButton NOT FOUND"); } else { console.log(">>>> tiltRightButton found"); }
    const resetButton = document.getElementById('resetButton');
    if (!resetButton) { console.error("ERROR: resetButton NOT FOUND"); } else { console.log(">>>> resetButton found"); }
    const enableSensorButton = document.getElementById('enableSensorButton');
    if (!enableSensorButton) { console.error("ERROR: enableSensorButton NOT FOUND"); } else { console.log(">>>> enableSensorButton found"); }
    const fullscreenButton = document.getElementById('fullscreenButton');
    if (!fullscreenButton) { console.error("ERROR: fullscreenButton NOT FOUND"); } else { console.log(">>>> fullscreenButton found"); }
    
    const gameContainer = document.querySelector('.game-container'); 
    if (!gameContainer) { console.error("ERROR: gameContainer NOT FOUND"); } else { console.log(">>>> gameContainer found"); }

    const startScreen = document.getElementById('startScreen');
    if (!startScreen) { console.error("ERROR: startScreen NOT FOUND"); } else { console.log(">>>> startScreen found"); }
    const startNormalModeButton = document.getElementById('startNormalModeButton');
    if (!startNormalModeButton) { console.error("ERROR: startNormalModeButton NOT FOUND"); } else { console.log(">>>> startNormalModeButton found"); }
    const startArcadeModeButton = document.getElementById('startArcadeModeButton');
    if (!startArcadeModeButton) { console.error("ERROR: startArcadeModeButton NOT FOUND"); } else { console.log(">>>> startArcadeModeButton found"); }
    const howToPlayButton = document.getElementById('howToPlayButton');
    if (!howToPlayButton) { console.error("ERROR: howToPlayButton NOT FOUND"); } else { console.log(">>>> howToPlayButton found"); }
    const howToPlayScreen = document.getElementById('howToPlayScreen'); 
    if (!howToPlayScreen) { console.error("ERROR: howToPlayScreen NOT FOUND"); } else { console.log(">>>> howToPlayScreen found"); }
    const closeHowToPlayButton = document.getElementById('closeHowToPlayButton'); 
    if (!closeHowToPlayButton) { console.error("ERROR: closeHowToPlayButton NOT FOUND"); } else { console.log(">>>> closeHowToPlayButton found"); }
    
    const levelStartScreen = document.getElementById('levelStartScreen');
    if (!levelStartScreen) { console.error("ERROR: levelStartScreen NOT FOUND"); } else { console.log(">>>> levelStartScreen found"); }
    const levelStartTitle = document.getElementById('levelStartTitle');
    if (!levelStartTitle) { console.error("ERROR: levelStartTitle NOT FOUND"); } else { console.log(">>>> levelStartTitle found"); }
    const levelStartObjective = document.getElementById('levelStartObjective');
    if (!levelStartObjective) { console.error("ERROR: levelStartObjective NOT FOUND"); } else { console.log(">>>> levelStartObjective found"); }
    const beginLevelButton = document.getElementById('beginLevelButton');
    if (!beginLevelButton) { console.error("ERROR: beginLevelButton NOT FOUND"); } else { console.log(">>>> beginLevelButton found"); }
    
    const levelEndScreen = document.getElementById('levelEndScreen');
    if (!levelEndScreen) { console.error("ERROR: levelEndScreen NOT FOUND"); } else { console.log(">>>> levelEndScreen found"); }
    const levelEndTitle = document.getElementById('levelEndTitle');
    if (!levelEndTitle) { console.error("ERROR: levelEndTitle NOT FOUND"); } else { console.log(">>>> levelEndTitle found"); }
    const levelEndTimeBonus = document.getElementById('levelEndTimeBonus');
    if (!levelEndTimeBonus) { console.error("ERROR: levelEndTimeBonus NOT FOUND"); } else { console.log(">>>> levelEndTimeBonus found"); }
    const levelEndTotalScore = document.getElementById('levelEndTotalScore');
    if (!levelEndTotalScore) { console.error("ERROR: levelEndTotalScore NOT FOUND"); } else { console.log(">>>> levelEndTotalScore found"); }
    const nextLevelButton = document.getElementById('nextLevelButton');
    if (!nextLevelButton) { console.error("ERROR: nextLevelButton NOT FOUND"); } else { console.log(">>>> nextLevelButton found"); }
    const arcadeEndToMenuButton = document.getElementById('arcadeEndToMenuButton');
    if (!arcadeEndToMenuButton) { console.error("ERROR: arcadeEndToMenuButton NOT FOUND"); } else { console.log(">>>> arcadeEndToMenuButton found"); }

    console.log(">>>> Finished getting DOM elements. Initializing game logic...");

    const gameScreenWidth = 450;
    const gameScreenHeight = 400;
    canvas.width = gameScreenWidth;
    canvas.height = gameScreenHeight;

    const RING_OUTER_RADIUS = 18; const RING_VISUAL_THICKNESS = 6; const MAX_RINGS_PER_PEG = 6; const RING_COLORS = ['#FF4136', '#0074D9', '#2ECC40', '#FFDC00']; const TOTAL_COLORS = RING_COLORS.length; const GRAVITY_BASE = 0.038; const MAX_JET_PRESSURE = 1.0; const JET_PRESSURE_INCREMENT_BASE = 0.05; const JET_PRESSURE_DECREMENT_BASE = 0.08; const BASE_JET_STRENGTH = 3.8; const JET_HORIZONTAL_INFLUENCE_RATIO = 0.28; const JET_EFFECT_RADIUS_Y = gameScreenHeight * 0.75; const JET_EFFECT_RADIUS_X = gameScreenWidth * 0.38; const JET_VERTICAL_FALLOFF_POWER = 0.6; const MAX_JET_PARTICLES = 200; const TILT_FORCE_BUTTON_BASE = 0.30; const TILT_FORCE_SENSOR_MULTIPLIER = 0.055; const MAX_SENSOR_TILT_FORCE = 0.55; const WATER_FRICTION_COEFF = 0.028; const BOUNCE_FACTOR = -0.2; const RING_COLLISION_BOUNCE = 0.5; const PEG_COLLISION_BOUNCE_FACTOR = -0.3; const PEG_STROKE_COLOR = '#505050'; const PEG_FILL_COLOR = '#808080'; const PEG_VISUAL_WIDTH = 10; const PEG_LANDING_WIDTH_FACTOR = 2.0; const PEG_COLLISION_WIDTH_FACTOR = 1.0; const PEG_MOVEMENT_SPEED_X = 0.7; const PEG_MOVEMENT_SPEED_Y_MIN = 0.3; const PEG_MOVEMENT_SPEED_Y_MAX = 0.8; const RING_OUTLINE_COLOR = 'rgba(0,0,0,0.85)'; const RING_OUTLINE_WIDTH_ON_SCREEN = 1.0; const FLAT_RING_VIEW_THICKNESS = 7; const GROUND_FLAT_RING_THICKNESS = 5; const LANDING_SNAP_Y_THRESHOLD = RING_OUTER_RADIUS * 1.2; const MAX_TOTAL_RINGS_ON_SCREEN = MAX_RINGS_PER_PEG * TOTAL_COLORS;
    let score = 0; let scorePulseActive = false; let scorePulseTimer = 0; const SCORE_PULSE_DURATION = 12; let rings = []; let pegs = []; let lastTime = 0; const TARGET_FPS = 60; const TARGET_DT = 1 / TARGET_FPS; let floatingScores = []; let jetParticles = []; let gameLoopId = null; let gameRunning = false; let isPausedForLevelTransition = false; let landedRingsCount = 0; let gameOver = false; let baseScoreFromRings = 0; let bonusScoreFromColorStreak = 0; let bonusScoreFromFullPegsGeneral = 0; let bonusScoreFromMonoColorPegsSpecific = 0; let allPegsCompletedBonusFactor = 1; let masterBonusFactor = 1; let currentScoreDisplaySize = 22; const SCORE_NORMAL_SIZE = 22; const SCORE_PULSE_SIZE = 26;
    let currentGameMode = 'none'; let currentArcadeLevel = 0; let timeLeftInLevel = 0; 
    const ARCADE_LEVEL_TIME_LIMIT = 90; 
    const ARCADE_LEVELS = [ { name: "Nivel 1: Clásico", ringsObjective: { type: 'fillPegs', count: 2 }, OR_ringsObjective: { type: 'minPerPeg', count: 3 }, timeLimit: ARCADE_LEVEL_TIME_LIMIT, bonusPerSecond: 2, pegConfigKey: 'standard' }, { name: "Nivel 2: Línea Central", ringsObjective: { type: 'fillPegs', count: 2 }, OR_ringsObjective: { type: 'minPerPeg', count: 3 }, timeLimit: ARCADE_LEVEL_TIME_LIMIT, bonusPerSecond: 3, pegConfigKey: 'centerLine' }, { name: "Nivel 3: Invertido", ringsObjective: { type: 'fillPegs', count: 2 }, OR_ringsObjective: { type: 'minPerPeg', count: 3 }, timeLimit: ARCADE_LEVEL_TIME_LIMIT, bonusPerSecond: 4, pegConfigKey: 'invertedStandard' }, { name: "Nivel 4: Movedizos Horizontales", ringsObjective: { type: 'fillPegs', count: 2 }, OR_ringsObjective: { type: 'minPerPeg', count: 3 }, timeLimit: ARCADE_LEVEL_TIME_LIMIT, bonusPerSecond: 5, pegConfigKey: 'horizontalMovers' }, { name: "Nivel 5: Bailarines Verticales", ringsObjective: { type: 'fillPegs', count: 2 }, OR_ringsObjective: { type: 'minPerPeg', count: 3 }, timeLimit: ARCADE_LEVEL_TIME_LIMIT, bonusPerSecond: 6, pegConfigKey: 'verticalMovers' } ];
    let leftJetInputActive = false; let rightJetInputActive = false; let leftJetPressure = 0; let rightJetPressure = 0; let tiltLeftActive = false; let tiltRightActive = false; let sensorTiltX = 0; let sensorAvailable = false; let sensorActive = false;
    const KEY_LEFT_ARROW = 'ArrowLeft'; const KEY_RIGHT_ARROW = 'ArrowRight'; const KEY_JET_LEFT = 'KeyA'; const KEY_JET_RIGHT = 'KeyD';

    function createRing(x, y, color) { let speedMagnitude = 0.08 + Math.random() * 0.12; return { x: x, y: y, vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4, color: color, originalColor: color, landed: false, pegIndex: -1, landedOrder: -1, basePoints: 25, awardedPoints: 0, rotationAngle: Math.random() * Math.PI * 2, initialRotationSpeed: (Math.random() < 0.5 ? -1 : 1) * speedMagnitude, rotationSpeed: 0, zRotationAngle: (Math.random() - 0.5) * 0.3, zRotationSpeed: (Math.random() - 0.5) * 0.03, isFlat: false, isSlidingOnPeg: false, finalYonPeg: 0 }; }
    function configurePegsForLayout(layoutType) { pegs = []; let pegData = []; const standardPegPositions = [ { xFactor: 0.22, heightFactor: 0.35, yOffsetFactor: 0 }, { xFactor: 0.78, heightFactor: 0.35, yOffsetFactor: 0 }, { xFactor: 0.38, heightFactor: 0.30, yOffsetFactor: 0.35 + (45 / gameScreenHeight) }, { xFactor: 0.62, heightFactor: 0.30, yOffsetFactor: 0.35 + (45 / gameScreenHeight) } ]; switch (layoutType) { case 'centerLine': const centerSpacing = gameScreenWidth / 5; pegData = [ { x: centerSpacing * 1, yBaseFactor: 0.3, heightFactor: 0.30 }, { x: centerSpacing * 2, yBaseFactor: 0.3, heightFactor: 0.30 }, { x: centerSpacing * 3, yBaseFactor: 0.3, heightFactor: 0.30 }, { x: centerSpacing * 4, yBaseFactor: 0.3, heightFactor: 0.30 }, ]; pegData.forEach((data, index) => { pegs.push({ id: index, x: data.x, bottomY: gameScreenHeight - (gameScreenHeight * data.yBaseFactor), height: gameScreenHeight * data.heightFactor, landedRings: [], isFullAndScored: false, isMonoColor: false, monoColorValue: null, vx: 0, vy: 0, dirX: 1, dirY: 1, minX: data.x, maxX: data.x, minY: gameScreenHeight - (gameScreenHeight * data.yBaseFactor) - (gameScreenHeight * data.heightFactor), maxY: gameScreenHeight - (gameScreenHeight * data.yBaseFactor) }); }); break; case 'invertedStandard': pegData = [ { xFactor: 0.38, heightFactor: 0.30, yOffsetFactor: 0 }, { xFactor: 0.62, heightFactor: 0.30, yOffsetFactor: 0 }, { xFactor: 0.22, heightFactor: 0.35, yOffsetFactor: 0.35 + (45 / gameScreenHeight) }, { xFactor: 0.78, heightFactor: 0.35, yOffsetFactor: 0.35 + (45 / gameScreenHeight) }, ]; pegData.forEach((data, index) => { pegs.push({ id: index, x: gameScreenWidth * data.xFactor, bottomY: gameScreenHeight - 20 - (gameScreenHeight * data.yOffsetFactor), height: gameScreenHeight * data.heightFactor, landedRings: [], isFullAndScored: false, isMonoColor: false, monoColorValue: null, vx: 0, vy: 0, dirX: 1, dirY: 1, minX: gameScreenWidth * data.xFactor, maxX: gameScreenWidth * data.xFactor, minY: gameScreenHeight - 20 - (gameScreenHeight * data.yOffsetFactor) - (gameScreenHeight * data.heightFactor), maxY: gameScreenHeight - 20 - (gameScreenHeight * data.yOffsetFactor) }); }); break; case 'horizontalMovers': const moverMarginX = gameScreenWidth * 0.1; const moverCenterGap = gameScreenWidth * 0.05; standardPegPositions.forEach((data, index) => { const pegX = gameScreenWidth * data.xFactor; let minX, maxX; if (index === 0 || index === 2) { minX = moverMarginX; maxX = gameScreenWidth / 2 - PEG_VISUAL_WIDTH - moverCenterGap / 2; } else { minX = gameScreenWidth / 2 + moverCenterGap / 2; maxX = gameScreenWidth - moverMarginX - PEG_VISUAL_WIDTH; } pegs.push({ id: index, x: (index === 0 || index === 2) ? minX : maxX, bottomY: gameScreenHeight - 20 - (gameScreenHeight * data.yOffsetFactor), height: gameScreenHeight * data.heightFactor, landedRings: [], isFullAndScored: false, isMonoColor: false, monoColorValue: null, vx: PEG_MOVEMENT_SPEED_X * ((index === 0 || index === 2) ? 1 : -1), vy: 0, dirX: ((index === 0 || index === 2) ? 1 : -1), dirY: 1, minX: minX, maxX: maxX, originalX: pegX, minY: gameScreenHeight - 20 - (gameScreenHeight * data.yOffsetFactor) - (gameScreenHeight * data.heightFactor), maxY: gameScreenHeight - 20 - (gameScreenHeight * data.yOffsetFactor) }); }); break; case 'verticalMovers': const centerBaseX = gameScreenWidth / 2; const topBoundary = gameScreenHeight * 0.2; const bottomBoundary = gameScreenHeight * 0.8; [ { xOffset: -PEG_VISUAL_WIDTH * 1.5, initialYFactor: 0.3 }, { xOffset: -PEG_VISUAL_WIDTH * 0.5, initialYFactor: 0.5 }, { xOffset: PEG_VISUAL_WIDTH * 0.5, initialYFactor: 0.4 }, { xOffset: PEG_VISUAL_WIDTH * 1.5, initialYFactor: 0.6 }, ].forEach((data, index) => { const pegHeight = gameScreenHeight * 0.25; const initialBottomY = gameScreenHeight * data.initialYFactor + pegHeight; pegs.push({ id: index, x: centerBaseX + data.xOffset, bottomY: initialBottomY, height: pegHeight, landedRings: [], isFullAndScored: false, isMonoColor: false, monoColorValue: null, vx: 0, vy: (Math.random() < 0.5 ? -1 : 1) * (PEG_MOVEMENT_SPEED_Y_MIN + Math.random() * (PEG_MOVEMENT_SPEED_Y_MAX - PEG_MOVEMENT_SPEED_Y_MIN)), dirX: 1, dirY: (Math.random() < 0.5 ? -1 : 1), minX: centerBaseX + data.xOffset, maxX: centerBaseX + data.xOffset, minY: topBoundary, maxY: bottomBoundary }); }); break; case 'standard': default: standardPegPositions.forEach((data, index) => { pegs.push({ id: index, x: gameScreenWidth * data.xFactor, bottomY: gameScreenHeight - 20 - (gameScreenHeight * data.yOffsetFactor), height: gameScreenHeight * data.heightFactor, landedRings: [], isFullAndScored: false, isMonoColor: false, monoColorValue: null, vx: 0, vy: 0, dirX: 1, dirY: 1, minX: gameScreenWidth * data.xFactor, maxX: gameScreenWidth * data.xFactor, minY: gameScreenHeight - 20 - (gameScreenHeight * data.yOffsetFactor) - (gameScreenHeight * data.heightFactor), maxY: gameScreenHeight - 20 - (gameScreenHeight * data.yOffsetFactor) }); }); break;} }
    function updatePegs(dt) { if (currentGameMode !== 'arcade' || !ARCADE_LEVELS[currentArcadeLevel] || !pegs) return; const configKey = ARCADE_LEVELS[currentArcadeLevel].pegConfigKey; const timeFactor = dt * TARGET_FPS * 0.5; if (configKey === 'horizontalMovers') { pegs.forEach(peg => { const prevX = peg.x; peg.x += peg.vx * timeFactor; if (peg.x + PEG_VISUAL_WIDTH/2 > peg.maxX) { peg.x = peg.maxX - PEG_VISUAL_WIDTH/2; peg.vx *= -1; } else if (peg.x - PEG_VISUAL_WIDTH/2 < peg.minX) { peg.x = peg.minX + PEG_VISUAL_WIDTH/2; peg.vx *= -1; } const deltaX = peg.x - prevX; peg.landedRings.forEach(ring => ring.x += deltaX); }); } else if (configKey === 'verticalMovers') { pegs.forEach(peg => { const prevBottomY = peg.bottomY; let newBottomY = peg.bottomY + peg.vy * timeFactor; let newTopY = newBottomY - peg.height; if (newTopY < peg.minY) { newBottomY = peg.minY + peg.height; peg.vy *= -1; } else if (newBottomY > peg.maxY) { newBottomY = peg.maxY; peg.vy *= -1; } peg.bottomY = newBottomY; const deltaY = peg.bottomY - prevBottomY; peg.landedRings.forEach(ring => ring.y += deltaY); }); } }
    function initGame(mode) { /* ... */ } // La definición completa está arriba
    function prepareArcadeLevel(levelIndex) { /* ... */ }
    function startPreparedArcadeLevel() { /* ... */ }
    function drawRing(ring) { /* ... */ }
    function drawAllPegsAndLandedRings() { /* ... */ }
    function drawArcadeInfoOnCanvas() { /* ... */ }
    function drawScoreOnCanvas() { /* ... */ }
    let instructionTimeout = null; function showMessage(text, duration = 3000, isInstruction = false) { /* ... */ }
    function setPersistentInstructions() { /* ... */ }
    function updateScore(pointsToAdd, message = "") { /* ... */ }
    function checkArcadeLevelWinCondition() { /* ... */ }
    function checkAndApplyBonuses(landedRing, peg) { /* ... */ }
    function checkAllPegsCompleted_NormalMode() { /* ... */ }
    function goToNextArcadeLevel() { /* ... */ }
    function triggerGameOver_NormalMode() { /* ... */ }
    function triggerGameOver_ArcadeMode(allLevelsCompleted = false) { /* ... */ }
    function showEndGameScreen(mode, arcadeWon = false, levelReachedIfLost = 0) { /* ... */ }
    function hideEndGameScreen() { /* ... */ }
    function hexToRgb(hex) { /* ... */ }
    function createFloatingScore(x, y, text, color = "#FFFFFF", durationFrames = 90, upwardSpeed = 0.8) { /* ... */ }
    function updateAndDrawFloatingScores(dt) { /* ... */ }
    function createJetParticle(xSide, strength) { /* ... */ }
    function updateAndDrawJetParticles(dt) { /* ... */ }
    function updateRings(actualTiltForceToApply, dt) { /* ... */ }

    // Copiar las definiciones completas de todas las funciones stubbed arriba aquí
    // para asegurar que están definidas dentro del ámbito del DOMContentLoaded
    // ... (ejemplo: initGame, prepareArcadeLevel, startPreparedArcadeLevel, drawRing, etc.)

    // --- MANEJO DE EVENTOS DE BOTONES ---
    if (leftJetButton) { leftJetButton.addEventListener('mousedown', () => { leftJetInputActive = true; }); leftJetButton.addEventListener('mouseup', () => { leftJetInputActive = false; }); leftJetButton.addEventListener('mouseleave', () => { if(leftJetInputActive) {leftJetInputActive = false;} }); leftJetButton.addEventListener('touchstart', (e) => { e.preventDefault(); leftJetInputActive = true; }, { passive: false }); leftJetButton.addEventListener('touchend', (e) => { e.preventDefault(); leftJetInputActive = false; }); }
    if (rightJetButton) { rightJetButton.addEventListener('mousedown', () => { rightJetInputActive = true; }); rightJetButton.addEventListener('mouseup', () => { rightJetInputActive = false; }); rightJetButton.addEventListener('mouseleave', () => { if(rightJetInputActive) {rightJetInputActive = false;} }); rightJetButton.addEventListener('touchstart', (e) => { e.preventDefault(); rightJetInputActive = true; }, { passive: false }); rightJetButton.addEventListener('touchend', (e) => { e.preventDefault(); rightJetInputActive = false; }); }
    if (tiltLeftButton) { tiltLeftButton.addEventListener('mousedown', () => { tiltLeftActive = true; }); tiltLeftButton.addEventListener('mouseup', () => { tiltLeftActive = false; }); tiltLeftButton.addEventListener('mouseleave', () => { if (tiltLeftActive) { tiltLeftActive = false; } }); tiltLeftButton.addEventListener('touchstart', (e) => { e.preventDefault(); tiltLeftActive = true; }, { passive: false }); tiltLeftButton.addEventListener('touchend', (e) => { e.preventDefault(); tiltLeftActive = false; }); }
    if (tiltRightButton) { tiltRightButton.addEventListener('mousedown', () => { tiltRightActive = true; }); tiltRightButton.addEventListener('mouseup', () => { tiltRightActive = false; }); tiltRightButton.addEventListener('mouseleave', () => { if (tiltRightActive) { tiltRightActive = false; } }); tiltRightButton.addEventListener('touchstart', (e) => { e.preventDefault(); tiltRightActive = true;}, { passive: false }); tiltRightButton.addEventListener('touchend', (e) => { e.preventDefault(); tiltRightActive = false; });}
    
    if (resetButton) resetButton.addEventListener('click', () => {
        console.log(">>>> resetButton clicked inside DOMContentLoaded");
        if (gameLoopId) { cancelAnimationFrame(gameLoopId); gameLoopId = null; }
        gameRunning = false; gameOver = false; isPausedForLevelTransition = false;
        hideEndGameScreen(); 
        if(levelStartScreen) levelStartScreen.style.display = 'none'; else console.warn("Reset: levelStartScreen es null");
        if(levelEndScreen) levelEndScreen.style.display = 'none'; else console.warn("Reset: levelEndScreen es null");
        if(startScreen) startScreen.style.display = 'flex'; else console.error("!!!!!!!! Reset: startScreen es null. Esto romperá el reinicio. !!!!!!!");
        
        if(howToPlayButton) howToPlayButton.style.display = 'inline-block';
        score = 0; currentScoreDisplaySize = SCORE_NORMAL_SIZE; 
        currentArcadeLevel = 0; timeLeftInLevel = 0; 
        currentGameMode = 'none';
        if(ctx) ctx.clearRect(0, 0, canvas.width, canvas.height); 
        drawScoreOnCanvas(); 
        if (!gameLoopId) { if (typeof performance !== 'undefined' && performance.now) { lastTime = performance.now(); } else { lastTime = Date.now(); } console.log(">>>> Requesting gameloop after reset for UI"); gameLoopId = requestAnimationFrame(gameLoop); }
    });

    if (fullscreenButton) fullscreenButton.addEventListener('click', () => { /* ... (lógica fullscreen) ... */});
    if (beginLevelButton) beginLevelButton.addEventListener('click', startPreparedArcadeLevel);
    if (nextLevelButton) nextLevelButton.addEventListener('click', () => { if(levelEndScreen) levelEndScreen.style.display = 'none'; if (currentArcadeLevel < ARCADE_LEVELS.length) { prepareArcadeLevel(currentArcadeLevel); } else { if(resetButton) resetButton.click(); } });
    if (arcadeEndToMenuButton) arcadeEndToMenuButton.addEventListener('click', () => { if(levelEndScreen) levelEndScreen.style.display = 'none'; if(resetButton) resetButton.click(); });
    if (startNormalModeButton) startNormalModeButton.addEventListener('click', () => { startGameFlow('normal'); });
    if (startArcadeModeButton) startArcadeModeButton.addEventListener('click', () => { startGameFlow('arcade'); });
    if (howToPlayButton) howToPlayButton.addEventListener('click', () => { if(howToPlayScreen) howToPlayScreen.style.display = 'flex';});
    if (closeHowToPlayButton) closeHowToPlayButton.addEventListener('click', () => { if(howToPlayScreen) howToPlayScreen.style.display = 'none';});
    window.addEventListener('click', (event) => { if (howToPlayScreen && event.target == howToPlayScreen) { howToPlayScreen.style.display = 'none'; }});
    window.addEventListener('keydown', (e) => { /* ... */ });
    window.addEventListener('keyup', (e) => { /* ... */ });
    function handleOrientation(event) { /* ... */ }
    function requestSensorPermission() { /* ... */ }
    if (enableSensorButton && window.DeviceOrientationEvent) { enableSensorButton.style.display = 'inline-block'; enableSensorButton.disabled = false; enableSensorButton.textContent = "SENSOR"; enableSensorButton.addEventListener('click', requestSensorPermission); } 
    else if(enableSensorButton) { enableSensorButton.style.display = 'none'; }

    // --- GAME LOOP ---
    function gameLoop(currentTime) { 
        if (isPausedForLevelTransition) {
            if (levelStartScreen && levelStartScreen.style.display === 'flex') {
                 if(ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
                 drawScoreOnCanvas(); 
                 if(ARCADE_LEVELS[currentArcadeLevel]) { drawArcadeInfoOnCanvas(); }
            } else if (levelEndScreen && levelEndScreen.style.display === 'flex') {
                 if(ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
                 drawScoreOnCanvas(); 
            }
            if(!gameLoopId && isPausedForLevelTransition) { // Asegurar que el loop sigue para UI de transición
                gameLoopId = requestAnimationFrame(gameLoop);
            } else if (isPausedForLevelTransition) { // Solo solicitar nuevo si está pausado
                 requestAnimationFrame(gameLoop);
            }
            return;
        }

        if (!gameRunning && !gameOver) { 
            if (typeof performance !== 'undefined' && performance.now) { lastTime = performance.now(); } 
            else { lastTime = Date.now(); }
            if(ctx) ctx.clearRect(0, 0, canvas.width, canvas.height); 
            if (startScreen && (startScreen.style.display === 'none' || startScreen.style.display === '')) {
                 drawScoreOnCanvas(); 
            } else if (startScreen && startScreen.style.display === 'flex') {
                // No es necesario dibujar el score si la pantalla de inicio está full screen
            }
            requestAnimationFrame(gameLoop);
            return;
        }
        if (gameOver) { return; }

        const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
        let dt = (now - lastTime) / 1000.0; 
        if (dt <= 0 || isNaN(dt) || dt > (TARGET_DT * 5) ) dt = TARGET_DT; 
        lastTime = now;
        const deltaTime = dt; 
        
        if(ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (scorePulseActive) { /* ... */ }
        const accelerationFactor = deltaTime * TARGET_FPS; 
        const pressureChange = JET_PRESSURE_INCREMENT_BASE * accelerationFactor;
        const pressureDecay = JET_PRESSURE_DECREMENT_BASE * accelerationFactor;
        if (leftJetInputActive) { leftJetPressure += pressureChange; if (leftJetPressure > MAX_JET_PRESSURE) leftJetPressure = MAX_JET_PRESSURE; if(leftJetPressure > 0.1) createJetParticle(-1, leftJetPressure); } 
        else { leftJetPressure -= pressureDecay; if (leftJetPressure < 0) leftJetPressure = 0; }
        if (rightJetInputActive) { rightJetPressure += pressureChange; if (rightJetPressure > MAX_JET_PRESSURE) rightJetPressure = MAX_JET_PRESSURE; if(rightJetPressure > 0.1) createJetParticle(1, rightJetPressure); } 
        else { rightJetPressure -= pressureDecay; if (rightJetPressure < 0) rightJetPressure = 0; }
        if (currentGameMode === 'arcade' && !gameOver && gameRunning) { timeLeftInLevel -= deltaTime; if (timeLeftInLevel <= 0) { timeLeftInLevel = 0; triggerGameOver_ArcadeMode(false); } }
        
        if (pegs && pegs.length > 0 && ARCADE_LEVELS[currentArcadeLevel]) updatePegs(deltaTime); 

        let forceForTiltUpdate = 0; 
        if (sensorActive && sensorAvailable) { forceForTiltUpdate = sensorTiltX * TILT_FORCE_SENSOR_MULTIPLIER; if (forceForTiltUpdate > MAX_SENSOR_TILT_FORCE) forceForTiltUpdate = MAX_SENSOR_TILT_FORCE; if (forceForTiltUpdate < -MAX_SENSOR_TILT_FORCE) forceForTiltUpdate = -MAX_SENSOR_TILT_FORCE; } 
        else { if (tiltLeftActive === true && tiltRightActive === false) { forceForTiltUpdate = -TILT_FORCE_BUTTON_BASE; } else if (tiltRightActive === true && tiltLeftActive === false) { forceForTiltUpdate = TILT_FORCE_BUTTON_BASE; } }
        
        if(rings) updateRings(forceForTiltUpdate, deltaTime); 
        drawAllPegsAndLandedRings();
        if(rings) rings.forEach(ring => { drawRing(ring); });
        updateAndDrawJetParticles(deltaTime);
        updateAndDrawFloatingScores(deltaTime);
        drawScoreOnCanvas(); 
        if (currentGameMode === 'arcade') drawArcadeInfoOnCanvas();
        if(gameRunning && !gameOver){ gameLoopId = requestAnimationFrame(gameLoop); }
    }
    
    function startGameFlow(mode) {
        console.log(">>>> startGameFlow called with mode:", mode);
        if(startScreen) startScreen.style.display = 'none'; else console.warn("startGameFlow: startScreen is null");
        if (howToPlayScreen && howToPlayScreen.style.display !== 'none') howToPlayScreen.style.display = 'none'; 
        
        initGame(mode); // Llama a initGame que configura variables, incluyendo el primer nivel de arcade
        
        if (mode === 'arcade') {
             // initGame llama a prepareArcadeLevel que muestra el modal de "Nivel X".
            // El juego (gameRunning = true) se iniciará con el botón de ese modal.
        } else { // Modo Normal
            gameRunning = true; 
            gameOver = false;
            isPausedForLevelTransition = false;
            if (gameLoopId) { cancelAnimationFrame(gameLoopId); }
            if (typeof performance !== 'undefined' && performance.now) { lastTime = performance.now(); } 
            else { lastTime = Date.now(); }
            console.log(">>>> Requesting gameloop for Normal Mode start");
            gameLoopId = requestAnimationFrame(gameLoop);
        }
    }

    // --- Configuración Inicial ---
    console.log(">>>> Script principal dentro de DOMContentLoaded. Configurando estado inicial...");
    if (messageBoard) setPersistentInstructions(); 
    else { console.error("ERROR: messageBoard NOT FOUND en setup inicial."); }

    if (startScreen) {
        startScreen.style.display = 'flex'; 
        console.log(">>>> Pantalla de inicio (startScreen) debería estar visible.");
    } else {
        console.error("!!!!!!!! FATAL: startScreen NO ENCONTRADO al final del script. No se puede mostrar la pantalla de inicio. !!!!!!!!!");
    }

    if (typeof performance !== 'undefined' && performance.now) { lastTime = performance.now(); } 
    else { lastTime = Date.now(); }
    console.log(">>>> Iniciando el primer gameloop para UI (debería mostrar pantalla de inicio).");
    gameLoopId = requestAnimationFrame(gameLoop); 

// }); // Fin del DOMContentLoaded (Temporalmente comentado para probar en GitHub Pages sin él)
