# Frontend EKS Admin Access
resource "aws_eks_access_entry" "frontend_admin" {
  count = var.enable_additional_admin && var.admin_principal_arn != null ? 1 : 0

  provider = aws.frontend

  cluster_name   = module.frontend_eks.cluster_name
  principal_arn  = var.admin_principal_arn
  type          = "STANDARD"
}

resource "aws_eks_access_policy_association" "frontend_admin" {
  count = var.enable_additional_admin && var.admin_principal_arn != null ? 1 : 0

  provider = aws.frontend

  cluster_name  = module.frontend_eks.cluster_name
  policy_arn    = "arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy"
  principal_arn = var.admin_principal_arn

  access_scope {
    type = "cluster"
  }

  depends_on = [aws_eks_access_entry.frontend_admin]
} 