resource "aws_lambda_function" "event_publisher_lambda" {
  function_name = "clash-bot-event-publisher"
  handler       = "handler.handler"
  runtime       = "nodejs16.x"
  role          = aws_iam_role.lambda_publisher_exec.arn

  s3_bucket = var.s3_bucket_name
  s3_key    = var.event_publisher_artifact_path

  environment {
    variables = {
      QUEUE_URL = module.clash_bot_event_sqs.queue_arn
    }
  }
}

resource "aws_iam_role" "lambda_publisher_exec" {
  name = "clash_bot_lambda_event_publisher_exec_role"

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

resource "aws_lambda_permission" "apigw" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.event_publisher_lambda.function_name
  principal     = "apigateway.amazonaws.com"

  # The /*/* portion grants access from any method on any resource
  # within the API Gateway "REST API".
  source_arn = "${module.api_gateway.apigatewayv2_api_execution_arn}/*/$default"
}

resource "aws_iam_role_policy_attachment" "lambda_publisher_exec_policy" {
  role       = aws_iam_role.lambda_handler_exec.name
  policy_arn = aws_iam_policy.event_publisher_policy.arn
}

data "aws_iam_policy_document" "event_publisher_policy_document" {
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

resource "aws_iam_policy" "event_publisher_policy" {
  name        = "ClashBotEventPublisherPolicy"
  description = "Allows the event publisher lambda to publish events to the event queue and log events to CloudWatch"
  policy      = data.aws_iam_policy_document.event_publisher_policy_document.json
}