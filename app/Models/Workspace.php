<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;
use App\Models\Publications\Publication;
use App\Models\WorkspaceUser;

class Workspace extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'created_by',
        'public',
        'allow_public_invites',
        'slack_webhook_url',
        'discord_webhook_url',
    ];

    protected static function booted()
    {
        static::creating(function ($workspace) {
            $baseSlug = $workspace->slug ?: Str::slug($workspace->name ?: 'workspace');
            $slug = $baseSlug;

            // Ensure slug is unique (including soft-deleted ones)
            $count = 0;
            while (static::withTrashed()->where('slug', $slug)->exists()) {
                $count++;
                // Safety break if it's too many attempts or if base name is empty
                if ($count > 10) {
                    $slug = $baseSlug . '-' . time() . '-' . Str::random(4);
                    break;
                }

                // Increase randomness as we fail
                $randomLen = $count > 3 ? 8 : 4;
                $slug = $baseSlug . '-' . Str::lower(Str::random($randomLen));
            }

            $workspace->slug = $slug;
        });
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'workspace_user')
            ->using(WorkspaceUser::class)
            ->withPivot('role_id')
            ->withTimestamps();
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function socialAccounts()
    {
        return $this->hasMany(SocialAccount::class);
    }

    public function publications()
    {
        return $this->hasMany(Publication::class);
    }

    public function campaigns()
    {
        return $this->hasMany(Campaign::class);
    }

    public function mediaFiles()
    {
        return $this->hasMany(MediaFile::class);
    }
}
