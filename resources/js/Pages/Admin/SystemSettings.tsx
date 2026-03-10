import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import AdminNavigation from '@/Components/Admin/AdminNavigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import Button from '@/Components/common/Modern/Button';
import { Badge } from '@/Components/ui/badge';
import Switch from '@/Components/common/Modern/Switch';
import SettingsTabs from '@/Components/Workspace/SettingsTabs';
import AlertCard from '@/Components/common/Modern/AlertCard';
import { 
    Settings, 
    Package, 
    Zap, 
    Puzzle, 
    Globe, 
    Save, 
    CheckCircle2,
    CreditCard
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation();
    const [localSettings, setLocalSettings] = useState<SettingsByCategory>(settings);
    const [hasChanges, setHasChanges] = useState(false);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('plans');

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

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'plans': return Package;
            case 'addons': return Zap;
            case 'features': return Puzzle;
            case 'integrations': return Globe;
            case 'payment_methods': return CreditCard;
            case 'general': return Settings;
            default: return Settings;
        }
    };

    const getCategoryIconElement = (category: string) => {
        const Icon = getCategoryIcon(category);
        return <Icon className="h-5 w-5" />;
    };

    const getImpactBadge = (key: string) => {
        if (key.includes('ai') || key.includes('maintenance_mode')) {
            return <Badge variant="destructive" className="ml-2 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800">{t('admin.system_settings.badges.high_impact')}</Badge>;
        }
        if (key.includes('plan') || key.includes('new_registrations')) {
            return <Badge variant="default" className="ml-2 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800">{t('admin.system_settings.badges.medium_impact')}</Badge>;
        }
        return null;
    };

    const renderSettingCard = (category: keyof SettingsByCategory, setting: Setting) => {
        const isEnabled = setting.value as boolean;
        
        return (
            <div key={setting.id} className="mb-4 p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{setting.label}</h3>
                            {getImpactBadge(setting.key)}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {setting.description}
                        </p>
                        {setting.updated_by && (
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                                {t('admin.system_settings.last_updated', {
                                    date: new Date(setting.updated_at).toLocaleString(t('common.locale') || 'es-ES'),
                                    user: setting.updated_by
                                })}
                            </p>
                        )}
                    </div>
                    <div className="flex-shrink-0">
                        <Switch
                            id={`setting-${setting.id}`}
                            label=""
                            checked={isEnabled}
                            onChange={() => handleToggle(category, setting.id, isEnabled)}
                        />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-center text-gray-900 dark:text-gray-100 mt-6">
                    <div>
                        <h2 className="text-3xl font-bold">{t('admin.system_settings.page_title')}</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {t('admin.system_settings.page_description')}
                        </p>
                    </div>
                    {hasChanges && (
                        <Button 
                            onClick={handleSave} 
                            disabled={saving}
                            icon={Save}
                            iconPosition="left"
                        >
                            {saving ? t('admin.system_settings.saving') : t('admin.system_settings.save_changes')}
                        </Button>
                    )}
                </div>
            }
        >
            <Head title={t('admin.system_settings.page_title')} />

            <AdminNavigation currentRoute="/admin/system-settings" />

            <div className="py-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {hasChanges && (
                        <AlertCard
                            type="info"
                            message={t('admin.system_settings.unsaved_changes')}
                            className="mb-6"
                        />
                    )}

                    <AlertCard
                        type="warning"
                        title={t('admin.system_settings.warning_title')}
                        message={t('admin.system_settings.warning_message')}
                        className="mb-6"
                    />

                    <SettingsTabs
                        tabs={Object.entries(categories).map(([key, label]) => ({
                            id: key,
                            label: t(`admin.system_settings.categories.${key}`) || label,
                            icon: getCategoryIcon(key),
                            enabled: true
                        }))}
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        isDraggable={false}
                    />

                    <div className="mt-6">
                        {Object.entries(categories).map(([categoryKey, categoryLabel]) => (
                            activeTab === categoryKey && (
                                <div key={categoryKey}>
                                    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                        <CardHeader className="border-b border-gray-200 dark:border-gray-700">
                                            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                                                {getCategoryIconElement(categoryKey)}
                                                {t(`admin.system_settings.categories.${categoryKey}`) || categoryLabel}
                                            </CardTitle>
                                            <CardDescription className="text-gray-600 dark:text-gray-400">
                                                {t(`admin.system_settings.descriptions.${categoryKey}`)}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="pt-6">
                                            {localSettings[categoryKey as keyof SettingsByCategory]?.map(setting => 
                                                renderSettingCard(categoryKey as keyof SettingsByCategory, setting)
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>
                            )
                        ))}
                    </div>

                    <Card className="mt-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <CardHeader className="border-b border-gray-200 dark:border-gray-700">
                            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                                {t('admin.system_settings.info_section.title')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                                <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">{t('admin.system_settings.info_section.plans_title')}</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {t('admin.system_settings.info_section.plans_description')}
                                </p>
                            </div>
                            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                                <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">{t('admin.system_settings.info_section.features_title')}</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {t('admin.system_settings.info_section.features_description')}
                                </p>
                            </div>
                            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                                <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">{t('admin.system_settings.info_section.addons_title')}</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {t('admin.system_settings.info_section.addons_description')}
                                </p>
                            </div>
                            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                                <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">{t('admin.system_settings.info_section.integrations_title')}</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {t('admin.system_settings.info_section.integrations_description')}
                                </p>
                            </div>
                            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                                <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">{t('admin.system_settings.info_section.payment_methods_title')}</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {t('admin.system_settings.info_section.payment_methods_description')}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
