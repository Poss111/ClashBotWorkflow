terraform {
  backend "remote" {
    organization = "Clash Bot"

    workspaces {
      name = "ClashBotWorkflow"
    }
  }
}