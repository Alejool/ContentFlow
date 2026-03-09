import { Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useActiveAddons } from '@/Hooks/useActiveAddons';
import { CarouselPagination, CarouselDots } from '@/Components/common/CarouselPagination';
import { AddonCard } from './AddonCard';

interface ActiveAddonsCardsProps {
    showCarousel?: boolean;
}

export function ActiveAddonsCards({ showCarousel = true }: ActiveAddonsCardsProps) {
    const { t } = useTranslation();
    const { addons, loading, totalSpent } = useActiveAddons();
    const [currentSlide, setCurrentSlide] = useState(0);

    // No mostrar nada mientras carga
    if (loading) {
        return null;
    }

    // No mostrar si no hay add-ons
    if (addons.length === 0) {
        return null;
    }

    // Configuración del carrusel
    const itemsPerSlide = 4;
    const totalSlides = Math.ceil(addons.length / itemsPerSlide);
    const showCarouselControls = showCarousel && addons.length > itemsPerSlide;

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % totalSlides);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
    };

    const getCurrentSlideAddons = () => {
        const start = currentSlide * itemsPerSlide;
        return addons.slice(start, start + itemsPerSlide);
    };



    return (
        <div className="space-y-4">
            {/* Header con total gastado */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Package className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                        {t('subscription.addons.additionalPackages', 'Paquetes Adicionales')}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {addons.length} {addons.length === 1 ? t('subscription.addons.activeAddon', 'paquete activo') : t('subscription.addons.activeAddonsPlural', 'paquetes activos')} • 
                        <span className="font-semibold text-primary-600 dark:text-primary-400 ml-1">
                            ${totalSpent.toFixed(2)} {t('subscription.addons.totalSpent', 'gastado')}
                        </span>
                    </p>
                </div>

                {/* Controles de carrusel */}
                {showCarouselControls && (
                    <CarouselPagination
                        currentSlide={currentSlide}
                        totalSlides={totalSlides}
                        onPrevious={prevSlide}
                        onNext={nextSlide}
                    />
                )}
            </div>

            {/* Grid de add-ons o Carrusel */}
            {showCarouselControls ? (
                <div className="relative">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {getCurrentSlideAddons().map(addon => (
                            <AddonCard key={addon.sku} addon={addon} />
                        ))}
                    </div>

                    {/* Indicadores de puntos */}
                    <CarouselDots
                        totalSlides={totalSlides}
                        currentSlide={currentSlide}
                        onDotClick={(index) => setCurrentSlide(index)}
                        className="mt-4"
                    />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {addons.map(addon => (
                        <AddonCard key={addon.sku} addon={addon} />
                    ))}
                </div>
            )}
        </div>
    );
}
