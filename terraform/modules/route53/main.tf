resource "aws_route53_zone" "primary" {
  name = var.domain_name
}

resource "aws_route53_record" "wildcard" {
  zone_id = aws_route53_zone.primary.zone_id
  name    = "*.${var.domain_name}"
  type    = "CNAME"
  ttl     = 300
  records = [var.cloudfront_domain]
}

resource "aws_route53_record" "school_a" {
  zone_id = aws_route53_zone.primary.zone_id
  name    = "school-a.${var.domain_name}"
  type    = "CNAME"
  ttl     = 300
  records = [var.cloudfront_domain]
}

resource "aws_route53_record" "school_b" {
  zone_id = aws_route53_zone.primary.zone_id
  name    = "school-b.${var.domain_name}"
  type    = "CNAME"
  ttl     = 300
  records = [var.cloudfront_domain]
}

# Route53 Variables & Outputs
variable "domain_name" { type = string }
variable "cloudfront_domain" { type = string }

output "nameservers" {
  value = aws_route53_zone.primary.name_servers
}
