import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import AdminNavigation from '@/Components/Admin/AdminNavigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import Button from '@/Components/common/Modern/Button';
import { Badge } from '@/Components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { Alert, AlertDescription } from '@/Components/ui/alert';
import { 
    Settings, 
    Package, 
    Zap, 
    Puzzle, 
    Globe, 
    Save, 
    AlertTriangle,
    CheckCircle2,
    Info,
    CreditCard,
    Bell,
    Send
} from 'lucide-react';

interface Setting {
    id: number;
    key: string;
    value: boolean | string | number;
    type: string;
    label: string;
    description: string;
    updated_at: string;
    updated_by: string | null;
}

interface SettingsByCategory {
    plans?: Setting[];
    addons?: Setting[];
    features?: Setting[];
    integrations?: Setting[];
    payment_methods?: Setting[];
    general?: Setting[];
}

interface Props {
    settings: SettingsByCategory;
    categories: Record<string, string>;
}

export default function SystemSettings({ settings, categories }: Props) {
    const [localSettings, setLocalSettings] = useState<SettingsByCategory>(settings);
    const [hasChanges, setHasChanges] = useState(false);
    const [saving, setSaving] = useState(false);
    const [sendingNotification, setSendingNotification] = useState(false);
    const [notificationForm, setNotificationForm] = useState({
        title: '',
        message: '',
        description: '',
        type: 'info' as 'info' | 'success' | 'warning' | 'error',
        icon: 'Bell'
    });

    const handleToggle = (category: keyof SettingsByCategory, settingId: number, currentValue: boolean) => {
        setLocalSettings(prev => ({
            ...prev,
            [category]: prev[category]?.map(s => 
                s.id === settingId ? { ...s, value: !currentValue } : s
            )
        }));
        setHasChanges(true);
    };

    const handleSave = () => {
        setSaving(true);
        
        const changedSettings = Object.values(localSettings)
            .flat()
            .filter(setting => {
                const original = Object.values(settings)
                    .flat()
                    .find(s => s.id === setting.id);
                return original && original.value !== setting.value;
            })
            .map(setting => ({
                id: setting.id,
                value: setting.value
            }));

        router.post('/admin/system-settings/bulk-update', {
            settings: changedSettings
        }, {
            onSuccess: () => {
                setHasChanges(false);
                setSaving(false);
            },
            onError: () => {
                setSaving(false);
            }
        });
    };

    const handleSendNotification = () => {
        if (!notificationForm.title || !notificationForm.message) {
            return;
        }

        setSendingNotification(true);

        router.post('/admin/system-notifications/send', notificationForm, {
            onSuccess: () => {
                setSendingNotification(false);
                setNotificationForm({
                    title: '',
                    message: '',
                    description: '',
                    type: 'info',
                    icon: 'Bell'
                });
            },
            onError: () => {
                setSendingNotification(false);
            }
        });
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'plans': return <Package className="h-5 w-5" />;
            case 'addons': return <Zap className="h-5 w-5" />;
            case 'features': return <Puzzle className="h-5 w-5" />;
            case 'integrations': return <Globe className="h-5 w-5" />;
            case 'payment_methods': return <CreditCard className="h-5 w-5" />;
            case 'general': return <Settings className="h-5 w-5" />;
            default: return <Settings className="h-5 w-5" />;
        }
    };

    const getImpactBadge = (key: string) => {
        if (key.includes('ai') || key.includes('maintenance_mode')) {
            return <Badge variant="destructive" className="ml-2">Alto Impacto</Badge>;
        }
        if (key.includes('plan') || key.includes('new_registrations')) {
            return <Badge variant="default" className="ml-2">Impacto Medio</Badge>;
        }
        return null;
    };

    const renderSettingCard = (category: keyof SettingsByCategory, setting: Setting) => {
        const isEnabled = setting.value as boolean;
        
        return (
            <Card key={setting.id} className="mb-4">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <div className="flex items-center">
                                <h3 className="text-lg font-semibold">{setting.label}</h3>
                                {getImpactBadge(setting.key)}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                                {setting.description}
                            </p>
                            {setting.updated_by && (
                                <p className="text-xs text-muted-foreground mt-2">
                                    Última actualización: {new Date(setting.updated_at).toLocaleString('es-ES')} por {setting.updated_by}
                                </p>
                            )}
                        </div>
                        <div className="ml-4">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isEnabled}
                                    onChange={() => handleToggle(category, setting.id, isEnabled)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                            </label>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between  text-dark dark:text-white">
                    <div>
                        <h2 className="text-2xl font-bold">Configuración del Sistema</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Gestiona planes, características e integraciones del sistema
                        </p>
                    </div>
                    {hasChanges && (
                        <Button 
                            onClick={handleSave} 
                            disabled={saving}
                            icon={Save}
                            iconPosition="left"
                        >
                            {saving ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                    )}
                </div>
            }
        >
            <Head title="Configuración del Sistema" />

            <AdminNavigation currentRoute="/admin/system-settings" />

            <div className="py-6 text-dark dark:text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {hasChanges && (
                        <Alert className="mb-6">
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                                Tienes cambios sin guardar. Haz clic en "Guardar Cambios" para aplicarlos.
                            </AlertDescription>
                        </Alert>
                    )}

                    <Alert className="mb-6 border-yellow-500 bg-yellow-50">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <AlertDescription className="text-yellow-800">
                            <strong>Advertencia:</strong> Los cambios en esta configuración afectan a todo el sistema.
                            Deshabilitar un plan o característica puede impactar a usuarios existentes.
                        </AlertDescription>
                    </Alert>

                    <Tabs defaultValue="plans" className="space-y-6">
                        <TabsList className="grid w-full grid-cols-6">
                            {Object.entries(categories).map(([key, label]) => (
                                <TabsTrigger key={key} value={key} className="flex items-center gap-2">
                                    {getCategoryIcon(key)}
                                    <span className="hidden sm:inline">{label}</span>
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        {Object.entries(categories).map(([categoryKey, categoryLabel]) => (
                            <TabsContent key={categoryKey} value={categoryKey}>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            {getCategoryIcon(categoryKey)}
                                            {categoryLabel}
                                        </CardTitle>
                                        <CardDescription>
                                            {categoryKey === 'plans' && 'Habilita o deshabilita planes de suscripción. Los usuarios existentes mantendrán su plan actual.'}
                                            {categoryKey === 'addons' && 'Controla qué tipos de add-ons pueden comprar los usuarios.'}
                                            {categoryKey === 'features' && 'Activa o desactiva características completas del sistema.'}
                                            {categoryKey === 'integrations' && 'Gestiona las integraciones con servicios externos.'}
                                            {categoryKey === 'payment_methods' && 'Habilita o deshabilita métodos de pago disponibles para los usuarios.'}
                                            {categoryKey === 'general' && 'Configuración general del sistema.'}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {localSettings[categoryKey as keyof SettingsByCategory]?.map(setting => 
                                            renderSettingCard(categoryKey as keyof SettingsByCategory, setting)
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        ))}
                    </Tabs>

                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                Información Importante
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h4 className="font-semibold mb-2">Planes de Suscripción</h4>
                                <p className="text-sm text-muted-foreground">
                                    Al deshabilitar un plan, este dejará de aparecer en la página de precios, pero los usuarios
                                    que ya lo tienen mantendrán su suscripción y acceso a todas las características.
                                </p>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-2">Características</h4>
                                <p className="text-sm text-muted-foreground">
                                    Deshabilitar una característica (como IA) la ocultará y desactivará en todo el sistema,
                                    independientemente del plan del usuario. Úsalo con precaución.
                                </p>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-2">Add-ons</h4>
                                <p className="text-sm text-muted-foreground">
                                    Los add-ons deshabilitados no estarán disponibles para compra, pero los usuarios que ya
                                    los compraron podrán seguir usándolos hasta que se agoten.
                                </p>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-2">Integraciones</h4>
                                <p className="text-sm text-muted-foreground">
                                    Deshabilitar una integración impedirá nuevas conexiones, pero las conexiones existentes
                                    seguirán funcionando hasta que el usuario las desconecte.
                                </p>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-2">Métodos de Pago</h4>
                                <p className="text-sm text-muted-foreground">
                                    Al deshabilitar un método de pago, este dejará de aparecer como opción en el checkout.
                                    Las suscripciones activas con ese método seguirán funcionando normalmente.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
