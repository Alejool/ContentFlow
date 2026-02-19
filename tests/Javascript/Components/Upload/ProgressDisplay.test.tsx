import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProgressDisplay } from "@/Components/Upload/ProgressDisplay";
import { I18nextProvider } from "react-i18next";
import i18n from "i18next";

// Initialize i18n for tests
i18n.init({
  lng: "en",
  resources: {
    en: {
      translation: {
        "publications.modal.upload.progress": "Upload progress",
        "publications.modal.upload.left": "remaining",
        "publications.modal.upload.pause": "Pause",
        "publications.modal.upload.resume": "Resume",
        "publications.modal.upload.cancel": "Cancel",
        "publications.modal.upload.done": "Done",
        "publications.modal.upload.paused": "Paused",
        "publications.modal.upload.cancelled": "Cancelled",
        "publications.modal.upload.pending": "Pending",
      },
    },
  },
});

const renderWithI18n = (component: React.ReactElement) => {
  return render(<I18nextProvider i18n={i18n}>{component}</I18nextProvider>);
};

describe("ProgressDisplay", () => {
  it("renders progress bar with correct percentage", () => {
    renderWithI18n(
      <ProgressDisplay
        percentage={45}
        status="uploading"
        isPausable={false}
        isPaused={false}
      />
    );

    expect(screen.getByText("45%")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "45");
  });

  it("displays ETA when provided and uploading", () => {
    renderWithI18n(
      <ProgressDisplay
        percentage={30}
        eta={120}
        status="uploading"
        isPausable={false}
        isPaused={false}
      />
    );

    expect(screen.getByLabelText("Estimated time remaining")).toHaveTextContent("2m remaining");
  });

  it("displays speed when provided and uploading", () => {
    renderWithI18n(
      <ProgressDisplay
        percentage={50}
        speed={1048576} // 1 MB/s
        status="uploading"
        isPausable={false}
        isPaused={false}
      />
    );

    expect(screen.getByLabelText("Upload speed")).toHaveTextContent("1 MB/s");
  });

  it("shows pause button when pausable and uploading", () => {
    const onPause = vi.fn();
    renderWithI18n(
      <ProgressDisplay
        percentage={50}
        status="uploading"
        isPausable={true}
        isPaused={false}
        onPause={onPause}
      />
    );

    expect(screen.getByRole("button", { name: /Pause/ })).toBeInTheDocument();
  });

  it("shows resume button when paused", () => {
    const onResume = vi.fn();
    renderWithI18n(
      <ProgressDisplay
        percentage={50}
        status="paused"
        isPausable={true}
        isPaused={true}
        onResume={onResume}
      />
    );

    expect(screen.getByRole("button", { name: /Resume/ })).toBeInTheDocument();
  });

  it("shows cancel button when provided", () => {
    const onCancel = vi.fn();
    renderWithI18n(
      <ProgressDisplay
        percentage={50}
        status="uploading"
        isPausable={false}
        isPaused={false}
        onCancel={onCancel}
      />
    );

    expect(screen.getByRole("button", { name: /Cancel/ })).toBeInTheDocument();
  });

  it("displays error message when status is error", () => {
    renderWithI18n(
      <ProgressDisplay
        percentage={30}
        status="error"
        error="Network error occurred"
        isPausable={false}
        isPaused={false}
      />
    );

    expect(screen.getByText("Network error occurred")).toBeInTheDocument();
  });

  it("has proper ARIA attributes for accessibility", () => {
    renderWithI18n(
      <ProgressDisplay
        percentage={75}
        status="uploading"
        isPausable={false}
        isPaused={false}
      />
    );

    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveAttribute("aria-valuenow", "75");
    expect(progressBar).toHaveAttribute("aria-valuemin", "0");
    expect(progressBar).toHaveAttribute("aria-valuemax", "100");
    expect(progressBar).toHaveAttribute("aria-label");
  });

  it("clamps percentage to 0-100 range", () => {
    const { rerender } = renderWithI18n(
      <ProgressDisplay
        percentage={150}
        status="uploading"
        isPausable={false}
        isPaused={false}
      />
    );

    expect(screen.getByText("100%")).toBeInTheDocument();

    rerender(
      <I18nextProvider i18n={i18n}>
        <ProgressDisplay
          percentage={-10}
          status="uploading"
          isPausable={false}
          isPaused={false}
        />
      </I18nextProvider>
    );

    expect(screen.getByText("0%")).toBeInTheDocument();
  });
});
