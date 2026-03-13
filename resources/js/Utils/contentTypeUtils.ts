import axios from 'axios';
import { route } from 'ziggy-js';

export interface ContentTypeSuggestion {
  current_type: string;
  suggested_type: string;
  should_change: boolean;
  reason?: string;
}

/**
 * Get video duration from file
 */
export const getVideoDuration = (file: File): Promise<number> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    
    video.onerror = () => {
      window.URL.revokeObjectURL(video.src);
      reject(new Error('Failed to load video metadata'));
    };
    
    video.src = URL.createObjectURL(file);
  });
};

/**
 * Suggest optimal content type based on video file
 */
export const suggestContentType = async (
  file: File,
  currentType: string
): Promise<ContentTypeSuggestion> => {
  try {
    let duration: number | undefined;
    
    // Only get duration for video files
    if (file.type.startsWith('video/')) {
      try {
        duration = await getVideoDuration(file);
      } catch (error) {
        console.warn('Failed to get video duration:', error);
        // Continue without duration - backend will handle it
      }
    }
    
    const response = await axios.post(route('api.v1.uploads.suggest-content-type'), {
      duration,
      mime_type: file.type,
      current_type: currentType
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to get content type suggestion:', error);
    // Return no change suggestion on error
    return {
      current_type: currentType,
      suggested_type: currentType,
      should_change: false
    };
  }
};

/**
 * Get content type limits for display
 */
export const getContentTypeLimits = (contentType: string): { min: number; max: number } => {
  switch (contentType) {
    case 'story':
      return { min: 1, max: 60 }; // 1-60 seconds
    case 'reel':
      return { min: 15, max: 90 }; // 15-90 seconds
    case 'post':
      return { min: 0, max: Infinity }; // No limit
    default:
      return { min: 0, max: Infinity };
  }
};

/**
 * Format duration for display
 */
export const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  
  if (remainingSeconds === 0) {
    return `${minutes}m`;
  }
  
  return `${minutes}m ${remainingSeconds}s`;
};

/**
 * Check if content type is valid for video duration
 */
export const isValidDurationForType = (duration: number, contentType: string): boolean => {
  const limits = getContentTypeLimits(contentType);
  return duration >= limits.min && duration <= limits.max;
};