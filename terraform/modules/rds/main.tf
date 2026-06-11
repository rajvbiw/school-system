resource "aws_db_subnet_group" "rds" {
  name       = "school-erp-rds-subnet-group"
  subnet_ids = var.private_subnet_ids
}

resource "aws_security_group" "rds" {
  name        = "school-erp-rds-sg"
  description = "Access to RDS MySQL"
  vpc_id      = var.vpc_id
  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [var.eks_security_group]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_db_instance" "main" {
  identifier                  = "school-erp-mysql"
  engine                      = "mysql"
  engine_version              = "8.0"
  instance_class              = var.instance_class
  allocated_storage           = 20
  max_allocated_storage       = 100
  storage_type                = "gp3"
  storage_encrypted           = true
  db_name                     = "school_erp_main"
  username                    = "school_erp_user"
  password                    = "school_erp_password"
  db_subnet_group_name        = aws_db_subnet_group.rds.name
  vpc_security_group_ids      = [aws_security_group.rds.id]
  publicly_accessible          = false
  backup_retention_period     = 7
  deletion_protection         = false # Dev/Review friendly
  skip_final_snapshot         = true
}


