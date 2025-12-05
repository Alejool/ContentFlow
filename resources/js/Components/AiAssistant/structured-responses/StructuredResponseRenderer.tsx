import { AIResponse } from "@/Hooks/useAIChat";
import QuickTipResponse from "./QuickTipResponse";
import InstructionsResponse from "./InstructionsResponse";
import DataResponse from "./DataResponse";
import AnalysisResponse from "./AnalysisResponse";
import ContentResponse from "./ContentResponse";
import RecommendationResponse from "./RecommendationResponse";
import GenericResponse from "./GenericResponse";

interface StructuredResponseRendererProps {
  aiResponse: AIResponse;
  theme: "dark" | "light";
}

export default function StructuredResponseRenderer({
  aiResponse,
  theme,
}: StructuredResponseRendererProps) {
  if (!aiResponse) return null;

  const { type } = aiResponse;

  switch (type) {
    case "quick_tip":
      return <QuickTipResponse data={aiResponse} theme={theme} />;
    case "instructions":
      return <InstructionsResponse data={aiResponse} theme={theme} />;
    case "data":
      return <DataResponse data={aiResponse} theme={theme} />;
    case "analysis":
      return <AnalysisResponse data={aiResponse} theme={theme} />;
    case "content":
      return <ContentResponse data={aiResponse} theme={theme} />;
    case "recommendation":
      return <RecommendationResponse data={aiResponse} theme={theme} />;
    default:
      return <GenericResponse data={aiResponse} theme={theme} />;
  }
}
