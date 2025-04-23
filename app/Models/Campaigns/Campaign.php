<?php

namespace App\Models\Campaigns;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

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
        public function user()
        {
            return $this->belongsTo(User::class);
        }
        // public function getImageAttribute($value)
        // {
        //     return asset('uploads/campaigns/'.$value);
        // }
        public function getStartDateAttribute($value)
        {
            return date('d-m-Y',strtotime($value));
        }
        public function getEndDateAttribute($value)
        {
            return date('d-m-Y',strtotime($value));
        }
        public function getPublishDateAttribute($value)
        {
            return date('d-m-Y',strtotime($value));
        }

}
