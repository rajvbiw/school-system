output "cluster_name" { value = aws_eks_cluster.main.name }
output "cluster_endpoint" { value = aws_eks_cluster.main.endpoint }
output "cluster_security_group_id" { value = aws_security_group.eks.id }
output "oidc_provider" { value = aws_iam_openid_connect_provider.eks.arn }
