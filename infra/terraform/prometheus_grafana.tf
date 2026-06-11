resource "helm_release" "kube_prometheus_stack" {
  name       = "prometheus-stack"
  namespace  = "monitoring"
  repository = "https://prometheus-community.github.io/helm-charts"
  chart      = "kube-prometheus-stack"
  version    = "55.2.0"

  create_namespace = true

  set {
    name  = "prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues"
    value = "false"
  }

  set {
    name  = "grafana.adminUser"
    value = "admin"
  }

  set {
    name  = "grafana.adminPassword"
    value = "${var.grafana_admin_password}"  # will be supplied via a secret variable
  }

  set {
    name  = "alertmanager.enabled"
    value = "true"
  }

  # Optional: expose Grafana via the same ALB ingress used by the app
  set {
    name  = "grafana.service.type"
    value = "ClusterIP"
  }

  tags = {
    Project = var.project_name
  }
}
