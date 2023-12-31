output "s3_bucket_policy" {
  value       = module.lambda_bucket.s3_bucket_policy
  description = "The S3 bucket policy for the Lambda deployment bucket"
}

output "s3_bucket_name" {
  value       = module.lambda_bucket.s3_bucket_id
  description = "The S3 bucket name for the Lambda deployment bucket"
}