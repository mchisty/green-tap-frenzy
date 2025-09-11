import { useState } from "react";
import GreenTapGame from "@/components/GreenTapGame";
import { FeatureGraphicGenerator } from "@/components/FeatureGraphicGenerator";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [showGenerator, setShowGenerator] = useState(false);

  return (
    <div className="min-h-screen">
      <div className="fixed top-4 right-4 z-50">
        <Button 
          onClick={() => setShowGenerator(!showGenerator)}
          variant="outline"
          size="sm"
        >
          {showGenerator ? "Play Game" : "Generate Feature Graphic"}
        </Button>
      </div>
      
      {showGenerator ? <FeatureGraphicGenerator /> : <GreenTapGame />}
    </div>
  );
};

export default Index;
