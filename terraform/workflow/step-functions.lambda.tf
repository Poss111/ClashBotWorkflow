module "create_team_step_function" {
  source = "terraform-aws-modules/step-functions/aws"

  name = "create-team-${var.environment}"
  definition = templatefile("${path.module}/step-functions/create-team-step-function.asl.json", {
    CreateTeamLambdaFunctionArn   = aws_lambda_function.create_team_lambda.arn,
    RetrieveTeamLambdaFunctionArn = aws_lambda_function.retrieve_team_lambda.arn,
    }
  )

  service_integrations = {
    dynamodb = {
      dynamodb = [module.dynamodb_table.dynamodb_table_arn]
    }
  }

  type = "STANDARD"
}