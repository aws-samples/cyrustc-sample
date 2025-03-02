# EBS Storage Class for Frontend EKS
resource "kubectl_manifest" "frontend_ebs_storage_class" {
  provider = kubectl.frontend

  yaml_body = yamlencode({
    apiVersion = "storage.k8s.io/v1"
    kind       = "StorageClass"
    metadata = {
      name = "ebs-sc"
      annotations = {
        "storageclass.kubernetes.io/is-default-class" = "true"
      }
    }
    provisioner       = "ebs.csi.eks.amazonaws.com"
    volumeBindingMode = "WaitForFirstConsumer"
    parameters = {
      type      = "gp3"
      encrypted = "true"
    }
  })

  depends_on = [module.frontend_eks]
} 
