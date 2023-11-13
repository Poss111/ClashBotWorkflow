resource "aws_lambda_function" "event_handler_lambda" {
  function_name = "clash-bot-event-handler"
  handler       = "prod/handler.handler"
  runtime       = "nodejs16.x"
  role          = aws_iam_role.lambda_handler_exec.arn

  s3_bucket = var.s3_bucket_name
  s3_key    = var.event_handler_artifact_path

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
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_handler_exec_policy" {
  role       = aws_iam_role.lambda_handler_exec.name
  policy_arn = aws_iam_policy.event_handler_policy.arn
}

data "aws_iam_policy_document" "event_handler_policy_document" {
  statement {
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = ["*"]
  }

  statement {
    effect = "Allow"
    actions = [
      "sqs:DeleteMessage",
      "sqs:GetQueueAttributes",
      "sqs:ReceiveMessage",
    ]
    resources = ["*"]
  }
}

resource "aws_iam_policy" "event_handler_policy" {
  name        = "ClashBotWorkflowEventHandlerPolicy"
  description = "Allows the event handler lambda to interact with SQS and CloudWatch Logs"
  policy      = data.aws_iam_policy_document.event_handler_policy_document.json
}