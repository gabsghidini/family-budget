import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Wallet, Shield, Users, BarChart3 } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center mb-8">
            <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wallet className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Budget Familiar</h1>
            <p className="text-gray-600">Gerencie as finanças da sua família com segurança</p>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex items-center space-x-3">
              <div className="bg-secondary/10 w-10 h-10 rounded-full flex items-center justify-center">
                <Shield className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Seguro e Confiável</p>
                <p className="text-sm text-gray-600">Seus dados protegidos</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="bg-primary/10 w-10 h-10 rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Para Toda Família</p>
                <p className="text-sm text-gray-600">Gerencie gastos em grupo</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="bg-accent/10 w-10 h-10 rounded-full flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Relatórios Detalhados</p>
                <p className="text-sm text-gray-600">Veja onde está gastando</p>
              </div>
            </div>
          </div>

          <Button 
            onClick={handleLogin}
            className="w-full bg-primary text-white hover:bg-blue-700"
            size="lg"
          >
            Entrar com Replit
          </Button>

          <p className="text-xs text-gray-500 text-center mt-4">
            Ao continuar, você aceita nossos termos de uso e política de privacidade.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
