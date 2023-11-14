terraform {
  backend "remote" {
    organization = "ClashBot"

    workspaces {
      name = "ClashBotWorkflow"
    }
  }
}