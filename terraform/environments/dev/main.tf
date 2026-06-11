module "school_erp" {
  source = "../../"

  environment            = "dev"
  eks_node_instance_type = "t3.small"
  eks_desired_nodes      = 2
  rds_instance_class     = "db.t3.micro"
}
