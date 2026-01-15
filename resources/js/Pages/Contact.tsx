import GuestLayout from "@/Layouts/GuestLayout";
import { Head, Link } from "@inertiajs/react";
import { ArrowLeft, Mail } from "lucide-react";

export default function Contact() {
  return (
    <GuestLayout>
      <Head title="Contacto - ContentFlow" />

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
              <Mail className="w-16 h-16 text-white/90 mx-auto mb-4" />
              <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
                Contacto
              </h1>
              <p className="mt-4 text-xl text-primary-100 max-w-2xl mx-auto">
                ¿Tienes preguntas o sugerencias? Estamos aquí para ayudarte.
              </p>
            </div>

            <div className="px-8 py-10 sm:px-12 space-y-12">
              <div className="max-w-2xl mx-auto text-center">
                <div className="bg-gray-50 dark:bg-gray-700/50 p-8 rounded-2xl border border-gray-100 dark:border-gray-600">
                  <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mb-6 mx-auto">
                    <Mail className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Atención y Sugerencias
                  </h3>
                  <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                    Este es el canal oficial para que nos hagas llegar tus
                    comentarios. Puedes enviarnos cualquier{" "}
                    <strong>sugerencia de mejora</strong>, informarnos sobre{" "}
                    <strong>errores de la aplicación</strong> o consultarnos
                    sobre nuestras <strong>políticas</strong>.
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 mb-8">
                    Tu feedback es fundamental para nosotros; revisamos cada
                    mensaje para seguir mejorando la experiencia de ContentFlow.
                  </p>
                  <div className="inline-block bg-white dark:bg-gray-800 px-6 py-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-transform hover:scale-105">
                    <span className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
                      Escríbenos a
                    </span>
                    <a
                      href="mailto:soporte@contentflow.app"
                      className="text-2xl font-bold text-primary-600 dark:text-primary-400 hover:underline transition-all"
                    >
                      soporte@contentflow.app
                    </a>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 dark:border-gray-700 pt-10 text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  Revisamos todas las sugerencias y errores reportados con
                  prioridad.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </GuestLayout>
  );
}
