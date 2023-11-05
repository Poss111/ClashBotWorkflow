module "lambda_bucket" {
  source = "terraform-aws-modules/s3-bucket/aws"

  bucket = "clash-bot-lambda-bucket"
  acl    = "private"

  control_object_ownership = true
  object_ownership         = "ObjectWriter"

  versioning = {
    enabled = false
  }
}

module "dynamodb_table" {
  source = "terraform-aws-modules/dynamodb-table/aws"

  name           = "clash-bot-workflow-${var.environment}"
  hash_key       = "type"
  range_key      = "id"
  billing_mode   = "PROVISIONED"
  write_capacity = 5
  read_capacity  = 1
  
  attributes = [
    {
      name = "type"
      type = "S"
    },
    {
      name = "id"
      type = "S"
    }
  ]
}