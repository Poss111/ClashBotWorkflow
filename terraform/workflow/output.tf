output "api-gateway-endpoint" {
  value       = module.api_gateway.apigatewayv2_api_api_endpoint
  description = "The endpoint for the API Gateway."
}

output "event-publisher-lambda-arn" {
  value       = module.event_publisher_lambda.arn
  description = "The ARN for the event publisher lambda function."
}

output "event-handler-lambda-arn" {
  value       = module.event_handler_lambda.arn
  description = "The ARN for the event handler lambda function."
}

output "create-team-lambda-arn" {
  value       = module.create_team_lambda.arn
  description = "The ARN for the create team lambda function."
}

output "retrieve-team-lambda-arn" {
  value       = module.retrieve_team_lambda.arn
  description = "The ARN for the retrieve team lambda function."
}

output "tournament-eligibility-lambda-arn" {
  value       = module.tournament_eligibility_lambda.arn
  description = "The ARN for the tournament eligibility lambda function."
}

output "event-sqs" {
  value       = module.clash_bot_event_sqs.queue_arn
  description = "The ARN for the event SQS queue."
}

output "step-function-arn" {
  value       = module.create_team_step_function.state_machine_arn
  description = "The ARN for the step function."
}