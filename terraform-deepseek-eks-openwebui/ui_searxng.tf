# SearXNG Namespace
resource "kubectl_manifest" "searxng_namespace" {
  provider = kubectl.frontend

  yaml_body = yamlencode({
    apiVersion = "v1"
    kind       = "Namespace"
    metadata = {
      name = "searxng"
    }
  })

  depends_on = [module.frontend_eks]
}

# ConfigMap for SearXNG settings with fixed secret key
resource "kubectl_manifest" "searxng_config" {
  provider = kubectl.frontend

  yaml_body = yamlencode({
    apiVersion = "v1"
    kind       = "ConfigMap"
    metadata = {
      name      = "searxng-config"
      namespace = "searxng"
    }
    data = {
      "settings.yml" = <<-EOT
        # Use minimal configuration and rely on defaults
        use_default_settings: true
        
        server:
          secret_key: "statickey123statickey123statickey123"
          bind_address: "0.0.0.0:8080"
          
        ui:
          static_use_hash: true
          default_theme: simple
          
        general:
          debug: false
          instance_name: "DeepSeek SearXNG"
          
        search:
          safe_search: 1
          autocomplete: "duckduckgo"
          default_lang: "en"
          formats:
            - html
            - json
          
        outgoing:
          # Adding required DOI resolver setting
          default_doi_resolver: "oadoi.org"
        
        redis:
          url: null
      EOT
    }
  })

  depends_on = [kubectl_manifest.searxng_namespace]
}

# Generate a random secret key for SearXNG
resource "random_password" "searxng_secret" {
  length  = 32
  special = false
}

# Persistent Volume Claim for SearXNG data
resource "kubectl_manifest" "searxng_pvc" {
  provider = kubectl.frontend

  yaml_body = yamlencode({
    apiVersion = "v1"
    kind       = "PersistentVolumeClaim"
    metadata = {
      name      = "searxng-data"
      namespace = "searxng"
    }
    spec = {
      accessModes = ["ReadWriteOnce"]
      resources = {
        requests = {
          storage = "1Gi"
        }
      }
      storageClassName = "ebs-sc"
    }
  })

  depends_on = [
    kubectl_manifest.searxng_namespace,
    kubectl_manifest.frontend_ebs_storage_class
  ]
}

# Service for SearXNG
resource "kubectl_manifest" "searxng_service" {
  provider = kubectl.frontend

  yaml_body = yamlencode({
    apiVersion = "v1"
    kind       = "Service"
    metadata = {
      name      = "searxng"
      namespace = "searxng"
      labels = {
        app = "searxng"
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
        app = "searxng"
      }
      type = "ClusterIP"
    }
  })

  depends_on = [kubectl_manifest.searxng_namespace]
}

# Deployment for SearXNG with custom settings
resource "kubectl_manifest" "searxng_deployment" {
  provider = kubectl.frontend

  yaml_body = yamlencode({
    apiVersion = "apps/v1"
    kind       = "Deployment"
    metadata = {
      name      = "searxng"
      namespace = "searxng"
      labels = {
        app = "searxng"
      }
    }
    spec = {
      replicas = 3
      selector = {
        matchLabels = {
          app = "searxng"
        }
      }
      template = {
        metadata = {
          labels = {
            app = "searxng"
          }
        }
        spec = {
          # Use init container to set up the config file
          initContainers = [
            {
              name    = "init-config"
              image   = "busybox:1.36"
              command = ["sh", "-c", "cp /config-readonly/settings.yml /etc/searxng/ && chmod 644 /etc/searxng/settings.yml"]
              volumeMounts = [
                {
                  name      = "config-readonly"
                  mountPath = "/config-readonly"
                  readOnly  = true
                },
                {
                  name      = "config-writable"
                  mountPath = "/etc/searxng"
                }
              ]
            }
          ],
          containers = [
            {
              name  = "searxng"
              image = "searxng/searxng:latest"
              ports = [
                {
                  containerPort = 8080
                  protocol      = "TCP"
                  name          = "http"
                }
              ]
              env = [
                {
                  name  = "BASE_URL"
                  value = "/search/"
                },
                {
                  name  = "INSTANCE_NAME"
                  value = "DeepSeek SearXNG"
                },
                {
                  name  = "AUTOCOMPLETE"
                  value = "duckduckgo"
                },
                {
                  # Still provide SECRET_KEY as env var as a fallback
                  name  = "SECRET_KEY"
                  value = random_password.searxng_secret.result
                }
              ]
              volumeMounts = [
                {
                  name      = "config-writable"
                  mountPath = "/etc/searxng"
                },
                {
                  name      = "searxng-data"
                  mountPath = "/srv/searxng/data"
                }
              ]
              resources = {
                requests = {
                  cpu    = "200m"
                  memory = "256Mi"
                }
                limits = {
                  cpu    = "500m"
                  memory = "512Mi"
                }
              }
              livenessProbe = {
                httpGet = {
                  path = "/"
                  port = 8080
                }
                initialDelaySeconds = 30
                periodSeconds       = 10
              }
              readinessProbe = {
                httpGet = {
                  path = "/"
                  port = 8080
                }
                initialDelaySeconds = 10
                periodSeconds       = 5
              }
            }
          ]
          volumes = [
            {
              # Read-only volume containing our settings.yml
              name = "config-readonly"
              configMap = {
                name = "searxng-config"
              }
            },
            {
              # Writable volume for SearXNG to use
              name     = "config-writable"
              emptyDir = {} # Allows SearXNG to create its uwsgi.ini file
            },
            {
              name = "searxng-data"
              persistentVolumeClaim = {
                claimName = "searxng-data"
              }
            }
          ]
        }
      }
    }
  })

  depends_on = [
    kubectl_manifest.searxng_service,
    kubectl_manifest.searxng_config,
    kubectl_manifest.searxng_pvc
  ]
}

# Ingress for SearXNG
resource "kubectl_manifest" "searxng_ingress" {
  provider = kubectl.frontend
  yaml_body = yamlencode({
    apiVersion = "networking.k8s.io/v1"
    kind       = "Ingress"
    metadata = {
      name      = "searxng-ingress"
      namespace = "searxng"
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
                path     = "/search"
                pathType = "Prefix"
                backend = {
                  service = {
                    name = "searxng"
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
    kubectl_manifest.searxng_service,
    kubectl_manifest.searxng_deployment
  ]
}

# Output the SearXNG URL
output "searxng_url" {
  description = "URL for accessing SearXNG"
  value       = "http://<ALB DNS>/search/"
}
