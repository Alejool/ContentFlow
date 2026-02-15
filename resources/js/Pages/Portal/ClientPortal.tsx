import Button from "@/Components/common/Modern/Button";
import { getPlatformConfig } from "@/Constants/socialPlatforms";
import { MediaFile, Publication } from "@/types";
import { Head, useForm } from "@inertiajs/react";
import {
  AlertCircle,
  Calendar,
  Check,
  Info,
  Loader2,
  MessageSquare,
  Share2,
  X,
} from "lucide-react";
import React, { useState } from "react";
import toast from "react-hot-toast";

interface Props {
  publication: Publication & { media_files: MediaFile[] };
  token: string;
}

const ClientPortal: React.FC<Props> = ({ publication, token }) => {
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { post, processing, data, setData, errors } = useForm({
    reason: "",
  });

  const handleApprove = () => {
    if (confirm("¿Estás seguro de que deseas aprobar este contenido?")) {
      post(route("api.v1.portal.approve", { token }), {
        onSuccess: () => {
          setIsSuccess(true);
          toast.success("Contenido aprobado correctamente");
        },
        onError: () => {
          toast.error("Error al aprobar el contenido");
        },
      });
    }
  };

  const handleReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.reason) {
      toast.error("Por favor, indica un motivo de rechazo");
      return;
    }

    post(route("api.v1.portal.reject", { token }), {
      onSuccess: () => {
        setIsSuccess(true);
        toast.success("Contenido rechazado correctamente");
      },
      onError: () => {
        toast.error("Error al rechazar el contenido");
      },
    });
  };

  // Helper to extract platforms from platform_settings
  const getTargetPlatforms = () => {
    if (
      !publication.platform_settings ||
      typeof publication.platform_settings !== "object" ||
      Array.isArray(publication.platform_settings)
    ) {
      return [];
    }
    return Object.keys(publication.platform_settings).map((key) =>
      getPlatformConfig(key),
    );
  };

  const targetPlatforms = getTargetPlatforms();

  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-zinc-950">
        <Head title="Contenido Procesado - ContentFlow" />
        <div className="w-full max-w-md p-8 text-center bg-white border border-gray-100 shadow-xl dark:bg-zinc-900 rounded-lg dark:border-zinc-800">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 text-green-600 bg-green-100 rounded-full dark:bg-green-900/30 dark:text-green-400">
            <Check className="w-8 h-8" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
            ¡Acción Completada!
          </h1>
          <p className="mb-6 text-gray-500 dark:text-zinc-400">
            Tu respuesta ha sido registrada correctamente para{" "}
            <strong>{publication.workspace?.name}</strong>. Ya puedes cerrar
            esta ventana.
          </p>
          <p className="text-sm text-gray-400 dark:text-zinc-500">
            Gracias por usar ContentFlow.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12 font-sans text-gray-900 bg-gray-50 dark:bg-zinc-950 dark:text-zinc-100">
      <Head
        title={`Revisión: ${publication.title} - ${publication.workspace?.name}`}
      />

      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
        <div className="flex items-center justify-between max-w-4xl px-4 mx-auto h-16">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 text-lg font-bold text-white rounded-lg bg-gradient-to-br from-orange-500 to-red-600">
              C
            </div>
            <div>
              <span className="block text-lg font-bold leading-none tracking-tight">
                ContentFlow
              </span>
              <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">
                Portal de Clientes
              </span>
            </div>
          </div>

          {publication.workspace && (
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-zinc-800 px-3 py-1.5 rounded-full border border-gray-100 dark:border-zinc-700">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="text-sm font-bold text-gray-700 dark:text-zinc-200">
                {publication.workspace.name}
              </span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-4xl px-4 mx-auto mt-8">
        {/* Why am I here? Info box */}
        <div className="flex gap-3 p-4 mb-6 border border-blue-100 rounded-lg bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800/20 items-start">
          <Info className="flex-shrink-0 w-5 h-5 text-blue-500 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-300">
            <p className="font-bold mb-0.5">Revisión de Contenido</p>
            Has recibido este enlace para revisar y aprobar el contenido
            preparado por{" "}
            <strong>{publication.user?.name || "tu gestor"}</strong> para el
            workspace <strong>{publication.workspace?.name}</strong>.
          </div>
        </div>

        <div className="overflow-hidden bg-white border border-gray-100 shadow-sm dark:bg-zinc-900 rounded-lg dark:border-zinc-800">
          {/* Status and Meta */}
          <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-gray-100 bg-gray-50/50 dark:bg-zinc-900/50 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="relative flex w-3 h-3">
                <span className="absolute inline-flex w-full h-full bg-orange-400 rounded-full opacity-75 animate-ping"></span>
                <span className="relative inline-flex w-3 h-3 bg-orange-500 rounded-full"></span>
              </span>
              <span className="text-xs font-bold tracking-wider text-orange-600 uppercase dark:text-orange-400">
                {publication.status === "pending_review"
                  ? "Pendiente de tu revisión"
                  : publication.status}
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs font-medium text-gray-500 dark:text-zinc-400">
              {publication.scheduled_at && (
                <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-800 px-2 py-1 rounded shadow-sm">
                  <Calendar className="w-3.5 h-3.5 text-orange-500" />
                  <span>
                    Programado:{" "}
                    {new Date(publication.scheduled_at).toLocaleString()}
                  </span>
                </div>
              )}

              {targetPlatforms.length > 0 && (
                <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-800 px-2 py-1 rounded shadow-sm">
                  <Share2 className="w-3.5 h-3.5 text-orange-500" />
                  <div className="flex items-center -space-x-1">
                    {targetPlatforms.map((p, i) => (
                      <div
                        key={i}
                        title={p.name}
                        className={`p-0.5 rounded-full bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800`}
                      >
                        <p.icon className={`w-3 h-3 ${p.textColor}`} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 md:p-10">
            <h1 className="mb-6 text-3xl font-extrabold leading-tight text-gray-900 dark:text-white">
              {publication.title}
            </h1>

            {/* Media Preview */}
            {publication.media_files && publication.media_files.length > 0 && (
              <div className="mb-8 rounded-lg overflow-hidden bg-gray-100 dark:bg-zinc-800 shadow-inner flex items-center justify-center relative group min-h-[300px]">
                {publication.media_files[0].file_type.startsWith("image/") ? (
                  <img
                    src={publication.media_files[0].file_path}
                    alt="Preview"
                    className="max-w-full max-h-[600px] object-contain transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-4 p-12 text-center">
                    <div className="flex items-center justify-center w-16 h-16 bg-gray-200 rounded-full dark:bg-zinc-700">
                      <AlertCircle className="w-8 h-8 text-gray-400" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">
                        Vista previa limitada
                      </p>
                      <p className="mt-1 text-sm text-gray-400">
                        Este archivo de tipo "
                        {publication.media_files[0].file_type}" se procesará
                        para el canal final.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Content Body */}
            <div className="mb-10">
              <h3 className="flex items-center gap-2 mb-4 text-sm font-bold tracking-widest text-gray-400 uppercase dark:text-zinc-500">
                <MessageSquare className="w-4 h-4" />
                Cuerpo del Mensaje
              </h3>
              <div className="p-6 bg-gray-50 dark:bg-zinc-950/50 rounded-lg border border-gray-100 dark:border-zinc-800/50">
                <div className="text-lg font-medium leading-relaxed text-gray-700 whitespace-pre-wrap dark:text-zinc-300">
                  {publication.description}
                </div>
              </div>
            </div>

            <hr className="mb-10 border-gray-100 dark:border-zinc-800" />

            {/* Actions */}
            {!showRejectReason ? (
              <div className="flex flex-col gap-4 sm:flex-row">
                <Button
                  onClick={handleApprove}
                  disabled={processing}
                  className="flex-[2] bg-green-600 hover:bg-green-700 text-white h-16 text-lg font-bold rounded-lg shadow-lg shadow-green-500/20 active:scale-95 transition-all"
                  icon={<Check className="w-6 h-6" />}
                >
                  {processing ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    "Aprobar Contenido"
                  )}
                </Button>
                <Button
                  onClick={() => setShowRejectReason(true)}
                  disabled={processing}
                  variant="secondary"
                  buttonStyle="outline"
                  className="flex-1 border-gray-200 dark:border-zinc-700 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 hover:border-red-200 h-16 text-lg font-bold rounded-lg active:scale-95 transition-all"
                  icon={<X className="w-6 h-6" />}
                >
                  Solicitar Cambios
                </Button>
              </div>
            ) : (
              <form
                onSubmit={handleReject}
                className="space-y-4 duration-500 animate-in fade-in slide-in-from-top-4"
              >
                <div className="flex items-center gap-2 p-3 mb-2 font-bold text-red-600 border border-red-100 rounded-lg bg-red-50 dark:bg-red-900/10 dark:text-red-400 dark:border-red-800/20">
                  <MessageSquare className="w-5 h-5" />
                  ¿Qué cambios necesitas en este contenido?
                </div>
                <textarea
                  value={data.reason}
                  onChange={(e) => setData("reason", e.target.value)}
                  className="w-full h-40 p-5 text-lg transition-all border-gray-200 shadow-inner rounded-lg dark:border-zinc-700 dark:bg-zinc-850 focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-700 dark:text-zinc-200"
                  placeholder="Por favor, describe detalladamente qué cambios te gustaría ver..."
                  required
                />
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    type="submit"
                    disabled={processing}
                    className="flex-[2] bg-red-600 hover:bg-red-700 text-white h-14 font-bold rounded-lg shadow-lg shadow-red-500/20"
                  >
                    {processing ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      "Enviar Comentarios de Rechazo"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowRejectReason(false)}
                    className="flex-1 h-14 font-bold rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800"
                  >
                    Volver
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>

        <footer className="mt-12 text-center">
          <p className="text-sm text-gray-400 dark:text-zinc-600">
            Este es un enlace seguro generado por <strong>ContentFlow</strong>{" "}
            para <strong>{publication.workspace?.name}</strong>.
          </p>
          <p className="mt-2 text-xs text-gray-300 dark:text-zinc-700">
            ID de Referencia: {publication.id} • Token: {token.substring(0, 8)}
            ...
          </p>
        </footer>
      </main>
    </div>
  );
};

export default ClientPortal;
