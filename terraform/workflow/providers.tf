provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Application = "ClashBot-Workflow"
      Environment = var.environment
    }
  }
}

terraform {
  required_version = ">= 0.12.0"
  backend "remote" {}
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
  }
}