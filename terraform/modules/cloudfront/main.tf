resource "aws_cloudfront_origin_access_control" "oac" {
  name                              = "school-erp-oac"
  description                       = "OAC access to frontend S3 assets"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "frontend" {
  origin {
    domain_name              = var.s3_bucket_regional_domain
    origin_id                = "S3-Frontend"
    origin_access_control_id = aws_cloudfront_origin_access_control.oac.id
  }
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_path      = "/index.html"
  }
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-Frontend"
    forwarded_values {
      query_string = false
      cookies { forward = "none" }
    }
    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }
  price_class = "PriceClass_100"
  restrictions {
    geo_restriction { restriction_type = "none" }
  }
  viewer_certificate {
    acm_certificate_arn      = var.acm_certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
}

# CloudFront Variables & Outputs
variable "s3_bucket_regional_domain" { type = string }
variable "acm_certificate_arn" { type = string }

output "domain_name" { value = aws_cloudfront_distribution.frontend.domain_name }
