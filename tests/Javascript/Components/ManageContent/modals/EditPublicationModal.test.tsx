import EditPublicationModal from "@/Components/Content/modals/EditPublicationModal";
import { usePublicationForm } from "@/Hooks/Publications/usePublicationForm";
import { usePublicationLock } from "@/Hooks/Publications/usePublicationLock";
import { useCampaignStore } from "@/stores/Campaign/campaignStore";
import { useAccountsStore } from "@/stores/ConfigSocialMedia/socialAccountsStore";
import { AbilityProvider } from "@/Contexts/Auth/AbilityContext";
import { usePage } from "@inertiajs/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <AbilityProvider>{ui}</AbilityProvider>
    </QueryClientProvider>,
  );
};

// Mocks
vi.mock("@/Hooks/Publications/usePublicationForm");
vi.mock("@/Hooks/Publications/usePublicationLock");
vi.mock("@/stores/Campaign/campaignStore");
vi.mock("@/stores/ConfigSocialMedia/socialAccountsStore");
vi.mock("@inertiajs/react", () => ({
  usePage: vi.fn(),
  useWatch: vi.fn(),
  memo: (c: any) => c,
}));

vi.mock("react-hook-form", () => ({
  useWatch: vi.fn(),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "es" },
  }),
  Trans: ({ i18nKey }: { i18nKey: string }) => <span>{i18nKey}</span>,
}));

// Mock sub-components to simplify
vi.mock("@/Components/Content/modals/common/ModalHeader", () => ({
  default: ({ title }: any) => <div data-testid="modal-header">{title}</div>,
}));
vi.mock("@/Components/Content/modals/common/ModalFooter", () => ({
  default: () => <div data-testid="modal-footer" />,
}));

describe("EditPublicationModal", () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();
  const mockPublication = { id: 1, title: "Test Pub", user_id: 1 };

  beforeEach(() => {
    vi.clearAllMocks();

    (usePage as any).mockReturnValue({
      props: {
        auth: {
          user: { id: 1, name: "Test User" },
          current_workspace: { permissions: ["manage-content", "publish"] },
        },
      },
    });

    (useCampaignStore as any).mockReturnValue({ campaigns: [] });
    (useAccountsStore as any).mockReturnValue({ accounts: [] });

    (usePublicationLock as any).mockReturnValue({
      isLockedByMe: true,
      isLockedByOther: false,
      lockInfo: null,
      activeUsers: [{ id: 1, name: "Test User" }],
    });

    (usePublicationForm as any).mockReturnValue({
      t: (s: string) => s,
      form: {
        register: vi.fn(() => ({
          onChange: vi.fn(),
          onBlur: vi.fn(),
          name: "test",
          ref: vi.fn(),
        })),
        getValues: vi.fn(() => []),
      },
      errors: {},
      isSubmitting: false,
      mediaFiles: [],
      isDataReady: true,
      handleSubmit: vi.fn(),
      handleClose: mockOnClose,
      control: {},
      setValue: vi.fn(),
      platformSettings: {
        youtube: {},
        instagram: {},
        facebook: {},
        twitter: {},
        linkedin: {},
        tiktok: {},
      },
      activePlatformSettings: null,
      setActivePlatformSettings: vi.fn(),
      accountSchedules: {},
      setAccountSchedules: vi.fn(),
      uploadProgress: {},
      uploadStats: {},
      uploadErrors: {},
    });
  });

  it("renders correctly when open", () => {
    renderWithProviders(
      <EditPublicationModal
        isOpen={true}
        onClose={mockOnClose}
        publication={mockPublication as any}
        onSubmit={mockOnSubmit}
      />,
    );

    expect(screen.getByTestId("modal-header")).toBeDefined();
    expect(screen.getByTestId("modal-footer")).toBeDefined();
  });

  it("shows locking alert when locked by another user", () => {
    (usePublicationLock as any).mockReturnValue({
      isLockedByMe: false,
      isLockedByOther: true,
      lockInfo: { user_id: 2, user_name: "Other User", locked_by: "user" },
      activeUsers: [
        { id: 1, name: "Test User" },
        { id: 2, name: "Other User" },
      ],
    });

    renderWithProviders(
      <EditPublicationModal
        isOpen={true}
        onClose={mockOnClose}
        publication={mockPublication as any}
        onSubmit={mockOnSubmit}
      />,
    );

    expect(
      screen.getByText("publications.modal.edit.lockedByOther"),
    ).toBeDefined();
  });

  it("disables the platform configuration section when user cannot publish and item isn't approved", () => {
    (usePage as any).mockReturnValue({
      props: {
        auth: {
          user: { id: 1, name: "Test User" },
          current_workspace: { permissions: ["manage-content"] }, // No publish permission
        },
      },
    });

    // Publication is not approved, so allowConfiguration should be false
    const draftPublication = {
      id: 2,
      title: "Other Pub",
      user_id: 2,
      status: "draft",
    };

    const { container } = renderWithProviders(
      <EditPublicationModal
        isOpen={true}
        onClose={mockOnClose}
        publication={draftPublication as any}
        onSubmit={mockOnSubmit}
      />,
    );

    expect(container.querySelector(".opacity-50.pointer-events-none")).not.toBeNull();
  });
});
