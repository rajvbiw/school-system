resource "aws_acm_certificate" "cert" {
  domain_name       = var.domain_name
  validation_method = "DNS"
  subject_alternative_names = [
    "*.${var.domain_name}"
  ]
  lifecycle {
    create_before_destroy = true
  }
}

variable "domain_name" { type = string }

output "certificate_arn" {
  value = aws_acm_certificate.cert.arn
}
