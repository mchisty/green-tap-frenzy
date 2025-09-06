import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";

type GameState = "idle" | "playing" | "gameOver";
type CircleColor = "red" | "blue" | "yellow" | "green";

const GreenTapGame = () => {
  const [gameState, setGameState] = useState<GameState>("idle");
  const [score, setScore] = useState(0);
  const [circleColor, setCircleColor] = useState<CircleColor>("red");
  const [cycleCount, setCycleCount] = useState(0);
  const [timeInterval, setTimeInterval] = useState(2000);
  const [isGreenPhase, setIsGreenPhase] = useState(false);
  const [finalScore, setFinalScore] = useState(0);

  const colors = ["red", "blue", "yellow"] as const;

  const getRandomColor = (): "red" | "blue" | "yellow" => {
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const startGame = () => {
    setGameState("playing");
    setScore(0);
    setCycleCount(0);
    setTimeInterval(2000);
    setIsGreenPhase(false);
    setCircleColor(getRandomColor());
    setFinalScore(0);
  };

  const endGame = () => {
    setGameState("gameOver");
    setFinalScore(score);
    setIsGreenPhase(false);
  };

  const handleCircleTap = () => {
    if (gameState !== "playing") return;

    if (circleColor === "green") {
      // Correct tap on green
      const newScore = score + 1;
      setScore(newScore);
      
      // Increase difficulty every 5 points
      if (newScore % 5 === 0) {
        setTimeInterval(prev => Math.max(prev * 0.9, 500)); // Minimum 500ms
      }
      
      // Reset cycle and continue
      setCycleCount(0);
      setIsGreenPhase(false);
      setCircleColor(getRandomColor());
    } else {
      // Wrong tap - game over
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
        setCircleColor("green");
        setIsGreenPhase(true);
        setCycleCount(0);
        
        // Start countdown for green phase
        const greenTimer = setTimeout(() => {
          if (isGreenPhase) {
            endGame(); // Player didn't tap green in time
          }
        }, 1500);

        return () => clearTimeout(greenTimer);
      }
    }, timeInterval);

    return () => clearTimeout(timer);
  }, [gameState, cycleCount, timeInterval, isGreenPhase]);

  // Reset green phase when color changes away from green
  useEffect(() => {
    if (circleColor !== "green") {
      setIsGreenPhase(false);
    }
  }, [circleColor]);

  const getCircleColorClass = () => {
    switch (circleColor) {
      case "red":
        return "bg-game-red";
      case "blue":
        return "bg-game-blue";
      case "yellow":
        return "bg-game-yellow";
      case "green":
        return "bg-game-green animate-pulse-glow";
      default:
        return "bg-game-red";
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-background to-card">
      <div className="text-center space-y-8 max-w-md w-full">
        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Green Tap Challenge
          </h1>
          <p className="text-muted-foreground">
            Tap the circle only when it turns green!
          </p>
        </div>

        {/* Score */}
        <div className="text-center">
          <p className="text-2xl font-semibold text-foreground">
            Score: {gameState === "gameOver" ? finalScore : score}
          </p>
          {gameState === "playing" && (
            <p className="text-sm text-muted-foreground mt-1">
              Speed: {Math.round((2000 / timeInterval) * 100)}%
            </p>
          )}
        </div>

        {/* Game Circle */}
        <div className="flex justify-center">
          <button
            onClick={handleCircleTap}
            disabled={gameState === "idle"}
            className={`
              w-48 h-48 rounded-full transition-all duration-300 transform
              ${getCircleColorClass()}
              ${gameState === "playing" ? "hover:scale-105 active:scale-95" : ""}
              ${gameState === "idle" ? "opacity-50" : ""}
              animate-color-change
              shadow-game
            `}
            style={{
              boxShadow: circleColor === "green" ? "0 0 40px hsl(var(--game-green) / 0.6)" : "var(--shadow-game)"
            }}
          />
        </div>

        {/* Game Controls */}
        <div className="space-y-4">
          {gameState === "idle" && (
            <Button 
              onClick={startGame}
              size="lg"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold animate-bounce-in"
            >
              Start Game
            </Button>
          )}

          {gameState === "gameOver" && (
            <div className="space-y-4 animate-bounce-in">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-destructive">Game Over!</h2>
                <p className="text-lg text-foreground">Final Score: {finalScore}</p>
                {finalScore > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Great job! You reached {Math.floor(finalScore / 5) + 1}x speed!
                  </p>
                )}
              </div>
              <Button 
                onClick={startGame}
                size="lg"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              >
                Play Again
              </Button>
            </div>
          )}
        </div>

        {/* Instructions */}
        {gameState === "idle" && (
          <div className="text-sm text-muted-foreground space-y-2 bg-card/50 p-4 rounded-lg">
            <p>• Tap the circle only when it's <span className="text-game-green font-semibold">green</span></p>
            <p>• Colors change every 2 seconds</p>
            <p>• Green appears every 4th change</p>
            <p>• Speed increases every 5 points</p>
            <p>• You have 1.5 seconds to tap green!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GreenTapGame;