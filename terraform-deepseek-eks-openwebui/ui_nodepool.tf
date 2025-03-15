# Frontend General Purpose NodePool
resource "kubectl_manifest" "frontend_general_nodepool" {
  provider = kubectl.frontend

  yaml_body = yamlencode({
    apiVersion = "karpenter.sh/v1"
    kind       = "NodePool"
    metadata = {
      name = "general-nodepool"
    }
    spec = {
      template = {
        metadata = {
          labels = {
            owner        = "frontend-team"
            instanceType = "general"
          }
        }
        spec = {
          nodeClassRef = {
            group = "eks.amazonaws.com"
            kind  = "NodeClass"
            name  = "default"
          }
          requirements = [
            {
              key      = "eks.amazonaws.com/instance-family"
              operator = "In"
              values   = ["m5", "m6i", "c5", "c6i"]  # Intel-based general purpose instances
            },
            {
              key      = "kubernetes.io/arch"
              operator = "In"
              values   = ["amd64"]
            },
            {
              key      = "karpenter.sh/capacity-type"
              operator = "In"
              values   = ["spot", "on-demand"]
            }
          ]
        }
      }
      limits = {
        cpu    = "100"
        memory = "400Gi"
      }
    }
  })

  depends_on = [module.frontend_eks]
} 