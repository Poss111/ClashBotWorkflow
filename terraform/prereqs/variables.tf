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

variable "access_key" {
  type = string
}

variable "secret_key" {
  type = string
}