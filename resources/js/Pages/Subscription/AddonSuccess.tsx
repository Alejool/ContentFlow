import Button from '@/Components/common/Modern/Button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/Components/ui/card';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import confetti from 'canvas-confetti';
import { ArrowRight, CheckCircle, Sparkles } from 'lucide-react';
import { useEffect } from 'react';

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
        <div className="mx-auto max-w-3xl sm:px-6 lg:px-8">
          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20">
            <CardHeader className="space-y-4 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>

              <div>
                <CardTitle className="text-3xl font-bold text-green-900 dark:text-green-100">
                  ¡Compra Exitosa!
                </CardTitle>
                <CardDescription className="mt-2 text-lg text-green-700 dark:text-green-300">
                  Tu add-on ha sido activado correctamente
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Success Message */}
              <div className="space-y-4 rounded-lg bg-white p-6 dark:bg-gray-800">
                <div className="flex items-start gap-4">
                  <Sparkles className="mt-1 h-6 w-6 flex-shrink-0 text-blue-600" />
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">¿Qué sigue?</h3>
                    <ul className="text-muted-foreground space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-blue-600">•</span>
                        <span>Tus créditos adicionales están disponibles inmediatamente</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-blue-600">•</span>
                        <span>Se usarán automáticamente cuando excedas el límite de tu plan</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-blue-600">•</span>
                        <span>Puedes ver tu balance actualizado en el dashboard</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-blue-600">•</span>
                        <span>
                          Recibirás un email de confirmación con los detalles de tu compra
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Info Box */}
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  💡 <strong>Tip:</strong> Los add-ons no expiran y se acumulan si compras múltiples
                  paquetes. Puedes solicitar reembolso dentro de los 7 días si no has usado el
                  add-on.
                </p>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col justify-center gap-3 sm:flex-row">
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
            <p className="text-muted-foreground mb-4 text-sm">
              ¿Necesitas ayuda? Contáctanos en soporte@Intellipost.com
            </p>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
