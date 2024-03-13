data "aws_caller_identity" "current" {}

module "lambda_bucket" {
  source = "terraform-aws-modules/s3-bucket/aws"

  bucket = var.s3_bucket_name
  acl    = "private"

  control_object_ownership = true
  object_ownership         = "ObjectWriter"

  versioning = {
    enabled = false
  }

  policy = <<POLICY
  {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Sid": "AllowPutObject",
        "Effect": "Allow",
        "Principal": {
          "AWS": "arn:aws:iam::${data.aws_caller_identity.current.account_id}:ClashBotGitHubUser"
        },
        "Action": "s3:PutObject",
        "Resource": "arn:aws:s3:::${var.s3_bucket_name}/*"
      }
    ]
  }
  POLICY
}

resource "aws_lambda_layer_version" "lambda_layer" {
  s3_bucket  = module.lambda_bucket.s3_bucket_id
  s3_key     = "layers/lambda_layer_2.zip"
  layer_name = "clash-bot-workflow-layer"

  compatible_runtimes = ["nodejs16.x"]
}
