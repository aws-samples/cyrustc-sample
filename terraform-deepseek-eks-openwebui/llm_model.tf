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
    }
    spec = {
      ports = [
        {
          port        = 8000
          targetPort  = 8000
          protocol    = "TCP"
          name        = "http"
        }
      ]
      selector = {
        app = "llm"
      }
      type = "ClusterIP"
    }
  })

  depends_on = [
    kubectl_manifest.llm_namespace
  ]
}

# IngressClassParams for ALB
resource "kubectl_manifest" "alb_ingress_class_params" {
  provider = kubectl.llm
  yaml_body = yamlencode({
    apiVersion = "eks.amazonaws.com/v1"
    kind       = "IngressClassParams"
    metadata = {
      name = "alb"
    }
    spec = {
      scheme = "internet-facing"
      healthCheck = {
        path = "/health"
        port = 8000
        protocol = "HTTP"
        intervalSeconds = 15
        timeoutSeconds = 5
        healthyThresholdCount = 2
        unhealthyThresholdCount = 3
      }
    }
  })

  depends_on = [module.llm_eks]
}

# IngressClass for ALB
resource "kubectl_manifest" "alb_ingress_class" {
  provider = kubectl.llm
  yaml_body = yamlencode({
    apiVersion = "networking.k8s.io/v1"
    kind       = "IngressClass"
    metadata = {
      name = "alb"
      annotations = {
        "ingressclass.kubernetes.io/is-default-class" = "true"
      }
    }
    spec = {
      controller = "eks.amazonaws.com/alb"
      parameters = {
        apiGroup = "eks.amazonaws.com"
        kind     = "IngressClassParams"
        name     = "alb"
      }
    }
  })

  depends_on = [kubectl_manifest.alb_ingress_class_params]
}

# Ingress for LLM Service
resource "kubectl_manifest" "llm_ingress" {
  provider = kubectl.llm
  yaml_body = yamlencode({
    apiVersion = "networking.k8s.io/v1"
    kind       = "Ingress"
    metadata = {
      name      = "llm-ingress"
      namespace = "llm"
    }
    spec = {
      ingressClassName = "alb"
      rules = [
        {
          http = {
            paths = [
              {
                path = "/v1"
                pathType = "Prefix"
                backend = {
                  service = {
                    name = "llm-service"
                    port = {
                      number = 8000
                    }
                  }
                }
              }
            ]
          }
        }
      ]
    }
  })

  depends_on = [
    kubectl_manifest.alb_ingress_class,
    kubectl_manifest.llm_service
  ]
}

# GPU LLM Deployment
resource "kubectl_manifest" "llm_gpu_deployment" {
  count = var.is_neuron ? 0 : 1
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
                "vllm serve ${var.llm_model} --max_model 2048"
              ]
              ports = [
                {
                  containerPort = 8000
                  protocol     = "TCP"
                }
              ]
              resources = {
                limits = {
                  cpu               = "32"
                  memory            = "100Gi"
                  "nvidia.com/gpu" = "1"
                }
                requests = {
                  cpu               = "16"
                  memory            = "30Gi"
                  "nvidia.com/gpu" = "1"
                }
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
  count = var.is_neuron ? 1 : 0
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
                  protocol     = "TCP"
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
                periodSeconds      = 10
              }
              readinessProbe = {
                httpGet = {
                  path = "/health"
                  port = 8000
                }
                initialDelaySeconds = 1800
                periodSeconds      = 5
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