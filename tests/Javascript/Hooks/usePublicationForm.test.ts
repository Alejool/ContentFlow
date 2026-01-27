import { usePublicationForm } from "@/Hooks/publication/usePublicationForm";
import { useMediaStore } from "@/stores/mediaStore";
import { usePublicationStore } from "@/stores/publicationStore";
import { usePage } from "@inertiajs/react";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mocks
vi.mock("@inertiajs/react", () => ({
  usePage: vi.fn(),
  router: {
    reload: vi.fn(),
  },
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "es" },
  }),
}));

vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock window.Echo
global.window.Echo = {
  private: vi.fn().mockReturnValue({
    listen: vi.fn().mockReturnThis(),
    stopListening: vi.fn().mockReturnThis(),
  }),
} as any;

// Mock URL methods
global.URL.createObjectURL = vi.fn().mockReturnValue("blob:test");
global.URL.revokeObjectURL = vi.fn();

describe("usePublicationForm", () => {
  const mockOnClose = vi.fn();
  const mockUser = {
    id: 1,
    name: "Test User",
    current_workspace_id: 1,
    global_platform_settings: {},
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (usePage as any).mockReturnValue({
      props: {
        auth: { user: mockUser },
      },
    });

    // Reset stores
    usePublicationStore.getState().reset();
    useMediaStore.getState().clear();
    // useUploadQueue doesn't have a reset, but we can clear the queue manually if needed
  });

  it("initializes with default values when no publication is provided", () => {
    const { result } = renderHook(() =>
      usePublicationForm({
        publication: null,
        onClose: mockOnClose,
        isOpen: true,
      }),
    );

    expect(result.current.isDataReady).toBe(true);
    expect(result.current.form.getValues("title")).toBe("");
    expect(result.current.form.getValues("status")).toBe("draft");
  });

  it("initializes with publication data when provided", async () => {
    const mockPublication = {
      id: 123,
      title: "Existing Publication",
      description: "Test description content",
      goal: "Test goal",
      hashtags: "#test",
      status: "draft",
      campaigns: [],
      scheduled_posts: [],
      media_files: [],
    };

    const { result } = renderHook(() =>
      usePublicationForm({
        publication: mockPublication as any,
        onClose: mockOnClose,
        isOpen: true,
      }),
    );

    // Wait for useEffect to process
    await act(async () => {
      // Small delay to let transitions finish
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.form.getValues("title")).toBe("Existing Publication");
    expect(result.current.form.getValues("description")).toBe(
      "Test description content",
    );
  });

  it("handles account toggling correctly", async () => {
    const { result } = renderHook(() =>
      usePublicationForm({
        publication: null,
        onClose: mockOnClose,
        isOpen: true,
      }),
    );

    act(() => {
      result.current.handleAccountToggle(1);
    });

    expect(result.current.form.getValues("social_accounts")).toContain(1);

    act(() => {
      result.current.handleAccountToggle(1);
    });

    expect(result.current.form.getValues("social_accounts")).not.toContain(1);
  });
});
