resource "aws_lambda_function" "lambda" {
  function_name = "${var.prefix}-${lower(var.environment)}"
  handler       = "prod/handler.handler"
  runtime       = "nodejs16.x"
  role          = aws_iam_role.lambda_exec_role.arn

  s3_bucket = var.s3_bucket_name
  s3_key    = var.artifact_path

  environment {
    variables = var.environment_variables
  }
}

resource "aws_iam_role" "lambda_exec_role" {
  name = "${replace(var.prefix, "-", "_")}_exec_role-${lower(var.environment)}"

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

resource "aws_iam_role_policy_attachment" "lambda_exec_policy" {
  role       = aws_iam_role.lambda_exec_role.name
  policy_arn = aws_iam_policy.policy.arn
}

resource "aws_iam_policy" "policy" {
  name        = "${var.prefix}-Policy-${lower(var.environment)}"
  description = "Policy for the ${var.prefix} lambda function."
  policy      = var.iam_policy_json
}