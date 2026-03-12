<?php

return [
  'title' => 'Your Publications',
  'subtitle' => 'Manage and track your social media content',
  'table' => [
    'campaign' => 'Campaign',
    'media' => 'Media',
  ],
  'filters' => [
    'title' => 'Filter Publications',
  ],
  'button' => [
    'addPublication' => 'New Publication',
    'approve' => 'Approve',
    'reject' => 'Reject',
  ],
  'noCampaign' => 'No Campaign',
  'edit' => [
    'accountMissingTitle' => 'Account Disconnected',
    'accountMissingText' => 'This publication was posted on an account (:account) that is no longer connected. Editing it will create a new version for your current account(s). Proceed?',
  ],
  'validation' => [
    'scheduledMinDifference' => 'The scheduled date must be at least 1 minute after the current time.',
    'recurrenceDaysRequired' => 'Please select at least one day for weekly recurrence.',
    'recurrenceEndDateRequired' => 'End date is required for recurring publications.',
  ],
  'modal' => [
    'contentType' => [
      'label' => 'Content Type',
      'filteredByPlatforms' => 'Filtered by selected platforms',
    ],
    'poll' => [
      'title' => 'Poll Options',
      'options' => 'Poll Options (2-4 options)',
      'optionPlaceholder' => 'Option',
      'addOption' => 'Add Option',
      'duration' => 'Poll Duration',
      'hours' => 'hours',
      'note' => 'Polls are only supported on Twitter and Facebook. Make sure to select compatible platforms.',
    ],
    'live' => [
      'title' => 'Live Stream Settings',
      'startTime' => 'Start Time',
      'duration' => 'Expected Duration',
      'minutes' => 'minutes',
      'note' => 'Live streaming is supported on YouTube and Facebook. You\'ll need to configure streaming settings on each platform.',
    ],
    'validation' => [
      'scheduledMinDifference' => 'The scheduled date must be at least 1 minute after the current time.',
      'recurrenceDaysRequired' => 'Please select at least one day for weekly recurrence.',
      'recurrenceEndDateRequired' => 'End date is required for recurring publications.',
      'pollOptionsRequired' => 'Poll requires 2-4 non-empty options.',
      'pollDurationRequired' => 'Poll duration must be between 1 and 168 hours.',
      'liveStartTimeRequired' => 'Live stream start time is required.',
    ],
    'schedule' => [
      'title' => 'Date for all networks',
      'useGlobal' => 'Global',
      'description' => 'Set a single date to publish on all selected social networks at once.',
      'placeholder' => 'Select date and time',
      'instantWarning' => 'To publish immediately, set the date from the scheduling modal.',
      'recurrence' => [
        'title' => 'Repeat publication (Recurrence)',
        'locked_title' => 'Recurrence locked',
        'locked_desc' => 'Upgrade your plan to configure automatic repetitions (every X days/weeks) in your publications.',
        'enable' => 'Enable repetition',
        'frequency' => 'Frequency',
        'interval' => 'Every',
        'days' => 'Repeat on days',
        'ends' => 'End date',
        'ends_placeholder' => 'Select when recurrence ends',
        'end_date_required' => 'End date is required for recurring publications',
        'preview_title' => 'Upcoming publication dates',
        'preview_note' => 'These dates are estimated and will be reflected in the calendar when saved.',
        'select_accounts' => 'Networks with recurrence',
        'select_accounts_desc' => 'Select which networks will publish recurrently. The others will only publish once.',
        'all_accounts' => 'Apply to all',
        'single_account_note' => 'This network will publish recurrently according to the configuration.',
      ],
    ],
  ],
  'errors' => [
    'only_draft_failed_rejected_can_request_review' => 'Only draft, failed, or rejected publications can be sent for review.',
    'not_approved' => 'This publication requires approval before publishing. Please request approval first.',
    'pending_review' => 'This publication is pending review. It must be approved or rejected before it can be published.',
    'already_publishing' => 'This publication is already being published or retrying. Please wait for the current process to complete.',
  ],
  'status' => [
    'publishingProgress' => ':current/:total publishing',
    'retryingProgress' => 'Retrying :current/:total',
    'partialSuccess' => ':success/:total published',
    'allPublished' => ':total/:total published',
    'retrying' => 'Retrying',
  ],
  'viewPost' => 'View post',
  'toast' => [
    'publishedSuccess' => 'Publication published successfully!',
    'publishedError' => 'Publication failed to publish.',
  ],
  'messages' => [
    'cancelError' => 'Error canceling publication',
  ],
];
