resource "aws_lambda_function" "event_handler_lambda" {
  function_name = "clash-bot-event-handler"
  handler       = "handler.handler"
  runtime       = "nodejs16.x"
  role          = aws_iam_role.lambda_exec.arn

  s3_bucket = data.aws_s3_bucket.lambda_bucket.id
  s3_key    = "${var.environment}/${var.event_handler_artifact_name}.zip}"

  source_code_hash = filebase64sha256("${event_handler_artifact_name}.zip")

  environment {
    variables = {
      CREATE_TEAM_SF_ARN            = module.create_team_step_function.state_machine_arn
      UPDATE_TEAM_SF_ARN            = module.create_team_step_function.state_machine_arn
      DELETE_TEAM_SF_ARN            = module.create_team_step_function.state_machine_arn
      CREATE_TENTATIVE_QUEUE_SF_ARN = module.create_team_step_function.state_machine_arn
      UPDATE_TENTATIVE_QUEUE_SF_ARN = module.create_team_step_function.state_machine_arn
      DELETE_TENTATIVE_QUEUE_SF_ARN = module.create_team_step_function.state_machine_arn
    }
  }
}

resource "aws_lambda_event_source_mapping" "sqs_trigger" {
  event_source_arn = module.clash_bot_event_sqs.queue_arn
  function_name    = aws_lambda_function.event_handler_lambda.function_name
  batch_size       = var.sqs_batch_size
}

resource "aws_iam_role" "lambda_handler_exec" {
  name = "clash_bot_lambda_event_handler_exec_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      },
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_handler_exec_policy" {
  role       = aws_iam_role.lambda_handler_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}