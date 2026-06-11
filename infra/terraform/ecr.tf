resource "aws_ecr_repository" "backend" {
  name = var.ecr_repo_backend
  image_scanning_configuration {
    scan_on_push = true
  }
  tags = {
    Project = var.project_name
  }
}

resource "aws_ecr_repository" "frontend" {
  name = var.ecr_repo_frontend
  image_scanning_configuration {
    scan_on_push = true
  }
  tags = {
    Project = var.project_name
  }
}
