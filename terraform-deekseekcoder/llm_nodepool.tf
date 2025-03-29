# LLM GPU/Neuron NodePool
resource "kubectl_manifest" "llm_gpu_nodepool" {
  count    = var.is_neuron ? 0 : 1
  provider = kubectl.llm

  yaml_body = yamlencode({
    apiVersion = "karpenter.sh/v1"
    kind       = "NodePool"
    metadata = {
      name = "gpu-nodepool"
    }
    spec = {
      template = {
        metadata = {
          labels = {
            owner        = "llm-team"
            instanceType = "gpu"
          }
        }
        spec = {
          nodeClassRef = {
            group = "eks.amazonaws.com"
            kind  = "NodeClass"
            name  = "default"
          }
          taints = [
            {
              key    = "nvidia.com/gpu"
              value  = "Exists"
              effect = "NoSchedule"
            }
          ]
          requirements = [
            {
              key      = "eks.amazonaws.com/instance-family"
              operator = "In"
              values   = ["g4dn"]
            },
            {
              key      = "eks.amazonaws.com/instance-size"
              operator = "In"
              values   = ["8xlarge", "12xlarge", "16xlarge", "metal"]
              # values = ["metal"]
            },
            {
              key      = "kubernetes.io/arch"
              operator = "In"
              values   = ["amd64"]
            },
            {
              key      = "karpenter.sh/capacity-type"
              operator = "In"
              values   = ["on-demand"]
            }
          ]
        }
      }
      limits = {
        cpu    = "1000"
        memory = "1000Gi"
      }
    }
  })

  depends_on = [module.llm_eks]
}
