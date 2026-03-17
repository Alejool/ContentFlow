<?php

return [
    // ... existing validation messages ...

    // Reel validations
    'reel_requires_video' => 'Reel content requires a video file.',
    'reel_must_be_video' => 'Reel content must be a video, not an image.',
    'instagram_reel_min_duration' => 'Instagram Reels should be at least 15 seconds long. Current duration: :duration seconds.',
    'instagram_reel_max_duration' => 'Instagram Reels cannot exceed 90 seconds. Current duration: :duration seconds.',
    'instagram_reel_aspect_ratio' => 'Instagram Reels work best with vertical aspect ratio (9:16).',
    'tiktok_min_duration' => 'TikTok videos should be at least 15 seconds long. Current duration: :duration seconds.',
    'tiktok_max_duration' => 'TikTok videos cannot exceed 10 minutes. Current duration: :duration seconds.',
    'youtube_shorts_max_duration' => 'YouTube Shorts cannot exceed 60 seconds. Current duration: :duration seconds.',

    // Story validations
    'story_requires_media' => 'Story content requires a media file (image or video).',
    'instagram_story_max_duration' => 'Instagram Stories videos cannot exceed 15 seconds. Current duration: :duration seconds.',
    'instagram_story_aspect_ratio' => 'Instagram Stories work best with vertical aspect ratio (9:16).',
    'facebook_story_max_duration' => 'Facebook Stories videos cannot exceed 60 seconds. Current duration: :duration seconds.',
    'facebook_reel_min_duration' => 'Facebook Reels should be at least 15 seconds long. Current duration: :duration seconds.',
    'facebook_reel_max_duration' => 'Facebook Reels cannot exceed 90 seconds. Current duration: :duration seconds.',

    // Carousel validations
    'carousel_min_media' => 'Carousel content requires at least 2 media files.',
    'instagram_carousel_max_media' => 'Instagram carousels cannot have more than 10 media files. Current count: :count.',
    'instagram_carousel_mixed_media' => 'Instagram carousels with mixed images and videos may not display optimally.',
    'facebook_carousel_max_media' => 'Facebook carousels cannot have more than 10 media files. Current count: :count.',
    'facebook_carousel_mixed_media' => 'Facebook does not support mixing images and videos in the same carousel. Please use only images or only videos.',
    'twitter_carousel_mixed_media' => 'Twitter/X does not allow combining videos and images in the same post.',
    'linkedin_carousel_max_media' => 'LinkedIn carousels cannot have more than 9 media files. Current count: :count.',

    // Content type compatibility
    'content_type_not_supported' => 'Content type ":type" is not supported on :platform. Supported types: :supported.',
];