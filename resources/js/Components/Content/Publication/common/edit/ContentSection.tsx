import AiFieldSuggester from '@/Components/AiAssistant/AiFieldSuggester';
import CampaignSelector from '@/Components/Content/Publication/common/CampaignSelector';
import type { ContentType } from '@/Components/Content/Publication/common/ContentTypeIconSelector';
import Input from '@/Components/common/Modern/Input';
import Textarea from '@/Components/common/Modern/Textarea';
import { useContentType } from '@/Hooks/publication/useContentType';
import { getFieldsConfig, isFieldRequired } from '@/constants/contentTypes';
import { FileText, Hash, HelpCircle, Target } from 'lucide-react';
import { memo } from 'react';
import type { FieldErrors, UseFormRegister, UseFormSetValue } from 'react-hook-form';

interface ContentSectionProps {
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  errors: FieldErrors<any>;
  watched: any;
  t: (key: string) => string;
  campaigns?: any[];
  publication?: any;
  onHashtagChange: (value: string) => void;
  disabled?: boolean;
  contentType?: ContentType;
}

const ContentSection = memo(
  ({
    register,
    setValue,
    errors,
    watched,
    t,
    campaigns,
    publication,
    onHashtagChange,
    disabled,
    contentType = 'post',
  }: ContentSectionProps) => {
    const { fieldVisibility, config } = useContentType(contentType);
    const fieldsConfig = getFieldsConfig(contentType);

    // Usar la configuración centralizada para determinar qué campos mostrar
    const shouldShowTitle = !!fieldsConfig.title;
    const shouldShowDescription = !!fieldsConfig.description;
    const shouldShowHashtags = !!fieldsConfig.hashtags;
    const shouldShowGoal = !!fieldsConfig.goal;

    const handleAiSuggestion = (data: any) => {
      if (data.title && shouldShowTitle)
        setValue('title', data.title, {
          shouldValidate: true,
          shouldDirty: true,
        });
      if (data.description && shouldShowDescription)
        setValue('description', data.description, {
          shouldValidate: true,
          shouldDirty: true,
        });
      if (data.goal && shouldShowGoal)
        setValue('goal', data.goal, {
          shouldValidate: true,
          shouldDirty: true,
        });
      if (data.hashtags && shouldShowHashtags) {
        setValue('hashtags', data.hashtags, {
          shouldValidate: true,
          shouldDirty: true,
        });
        onHashtagChange(data.hashtags);
      }
    };

    return (
      <div className={` ${disabled ? 'opacity-75' : ''}`}>
        <div className="flex items-end justify-between px-1">
          <AiFieldSuggester
            fields={watched}
            type="publication"
            onSuggest={handleAiSuggestion}
            {...(disabled !== undefined && { disabled })}
          />
        </div>
        <div className='space-y-4'>
          {shouldShowTitle && (
            <Input
              id="title"
              label={t(fieldsConfig.title?.label || 'publications.modal.edit.titleField')}
              type="text"
              register={register}
              name="title"
              placeholder={t(
                fieldsConfig.title?.placeholder || 'publications.modal.edit.placeholders.title',
              )}
              error={errors.title?.message as string}
              icon={contentType === 'poll' ? HelpCircle : FileText}
              variant="filled"
              sizeType="lg"
              required={isFieldRequired(contentType, 'title')}
              hint={`${watched.title?.length || 0}/70 characters`}
              disabled={disabled}
            />
          )}

          {shouldShowDescription && (
            <Textarea
              id="description"
              label={t(fieldsConfig.description?.label || 'publications.modal.edit.description')}
              register={register}
              name="description"
              placeholder={t('publications.modal.edit.placeholders.description')}
              error={errors.description?.message as string}
              icon={FileText}
              variant="filled"
              size="lg"
              required={isFieldRequired(contentType, 'description')}
              rows={contentType === 'story' ? 3 : 6}
              maxLength={config.descriptionMaxLength}
              showCharCount
              hint={`Maximum ${config.descriptionMaxLength} characters`}
              disabled={disabled}
            />
          )}

          {shouldShowGoal && (
            <Input
              id="goal"
              label={t(fieldsConfig.goal?.label || 'publications.modal.edit.goal')}
              type="text"
              register={register}
              name="goal"
              placeholder={t('publications.modal.edit.placeholders.goal')}
              error={errors.goal?.message as string}
              icon={Target}
              variant="filled"
              sizeType="lg"
              required={isFieldRequired(contentType, 'goal')}
              hint={`${watched.goal?.length || 0}/200 characters`}
              disabled={disabled}
            />
          )}

          {/* Hashtags field - Ahora controlado por la configuración centralizada */}
          {shouldShowHashtags && (
            <Input
              id="hashtags"
              label={t(fieldsConfig.hashtags?.label || 'publications.modal.edit.hashtags')}
              type="text"
              value={watched.hashtags || ''}
              name="hashtags"
              placeholder={t('publications.modal.edit.placeholders.hashtags')}
              required={isFieldRequired(contentType, 'hashtags')}
              error={errors.hashtags?.message as string}
              onChange={(e) => {
                const value = e.target.value;
                setValue('hashtags', value, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
                onHashtagChange(value);
              }}
              icon={Hash}
              variant="filled"
              sizeType="lg"
              hint={`${
                watched.hashtags
                  ? (() => {
                      const hashtagsStr =
                        typeof watched.hashtags === 'string'
                          ? watched.hashtags
                          : Array.isArray(watched.hashtags)
                            ? watched.hashtags.join(' ')
                            : '';

                      // Better hashtag separation logic
                      const hashtagArray = hashtagsStr
                        .split(/[\s,]+/) // Split by spaces or commas
                        .map((tag) => tag.trim())
                        .filter((tag) => tag.startsWith('#') && tag.length > 1);

                      return hashtagArray.length;
                    })()
                  : 0
              }/10 hashtags`}
              disabled={disabled}
            />
          )}

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              {t('publications.modal.edit.campaigns') || 'Add to Campaign'}
            </label>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-neutral-700 dark:bg-black/20">
              <CampaignSelector
                campaigns={campaigns || []}
                selectedId={watched.campaign_id ? parseInt(watched.campaign_id.toString()) : null}
                loading={false}
                t={t}
                onSelectCampaign={(id: number | null) => {
                  setValue('campaign_id', id?.toString() ?? '', {
                    shouldValidate: true,
                  });
                }}
                {...(disabled !== undefined && { disabled })}
              />
            </div>
            {errors.campaign_id?.message && (
              <p className="mt-1 text-xs text-red-500">{errors.campaign_id.message as string}</p>
            )}
          </div>
        </div>
      </div>
    );
  },
);

export default ContentSection;
