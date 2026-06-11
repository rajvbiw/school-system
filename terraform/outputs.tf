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

output "ecr_backend_url" {
  value       = module.ecr.backend_repo_url
  description = "ECR Backend repository URL"
}

output "ecr_frontend_url" {
  value       = module.ecr.frontend_repo_url
  description = "ECR Frontend repository URL"
}

output "rds_endpoint" {
  value       = module.rds.db_endpoint
  description = "RDS Database Endpoint"
}

output "elasticache_endpoint" {
  value       = module.elasticache.cache_endpoint
  description = "ElastiCache Redis endpoint"
}

output "s3_uploads_bucket" {
  value       = module.s3.uploads_bucket_name
  description = "S3 Uploads bucket name"
}

output "cloudfront_domain" {
  value       = module.cloudfront.domain_name
  description = "CloudFront Distribution Domain Name"
}

output "route53_nameservers" {
  value       = module.route53.nameservers
  description = "Route53 Zone Nameservers"
}
