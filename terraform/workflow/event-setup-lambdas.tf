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

resource "aws_lambda_event_source_mapping" "event_handler_sqs_trigger" {
  event_source_arn = module.clash_bot_event_sqs.queue_arn
  function_name    = module.event_handler_lambda.name
  batch_size       = 1
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

module "event_notifier_lambda" {
  source = "./modules/lambda"

  prefix         = "event-notifier"
  s3_bucket_name = var.s3_bucket_name
  environment    = var.environment

  artifact_path = var.event_notifier_artifact_path

  environment_variables = {
    TABLE_NAME = module.events_table.dynamodb_table_id
  }

  iam_policy_json = templatefile(
    "${path.module}/policies/event-notifier-lambda-policy.json",
    {
      DYNAMODB_ARN = module.events_table.dynamodb_table_arn
    }
  )
}