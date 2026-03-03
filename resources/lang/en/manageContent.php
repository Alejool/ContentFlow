<?php

return [
    'socialMedia' => [
        'blockerModal' => [
            'titlePublishing' => 'Cannot Disconnect',
            'titleScheduled' => 'Cannot Disconnect',
            'messagePublishing' => 'This account has publications that are currently being published. Please wait for them to finish before disconnecting.',
            'messageScheduled' => 'This account has scheduled publications. You must remove them from the publications before you can disconnect this account.',
            'table' => [
                'publication' => 'Publication',
                'status' => 'Status',
                'scheduledDate' => 'Scheduled Date',
            ],
            'action' => 'Action Required',
            'waitForPublishing' => 'Wait for the publications to finish publishing.',
            'removeScheduled' => 'Go to the Content section and remove these publications from the schedule.',
        ],
    ],
];
