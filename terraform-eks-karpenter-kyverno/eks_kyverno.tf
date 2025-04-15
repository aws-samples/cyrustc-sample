module "kyverno" {

  depends_on = [module.eks_blueprints_addons]
  source     = "aws-ia/eks-blueprints-addon/aws"
  version    = "1.1.1"

  description      = "Kyverno Kubernetes Native Policy Management"
  chart            = "kyverno"
  chart_version    = "3.0.0"
  namespace        = "kyverno"
  create_namespace = true
  repository       = "https://kyverno.github.io/kyverno/"
  wait             = true
  wait_for_jobs    = true

  values = [
    <<-EOT
    admissionController:
      replicas: 3
    backgroundController:
      replicas: 3
    cleanupController:
      replicas: 3
    reportsController:
      replicas: 1

    installCRDs: true
    EOT
  ]
}

module "kyverno_policies" {
  depends_on = [module.kyverno]
  source     = "aws-ia/eks-blueprints-addon/aws"
  version    = "1.1.1"

  description   = "Kyverno policy library"
  chart         = "kyverno-policies"
  chart_version = "3.0.0"
  namespace     = "kyverno"
  repository    = "https://kyverno.github.io/kyverno/"

  values = [
    templatefile("${path.module}/kyverno-policies.yaml", {})
  ]
}
