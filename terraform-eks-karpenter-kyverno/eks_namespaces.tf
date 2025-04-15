# Uncomment this in the future when upgrading EKS cluster. Create before argocd kicks in.

# resource "kubernetes_namespace_v1" "namespaces" {
#   for_each = toset(local.default_namespaces)

#   metadata {
#     name = each.value
#   }
# }
