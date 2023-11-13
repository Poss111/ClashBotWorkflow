variable "region" {
  type        = string
  default     = "us-east-1"
  description = "The region to use."
}

variable "environment" {
  type        = string
  default     = "dev"
  description = "value of the environment to use."
}

variable "s3_bucket_name" {
  type        = string
  description = "The name of the S3 bucket to create."
}