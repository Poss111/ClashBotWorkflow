module "create_team_step_function" {
  source = "terraform-aws-modules/step-functions/aws"

  name = "create-team-${var.environment}"
  definition = templatefile("${path.module}/step-functions/create-team-step-function.asl.json", {
    CreateTeamLambdaFunctionArn           = module.create_team_lambda.arn,
    RetrieveTeamLambdaFunctionArn         = module.retrieve_team_lambda.arn,
    IsTournamentEligibleLambdaFunctionArn = module.tournament_eligibility_lambda.arn,
    WebSocketPublishLambdaFunctionArn     = module.websocket_publisher_lambda.arn
    }
  )

  service_integrations = {
    dynamodb = {
      dynamodb = [module.dynamodb_table.dynamodb_table_arn]
    }
    lambda = {
      lambda = [
        module.create_team_lambda.arn,
        module.retrieve_team_lambda.arn,
        module.tournament_eligibility_lambda.arn,
        module.websocket_publisher_lambda.arn
      ]
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
      DYNAMODB_ARN = module.dynamodb_table.dynamodb_table_arn
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
      DYNAMODB_ARN = module.dynamodb_table.dynamodb_table_arn
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
      DYNAMODB_ARN = module.dynamodb_table.dynamodb_table_arn
    }
  )
}

module "websocket_publisher_lambda" {
  source = "./modules/lambda"

  prefix         = "websocket-publisher"
  s3_bucket_name = var.s3_bucket_name
  environment    = var.environment

  artifact_path = var.websocket_publisher_artifact_path

  environment_variables = {
    TOPIC_TO_SUBSCRIBERS_TABLE_NAME = module.events_table.dynamodb_table_id,
    WEBSOCKET_API_ENDPOINT          = "https://${aws_apigatewayv2_api.clash_bot_websocket_api.id}.execute-api.${var.region}.amazonaws.com/${aws_apigatewayv2_stage.clash_bot_websocket_api_stage.name}"
  }

  iam_policy_json = templatefile(
    "${path.module}/policies/websocket-publisher-lambda-policy.json",
    {
      DYNAMODB_ARN   = module.events_table.dynamodb_table_arn,
      WS_GATEWAY_ARN = aws_apigatewayv2_api.clash_bot_websocket_api.arn
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

resource "aws_lambda_permission" "tournament_eligibility_permission" {
  statement_id  = "TournamentEligibilityPermission-${lower(var.environment)}"
  action        = "lambda:InvokeFunction"
  function_name = module.tournament_eligibility_lambda.name
  principal     = "states.amazonaws.com"
  source_arn    = module.create_team_step_function.state_machine_arn
}

resource "aws_lambda_permission" "create_team_permission" {
  statement_id  = "CreateTeamPermission-${lower(var.environment)}"
  action        = "lambda:InvokeFunction"
  function_name = module.create_team_lambda.name
  principal     = "states.amazonaws.com"
  source_arn    = module.create_team_step_function.state_machine_arn
}

resource "aws_lambda_permission" "websocket_publisher_permission" {
  statement_id  = "WebSocketPublisherPermission-${lower(var.environment)}"
  action        = "lambda:InvokeFunction"
  function_name = module.websocket_publisher_lambda.name
  principal     = "states.amazonaws.com"
  source_arn    = module.create_team_step_function.state_machine_arn
}