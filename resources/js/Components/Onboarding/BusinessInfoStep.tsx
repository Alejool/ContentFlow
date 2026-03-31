import Button from '@/Components/common/Modern/Button';
import Input from '@/Components/common/Modern/Input';
import Select from '@/Components/common/Modern/Select';
import Textarea from '@/Components/common/Modern/Textarea';
import { Briefcase, Building2, Target, Users } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

interface BusinessInfoStepProps {
  onComplete: (data: BusinessInfoData) => void;
  onSkip: () => void;
  initialData?: Partial<BusinessInfoData>;
}

// Zod schema for validation
const businessInfoSchema = z.object({
  businessName: z.string().min(1, 'nameRequired'),
  businessIndustry: z.string().min(1, 'industryRequired'),
  businessSize: z.string().min(1, 'sizeRequired'),
  businessGoals: z.string().optional(),
});

export type BusinessInfoData = z.infer<typeof businessInfoSchema>;

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
  onSkip: _onSkip,
  initialData,
}: BusinessInfoStepProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<BusinessInfoData>({
    businessName: initialData?.businessName || '',
    businessIndustry: initialData?.businessIndustry || '',
    businessGoals: initialData?.businessGoals || '',
    businessSize: initialData?.businessSize || '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof BusinessInfoData, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof BusinessInfoData, string>> = {};

    try {
      businessInfoSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          const field = err.path[0] as keyof BusinessInfoData;
          newErrors[field] = t(`businessInfo.errors.${err.message}`);
        });
      }
      setErrors(newErrors);
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onComplete(formData);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-3 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/20">
          <Building2 className="h-8 w-8 text-primary-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('businessInfo.title')}
        </h3>
        <p className="text-gray-600 dark:text-gray-400">{t('businessInfo.description')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Business Name */}
        <Input
          id="businessName"
          label={t('businessInfo.fields.name')}
          value={formData.businessName}
          onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
          error={errors.businessName}
          placeholder={t('businessInfo.placeholders.name')}
          icon={Building2}
          required
        />

        {/* Industry */}
        <Select
          id="businessIndustry"
          label={t('businessInfo.fields.industry')}
          value={formData.businessIndustry}
          onChange={(value) => setFormData({ ...formData, businessIndustry: value as string })}
          error={errors.businessIndustry}
          placeholder={t('businessInfo.placeholders.industry')}
          icon={Briefcase}
          options={INDUSTRIES.map((industry) => ({
            value: industry,
            label: t(`businessInfo.industries.${industry}`),
          }))}
          required
        />

        {/* Business Size */}
        <div>
          <label className="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('businessInfo.fields.size')}
          </label>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {BUSINESS_SIZES.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setFormData({ ...formData, businessSize: size })}
                className={`rounded-lg border-2 p-4 text-center transition-all ${
                  formData.businessSize === size
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-300 hover:border-primary-300 dark:border-neutral-700'
                }`}
              >
                <Users className="mx-auto mb-2 h-6 w-6 text-gray-600 dark:text-gray-400" />
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {t(`businessInfo.sizes.${size}`)}
                </p>
              </button>
            ))}
          </div>
          {errors.businessSize && (
            <p className="mt-1 text-sm text-red-600">{errors.businessSize}</p>
          )}
        </div>

        {/* Goals */}
        <Textarea
          id="businessGoals"
          label={`${t('businessInfo.fields.goals')} (${t('businessInfo.optional')})`}
          value={formData.businessGoals || ''}
          onChange={(e) => setFormData({ ...formData, businessGoals: e.target.value })}
          rows={4}
          placeholder={t('businessInfo.placeholders.goals')}
          icon={Target}
        />

        {/* Actions */}
        <div className="flex justify-end pt-4">
          <Button type="submit" variant="primary" size="lg" className="px-8">
            {t('businessInfo.continue')}
          </Button>
        </div>
      </form>
    </div>
  );
}
