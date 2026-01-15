import GuestLayout from "@/Layouts/GuestLayout";
import { Head, Link } from "@inertiajs/react";
import { ArrowLeft, Shield } from "lucide-react";

export default function PrivacyPolicy() {
  const lastUpdated = "15 de Enero, 2026";

  return (
    <GuestLayout>
      <Head title="Política de Privacidad - ContentFlow" />

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
              <Shield className="w-16 h-16 text-white/90 mx-auto mb-4" />
              <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
                Política de Privacidad
              </h1>
              <p className="mt-4 text-xl text-primary-100 max-w-2xl mx-auto">
                Tu privacidad es importante para nosotros. Esta política explica
                cómo recopilamos, usamos y protegemos tu información.
              </p>
            </div>

            <div className="px-8 py-10 sm:px-12 space-y-10 text-gray-600 dark:text-gray-300">
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
                  Última actualización: {lastUpdated}
                </p>

                <Section title="1. Introducción">
                  <p>
                    Bienvenido a ContentFlow ("nosotros", "nuestro" o "la
                    Plataforma"). Nos comprometemos a proteger tu privacidad y
                    asegurar que tus datos personales sean manejados de manera
                    segura y transparente. Esta Política de Privacidad describe
                    cómo recopilamos, usamos, divulgamos y protegemos tu
                    información cuando utilizas nuestro sitio web y servicios
                    (colectivamente, el "Servicio").
                  </p>
                  <p>
                    Al acceder o utilizar el Servicio, aceptas las prácticas
                    descritas en esta política. Si no estás de acuerdo con esta
                    política, por favor no utilices nuestros servicios.
                  </p>
                </Section>

                <Section title="2. Información que Recopilamos">
                  <p>
                    Podemos recopilar y procesar los siguientes tipos de
                    información:
                  </p>

                  <h4 className="font-semibold text-gray-900 dark:text-white mt-4 mb-2">
                    Información que nos proporcionas directamente:
                  </h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      <strong>Información de la Cuenta:</strong> Nombre,
                      dirección de correo electrónico, contraseña y otra
                      información de registro.
                    </li>
                    <li>
                      <strong>Contenido del Usuario:</strong> Archivos,
                      publicaciones, comentarios y otros materiales que subes o
                      creas en la plataforma.
                    </li>
                    <li>
                      <strong>Comunicaciones:</strong> Información enviada
                      cuando nos contactas para soporte o consultas.
                    </li>
                  </ul>

                  <h4 className="font-semibold text-gray-900 dark:text-white mt-4 mb-2">
                    Información recopilada automáticamente:
                  </h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      <strong>Datos de Uso:</strong> Información sobre cómo
                      interactúas con el Servicio (páginas visitadas, tiempo de
                      sesión, clics).
                    </li>
                    <li>
                      <strong>Datos del Dispositivo:</strong> Dirección IP, tipo
                      de navegador, sistema operativo, identificadores del
                      dispositivo.
                    </li>
                    <li>
                      <strong>Cookies y Tecnologías Similares:</strong>{" "}
                      Utilizamos cookies para mejorar tu experiencia, analizar
                      el tráfico y personalizar el contenido.
                    </li>
                  </ul>

                  <h4 className="font-semibold text-gray-900 dark:text-white mt-4 mb-2">
                    Información de Terceros (Google y Redes Sociales):
                  </h4>
                  <p>
                    Nuestro servicio permite la integración con plataformas de
                    terceros como Google (YouTube), Facebook, Instagram, Twitter
                    y TikTok.
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      <strong>Google User Data:</strong> Si conectas tu cuenta
                      de YouTube, accedemos a cierta información de tu cuenta de
                      Google según lo permitido por la configuración de permisos
                      de Google. El uso y la transferencia a cualquier otra
                      aplicación de la información recibida de las API de Google
                      se adherirán a la{" "}
                      <a
                        href="https://developers.google.com/terms/api-services-user-data-policy"
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary-600 hover:text-primary-500 underline"
                      >
                        Política de Datos de Usuario de los Servicios API de
                        Google
                      </a>
                      , incluidos los requisitos de Uso Limitado.
                    </li>
                    <li>
                      Puedes gestionar y revocar el acceso a tus datos a través
                      de la{" "}
                      <a
                        href="https://myaccount.google.com/permissions"
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary-600 hover:text-primary-500 underline"
                      >
                        Página de Configuración de Seguridad de Google
                      </a>
                      .
                    </li>
                  </ul>
                </Section>

                <Section title="3. Cómo Usamos tu Información">
                  <p>
                    Utilizamos la información recopilada para los siguientes
                    propósitos:
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      <strong>Provisión del Servicio:</strong> Para operar,
                      mantener y mejorar las funcionalidades de ContentFlow.
                    </li>
                    <li>
                      <strong>Personalización:</strong> Para adaptar tu
                      experiencia y ofrecer contenido relevante.
                    </li>
                    <li>
                      <strong>Comunicaciones:</strong> Para enviarte
                      actualizaciones, alertas de seguridad y mensajes
                      administrativos.
                    </li>
                    <li>
                      <strong>Análisis:</strong> Para entender cómo se utiliza
                      nuestro servicio y mejorar su rendimiento.
                    </li>
                    <li>
                      <strong>Seguridad:</strong> Para detectar, prevenir y
                      abordar problemas técnicos o fraudes.
                    </li>
                    <li>
                      <strong>Cumplimiento Legal:</strong> Para cumplir con
                      obligaciones legales y proteger nuestros derechos.
                    </li>
                  </ul>
                </Section>

                <Section title="4. Compartir tu Información">
                  <p>
                    No vendemos tu información personal a terceros. Podemos
                    compartir tu información en las siguientes circunstancias:
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      <strong>Proveedores de Servicios:</strong> Con terceros
                      que nos ayudan a operar el servicio (alojamiento,
                      análisis, procesamiento de pagos), bajo estrictas
                      obligaciones de confidencialidad.
                    </li>
                    <li>
                      <strong>Cumplimiento de la Ley:</strong> Cuando sea
                      requerido por ley, citación u otro proceso legal.
                    </li>
                    <li>
                      <strong>Transferencia de Negocio:</strong> En caso de
                      fusión, venta o adquisición de la empresa.
                    </li>
                    <li>
                      <strong>Con tu Consentimiento:</strong> Cuando nos das
                      permiso explícito para compartir tu información.
                    </li>
                  </ul>
                </Section>

                <Section title="5. Seguridad de los Datos">
                  <p>
                    Implementamos medidas de seguridad técnicas y organizativas
                    razonables para proteger tu información contra acceso no
                    autorizado, pérdida o alteración. Sin embargo, ningún método
                    de transmisión por Internet o almacenamiento electrónico es
                    100% seguro.
                  </p>
                </Section>

                <Section title="6. Tus Derechos y Control de Datos">
                  <p>
                    Dependiendo de tu ubicación, puedes tener ciertos derechos
                    sobre tus datos, incluyendo:
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      <strong>Acceso y Portabilidad:</strong> Solicitar una
                      copia de tus datos personales.
                    </li>
                    <li>
                      <strong>Rectificación:</strong> Corregir información
                      inexacta o incompleta.
                    </li>
                    <li>
                      <strong>Eliminación (Derecho al Olvido):</strong>{" "}
                      Solicitar la eliminación de tu cuenta y datos personales.
                      Puedes eliminar tu cuenta desde la configuración de tu
                      perfil o contactándonos directamente.
                    </li>
                    <li>
                      <strong>Revocación del Consentimiento:</strong> Retirar tu
                      consentimiento para el procesamiento de datos en cualquier
                      momento.
                    </li>
                  </ul>
                  <p className="mt-2">
                    Para ejercer estos derechos, contáctanos a través de la
                    información proporcionada al final de esta política.
                  </p>
                </Section>

                <Section title="7. Privacidad de los Niños">
                  <p>
                    Nuestro servicio no está dirigido a personas menores de 13
                    años (o la edad mínima requerida en tu jurisdicción). No
                    recopilamos conscientemente información personal de niños.
                    Si descubres que un niño nos ha proporcionado información
                    personal, contáctanos y la eliminaremos.
                  </p>
                </Section>

                <Section title="8. Cambios a esta Política">
                  <p>
                    Podemos actualizar esta Política de Privacidad
                    ocasionalmente. Te notificaremos sobre cambios
                    significativos enviando un aviso a tu correo electrónico o
                    publicando un aviso destacado en nuestro servicio. Te
                    recomendamos revisar esta página periódicamente.
                  </p>
                </Section>

                <Section title="9. Contacto">
                  <p>
                    Si tienes preguntas o inquietudes sobre esta Política de
                    Privacidad, por favor contáctanos en:
                  </p>
                  <div className="mt-4 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                    <p className="font-medium">Equipo de ContentFlow</p>
                    <p>
                      Email:{" "}
                      <a
                        href="mailto:soporte@contentflow.app"
                        className="text-primary-600 hover:text-primary-500"
                      >
                        soporte@contentflow.app
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
