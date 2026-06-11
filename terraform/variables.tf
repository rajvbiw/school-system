variable "aws_region" {
  type        = string
  description = "AWS region to deploy resources"
  default     = "us-east-1"
}

variable "environment" {
  type        = string
  description = "Execution environment (e.g. dev, prod)"
  default     = "dev"
}

variable "project_name" {
  type        = string
  description = "Name of the project"
  default     = "school-erp"
}

variable "eks_node_instance_type" {
  type        = string
  description = "Instance type for EKS worker nodes"
  default     = "t3.small"
}

variable "eks_desired_nodes" {
  type        = number
  description = "Desired number of EKS worker nodes"
  default     = 2
}

variable "eks_min_nodes" {
  type        = number
  description = "Minimum number of EKS worker nodes"
  default     = 2
}

variable "eks_max_nodes" {
  type        = number
  description = "Maximum number of EKS worker nodes"
  default     = 5
}

variable "rds_instance_class" {
  type        = string
  description = "Instance type for RDS database"
  default     = "db.t3.micro"
}

variable "domain_name" {
  type        = string
  description = "DNS Root domain name"
  default     = "edtech.example.com"
}

variable "alert_email" {
  type        = string
  description = "Email address for SNS CloudWatch alert notifications"
  default     = "sysops@edtech.example.com"
}
