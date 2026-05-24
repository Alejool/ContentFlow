import { AIResponse } from '@/Hooks/useAIChat';
import QuickTipResponse from '@/Components/AiAssistant/structured-responses/QuickTipResponse';
import InstructionsResponse from '@/Components/AiAssistant/structured-responses/InstructionsResponse';
import DataResponse from '@/Components/AiAssistant/structured-responses/DataResponse';
import AnalysisResponse from '@/Components/AiAssistant/structured-responses/AnalysisResponse';
import ContentResponse from '@/Components/AiAssistant/structured-responses/ContentResponse';
import RecommendationResponse from '@/Components/AiAssistant/structured-responses/RecommendationResponse';
import GenericResponse from '@/Components/AiAssistant/structured-responses/GenericResponse';

interface StructuredResponseRendererProps {
  aiResponse: AIResponse;
  theme: 'dark' | 'light';
}

export default function StructuredResponseRenderer({
  aiResponse,
  theme,
}: StructuredResponseRendererProps) {
  if (!aiResponse) return null;

  const { type } = aiResponse;

  switch (type) {
    case 'quick_tip':
      return <QuickTipResponse data={aiResponse} theme={theme} />;
    case 'instructions':
      return <InstructionsResponse data={aiResponse} theme={theme} />;
    case 'data':
      return <DataResponse data={aiResponse} theme={theme} />;
    case 'analysis':
      return <AnalysisResponse data={aiResponse} theme={theme} />;
    case 'content':
      return <ContentResponse data={aiResponse} theme={theme} />;
    case 'recommendation':
      return <RecommendationResponse data={aiResponse} theme={theme} />;
    default:
      return <GenericResponse data={aiResponse} theme={theme} />;
  }
}
