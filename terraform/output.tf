output "clash-teams-table-arn" {
  value       = module.dynamodb_table.dynamodb_table_arn
  description = "The created Dynamodb table ARN."
}