import GuestLayout from "@/Layouts/GuestLayout";
import { Head, Link } from "@inertiajs/react";
import { ArrowLeft, FileText } from "lucide-react";

export default function TermsOfService() {
  const lastUpdated = "15 de Enero, 2026";

  return (
    <GuestLayout>
      <Head title="Términos de Servicio - ContentFlow" />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al inicio
            </Link>
          </div>

          <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl overflow-hidden">
            <div className="bg-primary-600 px-8 py-10 sm:px-12 text-center">
              <FileText className="w-16 h-16 text-white/90 mx-auto mb-4" />
              <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
                Términos de Servicio
              </h1>
              <p className="mt-4 text-xl text-primary-100 max-w-2xl mx-auto">
                Por favor, lee estos términos cuidadosamente antes de usar
                nuestra plataforma.
              </p>
            </div>

            <div className="px-8 py-10 sm:px-12 space-y-10 text-gray-600 dark:text-gray-300">
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
                  Última actualización: {lastUpdated}
                </p>

                <Section title="1. Aceptación de los Términos">
                  <p>
                    Al acceder y utilizar ContentFlow ("Servicio"), aceptas
                    cumplir y estar sujeto a los siguientes términos y
                    condiciones ("Términos"). Si no estás de acuerdo con alguna
                    parte de estos términos, no podrás acceder al Servicio.
                  </p>
                </Section>

                <Section title="2. Cuentas">
                  <p>
                    Cuando creas una cuenta con nosotros, debes proporcionar
                    información precisa, completa y actualizada. El
                    incumplimiento de esto constituye una violación de los
                    Términos, lo que puede resultar en la terminación inmediata
                    de tu cuenta.
                  </p>
                  <p>
                    Eres responsable de salvaguardar la contraseña que utilizas
                    para acceder al Servicio y de cualquier actividad o acción
                    bajo tu contraseña.
                  </p>
                </Section>

                <Section title="3. Uso del Servicio">
                  <p>
                    Aceptas no utilizar el Servicio para ningún propósito ilegal
                    o prohibido por estos Términos. No puedes usar el Servicio
                    de ninguna manera que pueda dañar, deshabilitar, sobrecargar
                    o deteriorar el Servicio.
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      No debes intentar obtener acceso no autorizado a ninguna
                      parte del Servicio.
                    </li>
                    <li>
                      No debes utilizar el Servicio para distribuir malware o
                      contenido malicioso.
                    </li>
                    <li>
                      Debes respetar los derechos de propiedad intelectual de
                      otros.
                    </li>
                  </ul>
                </Section>

                <Section title="4. Propiedad Intelectual">
                  <p>
                    El Servicio y su contenido original (excluyendo el contenido
                    proporcionado por los usuarios), características y
                    funcionalidad son y seguirán siendo propiedad exclusiva de
                    ContentFlow y sus licenciantes. El Servicio está protegido
                    por derechos de autor, marcas registradas y otras leyes.
                  </p>
                </Section>

                <Section title="5. Enlaces a Otros Sitios Web">
                  <p>
                    Nuestro Servicio puede contener enlaces a sitios web o
                    servicios de terceros que no son propiedad ni están
                    controlados por ContentFlow. No tenemos control ni asumimos
                    responsabilidad por el contenido, las políticas de
                    privacidad o las prácticas de sitios web o servicios de
                    terceros.
                  </p>
                </Section>

                <Section title="6. Terminación">
                  <p>
                    Podemos terminar o suspender tu cuenta inmediatamente, sin
                    previo aviso o responsabilidad, por cualquier motivo,
                    incluido, entre otros, si incumples los Términos. Tras la
                    terminación, tu derecho a utilizar el Servicio cesará
                    inmediatamente.
                  </p>
                </Section>

                <Section title="7. Limitación de Responsabilidad">
                  <p>
                    En ningún caso ContentFlow, ni sus directores, empleados,
                    socios, agentes, proveedores o afiliados, serán responsables
                    de daños indirectos, incidentales, especiales, consecuentes
                    o punitivos, incluidos, entre otros, pérdida de beneficios,
                    datos, uso, buena voluntad u otras pérdidas intangibles,
                    resultantes de tu acceso o uso o incapacidad para acceder o
                    usar el Servicio.
                  </p>
                </Section>

                <Section title="8. Cambios">
                  <p>
                    Nos reservamos el derecho, a nuestra sola discreción, de
                    modificar o reemplazar estos Términos en cualquier momento.
                    Si una revisión es material, intentaremos proporcionar un
                    aviso de al menos 30 días antes de que entren en vigor los
                    nuevos términos.
                  </p>
                </Section>

                <Section title="9. Contacto">
                  <p>
                    Si tienes alguna pregunta sobre estos Términos, por favor
                    contáctanos en:
                  </p>
                  <div className="mt-4 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                    <p className="font-medium">Equipo de ContentFlow</p>
                    <p>
                      Email:{" "}
                      <a
                        href="mailto:legal@contentflow.app"
                        className="text-primary-600 hover:text-primary-500"
                      >
                        legal@contentflow.app
                      </a>
                    </p>
                  </div>
                </Section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </GuestLayout>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-gray-100 dark:border-gray-700 pb-8 last:border-0">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        {title}
      </h2>
      <div className="text-gray-600 dark:text-gray-300 space-y-4 leading-relaxed">
        {children}
      </div>
    </section>
  );
}
