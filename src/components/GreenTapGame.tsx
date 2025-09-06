import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX } from "lucide-react";

type GameState = "idle" | "playing" | "gameOver";
type CircleColor = "red" | "blue" | "yellow" | "green";

const GreenTapGame = () => {
  const [gameState, setGameState] = useState<GameState>("idle");
  const [score, setScore] = useState(0);
  const [circleColor, setCircleColor] = useState<CircleColor>("red");
  const [cycleCount, setCycleCount] = useState(0);
  const [timeInterval, setTimeInterval] = useState(1000);
  const [isGreenPhase, setIsGreenPhase] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [greenTimeoutId, setGreenTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [wasRecentlyGreen, setWasRecentlyGreen] = useState(false);
  const [showScorePop, setShowScorePop] = useState(false);

  const colors = ["red", "blue", "yellow"] as const;

  // Sound generation functions
  const playSuccessSound = useCallback(() => {
    if (isMuted) return;
    
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  }, [isMuted]);

  const playErrorSound = useCallback(() => {
    if (isMuted) return;
    
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Gentle descending tone
    oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(250, audioContext.currentTime + 0.4);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.4);
  }, [isMuted]);

  const getRandomColor = (): "red" | "blue" | "yellow" => {
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const startGame = () => {
    setGameState("playing");
    setScore(0);
    setCycleCount(0);
    setTimeInterval(1000);
    setIsGreenPhase(false);
    setCircleColor(getRandomColor());
    setFinalScore(0);
  };

  const endGame = () => {
    playErrorSound();
    setGameState("gameOver");
    setFinalScore(score);
    setIsGreenPhase(false);
  };

  const handleCircleTap = () => {
    if (gameState !== "playing") return;

    console.log("Circle tapped - Color:", circleColor, "WasRecentlyGreen:", wasRecentlyGreen, "IsGreenPhase:", isGreenPhase, "Score:", score);

    // Accept tap if circle is green OR was recently green (grace period)
    if (circleColor === "green" || wasRecentlyGreen) {
      // Clear the green timeout to prevent race condition
      if (greenTimeoutId) {
        console.log("Clearing green timeout on successful tap");
        clearTimeout(greenTimeoutId);
        setGreenTimeoutId(null);
      }
      
      // Reset grace period
      setWasRecentlyGreen(false);
      
      // Correct tap on green
      playSuccessSound();
      const newScore = score + 1;
      setScore(newScore);
      
      // Show score pop animation
      setShowScorePop(true);
      setTimeout(() => setShowScorePop(false), 600);
      
      console.log("Successful green tap! New score:", newScore);
      
      // Increase difficulty every 5 points
      if (newScore % 5 === 0) {
        const newInterval = Math.max(timeInterval * 0.85, 500);
        console.log("Speed increase! Old interval:", timeInterval, "New interval:", newInterval);
        setTimeInterval(newInterval);
      }
      
      // Reset cycle and continue after brief pause
      setCycleCount(0);
      setIsGreenPhase(false);
      
      // Add brief pause before starting next cycle to prevent confusion
      setTimeout(() => {
        setCircleColor(getRandomColor());
      }, 300);
    } else {
      // Wrong tap - game over
      console.log("Wrong tap - game over");
      playErrorSound();
      endGame();
    }
  };

  // Game loop effect
  useEffect(() => {
    if (gameState !== "playing") return;

    const timer = setTimeout(() => {
      if (cycleCount < 3) {
        // First 3 changes are random colors
        setCycleCount(prev => prev + 1);
        setCircleColor(getRandomColor());
      } else {
        // 4th change is green
        console.log("Changing to green, cycle:", cycleCount);
        setCircleColor("green");
        setIsGreenPhase(true);
        setWasRecentlyGreen(true);
        setCycleCount(0);
        
        // Clear grace period after 200ms
        setTimeout(() => {
          console.log("Grace period expired");
          setWasRecentlyGreen(false);
        }, 200);
        
        // Start countdown for green phase with proper cleanup
        const greenTimeoutDuration = Math.max(timeInterval * 1.5, 750); // Proportional to game speed
        console.log("Green phase started, timeout duration:", greenTimeoutDuration);
        
        const greenTimer = setTimeout(() => {
          console.log("Green timeout fired - game over");
          setIsGreenPhase(false);
          setGreenTimeoutId(null);
          setWasRecentlyGreen(false);
          endGame(); // Player didn't tap green in time
        }, greenTimeoutDuration);
        
        setGreenTimeoutId(greenTimer);
      }
    }, timeInterval);

    return () => clearTimeout(timer);
  }, [gameState, cycleCount, timeInterval]);

  // Cleanup green timeout on unmount or game state change
  useEffect(() => {
    return () => {
      if (greenTimeoutId) {
        clearTimeout(greenTimeoutId);
      }
    };
  }, [greenTimeoutId]);

  // Reset green phase when color changes away from green
  useEffect(() => {
    if (circleColor !== "green") {
      setIsGreenPhase(false);
    }
  }, [circleColor]);

  const getCircleColorClass = () => {
    const baseClasses = "relative overflow-hidden";
    const shadowClass = "shadow-[var(--shadow-3d)]";
    
    switch (circleColor) {
      case "red":
        return `${baseClasses} bg-gradient-to-br from-game-red via-red-500 to-red-700 ${shadowClass}`;
      case "blue":
        return `${baseClasses} bg-gradient-to-br from-game-blue via-blue-500 to-blue-700 ${shadowClass}`;
      case "yellow":
        return `${baseClasses} bg-gradient-to-br from-game-yellow via-yellow-400 to-yellow-600 ${shadowClass}`;
      case "green":
        return `${baseClasses} bg-gradient-to-br from-game-green via-green-500 to-green-700 animate-pulse-glow ${shadowClass}`;
      default:
        return `${baseClasses} bg-gradient-to-br from-game-red via-red-500 to-red-700 ${shadowClass}`;
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-background to-card">
      <div className="text-center space-y-8 max-w-md w-full">
        {/* Title */}
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Green Tap Challenge
            </h1>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsMuted(!isMuted)}
              className="shrink-0"
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </Button>
          </div>
          <p className="text-muted-foreground">
            Tap the circle only when it turns green!
          </p>
        </div>

        {/* Score */}
        <div className="text-center relative">
          <div className="relative">
            <p className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent animate-score-glow">
              Score: {gameState === "gameOver" ? finalScore : score}
            </p>
            {showScorePop && (
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-2xl font-bold text-primary animate-pop-in pointer-events-none">
                +1
              </div>
            )}
          </div>
          {gameState === "playing" && (
            <p className="text-sm text-muted-foreground mt-2 bg-gradient-to-r from-game-green to-game-blue bg-clip-text text-transparent">
              Speed: {Math.round((1000 / timeInterval) * 100)}%
            </p>
          )}
        </div>

        {/* Game Circle */}
        <div className="flex justify-center">
          <button
            onClick={handleCircleTap}
            disabled={gameState === "idle"}
            className={`
              w-48 h-48 rounded-full transition-all duration-300 transform border-4 border-white/20
              ${getCircleColorClass()}
              ${gameState === "playing" ? "hover:scale-105 active:scale-95 cursor-pointer" : ""}
              ${gameState === "idle" ? "opacity-50 cursor-not-allowed" : ""}
              animate-color-change
              before:absolute before:inset-2 before:rounded-full before:bg-gradient-to-br before:from-white/30 before:to-transparent before:pointer-events-none
            `}
            style={{
              boxShadow: circleColor === "green" 
                ? "0 0 60px hsl(var(--game-green) / 0.8), inset 0 4px 8px rgba(255,255,255,0.2)" 
                : "var(--shadow-3d), inset 0 4px 8px rgba(255,255,255,0.2)"
            }}
          />
        </div>

        {/* Game Controls */}
        <div className="space-y-4">
          {gameState === "idle" && (
            <Button 
              onClick={startGame}
              size="lg"
              className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-semibold shadow-[var(--shadow-button)] animate-bounce-in active:animate-button-press transition-all duration-200"
            >
              Start Game
            </Button>
          )}

          {gameState === "gameOver" && (
            <div className="space-y-4 animate-bounce-in">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-destructive via-red-500 to-destructive bg-clip-text text-transparent animate-game-over-shake">
                  Game Over!
                </h2>
                <p className="text-xl font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Final Score: {finalScore}
                </p>
                {finalScore > 0 && (
                  <p className="text-sm text-muted-foreground bg-gradient-to-r from-game-yellow to-game-green bg-clip-text text-transparent">
                    Great job! You reached {Math.floor(finalScore / 5) + 1}x speed!
                  </p>
                )}
              </div>
              <Button 
                onClick={startGame}
                size="lg"
                className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-semibold shadow-[var(--shadow-button)] active:animate-button-press transition-all duration-200"
              >
                Play Again
              </Button>
            </div>
          )}
        </div>

        {/* Instructions */}
        {gameState === "idle" && (
          <div className="text-sm text-muted-foreground space-y-2 bg-gradient-to-br from-card/60 to-card/30 backdrop-blur-sm p-6 rounded-xl border border-white/10">
            <p>• Tap the circle only when it's <span className="bg-gradient-to-r from-game-green to-green-400 bg-clip-text text-transparent font-bold">green</span></p>
            <p>• Colors change every <span className="text-primary font-semibold">1 second</span></p>
            <p>• Green appears every <span className="text-accent font-semibold">4th change</span></p>
            <p>• Speed increases every <span className="text-game-yellow font-semibold">5 points</span></p>
            <p>• You have <span className="text-destructive font-semibold">1.5 seconds</span> to tap green!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GreenTapGame;