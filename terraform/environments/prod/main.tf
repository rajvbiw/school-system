module "school_erp" {
  source = "../../"

  environment            = "prod"
  eks_node_instance_type = "t3.large"
  eks_desired_nodes      = 3
  eks_max_nodes          = 10
  rds_instance_class     = "db.t3.small"
}
