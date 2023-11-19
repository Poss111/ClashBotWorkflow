resource "aws_apigatewayv2_api" "clash_bot_websocket_api" {
  name                       = "clash-bot-workflow-ws-${var.environment}"
  protocol_type              = "WEBSOCKET"
  route_selection_expression = "$request.body.action"
}

resource "aws_apigatewayv2_route" "clash_bot_connection_route" {
  api_id    = aws_apigatewayv2_api.clash_bot_websocket_api.id
  route_key = "$connect"
  target    = "integrations/${aws_apigatewayv2_integration.clash_bot_websocket_api_integration.id}"
}

resource "aws_apigatewayv2_route" "clash_bot_disconnection_route" {
  api_id    = aws_apigatewayv2_api.clash_bot_websocket_api.id
  route_key = "$disconnect"
  target    = "integrations/${aws_apigatewayv2_integration.clash_bot_websocket_api_integration.id}"
}

resource "aws_apigatewayv2_route" "clash_bot_message_route" {
  api_id    = aws_apigatewayv2_api.clash_bot_websocket_api.id
  route_key = "$message"
  target    = "integrations/${aws_apigatewayv2_integration.clash_bot_websocket_api_integration.id}"
}

resource "aws_apigatewayv2_integration" "clash_bot_websocket_api_integration" {
  api_id           = aws_apigatewayv2_api.clash_bot_websocket_api.id
  integration_type = "AWS_PROXY"

  connection_type    = "INTERNET"
  description        = "Lambda integration"
  integration_method = "POST"
  integration_uri    = module.event_notifier_lambda.invoke_arn
}

resource "aws_lambda_permission" "clash_bot_ws_lambda_permission" {
  action        = "lambda:InvokeFunction"
  function_name = module.event_notifier_lambda.name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.clash_bot_websocket_api.execution_arn}/*/*"
}

resource "aws_apigatewayv2_deployment" "clash_bot_websocket_api_deployment" {
  api_id      = aws_apigatewayv2_api.clash_bot_websocket_api.id
  description = "Webscocket API deployment"

  depends_on = [
    aws_apigatewayv2_route.clash_bot_connection_route
  ]
}

resource "aws_apigatewayv2_stage" "clash_bot_websocket_api_stage" {
  api_id        = aws_apigatewayv2_api.clash_bot_websocket_api.id
  name          = "events-${var.environment}"
  description   = "Clash Bot Workflow Websocket API stage"
  deployment_id = aws_apigatewayv2_deployment.clash_bot_websocket_api_deployment.id
  auto_deploy   = true
}