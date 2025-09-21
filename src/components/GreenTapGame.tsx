import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Volume2, VolumeX, ShoppingCart, RotateCcw, HelpCircle } from "lucide-react";
import { AppInfo } from "@/components/AppInfo";
import { useAdMob } from "@/hooks/useAdMob";
import { useInAppPurchase } from "@/hooks/useInAppPurchase";
import { useToast } from "@/hooks/use-toast";

type GameState = "idle" | "playing" | "gameOver";
type CircleColor = "red" | "blue" | "yellow" | "green" | "purple" | "orange" | "pink" | "cyan" | "magenta" | "lime";

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
  const [showInstructions, setShowInstructions] = useState(false);

  const { toast } = useToast();
  
  // AdMob integration
  const {
    adsRemoved,
    showBannerAd,
    hideBannerAd,
    showInterstitialAd,
    removeAds,
    bannerVisible
  } = useAdMob();

  // In-App Purchase integration
  const {
    isPurchasing,
    isRestoring,
    purchaseRemoveAds,
    restorePurchases
  } = useInAppPurchase(removeAds);

  const colors = ["red", "blue", "yellow", "purple", "orange", "pink", "cyan", "magenta", "lime"] as const;

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

  const getRandomColor = (): Exclude<CircleColor, "green"> => {
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
    
    // Show banner ad when game starts (if ads not removed)
    showBannerAd();
  };

  const endGame = () => {
    playErrorSound();
    setGameState("gameOver");
    setFinalScore(score);
    setIsGreenPhase(false);
    
    // Hide banner ad and show interstitial ad on game over
    hideBannerAd();
    showInterstitialAd();
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
    const baseClasses = "relative overflow-hidden animate-circle-morph";
    const shadowClass = circleColor === "green" 
      ? "shadow-[var(--shadow-circle-glow)]" 
      : "shadow-[var(--shadow-circle-3d)]";
    
    switch (circleColor) {
      case "red":
        return `${baseClasses} bg-gradient-to-br from-game-red via-red-500 to-red-700 ${shadowClass}`;
      case "blue":
        return `${baseClasses} bg-gradient-to-br from-game-blue via-blue-500 to-blue-700 ${shadowClass}`;
      case "yellow":
        return `${baseClasses} bg-gradient-to-br from-game-yellow via-yellow-400 to-yellow-600 ${shadowClass}`;
      case "purple":
        return `${baseClasses} bg-gradient-to-br from-game-purple via-purple-500 to-purple-700 ${shadowClass}`;
      case "orange":
        return `${baseClasses} bg-gradient-to-br from-game-orange via-orange-500 to-orange-700 ${shadowClass}`;
      case "pink":
        return `${baseClasses} bg-gradient-to-br from-game-pink via-pink-500 to-pink-700 ${shadowClass}`;
      case "cyan":
        return `${baseClasses} bg-gradient-to-br from-game-cyan via-cyan-500 to-cyan-700 ${shadowClass}`;
      case "magenta":
        return `${baseClasses} bg-gradient-to-br from-game-magenta via-fuchsia-500 to-fuchsia-700 ${shadowClass}`;
      case "lime":
        return `${baseClasses} bg-gradient-to-br from-game-lime via-lime-500 to-lime-700 ${shadowClass}`;
      case "green":
        return `${baseClasses} bg-gradient-to-br from-game-green via-green-500 to-green-700 animate-circle-pulse-3d ${shadowClass}`;
      default:
        return `${baseClasses} bg-gradient-to-br from-game-red via-red-500 to-red-700 ${shadowClass}`;
    }
  };

  const handlePurchaseRemoveAds = async () => {
    const result = await purchaseRemoveAds();
    if (result?.success) {
      toast({
        title: "Purchase Successful!",
        description: "Ads have been removed permanently.",
      });
    } else {
      toast({
        title: "Purchase Failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleRestorePurchases = async () => {
    const result = await restorePurchases();
    if (result?.success) {
      toast({
        title: "Purchases Restored",
        description: "Your previous purchases have been restored.",
      });
    } else {
      toast({
        title: "Restore Failed",
        description: "No purchases found to restore.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-background to-card">
      <div className="text-center space-y-8 max-w-md w-full">
        {/* Title */}
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-4">
            <h1 className="text-4xl font-bold text-primary title-clean">
              Green Tap Challenge
            </h1>
            <div className="flex gap-2 shrink-0">
              <AppInfo />
              <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon">
                    <HelpCircle size={20} />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-center text-xl font-bold text-primary">
                      How to Play
                    </DialogTitle>
                  </DialogHeader>
                  <div className="text-lg text-muted-foreground space-y-3 p-4">
                    <p>• Tap the circle only when it's <span className="bg-gradient-to-r from-game-green to-green-400 bg-clip-text text-transparent font-bold glow-3d">green</span></p>
                    <p>• Colors change every <span className="text-primary font-semibold glow-3d">1 second</span></p>
                    <p>• Green appears every <span className="text-accent font-semibold glow-3d">4th change</span></p>
                    <p>• Speed increases every <span className="text-game-yellow font-semibold glow-3d">5 points</span></p>
                    <p>• You have <span className="text-destructive font-semibold glow-3d">1.5 seconds</span> to tap green!</p>
                  </div>
                </DialogContent>
              </Dialog>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </Button>
            </div>
          </div>
          <p className="text-muted-foreground text-lg">
            Tap the circle only when it turns green!
          </p>
        </div>

        {/* Score */}
        <div className="text-center relative">
          <div className="relative">
            <p className="text-5xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent glow-3d animate-score-glow">
              Score: {gameState === "gameOver" ? finalScore : score}
            </p>
            {showScorePop && (
              <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 text-3xl font-bold text-primary animate-pop-in-3d pointer-events-none glow-3d">
                +1
              </div>
            )}
          </div>
          {gameState === "playing" && (
            <p className="text-lg text-muted-foreground mt-2 bg-gradient-to-r from-game-green to-game-blue bg-clip-text text-transparent text-3d">
              Speed: {Math.round((1000 / timeInterval) * 100)}%
            </p>
          )}
        </div>

        {/* Game Circle */}
        <div className="flex justify-center">
          <div className="relative">
            <button
              onClick={handleCircleTap}
              disabled={gameState === "idle"}
              className={`
                w-48 h-48 rounded-full transition-all duration-500 transform border-4 border-white/30
                ${getCircleColorClass()}
                ${gameState === "playing" ? "hover:scale-110 active:scale-90 cursor-pointer hover:rotate-3 active:rotate-6" : ""}
                ${gameState === "idle" ? "opacity-50 cursor-not-allowed" : ""}
                animate-color-change backdrop-blur-sm
              `}
              style={{
                boxShadow: circleColor === "green" 
                  ? `0 0 80px hsl(var(--game-green) / 0.9), 0 0 120px hsl(var(--game-green) / 0.6), var(--shadow-circle-deep), inset 0 6px 12px rgba(255,255,255,0.3), inset 0 -6px 12px rgba(0,0,0,0.2)`
                  : `var(--shadow-circle-3d), inset 0 6px 12px rgba(255,255,255,0.25), inset 0 -6px 12px rgba(0,0,0,0.15)`
              }}
            />
            {/* Enhanced 3D highlight overlays */}
            <div className="absolute inset-3 rounded-full bg-gradient-to-br from-white/40 via-white/10 to-transparent pointer-events-none" />
            <div className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/60 blur-sm pointer-events-none animate-pulse" />
            <div className="absolute bottom-6 right-6 w-4 h-4 rounded-full bg-white/40 blur-xs pointer-events-none" />
          </div>
        </div>

        {/* Game Controls */}
        <div className="space-y-4">
          {gameState === "idle" && (
            <Button 
              onClick={startGame}
              size="lg"
              className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-semibold shadow-[var(--shadow-button)] animate-bounce-in active:animate-button-press transition-all duration-200 text-3d"
            >
              Start Game
            </Button>
          )}

          {gameState === "gameOver" && (
            <div className="space-y-4 animate-bounce-in">
              <div className="text-center space-y-2">
                <h2 className="text-4xl font-bold bg-gradient-to-r from-destructive via-red-500 to-destructive bg-clip-text text-transparent message-3d animate-game-over-shake">
                  Game Over!
                </h2>
                <p className="text-2xl font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent glow-3d">
                  Final Score: {finalScore}
                </p>
                {finalScore > 0 && (
                  <p className="text-lg text-muted-foreground bg-gradient-to-r from-game-yellow to-game-green bg-clip-text text-transparent text-3d">
                    Great job! You reached {Math.floor(finalScore / 5) + 1}x speed!
                  </p>
                )}
              </div>
              <Button 
                onClick={startGame}
                size="lg"
                className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-semibold shadow-[var(--shadow-button)] active:animate-button-press transition-all duration-200 text-3d"
              >
                Play Again
              </Button>
            </div>
          )}
        </div>

        {/* Monetization Buttons */}
        {gameState === "idle" && !adsRemoved && (
          <div className="space-y-3">
            <Button
              onClick={handlePurchaseRemoveAds}
              disabled={isPurchasing}
              className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-semibold shadow-lg"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              {isPurchasing ? "Processing..." : "Remove Ads"}
            </Button>
            
            <Button
              onClick={handleRestorePurchases}
              disabled={isRestoring}
              variant="outline"
              className="w-full"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              {isRestoring ? "Restoring..." : "Restore Purchases"}
            </Button>
          </div>
        )}

        {/* Instructions */}
        {gameState === "idle" && (
          <div className="text-lg text-muted-foreground space-y-3 bg-gradient-to-br from-card/60 to-card/30 backdrop-blur-sm p-6 rounded-xl border border-white/10 text-3d">
            <p>• Tap the circle only when it's <span className="bg-gradient-to-r from-game-green to-green-400 bg-clip-text text-transparent font-bold glow-3d">green</span></p>
            <p>• Colors change every <span className="text-primary font-semibold glow-3d">1 second</span></p>
            <p>• Green appears every <span className="text-accent font-semibold glow-3d">4th change</span></p>
            <p>• Speed increases every <span className="text-game-yellow font-semibold glow-3d">5 points</span></p>
            <p>• You have <span className="text-destructive font-semibold glow-3d">1.5 seconds</span> to tap green!</p>
          </div>
        )}
      </div>
      
      {/* Ad-free indicator */}
      {adsRemoved && (
        <div className="fixed bottom-4 left-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
          Ad-Free ✓
        </div>
      )}
      
      {/* Banner Ad Simulation (Web Preview Only) */}
      {bannerVisible && !adsRemoved && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white text-center py-3 text-sm border-t border-gray-600">
          🎬 Banner Ad (Simulated for Web Preview) - Would be real AdMob banner on mobile
        </div>
      )}
    </div>
  );
};

export default GreenTapGame;