# LLM Namespace
resource "kubectl_manifest" "llm_namespace" {
  provider = kubectl.llm

  yaml_body = yamlencode({
    apiVersion = "v1"
    kind       = "Namespace"
    metadata = {
      name = "llm"
    }
  })

  depends_on = [module.llm_eks]
}

# LLM Service
resource "kubectl_manifest" "llm_service" {
  provider = kubectl.llm

  yaml_body = yamlencode({
    apiVersion = "v1"
    kind       = "Service"
    metadata = {
      name      = "llm-service"
      namespace = "llm"
      labels = {
        app = "llm"
      }
      annotations = {
        # NLB-specific annotations for EKS Auto Mode
        "service.beta.kubernetes.io/aws-load-balancer-scheme"                   = "internet-facing"
        "service.beta.kubernetes.io/aws-load-balancer-nlb-target-type"          = "ip"
        "service.beta.kubernetes.io/aws-load-balancer-healthcheck-protocol"     = "HTTP"
        "service.beta.kubernetes.io/aws-load-balancer-healthcheck-path"         = "/health"
        "service.beta.kubernetes.io/aws-load-balancer-healthcheck-port"         = "8000"
        "service.beta.kubernetes.io/aws-load-balancer-additional-resource-tags" = join(",", [for k, v in var.tags : "${k}=${v}"])
        "service.beta.kubernetes.io/aws-load-balancer-ip-address-type"          = "ipv4"
      }
    }
    spec = {
      ports = [
        {
          port       = 80
          targetPort = 8000
          protocol   = "TCP"
          name       = "http"
        }
      ]
      selector = {
        app = "llm"
      }
      type              = "LoadBalancer"
      loadBalancerClass = "eks.amazonaws.com/nlb"
    }
  })

  depends_on = [
    kubectl_manifest.llm_namespace
  ]
}

# GPU LLM Deployment
resource "kubectl_manifest" "llm_gpu_deployment" {
  provider = kubectl.llm

  yaml_body = yamlencode({
    apiVersion = "apps/v1"
    kind       = "Deployment"
    metadata = {
      name      = "llm-gpu"
      namespace = "llm"
      labels = {
        app = "llm"
      }
    }
    spec = {
      replicas = 1
      selector = {
        matchLabels = {
          app = "llm"
        }
      }
      template = {
        metadata = {
          labels = {
            app = "llm"
          }
        }
        spec = {
          nodeSelector = {
            owner        = "llm-team"
            instanceType = "gpu"
          }
          tolerations = [
            {
              key      = "nvidia.com/gpu"
              operator = "Exists"
              effect   = "NoSchedule"
            },
            {
              key      = "karpenter.sh/disrupted"
              operator = "Exists"
              effect   = "NoSchedule"
            }
          ]
          containers = [
            {
              name  = "llm"
              image = "vllm/vllm-openai:latest"
              command = [
                "sh",
                "-c",
                "vllm serve ${var.llm_model_name} --device cuda --trust-remote-code --dtype=half --max-model-len=8192 --gpu-memory-utilization=0.9"
              ]
              ports = [
                {
                  containerPort = 8000
                  protocol      = "TCP"
                }
              ]
              resources = {
                limits = {
                  "nvidia.com/gpu" = "8"
                }
                requests = {
                  "nvidia.com/gpu" = "8"
                }
              }
              livenessProbe = {
                httpGet = {
                  path = "/health"
                  port = 8000
                }
                initialDelaySeconds = 300
                periodSeconds       = 10
              }
              readinessProbe = {
                httpGet = {
                  path = "/health"
                  port = 8000
                }
                initialDelaySeconds = 300
                periodSeconds       = 5
              }
            }
          ]
        }
      }
    }
  })

  depends_on = [
    kubectl_manifest.llm_namespace
  ]
}
