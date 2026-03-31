import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import CheckoutButton from '@/Components/Stripe/CheckoutButton';
import { FiCheck, FiZap, FiTrendingUp, FiUsers, FiStar, FiGift } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  period: string;
  icon: React.ComponentType<{ className?: string }>;
  features: PlanFeature[];
  highlighted?: boolean;
  badge?: string;
  buttonText: string;
  buttonVariant: 'primary' | 'secondary' | 'outline';
}

export default function Pricing() {
  const { t } = useTranslation();

  const plans: Plan[] = [
    {
      id: 'free',
      name: t('pricing.plans.free.name'),
      description: t('pricing.plans.free.description'),
      price: 0,
      period: t('pricing.perMonth'),
      icon: FiGift,
      features: [
        { text: `5 ${t('pricing.features.publications')}`, included: true },
        { text: `1 ${t('pricing.features.socialAccounts')}`, included: true },
        { text: t('pricing.features.basicAnalytics'), included: true },
        { text: `100 MB ${t('pricing.features.storage')}`, included: true },
        { text: t('pricing.features.withWatermark'), included: true },
        { text: t('pricing.features.emailSupport'), included: true },
        { text: t('pricing.features.advancedAnalytics'), included: false },
        { text: t('pricing.features.prioritySupport'), included: false },
      ],
      buttonText: t('pricing.currentPlan'),
      buttonVariant: 'outline',
    },
    {
      id: 'starter',
      name: t('pricing.plans.starter.name'),
      description: t('pricing.plans.starter.description'),
      price: 19.99,
      period: t('pricing.perMonth'),
      icon: FiZap,
      features: [
        { text: `50 ${t('pricing.features.publications')}`, included: true },
        { text: `3 ${t('pricing.features.socialAccounts')}`, included: true },
        { text: t('pricing.features.advancedAnalytics'), included: true },
        { text: `5 GB ${t('pricing.features.storage')}`, included: true },
        { text: `100 ${t('pricing.features.aiRequests')}`, included: true },
        { text: t('pricing.features.noWatermark'), included: true },
        { text: t('pricing.features.calendarSync'), included: true },
        { text: t('pricing.features.emailSupport'), included: true },
      ],
      buttonText: t('pricing.selectPlan'),
      buttonVariant: 'secondary',
    },
    {
      id: 'professional',
      name: t('pricing.plans.professional.name'),
      description: t('pricing.plans.professional.description'),
      price: 49.99,
      period: t('pricing.perMonth'),
      icon: FiTrendingUp,
      highlighted: true,
      badge: t('pricing.mostPopular'),
      features: [
        { text: t('pricing.features.publicationsUnlimited'), included: true },
        { text: `10 ${t('pricing.features.socialAccounts')}`, included: true },
        { text: t('pricing.features.advancedAnalytics'), included: true },
        { text: `50 GB ${t('pricing.features.storage')}`, included: true },
        { text: t('pricing.features.aiRequestsUnlimited'), included: true },
        { text: `5 ${t('pricing.features.teamMembers')}`, included: true },
        { text: t('pricing.features.prioritySupport'), included: true },
        { text: t('pricing.features.bulkOperations'), included: true },
      ],
      buttonText: t('pricing.selectPlan'),
      buttonVariant: 'primary',
    },
    {
      id: 'enterprise',
      name: t('pricing.plans.enterprise.name'),
      description: t('pricing.plans.enterprise.description'),
      price: 149.99,
      period: t('pricing.perMonth'),
      icon: FiUsers,
      features: [
        { text: t('pricing.features.publicationsUnlimited'), included: true },
        { text: t('pricing.features.socialAccountsUnlimited'), included: true },
        { text: t('pricing.features.advancedAnalytics'), included: true },
        { text: `500 GB ${t('pricing.features.storage')}`, included: true },
        { text: t('pricing.features.aiRequestsUnlimited'), included: true },
        { text: t('pricing.features.teamMembersUnlimited'), included: true },
        { text: t('pricing.features.dedicatedSupport'), included: true },
        { text: t('pricing.features.apiAccess'), included: true },
      ],
      buttonText: t('pricing.selectPlan'),
      buttonVariant: 'secondary',
    },
  ];

  return (
    <AuthenticatedLayout>
      <Head title={t('pricing.title')} />

      <div className="bg-gradient-to-b from-gray-50 to-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-16 text-center">
            <h1 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
              {t('pricing.title')}
            </h1>
            <p className="mx-auto max-w-3xl text-lg text-gray-600 md:text-xl">
              {t('pricing.subtitle')}
            </p>
          </div>

          {/* Plans Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            {plans.map((plan) => {
              const Icon = plan.icon;
              const isHighlighted = plan.highlighted;

              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col rounded-2xl bg-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                    isHighlighted
                      ? 'border-2 border-primary-500 ring-4 ring-primary-100'
                      : 'border-2 border-gray-200'
                  } `}
                >
                  {/* Badge */}
                  {plan.badge && (
                    <div className="absolute -top-4 left-1/2 z-10 -translate-x-1/2 transform">
                      <div className="flex items-center gap-1 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-1.5 text-sm font-semibold text-white shadow-lg">
                        <FiStar className="h-4 w-4" />
                        {plan.badge}
                      </div>
                    </div>
                  )}

                  {/* Card Content */}
                  <div className="flex h-full flex-col p-6">
                    {/* Icon & Title */}
                    <div className="mb-6 text-center">
                      <div
                        className={`mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl ${
                          isHighlighted
                            ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white'
                            : 'bg-gray-100 text-gray-700'
                        } `}
                      >
                        <Icon className="h-7 w-7" />
                      </div>

                      <h3 className="mb-2 text-2xl font-bold text-gray-900">{plan.name}</h3>

                      <p className="min-h-[40px] text-sm text-gray-600">{plan.description}</p>
                    </div>

                    {/* Price */}
                    <div className="mb-6 border-b border-gray-200 pb-6 text-center">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-2xl font-semibold text-gray-900">$</span>
                        <span className="text-5xl font-bold text-gray-900">{plan.price}</span>
                        <span className="text-base text-gray-600">{plan.period}</span>
                      </div>
                    </div>

                    {/* Features */}
                    <ul className="mb-8 flex-grow space-y-3">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <div
                            className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ${
                              feature.included
                                ? isHighlighted
                                  ? 'bg-primary-100 text-primary-600'
                                  : 'bg-green-100 text-green-600'
                                : 'bg-gray-100 text-gray-400'
                            } `}
                          >
                            <FiCheck className="h-3.5 w-3.5" strokeWidth={3} />
                          </div>
                          <span
                            className={`text-sm ${feature.included ? 'text-gray-700' : 'text-gray-400 line-through'} `}
                          >
                            {feature.text}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA Button */}
                    <div className="mt-auto">
                      {plan.buttonVariant === 'primary' ? (
                        <CheckoutButton
                          className={`w-full transform rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:scale-105 hover:from-primary-600 hover:to-primary-700 hover:shadow-xl`}
                        />
                      ) : plan.buttonVariant === 'secondary' ? (
                        <button
                          className={`w-full rounded-xl bg-gray-900 px-6 py-3 font-semibold text-white shadow-md transition-all duration-200 hover:bg-gray-800 hover:shadow-lg`}
                        >
                          {plan.buttonText}
                        </button>
                      ) : (
                        <button
                          disabled
                          className={`w-full cursor-not-allowed rounded-xl border-2 border-gray-200 bg-gray-100 px-6 py-3 font-semibold text-gray-500`}
                        >
                          {plan.buttonText}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Info */}
          <div className="mt-16 space-y-4 text-center">
            <p className="text-gray-600">
              {t('pricing.faq')}{' '}
              <a
                href="mailto:support@example.com"
                className="font-semibold text-primary-600 hover:text-primary-700"
              >
                {t('pricing.contactUs')}
              </a>
            </p>
            <p className="text-sm text-gray-500">
              Pagos seguros procesados por Stripe. Cancela en cualquier momento.
            </p>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
