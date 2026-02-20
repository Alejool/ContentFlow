<?php

return [
  /*
  |--------------------------------------------------------------------------
  | FFmpeg Configuration
  |--------------------------------------------------------------------------
  | 
  | For Windows: Use 'ffmpeg' and 'ffprobe' if they're in PATH
  | Or specify full path like: 'C:/ffmpeg/bin/ffmpeg.exe'
  | 
  | For Linux/Mac: Use '/usr/bin/ffmpeg' or '/usr/local/bin/ffmpeg'
  */
  'ffmpeg_path' => env('FFMPEG_PATH', PHP_OS_FAMILY === 'Windows' ? 'ffmpeg' : '/usr/bin/ffmpeg'),
  'ffprobe_path' => env('FFPROBE_PATH', PHP_OS_FAMILY === 'Windows' ? 'ffprobe' : '/usr/bin/ffprobe'),

  /*
  |--------------------------------------------------------------------------
  | Reel Generation Settings
  |--------------------------------------------------------------------------
  */
  'reels' => [
    'auto_generate' => env('AUTO_GENERATE_REELS', false),
    'default_platforms' => ['instagram', 'tiktok', 'youtube_shorts'],
    'add_subtitles' => env('REELS_ADD_SUBTITLES', true),
    'default_language' => env('REELS_LANGUAGE', 'es'),
    'max_clips' => env('REELS_MAX_CLIPS', 5),
    'clip_duration' => env('REELS_CLIP_DURATION', 30),
  ],

  /*
  |--------------------------------------------------------------------------
  | Platform Specifications
  |--------------------------------------------------------------------------
  */
  'platforms' => [
    'instagram' => [
      'max_video_size' => 4 * 1024 * 1024 * 1024, // 4GB
      'max_duration' => 90,
      'min_duration' => 3,
      'aspect_ratio' => '9:16',
      'resolution' => '1080x1920',
    ],
    'tiktok' => [
      'max_video_size' => 4 * 1024 * 1024 * 1024, // 4GB
      'max_duration' => 180,
      'min_duration' => 3,
      'aspect_ratio' => '9:16',
      'resolution' => '1080x1920',
    ],
    'youtube_shorts' => [
      'max_video_size' => 256 * 1024 * 1024, // 256MB
      'max_duration' => 60,
      'min_duration' => 1,
      'aspect_ratio' => '9:16',
      'resolution' => '1080x1920',
    ],
  ],
];
