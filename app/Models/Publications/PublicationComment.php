<?php

namespace App\Models\Publications;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Publications\Publication;
use App\Models\User;

class PublicationComment extends Model
{
    use HasFactory;

    protected $fillable = ['publication_id', 'user_id', 'content'];

    public function publication()
    {
        return $this->belongsTo(Publication::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
