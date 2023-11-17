variable "prefix" {
    type        = string
    description = "The prefix to use for all resources."
}

variable "environment" {
    type        = string
    description = "The environment to use."
}

variable "s3_bucket_name" {
  type = string
  description = "The s3 bucket that stores the lambda function code."
}

variable "artifact_path" {
  type = string
  description = "Path to the artifact for the lambda function."
}

variable "environment_variables" {
  type = map(string)
  description = "Environment variables to set for the lambda function."
}

variable "iam_policy_json" {
  type = string
  description = "The json for the iam policy."
}