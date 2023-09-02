provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Application = "ClashBot"
      Environment = var.environment
    }
  }
}

module "dynamodb_table" {
  source = "terraform-aws-modules/dynamodb-table/aws"

  name           = "clash-teams-${var.environment}"
  hash_key       = "teamId"
  billing_mode   = "PROVISIONED"
  write_capacity = 5
  read_capacity  = 1

  #   private TeamId teamId;
  #     private String id;
  #     private TournamentId tournamentId;    
  #         private String tournamentName;
  #         private String tournamentDay;
  #   private String teamName;
  #   private String serverId;
  #   private String teamIconLink;
  #   private Map<Role, BasePlayerRecord> positions;
  #     private String discordId;
  #     private String name;
  #     private Set<LoLChampion> championsToPlay;
  #         private String name;

  attributes = [
    {
      name = "teamId"
      type = "S"
    }
  ]
}

module "step_function" {
  source = "terraform-aws-modules/step-functions/aws"

  name       = "retrieve-teams-${var.environment}"
  definition = <<EOF
  {
    "Comment": "A Hello World example of the Amazon States Language using Pass states",
    "StartAt": "Hello",
    "States": {
      "Hello": {
        "Type": "Pass",
        "Result": "Hello",
        "Next": "World"
      },
      "World": {
        "Type": "Pass",
        "Result": "World",
        "End": true
      }
    }
  }
  EOF

  service_integrations = {
    dynamodb = {
      dynamodb = [module.dynamodb_table.dynamodb_table_arn]
    }
  }

  type = "STANDARD"
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
  domain_name = "clash-bot-workflow-${var.environment}.api"
  # domain_name_certificate_arn = "arn:aws:acm:eu-west-1:052235179155:certificate/2b3a7ed9-05e1-4f9e-952b-27744ba06da6"

  # Access logs
  default_stage_access_log_format = "$context.identity.sourceIp - - [$context.requestTime] \"$context.httpMethod $context.routeKey $context.protocol\" $context.status $context.responseLength $context.requestId $context.integrationErrorMessage"

  # Routes and integrations
  integrations = {
    "$default" = {
      step_function_arn = module.step_function.state_machine_arn
    }
  }
}
