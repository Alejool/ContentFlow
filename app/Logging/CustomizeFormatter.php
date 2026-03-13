<?php

namespace App\Logging;

use Illuminate\Log\Logger;

/**
 * Clase para personalizar los canales de logging
 * Se usa en config/logging.php con 'tap'
 */
class CustomizeFormatter
{
    /**
     * Personaliza el logger con el JsonFormatter
     */
    public function __invoke(Logger $logger): void
    {
        foreach ($logger->getHandlers() as $handler) {
            $handler->setFormatter(new JsonFormatter());
        }
    }
}
