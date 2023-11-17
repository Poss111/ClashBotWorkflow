resource "aws_lambda_function" "retrieve_team_lambda" {
  function_name = "clash-bot-retrieve-team-${lower(var.environment)}"
  handler       = "prod/handler.handler"
  runtime       = "nodejs16.x"
  role          = aws_iam_role.retrieve_team_lambda_exec.arn

  s3_bucket = var.s3_bucket_name
  s3_key    = var.retrieve_team_artifact_path

  environment {
    variables = {
      TABLE_NAME = module.dynamodb_table.dynamodb_table_id
    }
  }
}

resource "aws_iam_role" "retrieve_team_lambda_exec" {
  name = "clash_bot_retrieve_team_exec_role-${lower(var.environment)}"

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

resource "aws_iam_role_policy_attachment" "retrieve_team_lambda_exec_policy" {
  role       = aws_iam_role.retrieve_team_lambda_exec.name
  policy_arn = aws_iam_policy.retrieve_team_policy.arn
}

data "aws_iam_policy_document" "retrieve_team_policy_document" {
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
      "dynamodb:GetItem",
      "dynamodb:BatchGetItem",
      "dynamodb:Query",
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:DeleteItem",
      "dynamodb:BatchWriteItem"
    ]
    resources = [
      module.dynamodb_table.dynamodb_table_arn
    ]
  }
}

resource "aws_iam_policy" "retrieve_team_policy" {
  name        = "ClashBotWorkflowRetrieveTeamPolicy-${lower(var.environment)}"
  description = "Policy for the retrieve team lambda function."
  policy      = data.aws_iam_policy_document.retrieve_team_policy_document.json
}