# OpenWebUI Namespace
resource "kubectl_manifest" "openwebui_namespace" {
  provider = kubectl.frontend

  yaml_body = yamlencode({
    apiVersion = "v1"
    kind       = "Namespace"
    metadata = {
      name = "openwebui"
    }
  })

  depends_on = [module.frontend_eks]
}

# ConfigMap for OpenWebUI settings
resource "kubectl_manifest" "openwebui_config" {
  provider = kubectl.frontend

  yaml_body = yamlencode({
    apiVersion = "v1"
    kind       = "ConfigMap"
    metadata = {
      name      = "openwebui-config"
      namespace = "openwebui"
    }
    data = {
      "WEB_TITLE"       = "DeepSeek LLM UI"
      "DEFAULT_MODELS"  = var.llm_model
      "DEFAULT_MODEL"   = var.llm_model
      "OLLAMA_BASE_URL" = "http://${var.llm_alb_dns_name}/v1"
      "ALLOWED_ORIGINS" = "*" # For cross-region communication
    }
  })

  depends_on = [kubectl_manifest.openwebui_namespace]
}

# Secret for OpenWebUI
resource "kubectl_manifest" "openwebui_secret" {
  provider = kubectl.frontend

  yaml_body = yamlencode({
    apiVersion = "v1"
    kind       = "Secret"
    metadata = {
      name      = "openwebui-secret"
      namespace = "openwebui"
    }
    type = "Opaque"
    data = {
      "JWT_SECRET" = base64encode("change-me-in-production") # Replace with a secure value in production
    }
  })

  depends_on = [kubectl_manifest.openwebui_namespace]
}

# Persistent Volume Claim for OpenWebUI data
resource "kubectl_manifest" "openwebui_pvc" {
  provider = kubectl.frontend

  yaml_body = yamlencode({
    apiVersion = "v1"
    kind       = "PersistentVolumeClaim"
    metadata = {
      name      = "openwebui-data"
      namespace = "openwebui"
    }
    spec = {
      accessModes = ["ReadWriteOnce"]
      resources = {
        requests = {
          storage = "10Gi"
        }
      }
      storageClassName = "ebs-sc"
    }
  })

  depends_on = [
    kubectl_manifest.openwebui_namespace,
    kubectl_manifest.frontend_ebs_storage_class
  ]
}

# Service for OpenWebUI
resource "kubectl_manifest" "openwebui_service" {
  provider = kubectl.frontend

  yaml_body = yamlencode({
    apiVersion = "v1"
    kind       = "Service"
    metadata = {
      name      = "openwebui"
      namespace = "openwebui"
      labels = {
        app = "openwebui"
      }
    }
    spec = {
      ports = [
        {
          port       = 80
          targetPort = 8080
          protocol   = "TCP"
          name       = "http"
        }
      ]
      selector = {
        app = "openwebui"
      }
      type = "ClusterIP"
    }
  })

  depends_on = [kubectl_manifest.openwebui_namespace]
}

# Service for LLM API access (external name service)
resource "kubectl_manifest" "llm_external_service" {
  provider = kubectl.frontend

  yaml_body = yamlencode({
    apiVersion = "v1"
    kind       = "Service"
    metadata = {
      name      = "llm-service"
      namespace = "openwebui"
    }
    spec = {
      type         = "ExternalName"
      externalName = var.llm_alb_dns_name
      ports = [
        {
          port       = 80
          targetPort = 80
          protocol   = "TCP"
        }
      ]
    }
  })

  depends_on = [kubectl_manifest.openwebui_namespace]
}

# Deployment for OpenWebUI
resource "kubectl_manifest" "openwebui_deployment" {
  provider = kubectl.frontend

  yaml_body = yamlencode({
    apiVersion = "apps/v1"
    kind       = "Deployment"
    metadata = {
      name      = "openwebui"
      namespace = "openwebui"
      labels = {
        app = "openwebui"
      }
    }
    spec = {
      replicas = 1
      selector = {
        matchLabels = {
          app = "openwebui"
        }
      }
      template = {
        metadata = {
          labels = {
            app = "openwebui"
          }
        }
        spec = {
          containers = [
            {
              name  = "openwebui"
              image = "ghcr.io/open-webui/open-webui:main"
              ports = [
                {
                  containerPort = 8080
                  protocol      = "TCP"
                  name          = "http"
                }
              ]
              envFrom = [
                {
                  configMapRef = {
                    name = "openwebui-config"
                  }
                }
              ]
              env = [
                {
                  name  = "LLM_SERVICE_HOST"
                  value = var.llm_alb_dns_name
                },
                {
                  name  = "LLM_SERVICE_PORT"
                  value = "80"
                },
                {
                  name = "JWT_SECRET"
                  valueFrom = {
                    secretKeyRef = {
                      name = "openwebui-secret"
                      key  = "JWT_SECRET"
                    }
                  }
                }
              ]
              tty = true
              volumeMounts = [
                {
                  name      = "openwebui-data"
                  mountPath = "/app/backend/data"
                }
              ]
              resources = {
                requests = {
                  cpu    = "500m"
                  memory = "512Mi"
                }
                limits = {
                  cpu    = "1000m"
                  memory = "1Gi"
                }
              }
              livenessProbe = {
                httpGet = {
                  path = "/health"
                  port = 8080
                }
                initialDelaySeconds = 60
                periodSeconds       = 10
              }
              readinessProbe = {
                httpGet = {
                  path = "/health"
                  port = 8080
                }
                initialDelaySeconds = 30
                periodSeconds       = 5
              }
            }
          ]
          volumes = [
            {
              name = "openwebui-data"
              persistentVolumeClaim = {
                claimName = "openwebui-data"
              }
            }
          ]
        }
      }
    }
  })

  depends_on = [
    kubectl_manifest.openwebui_service,
    kubectl_manifest.openwebui_config,
    kubectl_manifest.openwebui_secret,
    kubectl_manifest.openwebui_pvc
  ]
}

# IngressClassParams for ALB (frontend)
resource "kubectl_manifest" "frontend_alb_ingress_class_params" {
  provider = kubectl.frontend
  yaml_body = yamlencode({
    apiVersion = "eks.amazonaws.com/v1"
    kind       = "IngressClassParams"
    metadata = {
      name = "alb"
    }
    spec = {
      scheme = "internet-facing"
      healthCheck = {
        path                    = "/health"
        port                    = 8080
        protocol                = "HTTP"
        intervalSeconds         = 15
        timeoutSeconds          = 5
        healthyThresholdCount   = 2
        unhealthyThresholdCount = 3
      }
      ipAddressType = "ipv4"
      tags = [
        {
          key   = "Environment"
          value = var.tags["Environment"]
        },
        {
          key   = "Project"
          value = var.tags["Project"]
        },
        {
          key   = "Component"
          value = "OpenWebUI-Frontend"
        }
      ]
    }
  })

  depends_on = [module.frontend_eks]
}

# IngressClass for ALB (frontend)
resource "kubectl_manifest" "frontend_alb_ingress_class" {
  provider = kubectl.frontend
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

  depends_on = [kubectl_manifest.frontend_alb_ingress_class_params]
}

# Ingress for OpenWebUI
resource "kubectl_manifest" "openwebui_ingress" {
  provider = kubectl.frontend
  yaml_body = yamlencode({
    apiVersion = "networking.k8s.io/v1"
    kind       = "Ingress"
    metadata = {
      name      = "openwebui-ingress"
      namespace = "openwebui"
      annotations = {
        "alb.ingress.kubernetes.io/target-type"  = "ip"
        "alb.ingress.kubernetes.io/scheme"       = "internet-facing"
        "alb.ingress.kubernetes.io/listen-ports" = "[{\"HTTP\": 80}]"
      }
    }
    spec = {
      ingressClassName = "alb"
      rules = [
        {
          http = {
            paths = [
              {
                path     = "/"
                pathType = "Prefix"
                backend = {
                  service = {
                    name = "openwebui"
                    port = {
                      number = 80
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
    kubectl_manifest.frontend_alb_ingress_class,
    kubectl_manifest.openwebui_service,
    kubectl_manifest.openwebui_deployment
  ]
}
