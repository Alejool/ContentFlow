import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import fc from "fast-check";
import TourOverlay from "@/Components/Onboarding/TourOverlay";
import type { TourStep } from "@/types/onboarding";

describe("TourOverlay Property Tests", () => {
  let mockElement: HTMLDivElement;

  beforeEach(() => {
    // Clean up any previous renders
    cleanup();
    
    // Mock DOM element for target selector
    mockElement = document.createElement("div");
    mockElement.id = "test-target";
    mockElement.style.position = "absolute";
    mockElement.style.top = "100px";
    mockElement.style.left = "100px";
    mockElement.style.width = "200px";
    mockElement.style.height = "50px";
    document.body.appendChild(mockElement);
  });

  afterEach(() => {
    // Clean up after each test
    cleanup();
    if (mockElement && mockElement.parentNode) {
      document.body.removeChild(mockElement);
    }
  });

  describe("Property 2: Tour Step Content Display", () => {
    // Custom arbitrary for non-empty, non-whitespace-only strings
    const nonEmptyString = (minLength: number, maxLength: number) =>
      fc
        .string({ minLength, maxLength })
        .filter((s) => s.trim().length > 0);

    it("renders tour step title and description for any valid tour step", () => {
      // Feature: interactive-onboarding, Property 2: Tour Step Content Display
      // Validates: Requirements 1.3
      fc.assert(
        fc.property(
          fc.record({
            id: nonEmptyString(1, 20),
            title: nonEmptyString(1, 100),
            description: nonEmptyString(1, 500),
            position: fc.constantFrom("top", "bottom", "left", "right"),
            highlightPadding: fc.integer({ min: 0, max: 20 }),
          }),
          (stepData) => {
            const tourStep: TourStep = {
              id: stepData.id,
              title: stepData.title,
              description: stepData.description,
              targetSelector: "#test-target",
              position: stepData.position as "top" | "bottom" | "left" | "right",
              highlightPadding: stepData.highlightPadding,
            };

            const mockOnNext = vi.fn();
            const mockOnSkip = vi.fn();
            const mockOnComplete = vi.fn();

            const { unmount } = render(
              <TourOverlay
                currentStep={tourStep}
                totalSteps={5}
                onNext={mockOnNext}
                onSkip={mockOnSkip}
                onComplete={mockOnComplete}
              />
            );

            // Verify property: title should be present in the rendered output
            // Use heading role to specifically target the title element
            const titleElement = screen.getByRole("heading", {
              name: (name) => name.trim() === tourStep.title.trim(),
            });
            expect(titleElement).toBeInTheDocument();

            // Verify property: description should be present in the rendered output
            // The description is in a paragraph, so we need to find it by text content
            const allParagraphs = screen.getAllByText((content, element) => {
              return element?.tagName === "P" && element?.textContent?.trim() === tourStep.description.trim();
            });
            expect(allParagraphs.length).toBeGreaterThan(0);
            expect(allParagraphs[0]).toBeInTheDocument();

            unmount();
          }
        ),
        { numRuns: 20 }
      );
    });

    it("displays both title and description text content correctly", () => {
      // Feature: interactive-onboarding, Property 2: Tour Step Content Display
      // Validates: Requirements 1.3
      fc.assert(
        fc.property(
          fc.tuple(
            nonEmptyString(5, 50),
            nonEmptyString(10, 200)
          ),
          ([title, description]) => {
            const tourStep: TourStep = {
              id: "step-1",
              title: title,
              description: description,
              targetSelector: "#test-target",
              position: "bottom",
              highlightPadding: 8,
            };

            const mockOnNext = vi.fn();
            const mockOnSkip = vi.fn();
            const mockOnComplete = vi.fn();

            const { unmount } = render(
              <TourOverlay
                currentStep={tourStep}
                totalSteps={3}
                onNext={mockOnNext}
                onSkip={mockOnSkip}
                onComplete={mockOnComplete}
              />
            );

            // Verify property: exact title text should be rendered
            const titleElement = screen.getByRole("heading", {
              name: (name) => name.trim() === title.trim(),
            });
            expect(titleElement).toBeInTheDocument();

            // Verify property: exact description text should be rendered
            const allParagraphs = screen.getAllByText((content, element) => {
              return element?.tagName === "P" && element?.textContent?.trim() === description.trim();
            });
            expect(allParagraphs.length).toBeGreaterThan(0);
            expect(allParagraphs[0]).toBeInTheDocument();

            unmount();
          }
        ),
        { numRuns: 20 }
      );
    });

    it("renders step content regardless of step position", () => {
      // Feature: interactive-onboarding, Property 2: Tour Step Content Display
      // Validates: Requirements 1.3
      fc.assert(
        fc.property(
          fc.constantFrom("top", "bottom", "left", "right"),
          nonEmptyString(3, 50),
          nonEmptyString(5, 150),
          (position, title, description) => {
            const tourStep: TourStep = {
              id: "step-test",
              title: title,
              description: description,
              targetSelector: "#test-target",
              position: position as "top" | "bottom" | "left" | "right",
              highlightPadding: 8,
            };

            const mockOnNext = vi.fn();
            const mockOnSkip = vi.fn();
            const mockOnComplete = vi.fn();

            const { unmount } = render(
              <TourOverlay
                currentStep={tourStep}
                totalSteps={4}
                onNext={mockOnNext}
                onSkip={mockOnSkip}
                onComplete={mockOnComplete}
              />
            );

            // Verify property: content is displayed regardless of position
            const titleElement = screen.getByRole("heading", {
              name: (name) => name.trim() === title.trim(),
            });
            expect(titleElement).toBeInTheDocument();
            
            const allParagraphs = screen.getAllByText((content, element) => {
              return element?.tagName === "P" && element?.textContent?.trim() === description.trim();
            });
            expect(allParagraphs.length).toBeGreaterThan(0);
            expect(allParagraphs[0]).toBeInTheDocument();

            unmount();
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});
