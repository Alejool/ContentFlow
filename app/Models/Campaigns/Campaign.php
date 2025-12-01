<?php

namespace App\Models\Campaigns;
use App\Models\User;
use App\Models\CampaignAnalytics;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Campaign extends Model
{
        use HasFactory;
        protected $fillable = [
            'title',
            'slug',
            'image',
            'status',
            'start_date',
            'end_date',
            'publish_date',
            'goal',
            'body',
            'url',
            'hashtags',
            'description',
            'user_id',
        ];  
        
        public function user(): BelongsTo
        {
            return $this->belongsTo(User::class);
        }

        public function analytics(): HasMany
        {
            return $this->hasMany(CampaignAnalytics::class);
        }

        // Helper methods for analytics
        public function getTotalViews()
        {
            return $this->analytics()->sum('views');
        }

        public function getTotalClicks()
        {
            return $this->analytics()->sum('clicks');
        }

        public function getTotalConversions()
        {
            return $this->analytics()->sum('conversions');
        }

        public function getAverageEngagementRate()
        {
            return $this->analytics()->avg('engagement_rate');
        }
        // public function getImageAttribute($value)
        // {
        //     return asset('uploads/campaigns/'.$value);
        // }
        public function getStartDateAttribute($value)
        {
            return date('Y-m-d',strtotime($value));
        }
        public function getEndDateAttribute($value)
        {
            return date('Y-m-d',strtotime($value));
        }
        public function getPublishDateAttribute($value)
        {
            return date('Y-m-d',strtotime($value));
        }

}
