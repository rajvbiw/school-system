terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  backend "s3" {
    bucket         = "school-erp-tfstate"
    key            = "school-erp/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "school-erp-tflock"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "Terraform"
    }
  }
}

module "vpc" {
  source       = "./modules/vpc"
  project_name = var.project_name
  environment  = var.environment
}

module "ecr" {
  source = "./modules/ecr"
}

module "eks" {
  source                 = "./modules/eks"
  vpc_id                 = module.vpc.vpc_id
  private_subnet_ids     = module.vpc.private_subnet_ids
  node_instance_type     = var.eks_node_instance_type
  desired_nodes          = var.eks_desired_nodes
  min_nodes              = var.eks_min_nodes
  max_nodes              = var.eks_max_nodes
}

module "rds" {
  source             = "./modules/rds"
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  eks_security_group = module.eks.cluster_security_group_id
  instance_class     = var.rds_instance_class
}

module "elasticache" {
  source             = "./modules/elasticache"
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  eks_security_group = module.eks.cluster_security_group_id
}

module "s3" {
  source = "./modules/s3"
}

module "cloudfront" {
  source                     = "./modules/cloudfront"
  s3_bucket_regional_domain = module.s3.assets_bucket_regional_domain
  acm_certificate_arn        = module.acm.certificate_arn
}

module "acm" {
  source      = "./modules/acm"
  domain_name = var.domain_name
}

module "route53" {
  source            = "./modules/route53"
  domain_name       = var.domain_name
  cloudfront_domain = module.cloudfront.domain_name
}

module "iam" {
  source        = "./modules/iam"
  oidc_provider = module.eks.oidc_provider
}

module "secrets_manager" {
  source = "./modules/secrets_manager"
}

module "cloudwatch" {
  source      = "./modules/cloudwatch"
  alert_email = var.alert_email
}
