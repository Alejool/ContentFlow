import axios from 'axios';

export interface PublicationActionResponse {
  action: 'publish' | 'review';
  can_bypass_workflow: boolean;
  workflow_enabled: boolean;
  button_text: string;
  button_text_en: string;
}

/**
 * Service to determine what action a user can take on publications
 * based on their role and workspace configuration.
 */
class PublicationActionService {
  /**
   * Get the publication action available for the current user in their workspace.
   * Returns whether they can 'publish' directly or must send to 'review'.
   */
  async getPublicationAction(): Promise<PublicationActionResponse> {
    try {
      const response = await axios.get('/api/v1/publications/action');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching publication action:', error);
      // Default to review if there's an error (safer)
      return {
        action: 'review',
        can_bypass_workflow: false,
        workflow_enabled: true,
        button_text: 'Enviar a revisión',
        button_text_en: 'Send to Review',
      };
    }
  }

  /**
   * Check if user can publish directly (is owner)
   */
  async canPublishDirectly(): Promise<boolean> {
    const actionData = await this.getPublicationAction();
    return actionData.action === 'publish';
  }

  /**
   * Check if user must send to review
   */
  async mustSendToReview(): Promise<boolean> {
    const actionData = await this.getPublicationAction();
    return actionData.action === 'review';
  }
}

export default new PublicationActionService();
