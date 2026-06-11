variable "vpc_id" { type = string }
variable "private_subnet_ids" { type = list(string) }
variable "eks_security_group" { type = string }
variable "instance_class" { type = string }
