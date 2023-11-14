module "clash_bot_event_sqs" {
  source = "terraform-aws-modules/sqs/aws"

  name = "clash-bot-event-sqs-${var.environment}"

  fifo_queue = true
}