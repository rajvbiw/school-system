terraform {
  required_version = ">= 1.7.0"
  required_providers {
    aws   = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    helm  = {
      source  = "hashicorp/helm"
      version = "~> 2.13"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.30"
    }
  }
  backend "s3" {
    bucket = var.tf_state_bucket
    key    = "school-erp/terraform.tfstate"
    region = var.aws_region
  }
}
