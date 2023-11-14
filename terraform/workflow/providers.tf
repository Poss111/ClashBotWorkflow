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
  backend "remote" {}
}