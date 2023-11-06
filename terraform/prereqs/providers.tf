provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Application = "ClashBot"
      Environment = var.environment
    }
  }
}

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "5.14.0"
    }
  }
  backend "remote" {
    organization = "ClashBot"

    workspaces {
      name = "ClashBotWorkflowPrereqs"
    }
  }
}
