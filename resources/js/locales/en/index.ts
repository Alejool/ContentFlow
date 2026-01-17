import ai from "./ai.json";
import analytics from "./analytics.json";
import approvals from "./approvals.json";
import auth from "./auth.json";
import campaigns from "./campaigns.json";
import common from "./common.json";
import dashboard from "./dashboard.json";
import logs from "./logs.json";
import manageContent from "./manageContent.json";
import nav from "./nav.json";
import notifications from "./notifications.json";
import pagination from "./pagination.json";
import platformSettings from "./platformSettings.json";
import profile from "./profile.json";
import publications from "./publications.json";
import settings from "./settings.json";
import welcome from "./welcome.json";
import workspace from "./workspace.json";

export default {
  ...common,
  ...analytics,
  ...campaigns,
  ...dashboard,
  ...nav,
  ...welcome,
  ...workspace,
  ...profile,
  ...platformSettings,
  ...approvals,
  ...pagination,
  ...settings,
  ...publications,
  ...logs,
  ...auth,
  ...ai,
  ...notifications,
  ...manageContent,
};
