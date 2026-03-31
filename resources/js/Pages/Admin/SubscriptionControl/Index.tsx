import AdminNavigation from '@/Components/Admin/AdminNavigation';
import AlertCard from '@/Components/common/Modern/AlertCard';
import Button from '@/Components/common/Modern/Button';
import { DynamicModal } from '@/Components/common/Modern/DynamicModal';
import Switch from '@/Components/common/Modern/Switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { AlertTriangle, Clock, RefreshCw, Save } from 'lucide-react';
import { useState } from 'react';

interface SubscriptionSettings {
  demo_mode: boolean;
  purchases_enabled: boolean;
  grace_period_days: number;
  max_retry_attempts: number;
  retry_interval_hours: number;
}

interface Props {
  settings: SubscriptionSettings;
}

interface PendingToggle {
  field: 'demo_mode' | 'purchases_enabled';
  newValue: boolean;
  label: string;
  warningMessage: string;
}

export default function SubscriptionControlIndex({ settings }: Props) {
  const { data, setData, put, processing, errors, reset } = useForm<SubscriptionSettings>({
    demo_mode: settings.demo_mode,
    purchases_enabled: settings.purchases_enabled,
    grace_period_days: settings.grace_period_days,
    max_retry_attempts: settings.max_retry_attempts,
    retry_interval_hours: settings.retry_interval_hours,
  });

  const [pendingToggle, setPendingToggle] = useState<PendingToggle | null>(null);
  const [numericErrors, setNumericErrors] = useState<
    Partial<Record<keyof SubscriptionSettings, string>>
  >({});

  const handleToggleRequest = (field: 'demo_mode' | 'purchases_enabled', newValue: boolean) => {
    const messages: Record<'demo_mode' | 'purchases_enabled', { label: string; warning: string }> =
      {
        demo_mode: {
          label: 'Modo Demo',
          warning: newValue
            ? 'Activar el modo demo restringirá el sistema al plan gratuito. Los usuarios no podrán iniciar nuevas compras.'
            : 'Desactivar el modo demo permitirá que los usuarios vuelvan a comprar planes de pago.',
        },
        purchases_enabled: {
          label: 'Compras',
          warning: newValue
            ? 'Habilitar las compras permitirá que los usuarios inicien nuevos flujos de pago.'
            : 'Deshabilitar las compras bloqueará todos los nuevos intentos de pago en el sistema.',
        },
      };

    setPendingToggle({
      field,
      newValue,
      label: messages[field].label,
      warningMessage: messages[field].warning,
    });
  };

  const confirmToggle = () => {
    if (!pendingToggle) return;
    const toggle = pendingToggle;

    setPendingToggle(null);

    // Update the data and submit
    setData(toggle.field, toggle.newValue);

    // Use router.put with explicit data to avoid timing issues
    router.put(
      '/admin/subscription-control/settings',
      {
        ...data,
        [toggle.field]: toggle.newValue,
      },
      {
        preserveScroll: true,
      },
    );
  };

  const cancelToggle = () => {
    setPendingToggle(null);
  };

  const validateNumeric = (field: keyof SubscriptionSettings, value: number): string | null => {
    if (!Number.isInteger(value) || value < 1) {
      return 'Debe ser un número entero positivo.';
    }
    const maxValues: Partial<Record<keyof SubscriptionSettings, number>> = {
      grace_period_days: 365,
      max_retry_attempts: 10,
      retry_interval_hours: 168,
    };
    const max = maxValues[field];
    if (max && value > max) {
      return `El valor máximo permitido es ${max}.`;
    }
    return null;
  };

  const handleNumericChange = (
    field: 'grace_period_days' | 'max_retry_attempts' | 'retry_interval_hours',
    rawValue: string,
  ) => {
    const parsed = parseInt(rawValue, 10);
    const numValue = isNaN(parsed) ? 0 : parsed;
    setData(field, numValue);

    const error = validateNumeric(field, numValue);
    setNumericErrors((prev) => ({ ...prev, [field]: error ?? undefined }));
  };

  const handleSaveNumeric = () => {
    const fields: Array<'grace_period_days' | 'max_retry_attempts' | 'retry_interval_hours'> = [
      'grace_period_days',
      'max_retry_attempts',
      'retry_interval_hours',
    ];

    const newErrors: Partial<Record<keyof SubscriptionSettings, string>> = {};
    let hasError = false;

    for (const field of fields) {
      const error = validateNumeric(field, data[field] as number);
      if (error) {
        newErrors[field] = error;
        hasError = true;
      }
    }

    setNumericErrors(newErrors);
    if (hasError) return;

    put('/admin/subscription-control/settings', { preserveScroll: true });
  };

  const isDemoModeActive = data.demo_mode;
  const isPurchasesEnabled = data.purchases_enabled;

  return (
    <AuthenticatedLayout
      header={
        <div className="text-gray-900 dark:text-gray-100">
          <h2 className="text-3xl font-bold">Control de Suscripciones</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Gestiona el modo demo, pagos y parámetros de renovación del sistema.
          </p>
        </div>
      }
    >
      <Head title="Control de Suscripciones" />

      <AdminNavigation currentRoute="/admin/subscription-control" />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          {/* Status summary */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div
              className={`rounded-xl border p-4 ${isDemoModeActive ? 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20' : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'}`}
            >
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Modo Demo</p>
              <p
                className={`mt-1 text-lg font-bold ${isDemoModeActive ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}`}
              >
                {isDemoModeActive ? 'Activo' : 'Inactivo'}
              </p>
            </div>
            <div
              className={`rounded-xl border p-4 ${!isPurchasesEnabled ? 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20' : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'}`}
            >
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Compras</p>
              <p
                className={`mt-1 text-lg font-bold ${isPurchasesEnabled ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
              >
                {isPurchasesEnabled ? 'Habilitadas' : 'Deshabilitadas'}
              </p>
            </div>
          </div>

          {isDemoModeActive && (
            <AlertCard
              type="amber"
              title="Modo Demo Activo"
              message="El sistema está en modo demo. Solo el plan gratuito está disponible y las compras están bloqueadas independientemente de la configuración de compras."
            />
          )}

          {!isPurchasesEnabled && !isDemoModeActive && (
            <AlertCard
              type="error"
              title="Compras Deshabilitadas"
              message="Las compras están deshabilitadas. Los usuarios no pueden iniciar nuevos flujos de pago."
            />
          )}

          {/* Toggle controls */}
          <Card className="border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <CardHeader className="border-b border-gray-200 dark:border-gray-700">
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Controles de Emergencia
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Cambios que afectan inmediatamente a todos los usuarios del sistema.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Demo Mode Toggle */}
              <div className="flex items-start justify-between gap-4 rounded-xl border border-gray-200 p-5 dark:border-gray-700">
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    Modo Demo
                  </h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Restringe el sistema al plan gratuito. Los usuarios con planes de pago activos
                    no se ven afectados.
                  </p>
                  <p className="mt-2 text-xs font-medium">
                    Estado:{' '}
                    <span
                      className={
                        isDemoModeActive
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-green-600 dark:text-green-400'
                      }
                    >
                      Modo Demo: {isDemoModeActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </p>
                </div>
                <Switch
                  id="demo_mode"
                  label=""
                  checked={data.demo_mode}
                  onChange={(val) => handleToggleRequest('demo_mode', val)}
                  isDisabled={processing}
                />
              </div>

              {/* Purchases Enabled Toggle */}
              <div className="flex items-start justify-between gap-4 rounded-xl border border-gray-200 p-5 dark:border-gray-700">
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    Habilitar Compras
                  </h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Control de emergencia para deshabilitar todos los flujos de pago. Los planes
                    activos no se interrumpen.
                  </p>
                  <p className="mt-2 text-xs font-medium">
                    Estado:{' '}
                    <span
                      className={
                        isPurchasesEnabled
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }
                    >
                      Compras: {isPurchasesEnabled ? 'Habilitadas' : 'Deshabilitadas'}
                    </span>
                  </p>
                </div>
                <Switch
                  id="purchases_enabled"
                  label=""
                  checked={data.purchases_enabled}
                  onChange={(val) => handleToggleRequest('purchases_enabled', val)}
                  isDisabled={processing}
                />
              </div>
            </CardContent>
          </Card>

          {/* Numeric settings */}
          <Card className="border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <CardHeader className="border-b border-gray-200 dark:border-gray-700">
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <RefreshCw className="h-5 w-5 text-blue-500" />
                Parámetros de Renovación
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Configuración del período de gracia y reintentos de cobro.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              <NumericField
                id="grace_period_days"
                label="Días de Período de Gracia"
                description="Días que un workspace mantiene acceso al plan de pago tras una renovación fallida."
                icon={<Clock className="h-4 w-4 text-gray-400" />}
                value={data.grace_period_days}
                onChange={(v) => handleNumericChange('grace_period_days', v)}
                error={numericErrors.grace_period_days ?? errors.grace_period_days}
                min={1}
                max={365}
                unit="días"
              />
              <NumericField
                id="max_retry_attempts"
                label="Máximo de Reintentos de Cobro"
                description="Número máximo de veces que se reintentará el cobro antes de iniciar el período de gracia."
                icon={<RefreshCw className="h-4 w-4 text-gray-400" />}
                value={data.max_retry_attempts}
                onChange={(v) => handleNumericChange('max_retry_attempts', v)}
                error={numericErrors.max_retry_attempts ?? errors.max_retry_attempts}
                min={1}
                max={10}
                unit="intentos"
              />
              <NumericField
                id="retry_interval_hours"
                label="Intervalo entre Reintentos"
                description="Horas de espera entre cada reintento de cobro fallido."
                icon={<Clock className="h-4 w-4 text-gray-400" />}
                value={data.retry_interval_hours}
                onChange={(v) => handleNumericChange('retry_interval_hours', v)}
                error={numericErrors.retry_interval_hours ?? errors.retry_interval_hours}
                min={1}
                max={168}
                unit="horas"
              />

              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleSaveNumeric}
                  disabled={processing || Object.values(numericErrors).some(Boolean)}
                  loading={processing}
                  loadingText="Guardando..."
                  icon={Save}
                  iconPosition="left"
                >
                  Guardar Parámetros
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmation Modal */}
      <DynamicModal
        isOpen={!!pendingToggle}
        onClose={cancelToggle}
        title={`Confirmar cambio: ${pendingToggle?.label || ''}`}
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">Advertencia</span>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400">
            {pendingToggle?.warningMessage}
          </p>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" buttonStyle="ghost" onClick={cancelToggle}>
              Cancelar
            </Button>
            <Button
              variant={pendingToggle?.newValue ? 'primary' : 'danger'}
              buttonStyle="solid"
              onClick={confirmToggle}
              loading={processing}
              loadingText="Aplicando..."
            >
              {pendingToggle?.newValue ? 'Activar' : 'Desactivar'}
            </Button>
          </div>
        </div>
      </DynamicModal>
    </AuthenticatedLayout>
  );
}

interface NumericFieldProps {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  value: number;
  onChange: (value: string) => void;
  error?: string | undefined;
  min: number;
  max: number;
  unit: string;
}

function NumericField({
  id,
  label,
  description,
  icon,
  value,
  onChange,
  error,
  min,
  max,
  unit,
}: NumericFieldProps) {
  return (
    <div className="rounded-xl border border-gray-200 p-5 dark:border-gray-700">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <label
            htmlFor={id}
            className="block text-base font-semibold text-gray-900 dark:text-gray-100"
          >
            {label}
          </label>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{description}</p>
          {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          {icon}
          <input
            id={id}
            type="number"
            min={min}
            max={max}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`w-24 rounded-lg border px-3 py-2 text-right text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-100 ${
              error ? 'border-red-400 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
            }`}
          />
          <span className="text-sm text-gray-500 dark:text-gray-400">{unit}</span>
        </div>
      </div>
    </div>
  );
}
