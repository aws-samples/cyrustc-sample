
resource "kubectl_manifest" "nginx_deployment_1" {
  yaml_body = <<-YAML
    apiVersion: apps/v1
    kind: Deployment
    metadata:
      name: nginx-nodeclass1
      labels:
        app: nginx-1
        team: team-a
    spec:
      replicas: ${local.nginx_replicas}
      selector:
        matchLabels:
          app: nginx-1
      template:
        metadata:
          labels:
            app: nginx-1
            team: team-a
        spec:
          nodeSelector:
            karpenter.sh/nodepool: nodepool-1
          containers:
          - name: nginx
            image: nginx:latest
            ports:
            - containerPort: 80
            resources:
              requests:
                cpu: "500m"
                memory: "512Mi"
              limits:
                cpu: "1"
                memory: "1Gi"
  YAML

  depends_on = [
    kubectl_manifest.karpenter_node_pool
  ]
}

# resource "kubectl_manifest" "nginx_deployment_2" {
#   yaml_body = <<-YAML
#     apiVersion: apps/v1
#     kind: Deployment
#     metadata:
#       name: nginx-nodeclass2
#       labels:
#         app: nginx-2
#         team: team-b
#     spec:
#       replicas: ${local.nginx_replicas}
#       selector:
#         matchLabels:
#           app: nginx-2
#       template:
#         metadata:
#           labels:
#             app: nginx-2
#             team: team-b
#         spec:
#           nodeSelector:
#             karpenter.sh/nodepool: nodepool-2
#           containers:
#           - name: nginx
#             image: nginx:latest
#             ports:
#             - containerPort: 80
#             resources:
#               requests:
#                 cpu: "500m"
#                 memory: "512Mi"
#               limits:
#                 cpu: "1"
#                 memory: "1Gi"
#   YAML

#   depends_on = [
#     kubectl_manifest.karpenter_node_pool_2
#   ]
# }
