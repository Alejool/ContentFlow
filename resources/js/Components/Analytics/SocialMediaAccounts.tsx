import PieChart from "@/Components/Statistics/PieChart";
import { SeededRandom } from "@/Utils/stableMock";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

interface SocialMediaAccount {
  id: number;
  platform: string;
  account_name: string;
  followers: number;
  engagement_rate: number;
  reach: number;
  follower_growth_30d: number;
}

interface SocialMediaAccountsProps {
  accounts: SocialMediaAccount[];
  theme?: "light" | "dark";
  showChart?: boolean;
}

export default function SocialMediaAccounts({
  accounts,
  theme = "light",
  showChart = true,
}: SocialMediaAccountsProps) {
  const { t } = useTranslation();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const mockAccounts: SocialMediaAccount[] = [
    {
      id: 101,
      platform: "instagram",
      account_name: "contentflow_oficial (Imaginaria)",
      followers: 15420,
      engagement_rate: 4.2,
      reach: 45000,
      follower_growth_30d: 350,
    },
    {
      id: 102,
      platform: "tiktok",
      account_name: "contentflow.app (Imaginaria)",
      followers: 54000,
      engagement_rate: 8.5,
      reach: 154000,
      follower_growth_30d: 1500,
    },
  ];

  // Inyectar datos a cuentas vacías y agregar imaginarias si hay pocas
  const displayAccounts =
    accounts.length > 0
      ? [
          ...accounts.map((acc) => {
            if (acc.followers === 0 && acc.reach === 0) {
              const rng = new SeededRandom(acc.id || acc.account_name);
              return {
                ...acc,
                account_name: `${acc.account_name} (Datos Simulados)`,
                followers: rng.nextInt(1000, 6000),
                engagement_rate: 3.5,
                reach: rng.nextInt(5000, 25000),
                follower_growth_30d: rng.nextInt(10, 210),
              };
            }
            return acc;
          }),
          ...(accounts.length <= 1 ? mockAccounts : []),
        ]
      : mockAccounts;

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = window.innerWidth > 1024 ? 400 : window.innerWidth;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div
      className={`rounded-lg border border-gray-100 bg-white p-6 shadow-lg transition-colors duration-300 dark:border-neutral-700/50 dark:bg-neutral-800/50 dark:backdrop-blur-sm`}
    >
      <div className="mb-8 flex flex-col items-center justify-between gap-4 md:flex-row">
        <h2 className={`text-xl font-bold text-gray-900 dark:text-gray-100`}>
          {t("analytics.socialMedia.title")}
        </h2>
      </div>

      {showChart && displayAccounts.length > 0 && (
        <div className="mb-10">
          <h3
            className={`mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400`}
          >
            {t("analytics.charts.followersByPlatform")}
          </h3>
          <div
            className={`rounded-lg p-4 transition-colors duration-300 ${
              theme === "dark"
                ? "border border-neutral-700/30 bg-neutral-800/30"
                : "border border-gray-100 bg-gray-50/50"
            }`}
          >
            <PieChart
              data={displayAccounts.map((acc) => ({
                name:
                  acc.account_name || acc.platform.charAt(0).toUpperCase() + acc.platform.slice(1),
                value: acc.followers,
              }))}
              theme={theme}
            />
          </div>
        </div>
      )}

      {accounts.length === 0 && (
        <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800 dark:border-orange-800/50 dark:bg-orange-900/20 dark:text-orange-300">
          <strong>Modo de demostración:</strong> No tienes cuentas conectadas. Se están mostrando
          datos de prueba.
        </div>
      )}

      <div className="group relative">
        {/* Navigation Buttons */}
        {displayAccounts.length > 2 && (
          <>
            <button
              onClick={() => scroll("left")}
              className={`absolute left-0 top-1/2 z-10 -ml-4 -translate-y-1/2 rounded-full p-2 opacity-0 shadow-lg transition-all disabled:opacity-0 group-hover:opacity-100 ${
                theme === "dark"
                  ? "bg-neutral-800 text-white hover:bg-neutral-700"
                  : "bg-white text-gray-800 hover:bg-gray-50"
              }`}
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={() => scroll("right")}
              className={`absolute right-0 top-1/2 z-10 -mr-4 -translate-y-1/2 rounded-full p-2 opacity-0 shadow-lg transition-all disabled:opacity-0 group-hover:opacity-100 ${
                theme === "dark"
                  ? "bg-neutral-800 text-white hover:bg-neutral-700"
                  : "bg-white text-gray-800 hover:bg-gray-50"
              }`}
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}

        <div
          ref={scrollContainerRef}
          className="hide-scrollbars flex snap-x snap-mandatory gap-6 overflow-x-auto pb-6"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {displayAccounts.map((account) => (
            <div
              key={account.id}
              className={`w-[85vw] shrink-0 snap-center rounded-lg p-6 transition-all duration-300 hover:scale-[1.02] sm:w-[350px] md:w-[400px] ${
                theme === "dark"
                  ? "border border-neutral-700/30 bg-neutral-800/30 hover:border-neutral-600/50"
                  : "border border-gray-200 hover:border-gray-300 hover:shadow-md"
              }`}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3
                  className={`text-lg font-semibold ${
                    theme === "dark" ? "text-gray-100" : "text-gray-900"
                  }`}
                >
                  <span className="capitalize">{account.platform}</span>
                  {account.account_name && (
                    <span className="ml-1 text-sm font-normal opacity-70">
                      ({account.account_name})
                    </span>
                  )}
                </h3>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    account.follower_growth_30d > 0
                      ? theme === "dark"
                        ? "bg-green-900/30 text-green-300"
                        : "bg-green-100 text-green-800"
                      : theme === "dark"
                        ? "bg-primary-900/30 text-primary-300"
                        : "bg-primary-100 text-primary-800"
                  }`}
                >
                  {account.follower_growth_30d > 0 ? "+" : ""}
                  {account.follower_growth_30d}
                </span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
                    {t("analytics.socialMedia.followers")}
                  </span>
                  <span
                    className={`font-semibold ${
                      theme === "dark" ? "text-gray-100" : "text-gray-900"
                    }`}
                  >
                    {account.followers.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
                    {t("analytics.socialMedia.engagementRate")}
                  </span>
                  <span
                    className={`font-semibold ${
                      theme === "dark" ? "text-gray-100" : "text-gray-900"
                    }`}
                  >
                    {account.engagement_rate}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
                    {t("analytics.socialMedia.reach")}
                  </span>
                  <span
                    className={`font-semibold ${
                      theme === "dark" ? "text-gray-100" : "text-gray-900"
                    }`}
                  >
                    {account.reach.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
