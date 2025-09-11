import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { toast } from 'sonner';

interface GeneratedImage {
  imageURL: string;
  positivePrompt: string;
  seed: number;
  NSFWContent: boolean;
}

class RunwareService {
  private ws: WebSocket | null = null;
  private apiKey: string;
  private connectionSessionUUID: string | null = null;
  private messageCallbacks: Map<string, (data: any) => void> = new Map();
  private isAuthenticated: boolean = false;
  private connectionPromise: Promise<void> | null = null;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.connectionPromise = this.connect();
  }

  private connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket("wss://ws-api.runware.ai/v1");
      
      this.ws.onopen = () => {
        console.log("WebSocket connected");
        this.authenticate().then(resolve).catch(reject);
      };

      this.ws.onmessage = (event) => {
        const response = JSON.parse(event.data);
        
        if (response.error || response.errors) {
          const errorMessage = response.errorMessage || response.errors?.[0]?.message || "An error occurred";
          toast.error(errorMessage);
          return;
        }

        if (response.data) {
          response.data.forEach((item: any) => {
            if (item.taskType === "authentication") {
              this.connectionSessionUUID = item.connectionSessionUUID;
              this.isAuthenticated = true;
            } else {
              const callback = this.messageCallbacks.get(item.taskUUID);
              if (callback) {
                callback(item);
                this.messageCallbacks.delete(item.taskUUID);
              }
            }
          });
        }
      };

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        toast.error("Connection error. Please try again.");
        reject(error);
      };

      this.ws.onclose = () => {
        console.log("WebSocket closed");
        this.isAuthenticated = false;
      };
    });
  }

  private authenticate(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error("WebSocket not ready"));
        return;
      }
      
      const authMessage = [{
        taskType: "authentication",
        apiKey: this.apiKey,
        ...(this.connectionSessionUUID && { connectionSessionUUID: this.connectionSessionUUID }),
      }];
      
      const authCallback = (event: MessageEvent) => {
        const response = JSON.parse(event.data);
        if (response.data?.[0]?.taskType === "authentication") {
          this.ws?.removeEventListener("message", authCallback);
          resolve();
        }
      };
      
      this.ws.addEventListener("message", authCallback);
      this.ws.send(JSON.stringify(authMessage));
    });
  }

  async generateImage(prompt: string): Promise<GeneratedImage> {
    await this.connectionPromise;

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.isAuthenticated) {
      this.connectionPromise = this.connect();
      await this.connectionPromise;
    }

    const taskUUID = crypto.randomUUID();
    
    return new Promise((resolve, reject) => {
      const message = [{
        taskType: "imageInference",
        taskUUID,
        positivePrompt: prompt,
        model: "runware:100@1",
        width: 1024,
        height: 500,
        numberResults: 1,
        outputFormat: "PNG",
        CFGScale: 1,
        scheduler: "FlowMatchEulerDiscreteScheduler",
        strength: 0.8,
      }];

      this.messageCallbacks.set(taskUUID, (data) => {
        if (data.error) {
          reject(new Error(data.errorMessage));
        } else {
          resolve(data);
        }
      });

      this.ws?.send(JSON.stringify(message));
    });
  }
}

export const FeatureGraphicGenerator: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const generateFeatureGraphic = async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter your Runware API key');
      return;
    }

    setIsGenerating(true);
    try {
      const service = new RunwareService(apiKey);
      const prompt = 'Feature graphic for "Green Tap Challenge" mobile game app, 1024x500 aspect ratio. Modern gaming UI design with vibrant green colors, tapping gesture elements, score counters, and energetic game atmosphere. Include the game title "Green Tap Challenge" in bold gaming font. Ultra high resolution gaming app store banner design with sleek gradients and dynamic elements.';
      
      const result = await service.generateImage(prompt);
      setGeneratedImage(result.imageURL);
      toast.success('Feature graphic generated successfully!');
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('Failed to generate image. Please check your API key.');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = async () => {
    if (!generatedImage) return;

    try {
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'feature-graphic-1024x500.png';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Feature graphic downloaded!');
    } catch (error) {
      console.error('Error downloading image:', error);
      toast.error('Failed to download image');
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Generate Play Store Feature Graphic</CardTitle>
          <CardDescription>
            Generate a 1024x500 PNG feature graphic for Google Play Store.
            Get your API key from <a href="https://runware.ai/" target="_blank" rel="noopener noreferrer" className="text-primary underline">runware.ai</a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">Runware API Key</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="Enter your Runware API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>
          
          <Button 
            onClick={generateFeatureGraphic} 
            disabled={isGenerating || !apiKey.trim()}
            className="w-full"
          >
            {isGenerating ? 'Generating...' : 'Generate Feature Graphic'}
          </Button>

          {generatedImage && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <img 
                  src={generatedImage} 
                  alt="Generated feature graphic" 
                  className="w-full h-auto rounded"
                />
              </div>
              <Button onClick={downloadImage} variant="outline" className="w-full">
                Download PNG (1024x500)
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};