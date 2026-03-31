<?php

namespace App\Console\Commands;

use App\Helpers\LogHelper;
use Illuminate\Console\Command;

class LogStatsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'log:stats {log=laravel : Log file to analyze}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Display statistics for a log file';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $logFile = $this->argument('log');
        $logPath = storage_path("logs/{$logFile}.log");

        if (!file_exists($logPath)) {
            $this->error("Log file not found: {$logPath}");
            return 1;
        }

        $this->info("📊 Analyzing {$logFile}.log...");
        $this->newLine();

        $stats = LogHelper::getStats($logFile);

        if (empty($stats)) {
            $this->warn('No data found in log file.');
            return 0;
        }

        // Total entries
        $this->line("📝 <info>Total Entries:</info> {$stats['total']}");
        $this->newLine();

        // By level
        if (!empty($stats['by_level'])) {
            $this->line("📊 <info>By Level:</info>");
            arsort($stats['by_level']);
            
            $headers = ['Level', 'Count', 'Percentage'];
            $rows = [];
            
            foreach ($stats['by_level'] as $level => $count) {
                $percentage = round(($count / $stats['total']) * 100, 2);
                $levelColor = match(strtoupper($level)) {
                    'ERROR', 'CRITICAL' => 'red',
                    'WARNING' => 'yellow',
                    'INFO' => 'green',
                    'DEBUG' => 'blue',
                    default => 'white',
                };
                
                $rows[] = [
                    "<fg={$levelColor}>" . strtoupper($level) . "</>",
                    $count,
                    "{$percentage}%"
                ];
            }
            
            $this->table($headers, $rows);
            $this->newLine();
        }

        // By module
        if (!empty($stats['by_module'])) {
            $this->line("📦 <info>By Module:</info>");
            arsort($stats['by_module']);
            
            $headers = ['Module', 'Count', 'Percentage'];
            $rows = [];
            
            $topModules = array_slice($stats['by_module'], 0, 10, true);
            
            foreach ($topModules as $module => $count) {
                $percentage = round(($count / $stats['total']) * 100, 2);
                $rows[] = [$module, $count, "{$percentage}%"];
            }
            
            $this->table($headers, $rows);
            
            if (count($stats['by_module']) > 10) {
                $remaining = count($stats['by_module']) - 10;
                $this->comment("... and {$remaining} more modules");
            }
            
            $this->newLine();
        }

        // By action
        if (!empty($stats['by_action'])) {
            $this->line("⚡ <info>Top Actions:</info>");
            arsort($stats['by_action']);
            
            $headers = ['Action', 'Count', 'Percentage'];
            $rows = [];
            
            $topActions = array_slice($stats['by_action'], 0, 15, true);
            
            foreach ($topActions as $action => $count) {
                $percentage = round(($count / $stats['total']) * 100, 2);
                $rows[] = [$action, $count, "{$percentage}%"];
            }
            
            $this->table($headers, $rows);
            
            if (count($stats['by_action']) > 15) {
                $remaining = count($stats['by_action']) - 15;
                $this->comment("... and {$remaining} more actions");
            }
        }

        return 0;
    }
}
