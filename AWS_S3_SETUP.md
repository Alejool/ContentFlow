# ☁️ AWS S3 Image Upload Setup

To enable image uploads for campaigns using AWS S3, please follow these steps:

## 1. Configure Environment Variables
Open your `.env` file and add or update the following configuration:

```env
FILESYSTEM_DISK=s3

AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_DEFAULT_REGION=your_region (e.g., us-east-1)
AWS_BUCKET=your_bucket_name
AWS_USE_PATH_STYLE_ENDPOINT=false
```

## 2. AWS S3 Bucket Permissions
Ensure your S3 bucket has a **Bucket Policy** that allows public read access if you want the images to be publicly viewable (standard for campaign images).

Example Bucket Policy (Replace `your-bucket-name`):
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::your-bucket-name/*"
        }
    ]
}
```

## 3. CORS Configuration (Optional but Recommended)
If you encounter issues with images not loading in the browser due to CORS, add this CORS configuration to your S3 bucket:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "HEAD"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": []
    }
]
```

## ✅ Verification
After configuring these settings, try creating a new campaign with an image. The image should be uploaded to your S3 bucket, and the campaign should be created successfully.
