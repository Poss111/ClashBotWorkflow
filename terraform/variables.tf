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
