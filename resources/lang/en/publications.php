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
  ],
  'errors' => [
    'only_draft_failed_rejected_can_request_review' => 'Only draft, failed, or rejected publications can be sent for review.',
    'not_approved' => 'This publication requires approval before publishing. Please request approval first.',
    'pending_review' => 'This publication is pending review. It must be approved or rejected before it can be published.',
  ],
  'status' => [
    'publishingProgress' => ':current/:total publishing',
    'partialSuccess' => ':success/:total published',
    'allPublished' => ':total/:total published',
  ],
  'viewPost' => 'View post',
];
