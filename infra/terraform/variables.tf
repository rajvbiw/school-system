variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-south-1"
}

variable "tf_state_bucket" {
  description = "S3 bucket for Terraform remote state"
  type        = string
  default     = "school-erp-terraform-state"
}

variable "project_name" {
  description = "Project identifier used for tagging"
  type        = string
  default     = "school-erp"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "cluster_name" {
  description = "EKS cluster name"
  type        = string
  default     = "school-erp-eks"
}

variable "node_instance_type" {
  description = "EC2 instance type for worker nodes"
  type        = string
  default     = "t3.medium"
}

variable "node_count" {
  description = "Number of worker nodes"
  type        = number
  default     = 2
}

variable "ecr_repo_backend" {
  description = "ECR repository name for backend"
  type        = string
  default     = "school-erp-backend"
}

variable "ecr_repo_frontend" {
  description = "ECR repository name for frontend"
  type        = string
  default     = "school-erp-frontend"
}

variable "enable_monitoring" {
  description = "Deploy Prometheus & Grafana via Helm"
  type        = bool
  default     = true
}
