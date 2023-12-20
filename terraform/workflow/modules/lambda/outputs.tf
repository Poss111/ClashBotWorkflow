output "arn" {
  value       = aws_lambda_function.lambda.arn
  description = "The ARN for the lambda function."
}

output "name" {
    value       = aws_lambda_function.lambda.function_name
    description = "The name for the lambda function."
}

output "invoke_arn" {
  value = aws_lambda_function.lambda.invoke_arn
  description = "The invoke ARN for the lambda function."
}