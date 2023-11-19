module "dynamodb_table" {
  source = "terraform-aws-modules/dynamodb-table/aws"

  name           = "clash-bot-workflow-${var.environment}"
  hash_key       = "type"
  range_key      = "id"
  billing_mode   = "PROVISIONED"
  write_capacity = 5
  read_capacity  = 1

  attributes = [
    {
      name = "type"
      type = "S"
    },
    {
      name = "id"
      type = "S"
    }
  ]
}

module "events_table" {
  source = "terraform-aws-modules/dynamodb-table/aws"

  name           = "clash-bot-topics-${var.environment}"
  hash_key       = "topic"
  range_key      = "subscriber"
  billing_mode   = "PROVISIONED"
  write_capacity = 5
  read_capacity  = 1

  attributes = [
    {
      name = "topic"
      type = "S"
    },
    {
      name = "subscriber"
      type = "SS"
    }
  ]
}

module "subscriber_table" {
  source = "terraform-aws-modules/dynamodb-table/aws"

  name           = "clash-bot-subscriber-${var.environment}"
  hash_key       = "subscriber"
  range_key      = "topics"
  billing_mode   = "PROVISIONED"
  write_capacity = 5
  read_capacity  = 1

  attributes = [
    {
      name = "subscriber"
      type = "S"
    },
    {
      name = "topics"
      type = "SS"
    }
  ]
}