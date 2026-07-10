// Last accounts the user published with, per workspace, so new publications
// (full modal or QuickComposer) start with them preselected instead of
// forcing re-selection every time.
const lastAccountsKey = (workspaceId: number | string) =>
  `contentflow:lastAccounts:${workspaceId}`;

export const readLastAccounts = (workspaceId: number | string | undefined): number[] => {
  if (!workspaceId) return [];
  try {
    const raw = localStorage.getItem(lastAccountsKey(workspaceId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'number') : [];
  } catch {
    return [];
  }
};

export const saveLastAccounts = (workspaceId: number | string | undefined, ids: number[]) => {
  if (!workspaceId || ids.length === 0) return;
  try {
    localStorage.setItem(lastAccountsKey(workspaceId), JSON.stringify(ids));
  } catch {
    // Storage full/blocked — preselection is best-effort
  }
};
