variable "region" {
  type        = string
  default     = "us-east-1"
  description = "The region to use."
}

variable "environment" {
  type        = string
  default     = "test"
  description = "The application environment."
}

variable "s3_bucket_name" {
  type        = string
  description = "The s3 bucket that stores the lambda function code."
}

variable "event_publisher_artifact_name" {
  type        = string
  description = "value of the artifact name for the event publisher lambda function."
}

variable "event_handler_artifact_name" {
  type        = string
  description = "value of the artifact name for the event handler lambda function."
}

variable "sqs_batch_size" {
  type        = number
  default     = 1
  description = "value of the batch size for the sqs trigger."
}

variable "dynamodb_table_arn" {
  type        = string
  description = "arn of the dynamodb table."

}