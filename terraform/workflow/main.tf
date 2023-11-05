provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Application = "ClashBot"
      Environment = var.environment
    }
  }
}

terraform {
  backend "remote" {
    organization = "ClashBot"

    workspaces {
      name = "ClashBotWorkflow"
    }
  }
}

data "aws_s3_bucket" "lambda_bucket" {
  bucket = var.s3_bucket_name
}

data "aws_acm_certificate" "issued" {
  domain   = "clash-bot.ninja"
  statuses = ["ISSUED"]
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
  domain_name                 = "${var.environment}.clash-bot.ninja"
  domain_name_certificate_arn = data.aws_acm_certificate.issued.arn

  # Access logs
  default_stage_access_log_format = "$context.identity.sourceIp - - [$context.requestTime] \"$context.httpMethod $context.routeKey $context.protocol\" $context.status $context.responseLength $context.requestId $context.integrationErrorMessage"

  # Routes and integrations
  integrations = {
    "$default" = {
      step_function_arn = module.step_function.state_machine_arn
    }
  }
}