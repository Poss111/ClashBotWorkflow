module "create_team_step_function" {
  source = "terraform-aws-modules/step-functions/aws"

  name = "create-team-${var.environment}"
  definition = templatefile("${path.module}/step-functions/create-team-step-function.asl.json", {
    CreateTeamLambdaFunctionArn   = module.create_team_lambda.arn,
    RetrieveTeamLambdaFunctionArn = module.retrieve_team_lambda.arn,
    IsTournamentEligibleLambdaFunctionArn = module.tournament_eligibility_lambda.arn
    }
  )

  service_integrations = {
    dynamodb = {
      dynamodb = [module.dynamodb_table.dynamodb_table_arn]
    }
  }

  type = "STANDARD"
}

module "create_team_lambda" {
  source = "./modules/lambda"

  prefix         = "create-team"
  s3_bucket_name = var.s3_bucket_name
  environment    = var.environment

  artifact_path = var.create_team_artifact_path

  environment_variables = {
    TABLE_NAME = module.dynamodb_table.dynamodb_table_id
  }

  iam_policy_json = templatefile(
    "${path.module}/policies/create-team-lambda-policy.json",
    {
      DYNAMODB_TABLE_ARN = module.dynamodb_table.dynamodb_table_arn
    }
  )
}

module "event_handler_lambda" {
  source = "./modules/lambda"

  prefix         = "event-handler"
  s3_bucket_name = var.s3_bucket_name
  environment    = var.environment

  artifact_path = var.event_handler_artifact_path

  environment_variables = {
    CREATE_TEAM_SF_ARN            = module.create_team_step_function.state_machine_arn
    UPDATE_TEAM_SF_ARN            = module.create_team_step_function.state_machine_arn
    DELETE_TEAM_SF_ARN            = module.create_team_step_function.state_machine_arn
    CREATE_TENTATIVE_QUEUE_SF_ARN = module.create_team_step_function.state_machine_arn
    UPDATE_TENTATIVE_QUEUE_SF_ARN = module.create_team_step_function.state_machine_arn
    DELETE_TENTATIVE_QUEUE_SF_ARN = module.create_team_step_function.state_machine_arn
  }

  iam_policy_json = templatefile(
    "${path.module}/policies/event-handler-lambda-policy.json",
    {
      CREATE_TEAM_STATE_MACHINE_ARN = module.create_team_step_function.state_machine_arn
      SQS_ARN                       = module.clash_bot_event_sqs.queue_arn
    }
  )
}

module "event_publisher_lambda" {
  source = "./modules/lambda"

  prefix         = "event-publisher"
  s3_bucket_name = var.s3_bucket_name
  environment    = var.environment

  artifact_path = var.event_publisher_artifact_path

  environment_variables = {
    QUEUE_URL = module.clash_bot_event_sqs.queue_url
  }

  iam_policy_json = templatefile(
    "${path.module}/policies/event-publisher-lambda-policy.json",
    {
      SQS_ARN = module.clash_bot_event_sqs.queue_arn
    }
  )
}

module "retrieve_team_lambda" {
  source = "./modules/lambda"

  prefix         = "retrieve-team"
  s3_bucket_name = var.s3_bucket_name
  environment    = var.environment

  artifact_path = var.retrieve_teams_artifact_path

  environment_variables = {
    TABLE_NAME = module.dynamodb_table.dynamodb_table_id
  }

  iam_policy_json = templatefile(
    "${path.module}/policies/retrieve-teams-lambda-policy.json",
    {
      SQS_ARN = module.clash_bot_event_sqs.queue_arn
    }
  )
}

module "tournament_eligibility_lambda" {
  source = "./modules/lambda"

  prefix         = "tournament-eligibility"
  s3_bucket_name = var.s3_bucket_name
  environment    = var.environment

  artifact_path = var.tournament_eligibility_lambda_artifact_path

  environment_variables = {
    TABLE_NAME = module.dynamodb_table.dynamodb_table_id
  }

  iam_policy_json = templatefile(
    "${path.module}/policies/tournament-eligibility-lambda-policy.json",
    {
      SQS_ARN = module.clash_bot_event_sqs.queue_arn
    }
  )
}

resource "aws_lambda_permission" "apigw" {
  statement_id  = "AllowExecutionFromAPIGateway-${lower(var.environment)}"
  action        = "lambda:InvokeFunction"
  function_name = module.event_publisher_lambda.name
  principal     = "apigateway.amazonaws.com"

  # The /*/* portion grants access from any method on any resource
  # within the API Gateway "REST API".
  source_arn = "${module.api_gateway.apigatewayv2_api_execution_arn}/*/*"
}