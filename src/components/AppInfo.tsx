import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Info, Smartphone, Code, Globe, Mail, Shield } from "lucide-react";
import { Capacitor } from '@capacitor/core';

interface DeviceInfo {
  platform: string;
  model: string;
  operatingSystem: string;
  osVersion: string;
  manufacturer: string;
  isVirtual: boolean;
}

export const AppInfo = () => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const getDeviceInfo = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          const { Device } = await import('@capacitor/device');
          const info = await Device.getInfo();
          setDeviceInfo({
            platform: info.platform,
            model: info.model,
            operatingSystem: info.operatingSystem,
            osVersion: info.osVersion,
            manufacturer: info.manufacturer,
            isVirtual: info.isVirtual
          });
        } catch (error) {
          console.error('Error getting device info:', error);
        }
      } else {
        // Web environment
        setDeviceInfo({
          platform: 'web',
          model: 'Browser',
          operatingSystem: navigator.platform,
          osVersion: navigator.userAgent.split(' ')[0] || 'Unknown',
          manufacturer: 'Web Browser',
          isVirtual: false
        });
      }
    };

    if (isOpen) {
      getDeviceInfo();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Info size={20} />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold text-primary flex items-center justify-center gap-2">
            <Info size={24} />
            App Information
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 text-sm">
          {/* App Details */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-semibold text-primary">
              <Code size={16} />
              App Details
            </div>
            <div className="grid gap-1 pl-6">
              <div className="flex justify-between">
                <span className="text-muted-foreground">App Name:</span>
                <span>Green Tap Frenzy</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Version:</span>
                <span>1.0.13</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Build:</span>
                <span>14</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Package ID:</span>
                <span className="text-xs break-all">com.mchisty.greentap</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Device Information */}
          {deviceInfo && (
            <>
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-semibold text-primary">
                  <Smartphone size={16} />
                  Device Information
                </div>
                <div className="grid gap-1 pl-6">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Platform:</span>
                    <span className="capitalize">{deviceInfo.platform}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">OS:</span>
                    <span>{deviceInfo.operatingSystem}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">OS Version:</span>
                    <span>{deviceInfo.osVersion}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Model:</span>
                    <span>{deviceInfo.model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Manufacturer:</span>
                    <span>{deviceInfo.manufacturer}</span>
                  </div>
                  {deviceInfo.isVirtual && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Device Type:</span>
                      <span>Virtual/Emulator</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />
            </>
          )}

          {/* Developer Information */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-semibold text-primary">
              <Globe size={16} />
              Developer Information
            </div>
            <div className="grid gap-1 pl-6">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Developer:</span>
                <span>M. Chisty</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Company:</span>
                <span>Green Tap Games</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Contact:</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-auto p-1 text-xs"
                  onClick={() => window.open('mailto:support@greentapgames.com')}
                >
                  <Mail size={12} className="mr-1" />
                  Support
                </Button>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Privacy:</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-auto p-1 text-xs"
                  onClick={() => window.open('/privacy-policy', '_blank')}
                >
                  <Shield size={12} className="mr-1" />
                  Privacy Policy
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Technical Information */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-semibold text-primary">
              <Code size={16} />
              Technical Details
            </div>
            <div className="grid gap-1 pl-6 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Framework:</span>
                <span>React + Capacitor</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Runtime:</span>
                <span>{Capacitor.isNativePlatform() ? 'Native' : 'Web'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Capacitor:</span>
                <span>v7.4.3</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};