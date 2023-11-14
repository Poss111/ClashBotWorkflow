provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Application = "ClashBot-Workflow"
      Environment = var.environment
    }
  }
}

data "aws_acm_certificate" "issued" {
  domain   = "clash-bot.ninja"
  statuses = ["ISSUED"]
}

resource "aws_cloudwatch_log_group" "api_gateway_default_log_group" {
  name = "api_gateway_default_log_group-${var.environment}"
}

module "api_gateway" {
  source = "terraform-aws-modules/apigateway-v2/aws"

  name          = "clash-bot-workflow-${var.environment}"
  description   = "Clash Bot Workflow API Gateway for the ${var.environment} environment"
  protocol_type = "HTTP"

  cors_configuration = {
    allow_headers = ["content-type", "x-amz-date", "authorization", "x-api-key", "x-amz-security-token", "x-amz-user-agent"]
    allow_methods = ["*"]
    allow_origins = ["*"]
  }

  # Custom domain
  domain_name                 = data.aws_acm_certificate.issued.domain
  domain_name_certificate_arn = data.aws_acm_certificate.issued.arn

  # Access logs
  default_stage_access_log_destination_arn = aws_cloudwatch_log_group.api_gateway_default_log_group.arn
  default_stage_access_log_format          = "$context.identity.sourceIp - - [$context.requestTime] \"$context.httpMethod $context.routeKey $context.protocol\" $context.status $context.responseLength $context.requestId $context.integrationErrorMessage"

  # Routes and integrations
  integrations = {
    "POST /api/v2" = {
      lambda_arn       = aws_lambda_function.event_publisher_lambda.arn,
      integration_type = "AWS_PROXY"
    }
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
