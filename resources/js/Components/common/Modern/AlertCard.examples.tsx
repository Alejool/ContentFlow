import { Trans } from 'react-i18next';
import AlertCard from './AlertCard';

/**
 * Ejemplos de uso del componente AlertCard
 * Este archivo muestra diferentes formas de usar el componente AlertCard
 */

export const AlertCardExamples = () => {
  return (
    <div className="space-y-4 p-6">
      <h2 className="text-xl font-bold mb-4">Ejemplos de AlertCard</h2>
      
      {/* Alerta básica de información */}
      <AlertCard
        type="info"
        message="Esta es una alerta de información básica."
      />

      {/* Alerta con título */}
      <AlertCard
        type="warning"
        title="Advertencia"
        message="Esta es una alerta de advertencia con título."
      />

      {/* Alerta amber (más intensa) */}
      <AlertCard
        type="amber"
        title="Sesión Duplicada"
        message="Se ha detectado otra sesión activa desde otro navegador."
      />

      {/* Alerta con contenido JSX */}
      <AlertCard
        type="info"
        title="Eres el editor actual"
        message={
          <div>
            <p>Hay <strong>2 usuarios</strong> esperando para editar.</p>
            <p className="text-xs mt-1 opacity-80">
              Los cambios se guardarán automáticamente.
            </p>
          </div>
        }
      />

      {/* Alerta con Trans (i18n) */}
      <AlertCard
        type="warning"
        title="Publicación en Revisión"
        message={
          <div>
            <Trans
              i18nKey="publications.modal.edit.pendingReviewWarningHint"
              components={{
                1: <span className="font-medium" />,
              }}
            />
          </div>
        }
      />

      {/* Alerta de éxito */}
      <AlertCard
        type="success"
        title="Operación Exitosa"
        message="La publicación se ha guardado correctamente."
      />

      {/* Alerta de error */}
      <AlertCard
        type="error"
        title="Error de Validación"
        message="Por favor, corrige los errores antes de continuar."
      />

      {/* Alerta de peligro */}
      <AlertCard
        type="danger"
        title="Acción Irreversible"
        message="Esta acción no se puede deshacer. ¿Estás seguro?"
      />

      {/* Alerta con animación personalizada */}
      <AlertCard
        type="amber"
        title="Conexión Perdida"
        message="Reconectando automáticamente..."
        className="animate-pulse"
      />
    </div>
  );
};

export default AlertCardExamples;