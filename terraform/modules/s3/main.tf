resource "aws_s3_bucket" "uploads" {
  bucket = "school-erp-uploads"
}

resource "aws_s3_bucket_public_access_block" "uploads" {
  bucket                  = aws_s3_bucket.uploads.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket" "assets" {
  bucket = "school-erp-frontend-assets"
}

resource "aws_s3_bucket_website_configuration" "assets" {
  bucket = aws_s3_bucket.assets.id
  index_document { suffix = "index.html" }
}

resource "aws_s3_bucket" "tfstate" {
  bucket = "school-erp-tfstate"
}

resource "aws_dynamodb_table" "tflock" {
  name         = "school-erp-tflock"
  hash_key     = "LockID"
  billing_mode = "PAY_PER_REQUEST"
  attribute {
    name = "LockID"
    type = "S"
  }
}

output "uploads_bucket_name" { value = aws_s3_bucket.uploads.id }
output "assets_bucket_regional_domain" { value = aws_s3_bucket.assets.bucket_regional_domain_name }
