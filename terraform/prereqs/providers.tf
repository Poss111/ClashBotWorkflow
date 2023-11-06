provider "aws" {
  region     = var.region
  access_key = var.access
  secret_key = var.secret

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