resource "aws_iam_role" "s3_access" {
  name = "school-erp-s3-access-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRoleWithWebIdentity"
      Effect = "Allow"
      Principal = { Federated = var.oidc_provider }
      Condition = {
        StringEquals = {
          "oidc.eks.us-east-1.amazonaws.com/id/EXAMPLED:sub" = "system:serviceaccount:school-a:school-erp-sa"
        }
      }
    }]
  })
}

resource "aws_iam_policy" "s3_uploads" {
  name        = "school-erp-s3-uploads-policy"
  description = "Allows pods to upload files to S3 bucket"
  policy      = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
        Resource = "arn:aws:s3:::school-erp-uploads/*"
      },
      {
        Effect   = "Allow"
        Action   = ["secretsmanager:GetSecretValue"]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "s3_attach" {
  policy_arn = aws_iam_policy.s3_uploads.arn
  role       = aws_iam_role.s3_access.name
}

# GitHub Actions CI IAM Role
resource "aws_iam_role" "github_actions" {
  name = "school-erp-github-actions-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRoleWithWebIdentity"
      Effect = "Allow"
      Principal = { Federated = "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com" }
      Condition = {
        StringEquals = {
          "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
        }
      }
    }]
  })
}

# IAM Variables
variable "oidc_provider" { type = string }
