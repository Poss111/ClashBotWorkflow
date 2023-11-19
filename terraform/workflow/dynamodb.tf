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

  name           = "clash-bot-events-${var.environment}"
  hash_key       = "connectionId"
  range_key      = "context"
  billing_mode   = "PROVISIONED"
  write_capacity = 5
  read_capacity  = 1

  attributes = [
    {
      name = "connectionId"
      type = "S"
    },
    {
      name = "context"
      type = "S"
    }
  ]
}