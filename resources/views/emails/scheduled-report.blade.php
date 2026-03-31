<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4F46E5; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; }
        .metric { background: white; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 4px solid #4F46E5; }
        .metric-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
        .metric-value { font-size: 24px; font-weight: bold; color: #111827; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        th { background: #f3f4f6; font-weight: 600; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{ $report->name }}</h1>
            <p>{{ $data['period'] }}</p>
        </div>
        
        <div class="content">
            @if($report->type === 'publications')
                <div class="metric">
                    <div class="metric-label">Total Publications</div>
                    <div class="metric-value">{{ $data['total_publications'] }}</div>
                </div>

                <h3>By Status</h3>
                @foreach($data['by_status'] as $status => $count)
                    <div class="metric">
                        <div class="metric-label">{{ ucfirst($status) }}</div>
                        <div class="metric-value">{{ $count }}</div>
                    </div>
                @endforeach

                @if(!empty($data['by_platform']))
                    <h3>By Platform</h3>
                    @foreach($data['by_platform'] as $platform => $count)
                        <div class="metric">
                            <div class="metric-label">{{ ucfirst($platform) }}</div>
                            <div class="metric-value">{{ $count }}</div>
                        </div>
                    @endforeach
                @endif

            @elseif($report->type === 'analytics')
                <div class="metric">
                    <div class="metric-label">Total Views</div>
                    <div class="metric-value">{{ number_format($data['total_views']) }}</div>
                </div>
                <div class="metric">
                    <div class="metric-label">Total Clicks</div>
                    <div class="metric-value">{{ number_format($data['total_clicks']) }}</div>
                </div>
                <div class="metric">
                    <div class="metric-label">Total Conversions</div>
                    <div class="metric-value">{{ number_format($data['total_conversions']) }}</div>
                </div>
                <div class="metric">
                    <div class="metric-label">Avg Engagement Rate</div>
                    <div class="metric-value">{{ $data['avg_engagement_rate'] }}%</div>
                </div>

            @elseif($report->type === 'campaigns')
                <div class="metric">
                    <div class="metric-label">Total Campaigns</div>
                    <div class="metric-value">{{ $data['total_campaigns'] }}</div>
                </div>
                <div class="metric">
                    <div class="metric-label">Active Campaigns</div>
                    <div class="metric-value">{{ $data['active_campaigns'] }}</div>
                </div>
            @endif
        </div>

        <div class="footer">
            <p>This is an automated report from ContentFlow</p>
            <p>Generated on {{ now()->format('F j, Y g:i A') }}</p>
        </div>
    </div>
</body>
</html>
