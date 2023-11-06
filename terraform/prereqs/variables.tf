variable "region" {
  type        = string
  default     = "us-east-1"
  description = "The region to use."
}

variable "environment" {
  type        = string
  default     = "dev"
  description = "value of the environment to use."
}

variable "access" {
  type = string
}

variable "secret" {
  type = string
}