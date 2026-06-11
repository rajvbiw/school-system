output "eks_cluster_name" {
  value       = module.eks.cluster_name
  description = "EKS Cluster Name"
}

output "eks_cluster_endpoint" {
  value       = module.eks.cluster_endpoint
  description = "EKS Cluster Endpoint"
}

output "eks_kubeconfig_command" {
  value       = "aws eks update-kubeconfig --name ${module.eks.cluster_name} --region ${var.aws_region}"
  description = "AWS EKS kubeconfig loading command"
}

output "rds_endpoint" {
  value       = module.rds.db_endpoint
  description = "RDS Database Endpoint"
}
