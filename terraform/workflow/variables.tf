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

variable "event_publisher_artifact_path" {
  type        = string
  description = "Path to the artifact for the event publisher lambda function."
}

variable "event_handler_artifact_path" {
  type        = string
  description = "Path to the artifact for the event handler lambda function."
}

variable "create_team_artifact_path" {
  type        = string
  description = "Path to the artifact for the create team lambda function."
}

variable "retrieve_team_artifact_path" {
  type        = string
  description = "Path to the artifact for the retrieve team lambda function."
}

variable "sqs_batch_size" {
  type        = number
  default     = 1
  description = "value of the batch size for the sqs trigger."
}
