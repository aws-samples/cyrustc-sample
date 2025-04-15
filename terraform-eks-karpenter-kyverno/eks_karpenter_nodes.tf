
resource "kubectl_manifest" "karpenter_node_class" {
  yaml_body = <<-YAML
    apiVersion: karpenter.k8s.aws/v1beta1
    kind: EC2NodeClass
    metadata:
      name: nodeclass-1
    spec:
      amiFamily: Bottlerocket
      role: ${module.karpenter.node_iam_role_name}
      userData: |
        [settings.kernel]
        lockdown = "integrity"

        [settings.kernel.modules]
        udf = { allowed = false }
        sctp = { allowed = false }

        [settings.kernel.sysctl]
        "net.ipv4.conf.all.send_redirects" = "0"
        "net.ipv4.conf.default.send_redirects" = "0"
        "net.ipv4.conf.all.accept_redirects" = "0"
        "net.ipv4.conf.default.accept_redirects" = "0"
        "net.ipv6.conf.all.accept_redirects" = "0"
        "net.ipv6.conf.default.accept_redirects" = "0"
        "net.ipv4.conf.all.secure_redirects" = "0"
        "net.ipv4.conf.default.secure_redirects" = "0"
        "net.ipv4.conf.all.log_martians" = "1"
        "net.ipv4.conf.default.log_martians" = "1"

        [settings.bootstrap-containers.cis-bootstrap]
        source = "${aws_ecr_repository.cis_bootstrap.repository_url}:latest"
        mode = "always"

      blockDeviceMappings:
        - deviceName: /dev/xvda
          ebs:
            volumeSize: 50Gi
            volumeType: gp3
            encrypted: true
            deleteOnTermination: true
      metadataOptions:
        httpEndpoint: enabled
        httpProtocolIPv6: disabled
        httpPutResponseHopLimit: 1
        httpTokens: required
      subnetSelectorTerms:
        - tags:
            karpenter.sh/discovery: ${module.eks.cluster_name}
      securityGroupSelectorTerms:
        - tags:
            karpenter.sh/discovery: ${module.eks.cluster_name}
      tags:
        karpenter.sh/discovery: ${module.eks.cluster_name}
  YAML

  depends_on = [
    helm_release.karpenter
  ]
}

resource "kubectl_manifest" "karpenter_node_pool" {
  yaml_body = <<-YAML
    apiVersion: karpenter.sh/v1beta1
    kind: NodePool
    metadata:
      name: nodepool-1
    spec:
      template:
        spec:
          nodeClassRef:
            name: nodeclass-1
          requirements:
            - key: "karpenter.k8s.aws/instance-category"
              operator: In
              values: ["c", "m", "r"]
            - key: "karpenter.k8s.aws/instance-cpu"
              operator: In
              values: ["4", "8", "16", "32"]
            - key: "karpenter.k8s.aws/instance-hypervisor"
              operator: In
              values: ["nitro"]
            - key: "karpenter.k8s.aws/instance-cpu-manufacturer"
              operator: In
              values: ["intel"]
            - key: "karpenter.k8s.aws/instance-generation"
              operator: Gt
              values: ["2"]
            - key: "karpenter.sh/capacity-type"
              operator: In
              values: ["spot","on-demand"]
          tolerations:
            - key: "karpenter.sh/controller"
              operator: "Equal"
              value: "true"
              effect: "NoSchedule"
      limits:
        cpu: 5000
      disruption:
        consolidationPolicy: WhenUnderutilized
  YAML

  depends_on = [
    kubectl_manifest.karpenter_node_class
  ]
}

resource "kubectl_manifest" "karpenter_node_class_2" {
  yaml_body = <<-YAML
    apiVersion: karpenter.k8s.aws/v1beta1
    kind: EC2NodeClass
    metadata:
      name: nodeclass-2
    spec:
      amiFamily: Bottlerocket
      role: ${module.karpenter.node_iam_role_name}
      userData: |
        [settings.kernel]
        lockdown = "integrity"

        [settings.kernel.modules]
        udf = { allowed = false }
        sctp = { allowed = false }

        [settings.kernel.sysctl]
        "net.ipv4.conf.all.send_redirects" = "0"
        "net.ipv4.conf.default.send_redirects" = "0"
        "net.ipv4.conf.all.accept_redirects" = "0"
        "net.ipv4.conf.default.accept_redirects" = "0"
        "net.ipv6.conf.all.accept_redirects" = "0"
        "net.ipv6.conf.default.accept_redirects" = "0"
        "net.ipv4.conf.all.secure_redirects" = "0"
        "net.ipv4.conf.default.secure_redirects" = "0"
        "net.ipv4.conf.all.log_martians" = "1"
        "net.ipv4.conf.default.log_martians" = "1"

      blockDeviceMappings:
        - deviceName: /dev/xvda
          ebs:
            volumeSize: 50Gi
            volumeType: gp3
            encrypted: true
            deleteOnTermination: true
      metadataOptions:
        httpEndpoint: enabled
        httpProtocolIPv6: disabled
        httpPutResponseHopLimit: 1
        httpTokens: required
      subnetSelectorTerms:
        - tags:
            karpenter.sh/discovery: ${module.eks.cluster_name}
      securityGroupSelectorTerms:
        - tags:
            karpenter.sh/discovery: ${module.eks.cluster_name}
      tags:
        karpenter.sh/discovery: ${module.eks.cluster_name}
  YAML

  depends_on = [
    helm_release.karpenter
  ]
}

resource "kubectl_manifest" "karpenter_node_pool_2" {
  yaml_body = <<-YAML
    apiVersion: karpenter.sh/v1beta1
    kind: NodePool
    metadata:
      name: nodepool-2
    spec:
      template:
        spec:
          nodeClassRef:
            name: nodeclass-2
          requirements:
            - key: "karpenter.k8s.aws/instance-category"
              operator: In
              values: ["c", "m", "r"]
            - key: "karpenter.k8s.aws/instance-cpu"
              operator: In
              values: ["4", "8", "16"]
            - key: "karpenter.k8s.aws/instance-hypervisor"
              operator: In
              values: ["nitro"]
            - key: "karpenter.k8s.aws/instance-cpu-manufacturer"
              operator: In
              values: ["intel"]
            - key: "karpenter.k8s.aws/instance-generation"
              operator: Gt
              values: ["2"]
            - key: "karpenter.sh/capacity-type"
              operator: In
              values: ["spot","on-demand"]
      limits:
        cpu: 5000
      disruption:
        consolidationPolicy: WhenUnderutilized
  YAML

  depends_on = [
    kubectl_manifest.karpenter_node_class_2
  ]
}
