function initializeAndRunGame() {
    console.log(">>>> Watertoy Arcade - initializeAndRunGame() called.");

    const canvas = document.getElementById('gameCanvas');
    if (!canvas) { console.error("FATAL: canvas NOT FOUND!"); return; }
    const ctx = canvas.getContext('2d');
    if (!ctx) { console.error("FATAL: 2D context NOT obtained!"); return; }

    const messageBoard = document.getElementById('messageBoard');
    const leftJetButton = document.getElementById('leftJetButton');
    const rightJetButton = document.getElementById('rightJetButton');
    const tiltLeftButton = document.getElementById('tiltLeftButton');
    const tiltRightButton = document.getElementById('tiltRightButton');
    const resetButton = document.getElementById('resetButton');
    const enableSensorButton = document.getElementById('enableSensorButton');
    const fullscreenButton = document.getElementById('fullscreenButton');
    const startScreen = document.getElementById('startScreen');
    const startGameButton = document.getElementById('startGameButton');
    const howToPlayButton = document.getElementById('howToPlayButton');
    const howToPlayScreen = document.getElementById('howToPlayScreen');
    const closeHowToPlayButton = document.getElementById('closeHowToPlayButton');

    if (!startGameButton) { console.error("FATAL: startGameButton NOT FOUND! El juego no puede iniciarse."); return; }

    const gameScreenWidth = 450;
    const gameScreenHeight = 400;
    canvas.width = gameScreenWidth;
    canvas.height = gameScreenHeight;

    // --- Constantes del Juego ---
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
    const JET_VERTICAL_FALLOFF_POWER = 0.5;
    const MAX_JET_PARTICLES = 200;
    const TILT_FORCE_BUTTON_BASE = 0.30;
    const TILT_FORCE_SENSOR_MULTIPLIER = 0.055;
    const MAX_SENSOR_TILT_FORCE = 0.55;

    const SENSOR_PITCH_TRANSITION_END_UP = 30;
    const SENSOR_PITCH_TRANSITION_END_DOWN = -25; // Volvemos a -25 para prueba
    const MAX_SENSOR_PITCH_FORCE = GRAVITY_BASE * 1.8; // Fuerza que el sensor puede AÑADIR/RESTAR

    const WATER_FRICTION_COEFF = 0.028;
    const BOUNCE_FACTOR = -0.2;
    const RING_COLLISION_BOUNCE = 0.5;
    const PEG_COLLISION_BOUNCE_FACTOR = -0.3;
    const PEG_STROKE_COLOR = '#505050';
    const PEG_FILL_COLOR = '#808080';
    const PEG_VISUAL_WIDTH = 10;
    const RING_OUTLINE_COLOR = 'rgba(0,0,0,0.85)';
    const RING_OUTLINE_WIDTH_ON_SCREEN = 1.0;
    const FLAT_RING_VIEW_THICKNESS = 7;
    const GROUND_FLAT_RING_THICKNESS = 5;
    const MAX_TOTAL_RINGS_ON_SCREEN = MAX_RINGS_PER_PEG * TOTAL_COLORS;

    const LANDED_RING_JET_EFFECT_MULTIPLIER = 0.25;
    const LANDED_RING_MAX_DISPLACEMENT_X = PEG_VISUAL_WIDTH * 0.5;
    const LANDED_RING_RETURN_TO_CENTER_SPEED = 0.8;
    const PEG_COMPLETED_FLASH_DURATION_FRAMES = 90;
    const PEG_COMPLETED_FLASH_INTERVAL_FRAMES = 8;
    const PEG_COMPLETED_FLASH_COLOR = '#FFFFFF';
    const LANDED_RING_WEIGHT_INCREASE_FACTOR = 4.5;

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

    let leftJetInputActive = false;
    let rightJetInputActive = false;
    let leftJetPressure = 0;
    let rightJetPressure = 0;
    let tiltLeftActive = false;
    let tiltRightActive = false;
    let sensorTiltX = 0;
    let sensorTiltY = 0;
    let sensorAvailable = false;
    let sensorActive = false;

    const KEY_LEFT_ARROW = 'ArrowLeft';
    const KEY_RIGHT_ARROW = 'ArrowRight';
    const KEY_JET_LEFT = 'KeyA';
    const KEY_JET_RIGHT = 'KeyD';

    function createRing(x, y, color) {
        let speedMagnitude = 0.08 + Math.random() * 0.12;
        return {
            x: x, y: y,
            vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
            color: color, originalColor: color,
            landed: false, pegIndex: -1, landedOrder: -1,
            basePoints: 25, awardedPoints: 0, colorStreakBonusGiven: 0,
            rotationAngle: Math.random() * Math.PI * 2,
            initialRotationSpeed: (Math.random() < 0.5 ? -1 : 1) * speedMagnitude,
            rotationSpeed: 0,
            zRotationAngle: (Math.random() - 0.5) * 0.3,
            zRotationSpeed: (Math.random() - 0.5) * 0.03,
            isFlat: false,
            isSlidingOnPeg: false,
            finalYonPeg: 0,
            isFlashing: false,
            flashTimer: 0,
            currentFlashColor: null,
            flashToggleCounter: 0
        };
    }

    function initStandardPegs() {
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
                landedRings: [],
                isFullAndScored: false,
                isMonoColor: false,
                monoColorValue: null,
                fullBonusAwarded: 0,
                monoBonusAwarded: 0
            });
        });
    }

    function initGame() {
        score = 0;
        baseScoreFromRings = 0;
        bonusScoreFromColorStreak = 0;
        bonusScoreFromFullPegsGeneral = 0;
        bonusScoreFromMonoColorPegsSpecific = 0;
        allPegsCompletedBonusFactor = 1;
        masterBonusFactor = 1;
        scorePulseActive = false;
        scorePulseTimer = 0;
        currentScoreDisplaySize = SCORE_NORMAL_SIZE;
        leftJetPressure = 0;
        rightJetPressure = 0;
        tiltLeftActive = false;
        tiltRightActive = false;
        sensorTiltX = 0;
        sensorTiltY = 0;
        floatingScores = [];
        jetParticles = [];
        landedRingsCount = 0;
        gameOver = false;
        hideEndGameScreen();
        if (startScreen) startScreen.style.display = 'none';
        if (howToPlayScreen && howToPlayScreen.style.display !== 'none') howToPlayScreen.style.display = 'none';
        setPersistentInstructions();
        initStandardPegs();
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
        if (typeof performance !== 'undefined' && performance.now) {
            lastTime = performance.now();
        } else {
            lastTime = Date.now();
        }
    }

    function drawRing(ring) {
        ctx.save();
        ctx.translate(ring.x, ring.y);

        if ((!ring.isFlat || ring.landed) && !ring.isSlidingOnPeg) {
            ctx.rotate(ring.zRotationAngle);
        }

        const outerRadius = RING_OUTER_RADIUS;
        const innerRadiusMaterial = RING_OUTER_RADIUS - RING_VISUAL_THICKNESS;
        let displayColor = ring.color;

        if (ring.isFlashing && ring.flashTimer > 0) {
            ring.flashTimer--;
            ring.flashToggleCounter++;
            if (ring.flashToggleCounter >= PEG_COMPLETED_FLASH_INTERVAL_FRAMES) {
                ring.currentFlashColor = (ring.currentFlashColor === PEG_COMPLETED_FLASH_COLOR) ? ring.originalColor : PEG_COMPLETED_FLASH_COLOR;
                ring.flashToggleCounter = 0;
            }
            displayColor = ring.currentFlashColor || PEG_COMPLETED_FLASH_COLOR;

            if (ring.flashTimer <= 0) {
                ring.isFlashing = false;
                displayColor = ring.originalColor;
            }
        } else if (ring.isFlashing && ring.flashTimer <=0) {
            ring.isFlashing = false;
            displayColor = ring.originalColor;
        }


        if (ring.isFlat) {
            const currentFlatThickness = ring.landed ? FLAT_RING_VIEW_THICKNESS : GROUND_FLAT_RING_THICKNESS;
            const halfFlatViewThickness = currentFlatThickness / 2;
            const flatDrawWidth = outerRadius * 2;

            ctx.fillStyle = RING_OUTLINE_COLOR;
            ctx.fillRect(
                -flatDrawWidth / 2 - RING_OUTLINE_WIDTH_ON_SCREEN,
                -halfFlatViewThickness - RING_OUTLINE_WIDTH_ON_SCREEN,
                flatDrawWidth + (RING_OUTLINE_WIDTH_ON_SCREEN * 2),
                currentFlatThickness + (RING_OUTLINE_WIDTH_ON_SCREEN * 2)
            );
            ctx.fillStyle = displayColor;
            ctx.fillRect(
                -flatDrawWidth / 2,
                -halfFlatViewThickness,
                flatDrawWidth,
                currentFlatThickness
            );
        } else {
            const scaleYValue = Math.abs(Math.cos(ring.rotationAngle));
            const effectiveScaleY = Math.max(0.08, scaleYValue);

            if (effectiveScaleY < 0.24 && !ring.landed && !ring.isSlidingOnPeg) {
                const tempFlatThickness = GROUND_FLAT_RING_THICKNESS * 0.75;
                const halfFlatViewThickness = tempFlatThickness / 2;
                const flatDrawWidth = outerRadius * 2;

                ctx.fillStyle = RING_OUTLINE_COLOR;
                 ctx.fillRect(
                    -flatDrawWidth / 2 - RING_OUTLINE_WIDTH_ON_SCREEN,
                    -halfFlatViewThickness - RING_OUTLINE_WIDTH_ON_SCREEN,
                    flatDrawWidth + (RING_OUTLINE_WIDTH_ON_SCREEN * 2),
                    tempFlatThickness + (RING_OUTLINE_WIDTH_ON_SCREEN * 2)
                );
                ctx.fillStyle = displayColor;
                ctx.fillRect(
                    -flatDrawWidth / 2,
                    -halfFlatViewThickness,
                    flatDrawWidth,
                    tempFlatThickness
                );

            } else {
                ctx.scale(1, effectiveScaleY);
                const outlineScaledOffset = RING_OUTLINE_WIDTH_ON_SCREEN / effectiveScaleY;

                ctx.beginPath();
                ctx.arc(0, 0, outerRadius + outlineScaledOffset, 0, Math.PI * 2, false);
                ctx.arc(0, 0, Math.max(0, innerRadiusMaterial - outlineScaledOffset), 0, Math.PI * 2, true);
                ctx.fillStyle = RING_OUTLINE_COLOR;
                ctx.fill();

                ctx.beginPath();
                ctx.arc(0, 0, outerRadius, 0, Math.PI * 2, false);
                ctx.arc(0, 0, innerRadiusMaterial, 0, Math.PI * 2, true);
                ctx.fillStyle = displayColor;
                ctx.fill();
            }
        }
        ctx.restore();
    }

    function drawAllPegsAndLandedRings() {
        if(!pegs) return;
        pegs.forEach(peg => {
            ctx.fillStyle = PEG_FILL_COLOR;
            ctx.strokeStyle = PEG_STROKE_COLOR;
            ctx.lineWidth = 2;
            const pegTopY = peg.bottomY - peg.height;
            ctx.beginPath();
            ctx.roundRect(peg.x - PEG_VISUAL_WIDTH / 2, pegTopY, PEG_VISUAL_WIDTH, peg.height, [PEG_VISUAL_WIDTH/3, PEG_VISUAL_WIDTH/3, 0, 0]);
            ctx.fill();
            ctx.stroke();
            peg.landedRings.forEach(drawRing);
        });
    }

    function drawScoreOnCanvas() {
        if (startScreen && startScreen.style.display === 'flex' && !gameRunning) return;
        ctx.save();
        ctx.font = `bold ${currentScoreDisplaySize}px Arial`;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowBlur = 3;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        if (scorePulseActive) {
            ctx.fillStyle = '#FFD700';
        } else {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        }
        ctx.fillText(`Score: ${score}`, gameScreenWidth - 10, 10);
        ctx.restore();
    }

    instructionTimeout = null;
    function showMessage(text, duration = 3000, isInstruction = false) {
        if (instructionTimeout && !isInstruction) {
            clearTimeout(instructionTimeout);
        }
        if(messageBoard) {
            messageBoard.textContent = text;
            messageBoard.style.opacity = 1;
            messageBoard.style.display = 'block';
        }

        if (!isInstruction) {
            instructionTimeout = setTimeout(() => {
                if(messageBoard) {
                    messageBoard.style.opacity = 0;
                    setTimeout(() => {
                        if (messageBoard && messageBoard.style.display !== 'none') messageBoard.style.display = 'none';
                    }, 300);
                }
                instructionTimeout = null;
            }, duration);
        }
    }
    function setPersistentInstructions() {
        if (!messageBoard) return;
        let instructionMessage = "PC: Flechas=Inclinar, A/D=Jets.";
        if (sensorAvailable) {
            if (sensorActive) {
                instructionMessage = "Móvil: Sensor ACTIVO. ¡Inclina tu dispositivo!";
            } else {
                instructionMessage = "PC: Flechas=Inclinar, A/D=Jets. Móvil: Botones/Activar SENSOR.";
            }
        } else {
            instructionMessage = "PC: Flechas=Inclinar, A/D=Jets. Móvil: Botones TILT (Sensor no disp.)";
        }
        messageBoard.textContent = instructionMessage;
        messageBoard.style.opacity = 1;
    }

    function updateScore(pointsToAdd, message = "") {
        if (pointsToAdd > 0) {
            score += pointsToAdd;
            scorePulseActive = true;
            scorePulseTimer = SCORE_PULSE_DURATION;
            currentScoreDisplaySize = SCORE_PULSE_SIZE;
        } else if (pointsToAdd < 0) {
            score += pointsToAdd;
        }
        if (message && message !== "") {
            showMessage(message, 2500);
        }
         if (score < 0) score = 0;
    }

    function checkAndApplyBonuses(landedRing, peg) {
        let pointsForThisSpecificRing = landedRing.basePoints;
        let bonusMessageText = "";
        landedRing.colorStreakBonusGiven = 0;
        baseScoreFromRings += landedRing.basePoints;

        if ('vibrate' in navigator) { navigator.vibrate(75); }

        let mightBecomeMonoColor = true;
        if(peg.landedRings.length === MAX_RINGS_PER_PEG) {
            const firstColorInPeg = peg.landedRings[0].color;
            for(const r of peg.landedRings) {
                if (r.color !== firstColorInPeg) {
                    mightBecomeMonoColor = false;
                    break;
                }
            }
        } else {
            mightBecomeMonoColor = false;
        }

        if (peg.landedRings.length > 1 && !mightBecomeMonoColor && landedRing.landedOrder > 0 ) {
            const previousRingInStack = peg.landedRings[landedRing.landedOrder -1];
            if (previousRingInStack && previousRingInStack.color === landedRing.color) {
                let colorStreakBonus = landedRing.basePoints;
                pointsForThisSpecificRing += colorStreakBonus;
                bonusScoreFromColorStreak += colorStreakBonus;
                landedRing.colorStreakBonusGiven = colorStreakBonus;
                bonusMessageText += ` Color x2!`;
            }
        }

        landedRing.awardedPoints = pointsForThisSpecificRing;
        createFloatingScore(landedRing.x, landedRing.finalYonPeg - RING_OUTER_RADIUS, `+${pointsForThisSpecificRing}${bonusMessageText}`, landedRing.color);
        updateScore(pointsForThisSpecificRing);

        landedRingsCount++;

        if (peg.landedRings.length === MAX_RINGS_PER_PEG && !peg.isFullAndScored) {
            peg.isFullAndScored = true;
            let isCurrentPegMonoColor = true;
            const firstLandedColor = peg.landedRings[0].color;
            for (let k = 1; k < MAX_RINGS_PER_PEG; k++) {
                if (peg.landedRings[k].color !== firstLandedColor) {
                    isCurrentPegMonoColor = false;
                    break;
                }
            }

            let additionalBonusScore = 0;
            let pegCompletionMessage = "";
            peg.fullBonusAwarded = 0;
            peg.monoBonusAwarded = 0;

            if (isCurrentPegMonoColor) {
                peg.isMonoColor = true;
                peg.monoColorValue = firstLandedColor;
                let currentPegAwardedPointsSum = 0;
                peg.landedRings.forEach(r => currentPegAwardedPointsSum += r.awardedPoints);
                let targetMonoScore = (landedRing.basePoints * MAX_RINGS_PER_PEG) * 10;
                additionalBonusScore = targetMonoScore - currentPegAwardedPointsSum;
                if(additionalBonusScore < 0) additionalBonusScore = 0;
                bonusScoreFromMonoColorPegsSpecific += additionalBonusScore;
                peg.monoBonusAwarded = additionalBonusScore;
                pegCompletionMessage = `PALO MONOCOLOR! (x10)`;
            } else {
                let pegTotalAwardedPoints = 0;
                peg.landedRings.forEach(r => {
                    pegTotalAwardedPoints += r.awardedPoints;
                });
                additionalBonusScore = pegTotalAwardedPoints * 3;
                bonusScoreFromFullPegsGeneral += additionalBonusScore;
                peg.fullBonusAwarded = additionalBonusScore;
                pegCompletionMessage = `PALO LLENO! (x4)`;
            }

            if(additionalBonusScore > 0) updateScore(additionalBonusScore, pegCompletionMessage);

            peg.landedRings.forEach(r => {
                r.isFlashing = true;
                r.flashTimer = PEG_COMPLETED_FLASH_DURATION_FRAMES;
                r.currentFlashColor = PEG_COMPLETED_FLASH_COLOR;
                r.flashToggleCounter = 0;
            });

            checkAllPegsCompleted();
        }
    }

    function handleRingEscape(ring, peg) {
        console.log(`Ring ${ring.originalColor} (ID: ${rings.indexOf(ring)}) escapó del peg ${peg.id}. Puntos previos: ${ring.awardedPoints}, Streak: ${ring.colorStreakBonusGiven}`);
        score -= ring.awardedPoints;
        baseScoreFromRings -= ring.basePoints;
        if (ring.colorStreakBonusGiven > 0) {
            bonusScoreFromColorStreak -= ring.colorStreakBonusGiven;
        }
        createFloatingScore(ring.x, ring.y, `-${ring.awardedPoints} Escapó!`, '#FF6347');

        const ringIndexInPeg = peg.landedRings.indexOf(ring);
        if (ringIndexInPeg > -1) {
            peg.landedRings.splice(ringIndexInPeg, 1);
        }

        peg.landedRings.forEach((remainingRing, newIndex) => {
            remainingRing.landedOrder = newIndex;
            const newFinalYonPeg = (peg.bottomY - FLAT_RING_VIEW_THICKNESS / 2) - (newIndex * FLAT_RING_VIEW_THICKNESS);
            remainingRing.finalYonPeg = newFinalYonPeg;
        });

        landedRingsCount--;

        let pegWasPreviouslyFullAndScored = peg.isFullAndScored;
        if (pegWasPreviouslyFullAndScored) {
            peg.isFullAndScored = false;
            peg.landedRings.forEach(r => {
                r.isFlashing = false;
                r.color = r.originalColor;
            });

            if (peg.isMonoColor) {
                console.log(`Peg ${peg.id} ya no es monocolor. Reversando bono: ${peg.monoBonusAwarded}`);
                if (peg.monoBonusAwarded > 0) {
                    score -= peg.monoBonusAwarded;
                    bonusScoreFromMonoColorPegsSpecific -= peg.monoBonusAwarded;
                    peg.monoBonusAwarded = 0;
                }
                peg.isMonoColor = false;
                peg.monoColorValue = null;
            } else {
                console.log(`Peg ${peg.id} ya no está lleno. Reversando bono: ${peg.fullBonusAwarded}`);
                if (peg.fullBonusAwarded > 0) {
                    score -= peg.fullBonusAwarded;
                    bonusScoreFromFullPegsGeneral -= peg.fullBonusAwarded;
                    peg.fullBonusAwarded = 0;
                }
            }
        }

        ring.landed = false;
        ring.pegIndex = -1;
        ring.landedOrder = -1;
        ring.isSlidingOnPeg = false;
        ring.finalYonPeg = 0;
        ring.awardedPoints = 0;
        ring.colorStreakBonusGiven = 0;
        ring.isFlashing = false;
        ring.color = ring.originalColor;
        ring.isFlat = false;

        ring.vx = (Math.random() - 0.5) * 2.5;
        ring.vy = - (BASE_JET_STRENGTH * 0.3 + Math.random() * 0.5);
        ring.rotationSpeed = ring.initialRotationSpeed * (Math.random() < 0.5 ? 1.2 : -1.2);
        ring.zRotationSpeed = (Math.random() - 0.5) * 0.05;

        if (pegWasPreviouslyFullAndScored) {
            const allStillFull = pegs.every(p => p.isFullAndScored);
            if (!allStillFull) {
                if (allPegsCompletedBonusFactor > 1) {
                    allPegsCompletedBonusFactor = 1;
                    showMessage("Palo roto. ¡Bono x2 perdido!", 2500);
                }
                if (masterBonusFactor > 1) {
                    masterBonusFactor = 1;
                    showMessage("Palo roto. ¡BONO MAESTRO perdido!", 3000);
                }
            }
        }
        if (score < 0) score = 0;
    }


    function checkAllPegsCompleted() {
        if (allPegsCompletedBonusFactor > 1 && masterBonusFactor > 1) return;
        if(!pegs) return;
        const allPegsNowFull = pegs.every(p => p.isFullAndScored);

        if (allPegsNowFull && allPegsCompletedBonusFactor === 1) {
            allPegsCompletedBonusFactor = 2;
            showMessage("TODOS LOS PALOS LLENOS! Puntos x2!", 3500, true);
            let monoColorPegCount = 0;
            const usedColorsForMaster = new Set();
            pegs.forEach(p => {
                if (p.isMonoColor) {
                    monoColorPegCount++;
                    usedColorsForMaster.add(p.monoColorValue);
                }
            });
            if (monoColorPegCount === TOTAL_COLORS && usedColorsForMaster.size === TOTAL_COLORS) {
                masterBonusFactor = 100;
                showMessage("¡¡BONO MAESTRO!! Puntuación Final x100!", 5000, true);
            }
            triggerGameOver();
        }
    }

    function triggerGameOver() {
        if (gameOver) return;
        gameOver = true;
        gameRunning = false;
        let finalScoreCalculation = baseScoreFromRings + bonusScoreFromColorStreak + bonusScoreFromFullPegsGeneral + bonusScoreFromMonoColorPegsSpecific;

        if(masterBonusFactor > 1) {
            let scoreBeforeAnyFinalMultiplier = baseScoreFromRings + bonusScoreFromColorStreak + bonusScoreFromFullPegsGeneral + bonusScoreFromMonoColorPegsSpecific;
            finalScoreCalculation = scoreBeforeAnyFinalMultiplier * masterBonusFactor;
        } else if(allPegsCompletedBonusFactor > 1) {
            finalScoreCalculation *= allPegsCompletedBonusFactor;
        }
        score = Math.round(finalScoreCalculation);
        if (score < 0) score = 0;

        if (gameLoopId) {
            cancelAnimationFrame(gameLoopId);
            gameLoopId = null;
        }
        showEndGameScreen();
    }
    function showEndGameScreen() {
        const existingScreen = document.getElementById('endGameScreen');
        if (existingScreen) existingScreen.parentNode.removeChild(existingScreen);

        const screenDOM = document.createElement('div');
        screenDOM.id = 'endGameScreen';
        screenDOM.classList.add('visible');

        let summaryHTML = `<h2>¡Juego Terminado!</h2><p>Puntos Base Aros: ${baseScoreFromRings}</p>`;
        if (bonusScoreFromColorStreak > 0) summaryHTML += `<p>Bono Racha Color: +${bonusScoreFromColorStreak}</p>`;
        if (bonusScoreFromFullPegsGeneral > 0) summaryHTML += `<p>Bono Palos Llenos (Normal): +${bonusScoreFromFullPegsGeneral}</p>`;
        if (bonusScoreFromMonoColorPegsSpecific > 0) summaryHTML += `<p>Bono Palos Monocolor: +${bonusScoreFromMonoColorPegsSpecific}</p>`;
        let subTotalBeforeMultipliers = baseScoreFromRings + bonusScoreFromColorStreak + bonusScoreFromFullPegsGeneral + bonusScoreFromMonoColorPegsSpecific;
        if (subTotalBeforeMultipliers < 0) subTotalBeforeMultipliers = 0;


        if (masterBonusFactor > 1) {
            summaryHTML += `<p style="color: gold; font-weight: bold;">¡BONO MAESTRO!: x${masterBonusFactor} (sobre ${subTotalBeforeMultipliers})</p>`;
        } else if (allPegsCompletedBonusFactor > 1) {
             summaryHTML += `<p style="color: lightblue;">Bono Todos Palos Llenos: x${allPegsCompletedBonusFactor} (sobre ${subTotalBeforeMultipliers})</p>`;
        }
        let finalDisplayScore = score;
        if (finalDisplayScore < 0) finalDisplayScore = 0;
        summaryHTML += `<h3 style="margin-top: 20px; color: #FFD700;">PUNTUACIÓN FINAL: ${finalDisplayScore}</h3>`;

        const playAgainButton = document.createElement('button');
        playAgainButton.textContent = 'Jugar de Nuevo';
        playAgainButton.onclick = () => {
            hideEndGameScreen();
            if(startScreen) startScreen.style.display = 'flex';
            if(howToPlayButton) howToPlayButton.style.display = 'inline-block';
            gameRunning = false;
            score = 0;
            currentScoreDisplaySize = SCORE_NORMAL_SIZE;
            if (enableSensorButton && sensorAvailable) {
                 enableSensorButton.style.display = 'inline-block';
                 enableSensorButton.disabled = false;
                 enableSensorButton.textContent = "SENSOR";
            }
            if (tiltLeftButton && (!sensorActive || !sensorAvailable) ) tiltLeftButton.style.display = 'flex';
            if(tiltRightButton && (!sensorActive || !sensorAvailable) ) tiltRightButton.style.display = 'flex';
            sensorActive = false; sensorTiltX = 0; sensorTiltY = 0;
            if(messageBoard) setPersistentInstructions();
            if (!gameLoopId) {
                if (typeof performance !== 'undefined' && performance.now) { lastTime = performance.now(); }
                else { lastTime = Date.now(); }
                gameLoopId = requestAnimationFrame(gameLoop);
            }
        };

        screenDOM.innerHTML = summaryHTML;
        screenDOM.appendChild(playAgainButton);
        if(document.body) document.body.appendChild(screenDOM);
    }
    function hideEndGameScreen() {
        const screenDOM = document.getElementById('endGameScreen');
        if (screenDOM) {
            screenDOM.classList.remove('visible');
            setTimeout(() => {
                if (screenDOM && screenDOM.parentNode) {
                    screenDOM.parentNode.removeChild(screenDOM);
                }
            }, 500);
        }
    }

    function hexToRgb(hex) {
        let r = 0, g = 0, b = 0;
        if (!hex || typeof hex !== 'string') return { r: 255, g: 255, b: 255 };
        if (hex.length == 4) {
            r = "0x" + hex[1] + hex[1]; g = "0x" + hex[2] + hex[2]; b = "0x" + hex[3] + hex[3];
        } else if (hex.length == 7) {
            r = "0x" + hex[1] + hex[2]; g = "0x" + hex[3] + hex[4]; b = "0x" + hex[5] + hex[6];
        } else {
            return { r: 255, g: 255, b: 255 };
        }
        return { r: +r, g: +g, b: +b };
    }
    function createFloatingScore(x, y, text, color = "#FFFFFF", durationFrames = 90, upwardSpeed = 0.8) {
        floatingScores.push({
            x: x, y: y, text: text, color: color,
            opacity: 1, vy: -upwardSpeed, life: durationFrames, initialLife: durationFrames,
            currentFontSize: 20, maxFontSize: 30
        });
    }
    function updateAndDrawFloatingScores(dt) {
        const accelerationFactor = dt * TARGET_FPS;
        ctx.save();
        ctx.textAlign = "center";
        ctx.shadowColor = "rgba(0,0,0,0.6)";
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        for (let i = floatingScores.length - 1; i >= 0; i--) {
            const fs = floatingScores[i];
            fs.y += fs.vy * accelerationFactor;
            fs.life -= accelerationFactor;
            const progress = 1 - (fs.life / fs.initialLife);
            fs.currentFontSize = 20 + (fs.maxFontSize - 20) * Math.sin(progress * Math.PI * 0.8);
            if(fs.currentFontSize < 18) fs.currentFontSize = 18;
            fs.opacity = (fs.life / fs.initialLife);
            if (fs.opacity < 0) fs.opacity = 0;

            if (fs.life <= 0) {
                floatingScores.splice(i, 1);
            } else {
                ctx.font = `bold ${Math.round(fs.currentFontSize)}px Arial`;
                const rgb = hexToRgb(fs.color);
                ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${fs.opacity})`;
                ctx.fillText(fs.text, fs.x, fs.y);
            }
        }
        ctx.restore();
    }

    function createJetParticle(xSide, strength) {
        if (jetParticles.length >= MAX_JET_PARTICLES) { return; }
        const isLeft = xSide === -1;
        const particleOriginX = isLeft ? gameScreenWidth * 0.22 : gameScreenWidth * 0.78;
        const particle = {
            x: particleOriginX + (Math.random() - 0.5) * 15,
            y: gameScreenHeight - 25 - Math.random() * 10,
            vx: (Math.random() - 0.5) * 2 + (isLeft ? 0.8 : -0.8) * (strength*2.5),
            vy: -(3.5 + Math.random() * 3.5 + strength * 5.5),
            radius: 2.0 + Math.random() * 2.0 + strength * 3.0,
            opacity: 0.45 + strength * 0.5,
            life: 30 + Math.random() * 25 + strength * 30,
            color: `rgba(220, 240, 255, ${0.25 + Math.random() * 0.3})`
        };
        jetParticles.push(particle);
    }
    function updateAndDrawJetParticles(dt) {
        const accelerationFactor = dt * TARGET_FPS;
        ctx.save();
        for (let i = jetParticles.length - 1; i >= 0; i--) {
            const p = jetParticles[i];
            p.x += p.vx * accelerationFactor;
            p.y += p.vy * accelerationFactor;
            p.vy += GRAVITY_BASE * 0.2 * accelerationFactor;
            p.life -= accelerationFactor;
            const baseOpacityMatch = p.color.match(/rgba\([\d\s,]+([\d.]+)\)/);
            const baseOpacity = baseOpacityMatch ? parseFloat(baseOpacityMatch[1]) : 0.3;
            p.opacity = baseOpacity * (p.life / (30 + 25 + 30));
            if (p.opacity < 0) p.opacity = 0;
            p.radius *= (1 - 0.020 * accelerationFactor);

            if (p.opacity <= 0 || p.radius <= 0.4 || p.life <= 0 || p.y < -p.radius || p.y > gameScreenHeight + p.radius) {
                jetParticles.splice(i, 1);
            } else {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                const colorParts = p.color.substring(p.color.indexOf('(') + 1, p.color.lastIndexOf(',')).trim();
                ctx.fillStyle = `rgba(${colorParts}, ${p.opacity.toFixed(2)})`;
                ctx.fill();
            }
        }
        ctx.restore();
    }


    function updateRings(actualTiltForceToApply, dt) {
        const accelerationFactor = dt * TARGET_FPS;

        rings.forEach(ring => {
            if (ring.isSlidingOnPeg) {
                const slideSpeedValue = 4.0 * accelerationFactor;
                if (ring.y < ring.finalYonPeg) {
                    ring.y += slideSpeedValue;
                    if (ring.y >= ring.finalYonPeg) {
                        ring.y = ring.finalYonPeg;
                        ring.isSlidingOnPeg = false; ring.vy = 0;
                    }
                } else {
                    ring.y -= slideSpeedValue;
                    if (ring.y <= ring.finalYonPeg) {
                        ring.y = ring.finalYonPeg;
                        ring.isSlidingOnPeg = false; ring.vy = 0;
                    }
                }
                ring.isFlat = true; ring.rotationAngle = Math.PI / 2; ring.rotationSpeed = 0;
                ring.zRotationAngle = 0; ring.zRotationSpeed = 0; ring.vx = 0;
                return;
            }

            let prevRingX = ring.x;
            let prevRingY = ring.y;

            ring.vy += GRAVITY_BASE * accelerationFactor;

            const frictionRate = 1 - WATER_FRICTION_COEFF;
            ring.vx *= Math.pow(frictionRate, accelerationFactor);
            ring.vy *= Math.pow(frictionRate, accelerationFactor);

            let forceAppliedToRingThisFrame = false;

            [[leftJetPressure, 0.22, 1], [rightJetPressure, 0.78, -1]].forEach(([pressure, jetXFactor, horizontalDir]) => {
                if (pressure > 0.01) {
                    let currentJetForceVertical = BASE_JET_STRENGTH * pressure;
                    let currentJetForceHorizontal = JET_HORIZONTAL_INFLUENCE_RATIO * currentJetForceVertical;
                    if (ring.landed) {
                        currentJetForceVertical *= (LANDED_RING_JET_EFFECT_MULTIPLIER / LANDED_RING_WEIGHT_INCREASE_FACTOR);
                        currentJetForceHorizontal *= (LANDED_RING_JET_EFFECT_MULTIPLIER / LANDED_RING_WEIGHT_INCREASE_FACTOR);
                    }
                    let jetSourceX = gameScreenWidth * jetXFactor;
                    const distanceX = ring.x - jetSourceX;
                    let proximityFactorY = 0;
                    const yPosInJetEffect = (ring.y - (gameScreenHeight - JET_EFFECT_RADIUS_Y));
                    if (yPosInJetEffect > 0 && ring.y < gameScreenHeight) {
                        proximityFactorY = 1 - Math.pow( (JET_EFFECT_RADIUS_Y - yPosInJetEffect) / JET_EFFECT_RADIUS_Y, JET_VERTICAL_FALLOFF_POWER);
                        proximityFactorY = Math.max(0.05, Math.min(1, proximityFactorY));
                    }
                    if (Math.abs(distanceX) < JET_EFFECT_RADIUS_X && proximityFactorY > 0.01) {
                        const proximityFactorX = 1 - (Math.abs(distanceX) / JET_EFFECT_RADIUS_X);
                        const totalProximityFactor = proximityFactorX * proximityFactorY;
                        if (totalProximityFactor > 0) {
                            ring.vy -= (currentJetForceVertical * totalProximityFactor) * accelerationFactor;
                            ring.vx += (currentJetForceHorizontal * totalProximityFactor * horizontalDir) * accelerationFactor;
                            forceAppliedToRingThisFrame = true;
                        }
                    }
                }
            });

            if (actualTiltForceToApply !== 0) {
                let tiltEffectMultiplier = 1;
                if (ring.landed) {
                    tiltEffectMultiplier = (LANDED_RING_JET_EFFECT_MULTIPLIER / LANDED_RING_WEIGHT_INCREASE_FACTOR);
                }
                ring.vx += actualTiltForceToApply * accelerationFactor * tiltEffectMultiplier;
                forceAppliedToRingThisFrame = true;
            }

            if (sensorActive && sensorAvailable && Math.abs(sensorTiltY) > 0.001) { // Umbral muy pequeño para reaccionar
                let forceYFromSensor = sensorTiltY * MAX_SENSOR_PITCH_FORCE;
                let pitchMultiplier = 1;
                if (ring.landed && !ring.isSlidingOnPeg) {
                    pitchMultiplier = (LANDED_RING_JET_EFFECT_MULTIPLIER / LANDED_RING_WEIGHT_INCREASE_FACTOR);
                }
                ring.vy += forceYFromSensor * accelerationFactor * pitchMultiplier;
                forceAppliedToRingThisFrame = true;
            }


            ring.x += ring.vx * accelerationFactor;
            ring.y += ring.vy * accelerationFactor;

            if (ring.landed && !ring.isSlidingOnPeg) {
                const peg = pegs[ring.pegIndex];
                if (peg) {
                    const pegTop = peg.bottomY - peg.height;
                    if (ring.y < pegTop - RING_OUTER_RADIUS * 0.5) {
                        handleRingEscape(ring, peg);
                        return;
                    }
                    let idealX = peg.x;
                    const displacementX = ring.x - idealX;
                    if (Math.abs(displacementX) > LANDED_RING_MAX_DISPLACEMENT_X) {
                        ring.x = idealX + LANDED_RING_MAX_DISPLACEMENT_X * Math.sign(displacementX);
                         ring.vx = 0;
                    } else if (Math.abs(ring.vx) < 0.15 && Math.abs(displacementX) > 0.5 && !forceAppliedToRingThisFrame) {
                        ring.x += (idealX - ring.x) * LANDED_RING_RETURN_TO_CENTER_SPEED * 0.3 * accelerationFactor;
                        if (Math.abs(ring.x - idealX) < 0.5) { ring.x = idealX; ring.vx = 0; }
                    } else if (Math.abs(ring.vx) < 0.05 && Math.abs(displacementX) <= 0.5) {
                        ring.x = idealX; ring.vx = 0;
                    }

                    // CORRECCIÓN BUG APILAMIENTO Y LÍMITES
                    // 1. Límite inferior es su propia finalYonPeg (no puede atravesar la base del apilamiento)
                    if (ring.y > ring.finalYonPeg) {
                        ring.y = ring.finalYonPeg;
                        if (ring.vy > 0) ring.vy = 0; // Detener si iba más abajo
                    }

                    // 2. Límite superior: no puede pasar al aro de arriba (si existe)
                    if (ring.landedOrder < peg.landedRings.length - 1) { // Si tiene un aro encima
                        const ringAbove = peg.landedRings[ring.landedOrder + 1];
                        // El "techo" para este aro es la base del aro de arriba
                        const ceilingForThisRing = ringAbove.finalYonPeg + FLAT_RING_VIEW_THICKNESS;
                        if (ring.y < ceilingForThisRing) {
                            ring.y = ceilingForThisRing;
                            if (ring.vy < 0) ring.vy = 0; // Detener si intentaba subir más
                        }
                    }
                    // 3. El aro de más abajo no puede ser empujado por debajo de su finalYonPeg
                    // (Ya cubierto por ring.y > ring.finalYonPeg, pero es bueno tenerlo en mente)


                    // Suave retorno a finalYonPeg si no hay fuerzas significativas y no está ya ahí
                     const significantSensorForceActive = sensorActive && Math.abs(sensorTiltY * MAX_SENSOR_PITCH_FORCE) > GRAVITY_BASE * 0.2;
                     const isBeingPushedByJet = forceAppliedToRingThisFrame && (leftJetPressure > 0.1 || rightJetPressure > 0.1); // Más específico para chorros

                    if (!significantSensorForceActive && !isBeingPushedByJet && Math.abs(ring.y - ring.finalYonPeg) > 0.2) {
                         const dyToFinal = ring.finalYonPeg - ring.y;
                         ring.y += dyToFinal * 0.4 * accelerationFactor;
                         if (Math.abs(ring.y - ring.finalYonPeg) < 0.2) {
                            ring.y = ring.finalYonPeg;
                            // No resetear vy aquí necesariamente, para permitir asentamiento suave
                         }
                    }
                }
                ring.isFlat = true; ring.rotationAngle = Math.PI / 2; ring.rotationSpeed = 0;
                ring.zRotationAngle = 0; ring.zRotationSpeed = 0;
            }


            const isOnGroundAndEffectivelySlow = ring.y + RING_OUTER_RADIUS >= gameScreenHeight - (GROUND_FLAT_RING_THICKNESS / 2 + RING_OUTLINE_WIDTH_ON_SCREEN + 1) && Math.abs(ring.vy) < 0.15 && Math.abs(ring.vx) < 0.15;
            if (ring.isFlat && forceAppliedToRingThisFrame && !isOnGroundAndEffectivelySlow && !ring.landed) {
                ring.isFlat = false;
                if (ring.rotationSpeed === 0) {
                    ring.rotationSpeed = ring.initialRotationSpeed * (Math.random() < 0.5 ? 0.7 : -0.7) * (0.7 + Math.random() * 0.6) ;
                }
                if (ring.zRotationSpeed === 0 && forceAppliedToRingThisFrame) {
                    ring.zRotationSpeed = (Math.random() - 0.5) * 0.03;
                }
            } else if (!ring.landed && isOnGroundAndEffectivelySlow && !forceAppliedToRingThisFrame) {
                ring.isFlat = true;
                ring.zRotationSpeed = 0;
            }

            if (!ring.isFlat && !ring.landed) {
                ring.rotationAngle += ring.rotationSpeed * accelerationFactor;
                if (ring.rotationAngle > Math.PI * 2) ring.rotationAngle -= Math.PI * 2;
                if (ring.rotationAngle < 0) ring.rotationAngle += Math.PI * 2;
                const rotationalFrictionRate = 1 - 0.01;
                ring.rotationSpeed *= Math.pow(rotationalFrictionRate, accelerationFactor);
                if (Math.abs(ring.rotationSpeed) < 0.005 / (accelerationFactor > 0 ? accelerationFactor : 1) ) ring.rotationSpeed = 0;
            } else if (!ring.landed) {
                ring.rotationAngle = Math.PI / 2;
                ring.rotationSpeed = 0;
            }

            if (!ring.landed) {
                ring.zRotationAngle += ring.zRotationSpeed * accelerationFactor;
                if (ring.zRotationAngle > Math.PI * 2) ring.zRotationAngle -= Math.PI * 2;
                else if (ring.zRotationAngle < 0) ring.zRotationAngle += Math.PI * 2;
                ring.zRotationSpeed *= Math.pow((1 - 0.025), accelerationFactor);
                if (Math.abs(ring.zRotationSpeed) < 0.001 / (accelerationFactor || 1)) ring.zRotationSpeed = 0;
            }

            if (!ring.landed || ring.isSlidingOnPeg) {
                for (let iter = 0; iter < 2; iter++) {
                    for (let i = rings.indexOf(ring) + 1; i < rings.length; i++) {
                        const ring1 = ring;
                        const ring2 = rings[i];
                        if ((ring1.landed && !ring1.isSlidingOnPeg) || (ring2.landed && !ring2.isSlidingOnPeg)) continue;

                        const dx = ring2.x - ring1.x;
                        const dy = ring2.y - ring1.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        const minDistance = RING_OUTER_RADIUS * 2;

                        if (distance < minDistance && distance > 0.001) {
                            const overlap = (minDistance - distance);
                            const normalX = dx / distance;
                            const normalY = dy / distance;
                            ring1.x -= overlap * 0.5 * normalX;
                            ring1.y -= overlap * 0.5 * normalY;
                            ring2.x += overlap * 0.5 * normalX;
                            ring2.y += overlap * 0.5 * normalY;
                            const relativeVx = ring1.vx - ring2.vx;
                            const relativeVy = ring1.vy - ring2.vy;
                            const dotProduct = relativeVx * normalX + relativeVy * normalY;
                            if (dotProduct > 0) {
                                const impulse = (-(1 + RING_COLLISION_BOUNCE) * dotProduct) / 2;
                                ring1.vx += impulse * normalX;
                                ring1.vy += impulse * normalY;
                                ring2.vx -= impulse * normalX;
                                ring2.vy -= impulse * normalY;
                                if (!ring1.isFlat && Math.abs(ring1.rotationSpeed) < 0.2) ring1.rotationSpeed += (Math.random() - 0.5) * 0.05 / (accelerationFactor || 1);
                                if (!ring2.isFlat && Math.abs(ring2.rotationSpeed) < 0.2) ring2.rotationSpeed += (Math.random() - 0.5) * 0.05 / (accelerationFactor || 1);
                                if (Math.abs(ring1.zRotationSpeed) < 0.05) ring1.zRotationSpeed += (Math.random() - 0.5) * 0.03 / (accelerationFactor || 1);
                                if (Math.abs(ring2.zRotationSpeed) < 0.05) ring2.zRotationSpeed += (Math.random() - 0.5) * 0.03 / (accelerationFactor || 1);
                            }
                        }
                    }
                }
            }

            let interactionOccurredThisFrame = false;
            if (!ring.landed && pegs) {
                for (const peg of pegs) {
                    if (ring.landed || interactionOccurredThisFrame || peg.landedRings.length >= MAX_RINGS_PER_PEG || peg.isFullAndScored ) {
                        continue;
                    }
                    const pegCenterX = peg.x;
                    const pegTop = peg.bottomY - peg.height;
                    const ringBottomForCollision = ring.y + RING_OUTER_RADIUS;
                    const prevRingBottomForCollision = prevRingY + RING_OUTER_RADIUS;
                    const landingCatchWidth = PEG_VISUAL_WIDTH * 1.8;

                    const horizontallyAligned = Math.abs(ring.x - pegCenterX) < landingCatchWidth / 2;
                    const isFalling = ring.vy > 0;

                    if (isFalling && horizontallyAligned &&
                        ringBottomForCollision >= pegTop && prevRingBottomForCollision < pegTop + RING_VISUAL_THICKNESS * 0.9 ) {
                        const targetLandedY = (peg.bottomY - FLAT_RING_VIEW_THICKNESS / 2) - (peg.landedRings.length * FLAT_RING_VIEW_THICKNESS);
                        
                        ring.finalYonPeg = targetLandedY;
                        ring.isSlidingOnPeg = true;
                        ring.landed = true;
                        ring.isFlat = true;
                        ring.pegIndex = peg.id;
                        ring.x = pegCenterX;

                        if (ring.y < targetLandedY) {
                            ring.vy = Math.min(4.0, 1.5 + peg.landedRings.length * 0.05);
                        } else {
                            ring.vy = -Math.min(4.0, 1.5 + peg.landedRings.length * 0.05);
                            if(targetLandedY > ring.y - 0.5) ring.vy = 0.05;
                        }
                        ring.vx = 0;
                        ring.rotationSpeed = 0; ring.rotationAngle = Math.PI / 2;
                        ring.zRotationAngle = 0; ring.zRotationSpeed = 0;
                        
                        ring.landedOrder = peg.landedRings.length;
                        peg.landedRings.push(ring);
                        checkAndApplyBonuses(ring, peg);
                        interactionOccurredThisFrame = true;
                        break;
                    }

                    if (!ring.landed && !interactionOccurredThisFrame) {
                        const pegBodyLeft = pegCenterX - (PEG_VISUAL_WIDTH * 0.8) / 2;
                        const pegBodyRight = pegCenterX + (PEG_VISUAL_WIDTH * 0.8) / 2;
                        if (ring.y + RING_OUTER_RADIUS > pegTop + RING_VISUAL_THICKNESS * 0.3 && ring.y - RING_OUTER_RADIUS < peg.bottomY) {
                            if (ring.x + RING_OUTER_RADIUS > pegBodyLeft && prevRingX + RING_OUTER_RADIUS <= pegBodyLeft + 1 && ring.vx > 0) {
                                ring.x = pegBodyLeft - RING_OUTER_RADIUS - 0.1;
                                ring.vx *= PEG_COLLISION_BOUNCE_FACTOR;
                                interactionOccurredThisFrame = true;
                            }
                            else if (ring.x - RING_OUTER_RADIUS < pegBodyRight && prevRingX - RING_OUTER_RADIUS >= pegBodyRight -1 && ring.vx < 0) {
                                ring.x = pegBodyRight + RING_OUTER_RADIUS + 0.1;
                                ring.vx *= PEG_COLLISION_BOUNCE_FACTOR;
                                interactionOccurredThisFrame = true;
                            }
                        }
                        if (!interactionOccurredThisFrame && isFalling &&
                            ring.y + RING_OUTER_RADIUS > pegTop && prevRingY + RING_OUTER_RADIUS <= pegTop + 3 &&
                            Math.abs(ring.x - pegCenterX) < (PEG_VISUAL_WIDTH / 2 + RING_OUTER_RADIUS)) {
                            ring.y = pegTop - RING_OUTER_RADIUS - 0.1;
                            ring.vy *= (PEG_COLLISION_BOUNCE_FACTOR - 0.1);
                            ring.vx += (Math.random() - 0.5) * 0.3 * accelerationFactor;
                            interactionOccurredThisFrame = true;
                        }
                    }
                    if (interactionOccurredThisFrame) break;
                }
            }
            if (ring.x - RING_OUTER_RADIUS < 0 && !ring.landed) { ring.x = RING_OUTER_RADIUS; ring.vx *= BOUNCE_FACTOR; }
            if (ring.x + RING_OUTER_RADIUS > gameScreenWidth && !ring.landed) { ring.x = gameScreenWidth - RING_OUTER_RADIUS; ring.vx *= BOUNCE_FACTOR; }
            if (ring.y - RING_OUTER_RADIUS < 0 && !ring.landed) { ring.y = RING_OUTER_RADIUS; ring.vy *= BOUNCE_FACTOR;}

            const groundCollisionBottomExtent = ring.y + (ring.isFlat ? (GROUND_FLAT_RING_THICKNESS / 2) : (RING_OUTER_RADIUS * Math.abs(Math.cos(ring.rotationAngle))));
            const groundHitPosition = gameScreenHeight - RING_OUTLINE_WIDTH_ON_SCREEN;
            if (groundCollisionBottomExtent >= groundHitPosition && !ring.landed) {
                ring.y = groundHitPosition - (ring.isFlat ? (GROUND_FLAT_RING_THICKNESS / 2) : (RING_OUTER_RADIUS * Math.abs(Math.cos(ring.rotationAngle))));
                if (ring.vy > 0) ring.vy *= BOUNCE_FACTOR * 0.3;
                if (Math.abs(ring.vy) < 0.05 / (accelerationFactor > 0 ? accelerationFactor : 1) ) {
                    ring.vy = 0;
                    if (!ring.landed) {
                        ring.isFlat = true;
                        if (ring.rotationSpeed !==0) ring.rotationSpeed = 0;
                        ring.rotationAngle = Math.PI / 2;
                        if (ring.zRotationSpeed !== 0) ring.zRotationSpeed = 0;
                    }
                }
            }
        });
    }


    function handleOrientation(event) {
        let gamma = event.gamma;
        if (gamma !== null && gamma !== undefined && sensorActive) {
            const MAX_EFFECTIVE_GAMMA_SENSOR = 30;
            sensorTiltX = gamma / MAX_EFFECTIVE_GAMMA_SENSOR;
            sensorTiltX = Math.max(-1, Math.min(1, sensorTiltX));
        } else if (!sensorActive) {
             sensorTiltX = 0;
        }

        let beta = event.beta;
        if (beta !== null && beta !== undefined && sensorActive) {
            if (beta >= 0) {
                if (beta <= SENSOR_PITCH_TRANSITION_END_UP) {
                    sensorTiltY = -1 + (beta / SENSOR_PITCH_TRANSITION_END_UP);
                } else {
                    sensorTiltY = 0;
                }
            } else {
                if (beta >= SENSOR_PITCH_TRANSITION_END_DOWN) {
                    sensorTiltY = -1 - (Math.abs(beta) / Math.abs(SENSOR_PITCH_TRANSITION_END_DOWN));
                } else {
                    sensorTiltY = -2;
                }
            }
            // Clamp sensorTiltY. Si beta >= 0, max es 0. Si beta < 0, min es -2.
             if (beta >= 0) {
                sensorTiltY = Math.max(-1, Math.min(0, sensorTiltY));
            } else {
                sensorTiltY = Math.max(-2, Math.min(-1, sensorTiltY));
            }


        } else if (!sensorActive) {
            sensorTiltX = 0;
            sensorTiltY = 0;
        }
    }
    function requestSensorPermission() {
        console.log(">>>> requestSensorPermission llamada.");
        if(!enableSensorButton) { console.error("requestSensorPermission: enableSensorButton no existe."); return; }
        enableSensorButton.classList.add('sensor-button--activating');
        setTimeout(() => { if(enableSensorButton) enableSensorButton.classList.remove('sensor-button--activating'); }, 300);
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            console.log("Sensor: Usando DeviceOrientationEvent.requestPermission()");
            DeviceOrientationEvent.requestPermission().then(permissionState => {
                console.log("Sensor: Estado del permiso:", permissionState);
                if (permissionState === 'granted') {
                    window.addEventListener('deviceorientation', handleOrientation, true);
                    sensorActive = true;
                    console.log("Sensor: Permiso concedido. sensorActive AHORA ES TRUE");
                    if(enableSensorButton) enableSensorButton.style.display = 'none';
                    if(tiltLeftButton) tiltLeftButton.style.display = 'none';
                    if(tiltRightButton) tiltRightButton.style.display = 'none';
                    if (messageBoard) setPersistentInstructions();
                } else {
                    sensorActive = false;
                    sensorTiltX = 0; sensorTiltY = 0;
                    if (messageBoard) showMessage("Permiso del sensor denegado.", 3000, true);
                    if(enableSensorButton) {enableSensorButton.textContent = "Sensor Denegado"; enableSensorButton.disabled = true;}
                    console.warn("Sensor: Permiso denegado. sensorActive AHORA ES FALSE");
                     if (messageBoard) setPersistentInstructions();
                }
            }).catch(error => {
                sensorActive = false; sensorTiltX = 0; sensorTiltY = 0;
                console.error("Sensor: Error al solicitar permiso:", error);
                if (messageBoard) showMessage("Error al activar sensor.", 3000, true);
                if (messageBoard) setPersistentInstructions();
            });
        } else if (window.DeviceOrientationEvent){
             console.log("Sensor: Navegador soporta DeviceOrientationEvent directamente.");
            window.addEventListener('deviceorientation', handleOrientation, true);
            sensorActive = true;
            console.log("Sensor: Listener añadido directamente. sensorActive AHORA ES TRUE");
            if(enableSensorButton) enableSensorButton.style.display = 'none';
            if(tiltLeftButton) tiltLeftButton.style.display = 'none';
            if(tiltRightButton) tiltRightButton.style.display = 'none';
            if (messageBoard) setPersistentInstructions();
        } else {
            sensorAvailable = false;
            sensorActive = false; sensorTiltX = 0; sensorTiltY = 0;
            console.warn("Sensor: DeviceOrientationEvent no soportado.");
            if (messageBoard) showMessage("Sensor no soportado.", 3000, true);
            if(enableSensorButton) enableSensorButton.style.display = 'none';
            if (messageBoard) setPersistentInstructions();
        }
    }

    if (leftJetButton) {
        leftJetButton.addEventListener('mousedown', () => { leftJetInputActive = true; });
        leftJetButton.addEventListener('mouseup', () => { leftJetInputActive = false; });
        leftJetButton.addEventListener('mouseleave', () => { if(leftJetInputActive) {leftJetInputActive = false;} });
        leftJetButton.addEventListener('touchstart', (e) => { e.preventDefault(); leftJetInputActive = true; }, { passive: false });
        leftJetButton.addEventListener('touchend', (e) => { e.preventDefault(); leftJetInputActive = false; });
    }
    if (rightJetButton) {
        rightJetButton.addEventListener('mousedown', () => { rightJetInputActive = true; });
        rightJetButton.addEventListener('mouseup', () => { rightJetInputActive = false; });
        rightJetButton.addEventListener('mouseleave', () => { if(rightJetInputActive) {rightJetInputActive = false;} });
        rightJetButton.addEventListener('touchstart', (e) => { e.preventDefault(); rightJetInputActive = true; }, { passive: false });
        rightJetButton.addEventListener('touchend', (e) => { e.preventDefault(); rightJetInputActive = false; });
    }
    if (tiltLeftButton) {
        tiltLeftButton.addEventListener('mousedown', () => { tiltLeftActive = true; });
        tiltLeftButton.addEventListener('mouseup', () => { tiltLeftActive = false; });
        tiltLeftButton.addEventListener('mouseleave', () => { if (tiltLeftActive) { tiltLeftActive = false; } });
        tiltLeftButton.addEventListener('touchstart', (e) => { e.preventDefault(); tiltLeftActive = true; }, { passive: false });
        tiltLeftButton.addEventListener('touchend', (e) => { e.preventDefault(); tiltLeftActive = false; });
    }
    if (tiltRightButton) {
        tiltRightButton.addEventListener('mousedown', () => { tiltRightActive = true; });
        tiltRightButton.addEventListener('mouseup', () => { tiltRightActive = false; });
        tiltRightButton.addEventListener('mouseleave', () => { if (tiltRightActive) { tiltRightActive = false; } });
        tiltRightButton.addEventListener('touchstart', (e) => { e.preventDefault(); tiltRightActive = true;}, { passive: false });
        tiltRightButton.addEventListener('touchend', (e) => { e.preventDefault(); tiltRightActive = false; });
    }
    if (resetButton) {
        resetButton.addEventListener('click', () => {
            if (gameLoopId) { cancelAnimationFrame(gameLoopId); gameLoopId = null; }
            gameRunning = false;
            gameOver = false;
            hideEndGameScreen();
            if(startScreen) startScreen.style.display = 'flex';
            if(howToPlayButton) howToPlayButton.style.display = 'inline-block';
            score = 0;
            currentScoreDisplaySize = SCORE_NORMAL_SIZE;
            if (enableSensorButton && sensorAvailable) {
                 enableSensorButton.style.display = 'inline-block';
                 enableSensorButton.disabled = false;
                 enableSensorButton.textContent = "SENSOR";
            }
            if (tiltLeftButton && (!sensorActive || !sensorAvailable) ) tiltLeftButton.style.display = 'flex';
            if(tiltRightButton && (!sensorActive || !sensorAvailable) ) tiltRightButton.style.display = 'flex';
            sensorActive = false; sensorTiltX = 0; sensorTiltY = 0;
            if(messageBoard) setPersistentInstructions();
            if (!gameLoopId) {
                if (typeof performance !== 'undefined' && performance.now) { lastTime = performance.now(); }
                else { lastTime = Date.now(); }
                gameLoopId = requestAnimationFrame(gameLoop);
            }
        });
    }
    if (fullscreenButton) {
        fullscreenButton.addEventListener('click', () => {
            const elem = document.querySelector('.game-container');
            if (elem && !document.fullscreenElement) {
                if (elem.requestFullscreen) { elem.requestFullscreen(); }
                else if (elem.webkitRequestFullscreen) { elem.webkitRequestFullscreen(); }
            } else {
                if (document.exitFullscreen) { document.exitFullscreen(); }
            }
        });
    }
    if (howToPlayButton) {
        howToPlayButton.addEventListener('click', () => {
            if(howToPlayScreen) howToPlayScreen.style.display = 'flex';
        });
    }
    if (closeHowToPlayButton) {
        closeHowToPlayButton.addEventListener('click', () => {
            if(howToPlayScreen) howToPlayScreen.style.display = 'none';
        });
    }
    window.addEventListener('click', (event) => {
        if (howToPlayScreen && event.target == howToPlayScreen) {
            howToPlayScreen.style.display = 'none';
        }
    });
    window.addEventListener('keydown', (e) => {
        let keyProcessed = false;
        switch (e.code) {
            case KEY_LEFT_ARROW:  tiltLeftActive = true; keyProcessed = true; break;
            case KEY_RIGHT_ARROW: tiltRightActive = true; keyProcessed = true; break;
            case KEY_JET_LEFT:    leftJetInputActive = true; keyProcessed = true; break;
            case KEY_JET_RIGHT:   rightJetInputActive = true; keyProcessed = true; break;
        }
        if (keyProcessed && (gameRunning || (startScreen && startScreen.style.display === 'none'))) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => {
        let keyProcessed = false;
        switch (e.code) {
            case KEY_LEFT_ARROW:  tiltLeftActive = false; keyProcessed = true; break;
            case KEY_RIGHT_ARROW: tiltRightActive = false; keyProcessed = true; break;
            case KEY_JET_LEFT:    leftJetInputActive = false; keyProcessed = true; break;
            case KEY_JET_RIGHT:   rightJetInputActive = false; keyProcessed = true; break;
        }
        if (keyProcessed && (gameRunning || (startScreen && startScreen.style.display === 'none'))) e.preventDefault();
    });
    if (enableSensorButton) {
        if (window.DeviceOrientationEvent) {
            sensorAvailable = true;
            enableSensorButton.style.display = 'inline-block';
            enableSensorButton.disabled = false;
            enableSensorButton.textContent = "SENSOR";
            enableSensorButton.addEventListener('click', requestSensorPermission);
        } else {
            sensorAvailable = false;
            enableSensorButton.style.display = 'none';
        }
    }

    function gameLoop(currentTime) {
        if (!gameRunning && !gameOver) {
            if (typeof performance !== 'undefined' && performance.now) { lastTime = performance.now(); }
            else { lastTime = Date.now(); }
            if(ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (startScreen && (startScreen.style.display === 'none' || startScreen.style.display === '')) {
                drawScoreOnCanvas();
            }
            gameLoopId = requestAnimationFrame(gameLoop);
            return;
        }
        if (gameOver) {
            return;
        }

        const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
        let dt = (now - lastTime) / 1000.0;
        if (dt <= 0 || isNaN(dt) || dt > (TARGET_DT * 5) ) dt = TARGET_DT;
        lastTime = now;
        const deltaTime = dt;

        if(ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (scorePulseActive) {
            scorePulseTimer -= deltaTime * TARGET_FPS;
            if (scorePulseTimer <= 0) {
                scorePulseActive = false;
                currentScoreDisplaySize = SCORE_NORMAL_SIZE;
            } else {
                const pulseProgress = 1 - (scorePulseTimer / SCORE_PULSE_DURATION);
                currentScoreDisplaySize = SCORE_NORMAL_SIZE + Math.sin(pulseProgress * Math.PI) * (SCORE_PULSE_SIZE - SCORE_NORMAL_SIZE);
            }
        }

        const accelerationFactor = deltaTime * TARGET_FPS;
        const pressureChange = JET_PRESSURE_INCREMENT_BASE * accelerationFactor;
        const pressureDecay = JET_PRESSURE_DECREMENT_BASE * accelerationFactor;

        if (leftJetInputActive) {
            leftJetPressure += pressureChange;
            if (leftJetPressure > MAX_JET_PRESSURE) leftJetPressure = MAX_JET_PRESSURE;
            if(leftJetPressure > 0.1) createJetParticle(-1, leftJetPressure);
        } else {
            leftJetPressure -= pressureDecay;
            if (leftJetPressure < 0) leftJetPressure = 0;
        }
        if (rightJetInputActive) {
            rightJetPressure += pressureChange;
            if (rightJetPressure > MAX_JET_PRESSURE) rightJetPressure = MAX_JET_PRESSURE;
            if(rightJetPressure > 0.1) createJetParticle(1, rightJetPressure);
        } else {
            rightJetPressure -= pressureDecay;
            if (rightJetPressure < 0) rightJetPressure = 0;
        }

        let forceForTiltUpdate = 0;
        if (sensorActive && sensorAvailable) {
            forceForTiltUpdate = sensorTiltX * TILT_FORCE_SENSOR_MULTIPLIER;
            if (forceForTiltUpdate > MAX_SENSOR_TILT_FORCE) forceForTiltUpdate = MAX_SENSOR_TILT_FORCE;
            if (forceForTiltUpdate < -MAX_SENSOR_TILT_FORCE) forceForTiltUpdate = -MAX_SENSOR_TILT_FORCE;
        } else {
            if (tiltLeftActive === true && tiltRightActive === false) {
                forceForTiltUpdate = -TILT_FORCE_BUTTON_BASE;
            } else if (tiltRightActive === true && tiltLeftActive === false) {
                forceForTiltUpdate = TILT_FORCE_BUTTON_BASE;
            }
        }

        if(rings) updateRings(forceForTiltUpdate, deltaTime);

        drawAllPegsAndLandedRings();
        if(rings) rings.forEach(ring => {
             if (!ring.landed || ring.isSlidingOnPeg || (ring.landed && ring.pegIndex === -1 && !ring.isSlidingOnPeg) ) {
                drawRing(ring);
             }
        });


        updateAndDrawJetParticles(deltaTime);
        updateAndDrawFloatingScores(deltaTime);
        drawScoreOnCanvas();

        if (landedRingsCount >= MAX_TOTAL_RINGS_ON_SCREEN && !gameOver) {
            checkAllPegsCompleted();
        }

        if(gameRunning && !gameOver){
            gameLoopId = requestAnimationFrame(gameLoop);
        }
    }

    if (startGameButton) {
        startGameButton.addEventListener('click', () => {
            console.log(">>>> startGameButton (Modo Único) clicked");
            if(startScreen) startScreen.style.display = 'none';
            if (howToPlayScreen && howToPlayScreen.style.display !== 'none') {
                howToPlayScreen.style.display = 'none';
            }
            initGame();
            gameRunning = true;
            gameOver = false;
            if (gameLoopId) { cancelAnimationFrame(gameLoopId); gameLoopId = null; }
            if (typeof performance !== 'undefined' && performance.now) { lastTime = performance.now(); }
            else { lastTime = Date.now(); }
            gameLoopId = requestAnimationFrame(gameLoop);
        });
    }

    if (messageBoard) {
        messageBoard.style.display = 'none';
        setPersistentInstructions();
    }
    if (startScreen) {
        startScreen.style.display = 'flex';
    }
    if (typeof performance !== 'undefined' && performance.now) { lastTime = performance.now(); }
    else { lastTime = Date.now(); }
    gameLoopId = requestAnimationFrame(gameLoop);
    console.log(">>>> Fin de initializeAndRunGame. UI loop inicializado para pantalla de inicio.");
}

initializeAndRunGame();
