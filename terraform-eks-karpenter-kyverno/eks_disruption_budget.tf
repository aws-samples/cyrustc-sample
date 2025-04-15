resource "kubernetes_pod_disruption_budget_v1" "global_pdb" {
  for_each = toset(local.default_namespaces)

  metadata {
    name      = "global-pdb"
    namespace = each.value
  }

  spec {
    min_available = "50%"
    selector {
      match_expressions {
        key      = "app"
        operator = "Exists"
      }
    }
  }
}
