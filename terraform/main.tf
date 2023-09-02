provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Application = "ClashBot"
      Environment = var.environment
    }
  }
}

module "dynamodb_table" {
  source = "terraform-aws-modules/dynamodb-table/aws"

  name           = "clash-teams"
  hash_key       = "teamId"
  billing_mode   = "PROVISIONED"
  write_capacity = 5
  read_capacity  = 1

  #   private TeamId teamId;
  #     private String id;
  #     private TournamentId tournamentId;    
  #         private String tournamentName;
  #         private String tournamentDay;
  #   private String teamName;
  #   private String serverId;
  #   private String teamIconLink;
  #   private Map<Role, BasePlayerRecord> positions;
  #     private String discordId;
  #     private String name;
  #     private Set<LoLChampion> championsToPlay;
  #         private String name;

  attributes = [
    {
      name = "teamId"
      type = "S"
    }
  ]
}
