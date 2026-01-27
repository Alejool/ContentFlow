import SocialAccountsDisplay from "@/Components/ManageContent/Publication/SocialAccountsDisplay";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Mocks
vi.mock("@/Constants/socialPlatforms", () => ({
  getPlatformConfig: (platform: string) => ({
    bgClass: "bg-test",
    textColor: "text-test",
    borderColor: "border-test",
    darkColor: "dark:bg-test",
    darkTextColor: "dark:text-test",
    darkBorderColor: "dark:border-test",
  }),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "es" },
  }),
}));

describe("SocialAccountsDisplay", () => {
  it('renders "No props" when no publication is provided', () => {
    render(<SocialAccountsDisplay publication={null} />);
    expect(screen.getByText("No props")).toBeDefined();
  });

  it("renders platform icons for scheduled posts", () => {
    const mockPublication = {
      scheduled_posts: [
        {
          id: 1,
          social_account_id: 1,
          platform: "facebook",
          social_account: { platform: "facebook" },
        },
        {
          id: 2,
          social_account_id: 2,
          platform: "twitter",
          social_account: { platform: "twitter" },
        },
      ],
      social_post_logs: [],
    };

    render(<SocialAccountsDisplay publication={mockPublication as any} />);

    // Facebook icon (starts with 'f')
    expect(screen.getByText("f")).toBeDefined();
    // Twitter icon (starts with 't')
    expect(screen.getByText("t")).toBeDefined();
  });

  it("renders count when showCount is true", () => {
    const mockPublication = {
      scheduled_posts: [{ id: 1, social_account_id: 1, platform: "facebook" }],
      social_post_logs: [],
    };

    render(
      <SocialAccountsDisplay
        publication={mockPublication as any}
        showCount={true}
      />,
    );
    expect(screen.getByText("1 IDs")).toBeDefined();
  });
});
