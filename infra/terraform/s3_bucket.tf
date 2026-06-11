resource "aws_s3_bucket" "tf_state" {
  bucket = var.tf_state_bucket
  acl    = "private"

  tags = {
    Project = var.project_name
    Name    = "${var.project_name}-tf-state"
  }
}

resource "aws_s3_bucket_versioning" "tf_state_versioning" {
  bucket = aws_s3_bucket.tf_state.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "tf_state_block" {
  bucket = aws_s3_bucket.tf_state.id
  block_public_acls   = true
  block_public_policy = true
  ignore_public_acls  = true
  restrict_public_buckets = true
}
