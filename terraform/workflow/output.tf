output "api-gateway-endpoint" {
  value       = module.api_gateway.apigatewayv2_api_endpoint
  description = "The endpoint for the API Gateway."
}

output "event-publisher-lambda-arn" {
  value       = aws_lambda_function.event_publisher_lambda.arn
  description = "The ARN for the event publisher lambda function."
}

output "event-handler-lambda-arn" {
  value       = aws_lambda_function.event_handler_lambda.arn
  description = "The ARN for the event handler lambda function."
}

output "event-publisher-lambda-version" {
  value       = aws_lambda_function.event_publisher_lambda.version
  description = "The version for the event publisher lambda function."
}

output "event-handler-lambda-version" {
  value       = aws_lambda_function.event_handler_lambda.version
  description = "The version for the event handler lambda function."
}

output "event-sqs" {
  value       = module.clash_bot_event_sqs.queue_arn
  description = "The ARN for the event SQS queue."
}

output "step-function-arn" {
  value       = module.create_team_step_function.state_machine_arn
  description = "The ARN for the step function."
}