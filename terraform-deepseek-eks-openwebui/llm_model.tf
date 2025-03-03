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

# LLM Service with NLB
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
      type = "LoadBalancer"
      # EKS Auto Mode makes this the default, but explicitly including for clarity
      loadBalancerClass = "eks.amazonaws.com/nlb"
    }
  })

  depends_on = [
    kubectl_manifest.llm_namespace
  ]
}

# GPU LLM Deployment
resource "kubectl_manifest" "llm_gpu_deployment" {
  count    = var.is_neuron ? 0 : 1
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
            }
          ]
          containers = [
            {
              name  = "llm"
              image = "vllm/vllm-openai:latest"
              command = [
                "sh",
                "-c",
                "vllm serve ${var.llm_model} --max_model 100000"
              ]
              ports = [
                {
                  containerPort = 8000
                  protocol      = "TCP"
                }
              ]
              resources = {
                limits = {
                  cpu              = "32"
                  memory           = "100Gi"
                  "nvidia.com/gpu" = "1"
                }
                requests = {
                  cpu              = "16"
                  memory           = "30Gi"
                  "nvidia.com/gpu" = "1"
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
    kubectl_manifest.llm_namespace,
    kubectl_manifest.llm_gpu_nodepool[0]
  ]
}

# Neuron LLM Deployment
resource "kubectl_manifest" "llm_neuron_deployment" {
  count    = var.is_neuron ? 1 : 0
  provider = kubectl.llm

  yaml_body = yamlencode({
    apiVersion = "apps/v1"
    kind       = "Deployment"
    metadata = {
      name      = "llm-neuron"
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
            instanceType = "neuron"
          }
          tolerations = [
            {
              key      = "aws.amazon.com/neuron"
              operator = "Exists"
              effect   = "NoSchedule"
            }
          ]
          containers = [
            {
              name  = "llm"
              image = "${aws_ecr_repository.neuron_ecr[0].repository_url}:0.1"
              command = [
                "sh",
                "-c",
                "vllm serve ${var.llm_model} --device neuron --tensor-parallel-size 2 --max-num-seqs 4 --block-size 8 --use-v2-block-manager --max-model-len 2048"
              ]
              env = [
                {
                  name  = "NEURON_RT_NUM_CORES"
                  value = "2"
                },
                {
                  name  = "NEURON_RT_VISIBLE_CORES"
                  value = "0,1"
                },
                {
                  name  = "VLLM_LOGGING_LEVEL"
                  value = "INFO"
                }
              ]
              ports = [
                {
                  containerPort = 8000
                  protocol      = "TCP"
                }
              ]
              resources = {
                limits = {
                  cpu                     = "30"
                  memory                  = "64Gi"
                  "aws.amazon.com/neuron" = "1"
                }
                requests = {
                  cpu                     = "30"
                  memory                  = "64Gi"
                  "aws.amazon.com/neuron" = "1"
                }
              }
              livenessProbe = {
                httpGet = {
                  path = "/health"
                  port = 8000
                }
                initialDelaySeconds = 1800
                periodSeconds       = 10
              }
              readinessProbe = {
                httpGet = {
                  path = "/health"
                  port = 8000
                }
                initialDelaySeconds = 1800
                periodSeconds       = 5
              }
            }
          ]
        }
      }
    }
  })

  depends_on = [
    kubectl_manifest.llm_namespace,
    kubectl_manifest.llm_neuron_nodepool[0]
  ]
}
