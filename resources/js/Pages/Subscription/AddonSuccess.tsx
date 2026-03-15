import React, { useEffect } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/Components/ui/card";
import Button from "@/Components/common/Modern/Button";
import { CheckCircle, Sparkles, ArrowRight } from "lucide-react";
import confetti from "canvas-confetti";

export default function AddonSuccess() {
  useEffect(() => {
    // Celebrar con confetti
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <AuthenticatedLayout>
      <Head title="Compra Exitosa" />

      <div className="py-12">
        <div className="max-w-3xl mx-auto sm:px-6 lg:px-8">
          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>

              <div>
                <CardTitle className="text-3xl font-bold text-green-900 dark:text-green-100">
                  ¡Compra Exitosa!
                </CardTitle>
                <CardDescription className="text-lg mt-2 text-green-700 dark:text-green-300">
                  Tu add-on ha sido activado correctamente
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Success Message */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 space-y-4">
                <div className="flex items-start gap-4">
                  <Sparkles className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">¿Qué sigue?</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold">•</span>
                        <span>
                          Tus créditos adicionales están disponibles
                          inmediatamente
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold">•</span>
                        <span>
                          Se usarán automáticamente cuando excedas el límite de
                          tu plan
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold">•</span>
                        <span>
                          Puedes ver tu balance actualizado en el dashboard
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold">•</span>
                        <span>
                          Recibirás un email de confirmación con los detalles de
                          tu compra
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  💡 <strong>Tip:</strong> Los add-ons no expiran y se acumulan
                  si compras múltiples paquetes. Puedes solicitar reembolso
                  dentro de los 7 días si no has usado el add-on.
                </p>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild variant="default" size="lg">
                <Link href="/dashboard">
                  Ir al Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>

              <Button asChild variant="outline" size="lg">
                <Link href="/subscription/addons">Ver Mis Add-ons</Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Additional Actions */}
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              ¿Necesitas ayuda? Contáctanos en soporte@contenflow.com
            </p>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
