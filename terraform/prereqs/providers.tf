provider "aws" {
  region     = var.region

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
