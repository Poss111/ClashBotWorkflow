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
      },
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_publisher_exec_policy" {
  role       = aws_iam_role.lambda_publisher_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}