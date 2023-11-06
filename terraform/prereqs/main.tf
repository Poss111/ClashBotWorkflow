module "lambda_bucket" {
  source = "terraform-aws-modules/s3-bucket/aws"

  bucket = "${var.s3_bucket_name}-${var.environment}"
  acl    = "private"

  control_object_ownership = true
  object_ownership         = "ObjectWriter"

  versioning = {
    enabled = false
  }
}