provider "aws" {
  region = var.region
}

module "dynamodb_table" {
  source = "terraform-aws-modules/dynamodb-table/aws"

  name           = "clash-teams"
  hash_key       = "id"
  billing_mode   = "PROVISIONED"
  write_capacity = 5

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
      type = "M"
    },
    {
      name = "teamName"
      type = "S"
    },
    {
      name = "serverId"
      type = "N"
    },
    {
      name = "teamIconLink"
      type = "S"
    },
    {
      name = "positions"
      type = "L"
    }
  ]
}
