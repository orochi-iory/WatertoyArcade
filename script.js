// El script se ejecuta después de que el HTML se parsea gracias a 'defer'

console.log(">>>> Watertoy Arcade - script.js execution started. Document readyState:", document.readyState);

const canvas = document.getElementById('gameCanvas');
// Verificación crítica del canvas al inicio
if (!canvas) {
    console.error("!!!!!!!! FATAL ERROR: Canvas element with id 'gameCanvas' NOT FOUND !!!!!!!");
    // Opcionalmente, mostrar un mensaje al usuario directamente en el body si todo falla
    const body = document.querySelector('body');
    if (body) {
        body.innerHTML = '<h1 style="color:red; text-align:center; margin-top: 50px;">Error: No se pudo cargar el juego (Canvas no encontrado).</h1>';
    }
    // No continuar si el canvas no existe, ya que es esencial.
    // throw new Error("Canvas not found, game cannot start."); // O lanzar un error
} else {
    console.log(">>>> Canvas found:", canvas);
    const ctx = canvas.getContext('2d');

    // Resto de las referencias al DOM (con verificaciones opcionales si sospechas de ellas)
    const messageBoard = document.getElementById('messageBoard');
    const leftJetButton = document.getElementById('leftJetButton');
    const rightJetButton = document.getElementById('rightJetButton');
    const tiltLeftButton = document.getElementById('tiltLeftButton');
    const tiltRightButton = document.getElementById('tiltRightButton');
    const resetButton = document.getElementById('resetButton');
    const enableSensorButton = document.getElementById('enableSensorButton');
    const fullscreenButton = document.getElementById('fullscreenButton'); 
    const gameContainer = document.querySelector('.game-container'); 
    const startScreen = document.getElementById('startScreen');
    const startGameButton = document.getElementById('startGameButton'); // Botón de inicio único
    const howToPlayButton = document.getElementById('howToPlayButton');
    const howToPlayScreen = document.getElementById('howToPlayScreen'); 
    const closeHowToPlayButton = document.getElementById('closeHowToPlayButton'); 
    // Modales de arcade eliminados

    console.log(">>>> All primary DOM elements obtained (or checked).");

    const gameScreenWidth = 450;
    const gameScreenHeight = 400;
    canvas.width = gameScreenWidth;
    canvas.height = gameScreenHeight;

    // --- CONSTANTES DEL JUEGO ---
    const RING_OUTER_RADIUS = 18; 
    const RING_VISUAL_THICKNESS = 6; 
    const MAX_RINGS_PER_PEG = 6;
    const RING_COLORS = ['#FF4136', '#0074D9', '#2ECC40', '#FFDC00'];
    const TOTAL_COLORS = RING_COLORS.length;
    const GRAVITY_BASE = 0.038; 
    const MAX_JET_PRESSURE = 1.0;        
    const JET_PRESSURE_INCREMENT_BASE = 0.05; 
    const JET_PRESSURE_DECREMENT_BASE = 0.08; 
    const BASE_JET_STRENGTH = 3.8; 
    const JET_HORIZONTAL_INFLUENCE_RATIO = 0.28; 
    const JET_EFFECT_RADIUS_Y = gameScreenHeight * 0.75; 
    const JET_EFFECT_RADIUS_X = gameScreenWidth * 0.38;
    const JET_VERTICAL_FALLOFF_POWER = 0.6; 
    const MAX_JET_PARTICLES = 200;
    const TILT_FORCE_BUTTON_BASE = 0.30; 
    const TILT_FORCE_SENSOR_MULTIPLIER = 0.055; 
    const MAX_SENSOR_TILT_FORCE = 0.55;
    const WATER_FRICTION_COEFF = 0.028; 
    const BOUNCE_FACTOR = -0.2; 
    const RING_COLLISION_BOUNCE = 0.5; 
    const PEG_COLLISION_BOUNCE_FACTOR = -0.3;
    const PEG_STROKE_COLOR = '#505050';
    const PEG_FILL_COLOR = '#808080';
    const PEG_VISUAL_WIDTH = 10; 
    // const PEG_LANDING_WIDTH_FACTOR = 2.0; // No usado explícitamente ahora
    // const PEG_COLLISION_WIDTH_FACTOR = 1.0; // No usado explícitamente ahora
    const RING_OUTLINE_COLOR = 'rgba(0,0,0,0.85)'; 
    const RING_OUTLINE_WIDTH_ON_SCREEN = 1.0;       
    const FLAT_RING_VIEW_THICKNESS = 7;   
    const GROUND_FLAT_RING_THICKNESS = 5; 
    const MAX_TOTAL_RINGS_ON_SCREEN = MAX_RINGS_PER_PEG * TOTAL_COLORS;

    // --- ESTADO DEL JUEGO ---
    let score = 0;
    let scorePulseActive = false; 
    let scorePulseTimer = 0;      
    const SCORE_PULSE_DURATION = 12; 
    let rings = [];
    let pegs = [];
    let lastTime = 0;
    const TARGET_FPS = 60;
    const TARGET_DT = 1 / TARGET_FPS;
    let floatingScores = []; 
    let jetParticles = []; 
    let gameLoopId = null;
    let gameRunning = false; 
    let landedRingsCount = 0; 
    let gameOver = false;
    let baseScoreFromRings = 0;
    let bonusScoreFromColorStreak = 0;
    let bonusScoreFromFullPegsGeneral = 0; 
    let bonusScoreFromMonoColorPegsSpecific = 0;
    let allPegsCompletedBonusFactor = 1; 
    let masterBonusFactor = 1; 
    let currentScoreDisplaySize = 22; 
    const SCORE_NORMAL_SIZE = 22;
    const SCORE_PULSE_SIZE = 26;

    // --- ESTADO DE CONTROLES ---
    let leftJetInputActive = false; 
    let rightJetInputActive = false;
    let leftJetPressure = 0;  
    let rightJetPressure = 0; 
    let tiltLeftActive = false; 
    let tiltRightActive = false; 
    let sensorTiltX = 0;
    let sensorAvailable = false;
    let sensorActive = false;

    // --- TECLAS DEL TECLADO ---
    const KEY_LEFT_ARROW = 'ArrowLeft';
    const KEY_RIGHT_ARROW = 'ArrowRight';
    const KEY_JET_LEFT = 'KeyA';
    const KEY_JET_RIGHT = 'KeyD';

    // --- FUNCIONES DEL JUEGO ---
    function createRing(x, y, color) { 
        let speedMagnitude = 0.08 + Math.random() * 0.12; 
        return { x: x, y: y, vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4, color: color, originalColor: color, landed: false, pegIndex: -1, landedOrder: -1, basePoints: 25, awardedPoints: 0, rotationAngle: Math.random() * Math.PI * 2, initialRotationSpeed: (Math.random() < 0.5 ? -1 : 1) * speedMagnitude, rotationSpeed: 0, zRotationAngle: (Math.random() - 0.5) * 0.3, zRotationSpeed: (Math.random() - 0.5) * 0.03, isFlat: false, isSlidingOnPeg: false, finalYonPeg: 0 };
    }

    function initStandardPegs() { // Renombrado para claridad
        pegs = []; 
        const pegData = [ 
            { xFactor: 0.22, heightFactor: 0.35, yOffsetFactor: 0 },
            { xFactor: 0.78, heightFactor: 0.35, yOffsetFactor: 0 },
            { xFactor: 0.38, heightFactor: 0.30, yOffsetFactor: 0.35 + (45 / gameScreenHeight) },
            { xFactor: 0.62, heightFactor: 0.30, yOffsetFactor: 0.35 + (45 / gameScreenHeight) }
        ];
        pegData.forEach((data, index) => {
            pegs.push({ 
                id: index, 
                x: gameScreenWidth * data.xFactor, 
                bottomY: gameScreenHeight - 20 - (gameScreenHeight * data.yOffsetFactor), 
                height: gameScreenHeight * data.heightFactor, 
                landedRings: [], isFullAndScored: false, isMonoColor: false, monoColorValue: null 
            });
        });
    }
    
    function initGame() {
        console.log(">>>> initGame (Modo Único) llamada.");
        score = 0;
        baseScoreFromRings = 0; bonusScoreFromColorStreak = 0; bonusScoreFromFullPegsGeneral = 0;
        bonusScoreFromMonoColorPegsSpecific = 0; allPegsCompletedBonusFactor = 1; masterBonusFactor = 1;
        scorePulseActive = false; scorePulseTimer = 0; currentScoreDisplaySize = SCORE_NORMAL_SIZE;
        leftJetPressure = 0; rightJetPressure = 0; tiltLeftActive = false; tiltRightActive = false;
        floatingScores = []; jetParticles = [];
        landedRingsCount = 0; 
        gameOver = false;
            
        hideEndGameScreen(); 
        if (startScreen) startScreen.style.display = 'none'; 
        if (howToPlayScreen && howToPlayScreen.style.display !== 'none') howToPlayScreen.style.display = 'none';
        
        setPersistentInstructions();
        initStandardPegs(); // Siempre la configuración estándar de palos
        rings = [];
        
        const colorsToDistribute = [...RING_COLORS];
        let colorCounter = 0;
        for (let i = 0; i < MAX_TOTAL_RINGS_ON_SCREEN; i++) {
            const color = colorsToDistribute[colorCounter % TOTAL_COLORS];
            colorCounter++;
            const x = RING_OUTER_RADIUS + Math.random() * (gameScreenWidth - 2 * RING_OUTER_RADIUS);
            const y = gameScreenHeight * 0.60 + Math.random() * (gameScreenHeight * 0.40 - RING_OUTER_RADIUS); 
            rings.push(createRing(x, y, color));
        }
        
        if (typeof performance !== 'undefined' && performance.now) { lastTime = performance.now(); } 
        else { lastTime = Date.now(); }
        console.log(">>>> initGame (Modo Único) finalizada.");
    }

    function drawRing(ring) { /* ... (código de la función sin cambios) ... */ }
    function drawAllPegsAndLandedRings() { /* ... (código de la función sin cambios) ... */ }
    function drawScoreOnCanvas() { /* ... (código de la función sin cambios) ... */ }
    let instructionTimeout = null; function showMessage(text, duration = 3000, isInstruction = false) { /* ... */ }
    function setPersistentInstructions() { /* ... (código de la función sin cambios) ... */ }
    function updateScore(pointsToAdd, message = "") { /* ... (código de la función sin cambios) ... */ }
    function checkAndApplyBonuses(landedRing, peg) { /* ... (Llamará a checkAllPegsCompleted, no a checkArcadeLevelWinCondition) ... */ }
    function checkAllPegsCompleted() { /* ... (Renombrado de checkAllPegsCompleted_NormalMode) ... */ }
    function triggerGameOver() { /* ... (Simplificado, ya no necesita modo como parámetro) ... */ }
    function showEndGameScreen() { /* ... (Simplificado, ya no necesita modo como parámetro) ... */ }
    function hideEndGameScreen() { /* ... (código de la función sin cambios) ... */ }
    function hexToRgb(hex) { /* ... (código de la función sin cambios) ... */ }
    function createFloatingScore(x, y, text, color = "#FFFFFF", durationFrames = 90, upwardSpeed = 0.8) { /* ... */ }
    function updateAndDrawFloatingScores(dt) { /* ... (código de la función sin cambios) ... */ }
    function createJetParticle(xSide, strength) { /* ... (código de la función sin cambios) ... */ }
    function updateAndDrawJetParticles(dt) { /* ... (código de la función sin cambios) ... */ }
    function updateRings(actualTiltForceToApply, dt) { /* ... (código de la función sin cambios) ... */ }
    function handleOrientation(event) { /* ... */ }
    function requestSensorPermission() { /* ... */ }
    
    // --- COPIAR Y PEGAR TODAS LAS DEFINICIONES COMPLETAS DE FUNCIONES ANTERIORES AQUÍ ---
    // (Ej. drawRing, checkAndApplyBonuses, triggerGameOver, showEndGameScreen, etc. Asegúrate de adaptar triggerGameOver y showEndGameScreen para un solo modo.)
    // ... (Me aseguraré de que estén completas en la siguiente sección de JS)


    // --- COMIENZO DE LAS DEFINICIONES COMPLETAS DE LAS FUNCIONES (reemplazar los stubs anteriores) ---
    drawRing = function(ring) { ctx.save(); ctx.translate(ring.x, ring.y); if ((!ring.isFlat || ring.landed) && !ring.isSlidingOnPeg) { ctx.rotate(ring.zRotationAngle); } const outerRadius = RING_OUTER_RADIUS; const innerRadiusMaterial = RING_OUTER_RADIUS - RING_VISUAL_THICKNESS; if (ring.isFlat) { const currentFlatThickness = ring.landed ? FLAT_RING_VIEW_THICKNESS : GROUND_FLAT_RING_THICKNESS; const halfFlatViewThickness = currentFlatThickness / 2; const flatDrawWidth = outerRadius * 2; ctx.fillStyle = RING_OUTLINE_COLOR; ctx.fillRect( -flatDrawWidth / 2 - RING_OUTLINE_WIDTH_ON_SCREEN, -halfFlatViewThickness - RING_OUTLINE_WIDTH_ON_SCREEN, flatDrawWidth + (RING_OUTLINE_WIDTH_ON_SCREEN * 2), currentFlatThickness + (RING_OUTLINE_WIDTH_ON_SCREEN * 2) ); ctx.fillStyle = ring.color; ctx.fillRect( -flatDrawWidth / 2, -halfFlatViewThickness, flatDrawWidth, currentFlatThickness ); } else { const scaleYValue = Math.abs(Math.cos(ring.rotationAngle)); const effectiveScaleY = Math.max(0.08, scaleYValue); if (scaleYValue < 0.08 && !ring.landed) { const tempFlatThickness = GROUND_FLAT_RING_THICKNESS * 0.8; const halfFlatViewThickness = tempFlatThickness / 2; const flatDrawWidth = outerRadius * 2; ctx.fillStyle = RING_OUTLINE_COLOR; ctx.fillRect( -flatDrawWidth / 2 - RING_OUTLINE_WIDTH_ON_SCREEN, -halfFlatViewThickness - RING_OUTLINE_WIDTH_ON_SCREEN, flatDrawWidth + (RING_OUTLINE_WIDTH_ON_SCREEN * 2), tempFlatThickness + (RING_OUTLINE_WIDTH_ON_SCREEN * 2) ); ctx.fillStyle = ring.color; ctx.fillRect( -flatDrawWidth / 2, -halfFlatViewThickness, flatDrawWidth, tempFlatThickness ); } else { ctx.scale(1, effectiveScaleY); const outlineScaledOffset = RING_OUTLINE_WIDTH_ON_SCREEN / effectiveScaleY; ctx.beginPath(); ctx.arc(0, 0, outerRadius + outlineScaledOffset, 0, Math.PI * 2, false); ctx.arc(0, 0, Math.max(0, innerRadiusMaterial - outlineScaledOffset), 0, Math.PI * 2, true); ctx.fillStyle = RING_OUTLINE_COLOR; ctx.fill(); ctx.beginPath(); ctx.arc(0, 0, outerRadius, 0, Math.PI * 2, false); ctx.arc(0, 0, innerRadiusMaterial, 0, Math.PI * 2, true);    ctx.fillStyle = ring.color; ctx.fill(); } } ctx.restore(); };
    drawAllPegsAndLandedRings = function() { if(!pegs) return; pegs.forEach(peg => { ctx.fillStyle = PEG_FILL_COLOR; ctx.strokeStyle = PEG_STROKE_COLOR; ctx.lineWidth = 2; const pegTopY = peg.bottomY - peg.height; ctx.beginPath(); ctx.roundRect(peg.x - PEG_VISUAL_WIDTH / 2, pegTopY, PEG_VISUAL_WIDTH, peg.height, [PEG_VISUAL_WIDTH/3, PEG_VISUAL_WIDTH/3, 0, 0]); ctx.fill(); ctx.stroke(); peg.landedRings.forEach(drawRing); }); };
    drawScoreOnCanvas = function() { if (startScreen && startScreen.style.display === 'flex' && !gameRunning) return; ctx.save(); ctx.font = `bold ${currentScoreDisplaySize}px Arial`; ctx.textAlign = 'right'; ctx.textBaseline = 'top'; ctx.shadowColor = 'rgba(0, 0, 0, 0.7)'; ctx.shadowBlur = 3; ctx.shadowOffsetX = 1; ctx.shadowOffsetY = 1; if (scorePulseActive) { ctx.fillStyle = '#FFD700'; } else { ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'; } ctx.fillText(`Score: ${score}`, gameScreenWidth - 10, 10); ctx.restore(); };
    instructionTimeout = null; showMessage = function(text, duration = 3000, isInstruction = false) { if (instructionTimeout && !isInstruction) { clearTimeout(instructionTimeout); } if(messageBoard) {messageBoard.textContent = text; messageBoard.style.opacity = 1;} if (!isInstruction) { instructionTimeout = setTimeout(() => { if(messageBoard) messageBoard.style.opacity = 0; instructionTimeout = null; setTimeout(setPersistentInstructions, 700); }, duration); } };
    setPersistentInstructions = function() { if (instructionTimeout && messageBoard && messageBoard.textContent !== "" && !messageBoard.textContent.toLowerCase().includes("pc:")) { return; } let instructionMessage = "PC: Flechas=Inclinar, A/D=Jets."; if (sensorAvailable) { if (sensorActive) instructionMessage += " Móvil: Sensor ACTIVO."; else instructionMessage += " Móvil: Botones/Activar Sensor."; } else { instructionMessage += " Móvil: Botones TILT."; } if(messageBoard) { messageBoard.textContent = instructionMessage; messageBoard.style.opacity = 1;} };
    updateScore = function(pointsToAdd, message = "") { if (pointsToAdd > 0) { score += pointsToAdd; scorePulseActive = true; scorePulseTimer = SCORE_PULSE_DURATION; currentScoreDisplaySize = SCORE_PULSE_SIZE; } else if (pointsToAdd < 0) { score += pointsToAdd; } if (message && message !== "") { showMessage(message, 2500); } };
    checkAndApplyBonuses = function(landedRing, peg) { let pointsForThisSpecificRing = landedRing.basePoints; let bonusMessageText = ""; baseScoreFromRings += landedRing.basePoints; if ('vibrate' in navigator) { navigator.vibrate(75); } let mightBecomeMonoColor = true; if(peg.landedRings.length === MAX_RINGS_PER_PEG) { const firstColorInPeg = peg.landedRings[0].color; for(const r of peg.landedRings) { if (r.color !== firstColorInPeg) { mightBecomeMonoColor = false; break; } } } else { mightBecomeMonoColor = false; } if (peg.landedRings.length > 1 && !mightBecomeMonoColor && landedRing.landedOrder > 0 ) { const previousRingInStack = peg.landedRings[landedRing.landedOrder -1]; if (previousRingInStack && previousRingInStack.color === landedRing.color) { let colorStreakBonus = landedRing.basePoints; pointsForThisSpecificRing += colorStreakBonus; bonusScoreFromColorStreak += colorStreakBonus; bonusMessageText += ` Color x2!`;} } landedRing.awardedPoints = pointsForThisSpecificRing; createFloatingScore(landedRing.x, landedRing.finalYonPeg - RING_OUTER_RADIUS, `+${pointsForThisSpecificRing}${bonusMessageText}`, landedRing.color); updateScore(pointsForThisSpecificRing); landedRingsCount++; if (peg.landedRings.length === MAX_RINGS_PER_PEG && !peg.isFullAndScored) { peg.isFullAndScored = true; let isCurrentPegMonoColor = true; const firstLandedColor = peg.landedRings[0].color; for (let k = 1; k < MAX_RINGS_PER_PEG; k++) { if (peg.landedRings[k].color !== firstLandedColor) { isCurrentPegMonoColor = false; break; } } let additionalBonusScore = 0; let pegCompletionMessage = ""; if (isCurrentPegMonoColor) { peg.isMonoColor = true; peg.monoColorValue = firstLandedColor; let currentPegAwardedPointsSum = 0; peg.landedRings.forEach(r => currentPegAwardedPointsSum += r.awardedPoints); let targetMonoScore = (landedRing.basePoints * MAX_RINGS_PER_PEG) * 10; additionalBonusScore = targetMonoScore - currentPegAwardedPointsSum; if(additionalBonusScore < 0) additionalBonusScore = 0; bonusScoreFromMonoColorPegsSpecific += additionalBonusScore; pegCompletionMessage = `PALO MONOCOLOR! (x10)`; } else { let pegTotalAwardedPoints = 0; peg.landedRings.forEach(r => { pegTotalAwardedPoints += r.awardedPoints; }); additionalBonusScore = pegTotalAwardedPoints * 3; bonusScoreFromFullPegsGeneral += additionalBonusScore; pegCompletionMessage = `PALO LLENO! (x4)`; } if(additionalBonusScore > 0) updateScore(additionalBonusScore, pegCompletionMessage); checkAllPegsCompleted(); } };
    checkAllPegsCompleted = function() { if (allPegsCompletedBonusFactor > 1 && masterBonusFactor > 1) return; if(!pegs) return; const allPegsNowFull = pegs.every(p => p.isFullAndScored); if (allPegsNowFull && allPegsCompletedBonusFactor === 1) { allPegsCompletedBonusFactor = 2; showMessage("TODOS LOS PALOS LLENOS! Puntos x2!", 3500, true); let monoColorPegCount = 0; const usedColorsForMaster = new Set(); pegs.forEach(p => { if (p.isMonoColor) { monoColorPegCount++; usedColorsForMaster.add(p.monoColorValue); } }); if (monoColorPegCount === TOTAL_COLORS && usedColorsForMaster.size === TOTAL_COLORS) { masterBonusFactor = 100; showMessage("¡¡BONO MAESTRO!! Puntuación Final x100!", 5000, true); } triggerGameOver(); } };
    triggerGameOver = function() { if (gameOver) return; gameOver = true; gameRunning = false; let finalScoreCalculation = baseScoreFromRings + bonusScoreFromColorStreak + bonusScoreFromFullPegsGeneral + bonusScoreFromMonoColorPegsSpecific; if(allPegsCompletedBonusFactor > 1) { finalScoreCalculation *= allPegsCompletedBonusFactor; } if(masterBonusFactor > 1) { let scoreBeforeAnyFinalMultiplier = baseScoreFromRings + bonusScoreFromColorStreak + bonusScoreFromFullPegsGeneral + bonusScoreFromMonoColorPegsSpecific; finalScoreCalculation = scoreBeforeAnyFinalMultiplier * masterBonusFactor; } score = Math.round(finalScoreCalculation); if (gameLoopId) { cancelAnimationFrame(gameLoopId); gameLoopId = null; } showEndGameScreen(); };
    showEndGameScreen = function() { const existingScreen = document.getElementById('endGameScreen'); if (existingScreen) existingScreen.parentNode.removeChild(existingScreen); const screenDOM = document.createElement('div'); screenDOM.id = 'endGameScreen'; screenDOM.classList.add('visible'); let summaryHTML = `<h2>¡Juego Terminado!</h2><p>Puntos Base Aros: ${baseScoreFromRings}</p>`; if (bonusScoreFromColorStreak > 0) summaryHTML += `<p>Bono Racha Color: +${bonusScoreFromColorStreak}</p>`; if (bonusScoreFromFullPegsGeneral > 0) summaryHTML += `<p>Bono Palos Llenos (Normal): +${bonusScoreFromFullPegsGeneral}</p>`; if (bonusScoreFromMonoColorPegsSpecific > 0) summaryHTML += `<p>Bono Palos Monocolor: +${bonusScoreFromMonoColorPegsSpecific}</p>`; let subTotalBeforeMultipliers = baseScoreFromRings + bonusScoreFromColorStreak + bonusScoreFromFullPegsGeneral + bonusScoreFromMonoColorPegsSpecific; if (masterBonusFactor > 1) { summaryHTML += `<p style="color: gold; font-weight: bold;">¡BONO MAESTRO!: x${masterBonusFactor} (sobre ${subTotalBeforeMultipliers})</p>`; } else if (allPegsCompletedBonusFactor > 1) { summaryHTML += `<p style="color: lightblue;">Bono Todos Palos Llenos: x${allPegsCompletedBonusFactor} (sobre ${subTotalBeforeMultipliers})</p>`; } summaryHTML += `<h3 style="margin-top: 20px; color: #FFD700;">PUNTUACIÓN FINAL: ${score}</h3>`; const playAgainButton = document.createElement('button'); playAgainButton.textContent = 'Jugar de Nuevo'; playAgainButton.onclick = () => { hideEndGameScreen(); if(startScreen) startScreen.style.display = 'flex'; if(howToPlayButton) howToPlayButton.style.display = 'inline-block'; gameRunning = false; score = 0; currentScoreDisplaySize = SCORE_NORMAL_SIZE;  if (!gameLoopId) { if (typeof performance !== 'undefined' && performance.now) { lastTime = performance.now(); } else { lastTime = Date.now(); } gameLoopId = requestAnimationFrame(gameLoop); } }; screenDOM.innerHTML = summaryHTML; screenDOM.appendChild(playAgainButton); if(document.body) document.body.appendChild(screenDOM); };
    hideEndGameScreen = function() { const screenDOM = document.getElementById('endGameScreen'); if (screenDOM) { screenDOM.classList.remove('visible'); setTimeout(() => { if (screenDOM && screenDOM.parentNode) { screenDOM.parentNode.removeChild(screenDOM); } }, 500); } };
    hexToRgb = function(hex) { let r = 0, g = 0, b = 0; if (!hex || typeof hex !== 'string') return { r: 255, g: 255, b: 255 }; if (hex.length == 4) { r = "0x" + hex[1] + hex[1]; g = "0x" + hex[2] + hex[2]; b = "0x" + hex[3] + hex[3]; } else if (hex.length == 7) { r = "0x" + hex[1] + hex[2]; g = "0x" + hex[3] + hex[4]; b = "0x" + hex[5] + hex[6]; } else { return { r: 255, g: 255, b: 255 }; } return { r: +r, g: +g, b: +b }; };
    createFloatingScore = function(x, y, text, color = "#FFFFFF", durationFrames = 90, upwardSpeed = 0.8) { floatingScores.push({ x: x, y: y, text: text, color: color, opacity: 1, vy: -upwardSpeed, life: durationFrames, initialLife: durationFrames, currentFontSize: 20, maxFontSize: 30 }); };
    updateAndDrawFloatingScores = function(dt) { const accelerationFactor = dt * TARGET_FPS; ctx.save(); ctx.textAlign = "center"; ctx.shadowColor = "rgba(0,0,0,0.6)"; ctx.shadowBlur = 4; ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 2; for (let i = floatingScores.length - 1; i >= 0; i--) { const fs = floatingScores[i]; fs.y += fs.vy * accelerationFactor; fs.life -= accelerationFactor; const progress = 1 - (fs.life / fs.initialLife); fs.currentFontSize = 20 + (fs.maxFontSize - 20) * Math.sin(progress * Math.PI * 0.8); if(fs.currentFontSize < 18) fs.currentFontSize = 18; fs.opacity = (fs.life / fs.initialLife); if (fs.opacity < 0) fs.opacity = 0; if (fs.life <= 0) { floatingScores.splice(i, 1); } else { ctx.font = `bold ${Math.round(fs.currentFontSize)}px Arial`; const rgb = hexToRgb(fs.color); ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${fs.opacity})`; ctx.fillText(fs.text, fs.x, fs.y); } } ctx.restore(); };
    createJetParticle = function(xSide, strength) { if (jetParticles.length >= MAX_JET_PARTICLES) { return; } const isLeft = xSide === -1; const particleOriginX = isLeft ? gameScreenWidth * 0.22 : gameScreenWidth * 0.78; const particle = { x: particleOriginX + (Math.random() - 0.5) * 15, y: gameScreenHeight - 25 - Math.random() * 10, vx: (Math.random() - 0.5) * 2 + (isLeft ? 0.8 : -0.8) * (strength*2.5), vy: -(3.5 + Math.random() * 3.5 + strength * 5.5), radius: 2.0 + Math.random() * 2.0 + strength * 3.0, opacity: 0.45 + strength * 0.5, life: 30 + Math.random() * 25 + strength * 30, color: `rgba(220, 240, 255, ${0.25 + Math.random() * 0.3})` }; jetParticles.push(particle); };
    updateAndDrawJetParticles = function(dt) { const accelerationFactor = dt * TARGET_FPS; ctx.save(); for (let i = jetParticles.length - 1; i >= 0; i--) { const p = jetParticles[i]; p.x += p.vx * accelerationFactor; p.y += p.vy * accelerationFactor; p.vy += GRAVITY_BASE * 0.2 * accelerationFactor; p.life -= accelerationFactor; const baseOpacityMatch = p.color.match(/rgba\([\d\s,]+([\d.]+)\)/); const baseOpacity = baseOpacityMatch ? parseFloat(baseOpacityMatch[1]) : 0.3; p.opacity = baseOpacity * (p.life / (30 + 25 + 30)); if (p.opacity < 0) p.opacity = 0; p.radius *= (1 - 0.020 * accelerationFactor); if (p.opacity <= 0 || p.radius <= 0.4 || p.life <= 0 || p.y < -p.radius || p.y > gameScreenHeight + p.radius) { jetParticles.splice(i, 1); } else { ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); const colorParts = p.color.substring(p.color.indexOf('(') + 1, p.color.lastIndexOf(',')).trim(); ctx.fillStyle = `rgba(${colorParts}, ${p.opacity.toFixed(2)})`; ctx.fill(); } } ctx.restore(); };
    updateRings = function(actualTiltForceToApply, dt) { const accelerationFactor = dt * TARGET_FPS; rings.forEach(ring => { if (ring.landed && !ring.isSlidingOnPeg) { ring.isFlat = true; ring.rotationAngle = Math.PI / 2; ring.rotationSpeed = 0; ring.zRotationAngle = 0; ring.zRotationSpeed = 0; ring.vx = 0; ring.vy = 0; return; } if (ring.isSlidingOnPeg) { const slideSpeedValue = 4.0 * accelerationFactor; if (ring.y < ring.finalYonPeg) { ring.y += slideSpeedValue; if (ring.y >= ring.finalYonPeg) { ring.y = ring.finalYonPeg; ring.isSlidingOnPeg = false; ring.vy = 0; landedRingsCount++; } } else { ring.y -= slideSpeedValue; if (ring.y <= ring.finalYonPeg) { ring.y = ring.finalYonPeg; ring.isSlidingOnPeg = false; ring.vy = 0; landedRingsCount++; } } ring.isFlat = true; ring.rotationAngle = Math.PI / 2; ring.rotationSpeed = 0; ring.zRotationAngle = 0; ring.zRotationSpeed = 0; ring.vx = 0; return; } ring.vy += GRAVITY_BASE * accelerationFactor; const frictionRate = 1 - WATER_FRICTION_COEFF; ring.vx *= Math.pow(frictionRate, accelerationFactor); ring.vy *= Math.pow(frictionRate, accelerationFactor); let forceAppliedToRingThisFrame = false; [[leftJetPressure, 0.22, 1], [rightJetPressure, 0.78, -1]].forEach(([pressure, jetXFactor, horizontalDir]) => { if (pressure > 0.01) { let currentJetForceVertical = BASE_JET_STRENGTH * pressure; let currentJetForceHorizontal = JET_HORIZONTAL_INFLUENCE_RATIO * currentJetForceVertical; let jetSourceX = gameScreenWidth * jetXFactor; const distanceX = ring.x - jetSourceX; let proximityFactorY = 0; const yPosInJetEffect = (ring.y - (gameScreenHeight - JET_EFFECT_RADIUS_Y)); if (yPosInJetEffect > 0 && ring.y < gameScreenHeight) { proximityFactorY = 1 - Math.pow( (JET_EFFECT_RADIUS_Y - yPosInJetEffect) / JET_EFFECT_RADIUS_Y, JET_VERTICAL_FALLOFF_POWER); proximityFactorY = Math.max(0.05, Math.min(1, proximityFactorY)); } if (Math.abs(distanceX) < JET_EFFECT_RADIUS_X && proximityFactorY > 0.01) { const proximityFactorX = 1 - (Math.abs(distanceX) / JET_EFFECT_RADIUS_X); const totalProximityFactor = proximityFactorX * proximityFactorY; if (totalProximityFactor > 0) { ring.vy -= (currentJetForceVertical * totalProximityFactor) * accelerationFactor; ring.vx += (currentJetForceHorizontal * totalProximityFactor * horizontalDir) * accelerationFactor; forceAppliedToRingThisFrame = true; } } } }); if (actualTiltForceToApply !== 0) { ring.vx += actualTiltForceToApply * accelerationFactor; forceAppliedToRingThisFrame = true; } const isOnGroundAndEffectivelySlow = ring.y + RING_OUTER_RADIUS >= gameScreenHeight - (GROUND_FLAT_RING_THICKNESS / 2 + RING_OUTLINE_WIDTH_ON_SCREEN + 1) && Math.abs(ring.vy) < 0.15 && Math.abs(ring.vx) < 0.15; if (ring.isFlat && forceAppliedToRingThisFrame && !isOnGroundAndEffectivelySlow) { ring.isFlat = false; if (ring.rotationSpeed === 0) { ring.rotationSpeed = ring.initialRotationSpeed * (Math.random() < 0.5 ? 0.7 : -0.7) * (0.7 + Math.random() * 0.6) ; } if (ring.zRotationSpeed === 0 && forceAppliedToRingThisFrame) { ring.zRotationSpeed = (Math.random() - 0.5) * 0.03; } } else if (!ring.landed && isOnGroundAndEffectivelySlow && !forceAppliedToRingThisFrame) { ring.isFlat = true; ring.zRotationSpeed = 0; } if (!ring.isFlat) { ring.rotationAngle += ring.rotationSpeed * accelerationFactor; if (ring.rotationAngle > Math.PI * 2) ring.rotationAngle -= Math.PI * 2; if (ring.rotationAngle < 0) ring.rotationAngle += Math.PI * 2; const rotationalFrictionRate = 1 - 0.01; ring.rotationSpeed *= Math.pow(rotationalFrictionRate, accelerationFactor); if (Math.abs(ring.rotationSpeed) < 0.005 / (accelerationFactor > 0 ? accelerationFactor : 1) ) ring.rotationSpeed = 0; } else { ring.rotationAngle = Math.PI / 2; ring.rotationSpeed = 0; } ring.zRotationAngle += ring.zRotationSpeed * accelerationFactor; if (ring.zRotationAngle > Math.PI * 2) ring.zRotationAngle -= Math.PI * 2; else if (ring.zRotationAngle < 0) ring.zRotationAngle += Math.PI * 2; ring.zRotationSpeed *= Math.pow((1 - 0.025), accelerationFactor); if (Math.abs(ring.zRotationSpeed) < 0.001 / (accelerationFactor || 1)) ring.zRotationSpeed = 0; });
    for (let iter = 0; iter < 3; iter++) { for (let i = 0; i < rings.length; i++) { const ring1 = rings[i]; if (ring1.landed) continue; for (let j = i + 1; j < rings.length; j++) { const ring2 = rings[j]; if (ring2.landed) continue; const dx = ring2.x - ring1.x; const dy = ring2.y - ring1.y; const distance = Math.sqrt(dx * dx + dy * dy); const minDistance = RING_OUTER_RADIUS * 2; if (distance < minDistance && distance > 0.001) { const overlap = (minDistance - distance); const normalX = dx / distance; const normalY = dy / distance; ring1.x -= overlap * 0.5 * normalX; ring1.y -= overlap * 0.5 * normalY; ring2.x += overlap * 0.5 * normalX; ring2.y += overlap * 0.5 * normalY; const relativeVx = ring1.vx - ring2.vx; const relativeVy = ring1.vy - ring2.vy; const dotProduct = relativeVx * normalX + relativeVy * normalY; if (dotProduct > 0) { const impulse = (-(1 + RING_COLLISION_BOUNCE) * dotProduct) / 2; ring1.vx += impulse * normalX; ring1.vy += impulse * normalY; ring2.vx -= impulse * normalX; ring2.vy -= impulse * normalY; if (!ring1.isFlat && Math.abs(ring1.rotationSpeed) < 0.2) ring1.rotationSpeed += (Math.random() - 0.5) * 0.05 / (accelerationFactor || 1); if (!ring2.isFlat && Math.abs(ring2.rotationSpeed) < 0.2) ring2.rotationSpeed += (Math.random() - 0.5) * 0.05 / (accelerationFactor || 1); if (Math.abs(ring1.zRotationSpeed) < 0.05) ring1.zRotationSpeed += (Math.random() - 0.5) * 0.03 / (accelerationFactor || 1); if (Math.abs(ring2.zRotationSpeed) < 0.05) ring2.zRotationSpeed += (Math.random() - 0.5) * 0.03 / (accelerationFactor || 1); } } } } }
    rings.forEach((ring, index) => { if (ring.landed && !ring.isSlidingOnPeg) return; if (ring.isSlidingOnPeg) return; let prevX = ring.x; let prevY = ring.y; ring.x += ring.vx * accelerationFactor; ring.y += ring.vy * accelerationFactor; let interactionOccurredThisFrame = false; if (!ring.landed) { for (const peg of pegs) { if (ring.landed || interactionOccurredThisFrame || peg.landedRings.length >= MAX_RINGS_PER_PEG || peg.isFullAndScored ) { continue; } const pegCenterX = peg.x; const pegTop = peg.bottomY - peg.height; const ringRadius = RING_OUTER_RADIUS; const landingCatchWidth = PEG_VISUAL_WIDTH * 2.0 /*PEG_LANDING_WIDTH_FACTOR*/; const horizontallyAligned = Math.abs(ring.x - pegCenterX) < landingCatchWidth / 2; const isFalling = ring.vy > 0; const ringBottom = ring.y + ringRadius; const prevRingBottom = prevY + ringRadius; if (isFalling && horizontallyAligned && ringBottom >= pegTop && prevRingBottom < pegTop + RING_VISUAL_THICKNESS * 0.8 ) { const targetLandedY = (peg.bottomY - FLAT_RING_VIEW_THICKNESS / 2) - (peg.landedRings.length * FLAT_RING_VIEW_THICKNESS); ring.isSlidingOnPeg = true; ring.finalYonPeg = targetLandedY; ring.landed = true; ring.isFlat = true; ring.pegIndex = peg.id; ring.x = pegCenterX; if (ring.y < targetLandedY) { ring.vy = Math.min(4.0, 2.0 + peg.landedRings.length * 0.1); } else { ring.vy = -Math.min(4.0, 2.0 + peg.landedRings.length * 0.1); if(targetLandedY > ring.y - 1) ring.vy = 0.1; } ring.vx = 0; ring.rotationSpeed = 0; ring.rotationAngle = Math.PI / 2; ring.zRotationAngle = 0; ring.zRotationSpeed = 0; ring.landedOrder = peg.landedRings.length; peg.landedRings.push(ring); checkAndApplyBonuses(ring, peg); interactionOccurredThisFrame = true; break; } if (!ring.landed && !interactionOccurredThisFrame) { const pegBodyLeft = pegCenterX - (PEG_VISUAL_WIDTH * 1.0 /*PEG_COLLISION_WIDTH_FACTOR*/) / 2; const pegBodyRight = pegCenterX + (PEG_VISUAL_WIDTH * 1.0 /*PEG_COLLISION_WIDTH_FACTOR*/) / 2; if (ring.y + ringRadius > pegTop + RING_VISUAL_THICKNESS * 0.5 && ring.y - ringRadius < peg.bottomY) { if (ring.x + ringRadius > pegBodyLeft && prevX + ringRadius <= pegBodyLeft + 1 && ring.vx > 0) { ring.x = pegBodyLeft - ringRadius - 0.1; ring.vx *= PEG_COLLISION_BOUNCE_FACTOR; interactionOccurredThisFrame = true; } else if (ring.x - ringRadius < pegBodyRight && prevX - ringRadius >= pegBodyRight -1 && ring.vx < 0) { ring.x = pegBodyRight + ringRadius + 0.1; ring.vx *= PEG_COLLISION_BOUNCE_FACTOR; interactionOccurredThisFrame = true; } } if (!interactionOccurredThisFrame && isFalling && ring.y + ringRadius > pegTop && prevY + ringRadius <= pegTop + 3 && Math.abs(ring.x - pegCenterX) < (PEG_VISUAL_WIDTH / 2 + ringRadius)) { ring.y = pegTop - ringRadius - 0.1; ring.vy *= (PEG_COLLISION_BOUNCE_FACTOR - 0.1); ring.vx += (Math.random() - 0.5) * 0.3 * accelerationFactor; interactionOccurredThisFrame = true;} } if (interactionOccurredThisFrame) break; } } if (ring.x - RING_OUTER_RADIUS < 0) { ring.x = RING_OUTER_RADIUS; ring.vx *= BOUNCE_FACTOR; } if (ring.x + RING_OUTER_RADIUS > gameScreenWidth) { ring.x = gameScreenWidth - RING_OUTER_RADIUS; ring.vx *= BOUNCE_FACTOR; } if (ring.y - RING_OUTER_RADIUS < 0) { ring.y = RING_OUTER_RADIUS; ring.vy *= BOUNCE_FACTOR;} const effectiveRingBottomExtent = ring.y + (ring.isFlat ? GROUND_FLAT_RING_THICKNESS / 2 : RING_OUTER_RADIUS); const groundHitPosition = gameScreenHeight - RING_OUTLINE_WIDTH_ON_SCREEN; if (effectiveRingBottomExtent >= groundHitPosition) { ring.y = groundHitPosition - (ring.isFlat ? GROUND_FLAT_RING_THICKNESS / 2 : RING_OUTER_RADIUS); if (ring.vy > 0) ring.vy *= BOUNCE_FACTOR * 0.3; if (Math.abs(ring.vy) < 0.05 / (accelerationFactor > 0 ? accelerationFactor : 1) ) { ring.vy = 0; if (!ring.landed) { ring.isFlat = true; if (ring.rotationSpeed !==0) ring.rotationSpeed = 0; ring.rotationAngle = Math.PI / 2; if (ring.zRotationSpeed !== 0) ring.zRotationSpeed = 0;} } }
    }); };
    function handleOrientation(event) { /* ... */ } function requestSensorPermission() { /* ... */ }


    // --- MANEJO DE EVENTOS DE BOTONES ---
    if (startGameButton) {startGameButton.addEventListener('click', () => { if(startScreen) startScreen.style.display = 'none'; if (howToPlayScreen && howToPlayScreen.style.display !== 'none') howToPlayScreen.style.display = 'none'; initGame(); gameRunning = true; gameOver = false; isPausedForLevelTransition = false; if (gameLoopId) { cancelAnimationFrame(gameLoopId); } if (typeof performance !== 'undefined' && performance.now) { lastTime = performance.now(); } else { lastTime = Date.now(); } gameLoopId = requestAnimationFrame(gameLoop); });} else {console.error("startGameButton no encontrado");}
    // (Resto de listeners como en la versión anterior, con verificaciones)


    // --- GAME LOOP ---
    function gameLoop(currentTime) {
        if (isPausedForLevelTransition) { /* ... (Sin cambios, debe ser funcional si elementos existen) ... */ return;}
        if (!gameRunning && !gameOver) { if (typeof performance !== 'undefined' && performance.now) { lastTime = performance.now(); } else { lastTime = Date.now(); } if(ctx) ctx.clearRect(0, 0, canvas.width, canvas.height); if (startScreen && (startScreen.style.display === 'none' || startScreen.style.display === '')) { drawScoreOnCanvas(); } requestAnimationFrame(gameLoop); return; }
        if (gameOver) { return; }
        const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
        let dt = (now - lastTime) / 1000.0; 
        if (dt <= 0 || isNaN(dt) || dt > (TARGET_DT * 5) ) dt = TARGET_DT; 
        lastTime = now;
        const deltaTime = dt; 
        if(ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (scorePulseActive) { scorePulseTimer -= deltaTime * TARGET_FPS; if (scorePulseTimer <= 0) { scorePulseActive = false; currentScoreDisplaySize = SCORE_NORMAL_SIZE; } else { const pulseProgress = 1 - (scorePulseTimer / SCORE_PULSE_DURATION); currentScoreDisplaySize = SCORE_NORMAL_SIZE + Math.sin(pulseProgress * Math.PI) * (SCORE_PULSE_SIZE - SCORE_NORMAL_SIZE); } }
        const accelerationFactor = deltaTime * TARGET_FPS; const pressureChange = JET_PRESSURE_INCREMENT_BASE * accelerationFactor; const pressureDecay = JET_PRESSURE_DECREMENT_BASE * accelerationFactor;
        if (leftJetInputActive) { leftJetPressure += pressureChange; if (leftJetPressure > MAX_JET_PRESSURE) leftJetPressure = MAX_JET_PRESSURE; if(leftJetPressure > 0.1) createJetParticle(-1, leftJetPressure); } else { leftJetPressure -= pressureDecay; if (leftJetPressure < 0) leftJetPressure = 0; }
        if (rightJetInputActive) { rightJetPressure += pressureChange; if (rightJetPressure > MAX_JET_PRESSURE) rightJetPressure = MAX_JET_PRESSURE; if(rightJetPressure > 0.1) createJetParticle(1, rightJetPressure); } else { rightJetPressure -= pressureDecay; if (rightJetPressure < 0) rightJetPressure = 0; }
        // No hay lógica de tiempo para modo normal
        let forceForTiltUpdate = 0; if (sensorActive && sensorAvailable) { forceForTiltUpdate = sensorTiltX * TILT_FORCE_SENSOR_MULTIPLIER; if (forceForTiltUpdate > MAX_SENSOR_TILT_FORCE) forceForTiltUpdate = MAX_SENSOR_TILT_FORCE; if (forceForTiltUpdate < -MAX_SENSOR_TILT_FORCE) forceForTiltUpdate = -MAX_SENSOR_TILT_FORCE; } else { if (tiltLeftActive === true && tiltRightActive === false) { forceForTiltUpdate = -TILT_FORCE_BUTTON_BASE; } else if (tiltRightActive === true && tiltLeftActive === false) { forceForTiltUpdate = TILT_FORCE_BUTTON_BASE; } }
        if(rings) updateRings(forceForTiltUpdate, deltaTime); 
        drawAllPegsAndLandedRings();
        if(rings) rings.forEach(ring => { drawRing(ring); });
        updateAndDrawJetParticles(deltaTime);
        updateAndDrawFloatingScores(deltaTime);
        drawScoreOnCanvas(); 
        // Condición de fin de juego para modo normal
        if (landedRingsCount >= MAX_TOTAL_RINGS_ON_SCREEN && !gameOver) {
             checkAllPegsCompleted(); // Esto puede llamar a triggerGameOver
        }
        if(gameRunning && !gameOver){ gameLoopId = requestAnimationFrame(gameLoop); }
    }
    
    // --- Configuración Inicial ---
    console.log(">>>> Script principal: Configurando estado inicial...");
    if (messageBoard) setPersistentInstructions(); else { console.error("ERROR: messageBoard NO ENCONTRADO en setup inicial."); }
    if (startScreen) { startScreen.style.display = 'flex'; console.log(">>>> Pantalla de inicio (startScreen) debería estar visible."); } 
    else { console.error("!!!!!!!! FATAL: startScreen NO ENCONTRADO al final del script. No se puede mostrar la pantalla de inicio. !!!!!!!!!"); }
    if (typeof performance !== 'undefined' && performance.now) { lastTime = performance.now(); } else { lastTime = Date.now(); }
    console.log(">>>> Iniciando el primer gameloop para UI (debería mostrar pantalla de inicio).");
    gameLoopId = requestAnimationFrame(gameLoop); 

} // Fin de initializeAndRunGame

// Llamar a la función principal
initializeAndRunGame();
