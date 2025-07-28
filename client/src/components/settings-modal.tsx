import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FamilyGroupManager } from "@/components/family-group-manager";
import { LogOut, Users, User } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Configurações</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="family" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="family" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Núcleo Familiar
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Conta
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="family" className="space-y-4">
            <FamilyGroupManager />
          </TabsContent>
          
          <TabsContent value="account" className="space-y-4">
            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600">
                Gerencie sua conta e dados pessoais
              </p>
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="w-full flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sair da conta
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
