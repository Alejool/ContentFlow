import Button from '@/Components/common/Modern/Button';
import Input from '@/Components/common/Modern/Input';
import Select from '@/Components/common/Modern/Select';
import Textarea from '@/Components/common/Modern/Textarea';
import { businessInfoSchema, type BusinessInfoData } from '@/schemas/Onboarding/businessInfo';
import { zodResolver } from '@hookform/resolvers/zod';
import { Briefcase, Building2, Target, Users } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

interface BusinessInfoStepProps {
  onComplete: (data: BusinessInfoData) => void;
  onSkip: () => void;
  initialData?: Partial<BusinessInfoData>;
}

const INDUSTRIES = [
  'technology',
  'retail',
  'healthcare',
  'education',
  'finance',
  'marketing',
  'real_estate',
  'hospitality',
  'manufacturing',
  'other',
];

const BUSINESS_SIZES = ['solo', 'small', 'medium', 'large'];

export default function BusinessInfoStep({
  onComplete,
  onSkip,
  initialData,
}: BusinessInfoStepProps) {
  const { t } = useTranslation();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<BusinessInfoData>({
    resolver: zodResolver(businessInfoSchema),
    defaultValues: {
      businessName: initialData?.businessName || '',
      businessIndustry: initialData?.businessIndustry || '',
      businessGoals: initialData?.businessGoals || '',
      businessSize: initialData?.businessSize || '',
    },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-3 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center ">
          <Building2 className="h-8 w-8 text-primary-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('businessInfo.title')}
        </h3>
        <p className="text-gray-600 dark:text-neutral-400">{t('businessInfo.description')}</p>
      </div>

      <form onSubmit={handleSubmit((data) => onComplete(data))} className="space-y-6">
        {/* Business Name */}
        <Controller
          name="businessName"
          control={control}
          render={({ field }) => (
            <Input
              id="businessName"
              label={t('businessInfo.fields.name')}
              value={field.value}
              onChange={field.onChange}
              error={errors.businessName ? t(`businessInfo.errors.${errors.businessName.message}`) : undefined}
              placeholder={t('businessInfo.placeholders.name')}
              icon={Building2}
              sizeType="lg"
              required
            />
          )}
        />

        {/* Industry */}
        <Controller
          name="businessIndustry"
          control={control}
          render={({ field }) => (
            <Select
              id="businessIndustry"
              label={t('businessInfo.fields.industry')}
              value={field.value}
              onChange={(value) => field.onChange(value as string)}
              searchable={true}
              size="lg"
              error={errors.businessIndustry ? t(`businessInfo.errors.${errors.businessIndustry.message}`) : undefined}
              placeholder={t('businessInfo.placeholders.industry')}
              icon={Briefcase}
              options={INDUSTRIES.map((industry) => ({
                value: industry,
                label: t(`businessInfo.industries.${industry}`),
              }))}
              required
            />
          )}
        />

        {/* Business Size */}
        <Controller
          name="businessSize"
          control={control}
          render={({ field }) => (
            <div>
              <label className="mb-3 block text-sm font-medium text-gray-700 dark:text-neutral-300">
                {t('businessInfo.fields.size')}
              </label>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {BUSINESS_SIZES.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => field.onChange(size)}
                    className={`rounded-lg border-2 p-4 text-center transition-all ${
                      field.value === size
                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-300 hover:border-primary-300 dark:border-neutral-700'
                    }`}
                  >
                    <Users className="mx-auto mb-2 h-6 w-6 text-gray-600 dark:text-neutral-400" />
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {t(`businessInfo.sizes.${size}`)}
                    </p>
                  </button>
                ))}
              </div>
              {errors.businessSize && (
                <p className="mt-1 text-sm text-red-600">
                  {t(`businessInfo.errors.${errors.businessSize.message}`)}
                </p>
              )}
            </div>
          )}
        />

        {/* Goals */}
        <Controller
          name="businessGoals"
          control={control}
          render={({ field }) => (
            <Textarea
              id="businessGoals"
              label={`${t('businessInfo.fields.goals')} (${t('businessInfo.optional')})`}
              value={field.value || ''}
              onChange={field.onChange}
              rows={4}
              placeholder={t('businessInfo.placeholders.goals')}
              icon={Target}
            />
          )}
        />

        {/* Actions */}
        <div className="flex items-center justify-between pt-4">
          <Button type="button" variant="ghost" size="lg" onClick={onSkip}>
            {t('businessInfo.skip', 'Skip for now')}
          </Button>
          <Button type="submit" variant="primary" size="lg" className="px-8">
            {t('businessInfo.continue')}
          </Button>
        </div>
      </form>
    </div>
  );
}
