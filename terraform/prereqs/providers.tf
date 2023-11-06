provider "aws" {
  region = var.region
  access_key = var.access_key
  secret_key = var.secret_key

  default_tags {
    tags = {
      Application = "ClashBot"
      Environment = var.environment
    }
  }
}

terraform {
  backend "remote" {
    organization = "ClashBot"

    workspaces {
      name = "ClashBotWorkflowPrereqs"
    }
  }
}