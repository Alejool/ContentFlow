import activity from "./activity.json";
import admin from "./admin.json";
import ai from "./ai.json";
import analytics from "./analytics.json";
import approvals from "./approvals.json";
import auth from "./auth.json";
import calendar from "./calendar.json";
import campaigns from "./campaigns.json";
import colors from "./colors.json";
import common from "./common.json";
import dashboard from "./dashboard.json";
import excel from "./excel.json";
import formats from "./formats.json";
import legal from "./legal.json";
import logs from "./logs.json";
import manageContent from "./manageContent.json";
import media from "./media.json";
import nav from "./nav.json";
import notifications from "./notifications.json";
import onboarding from "./onboarding.json";
import pagination from "./pagination.json";
import payment from "./payment.json";
import platformSettings from "./platformSettings.json";
import pricing from "./pricing.json";
import profile from "./profile.json";
import publications from "./publications.json";
import reels from "./reels.json";
import roles from "./roles.json";
import settings from "./settings.json";
import shortcuts from "./shortcuts.json";
import subscription from "./subscription.json";
import twoFactor from "./twoFactor.json";
import validation from "./validation.json";
import videoValidation from "./videoValidation.json";
import welcome from "./welcome.json";
import workspace from "./workspace.json";

export default {
  ...common,
  ...colors,
  ...calendar,
  ...analytics,
  ...campaigns,
  ...dashboard,
  ...excel,
  ...nav,
  ...welcome,
  ...workspace,
  ...pricing,
  ...subscription,
  ...payment,
  ...profile,
  ...platformSettings,
  ...approvals,
  ...pagination,
  ...settings,
  ...publications,
  ...reels,
  ...roles,
  ...logs,
  ...auth,
  ...ai,
  ...admin,
  ...notifications,
  ...manageContent,
  ...media,
  ...legal,
  ...activity,
  ...validation,
  ...videoValidation,
  ...onboarding,
  ...shortcuts,
  twoFactor,
  formats,
};
