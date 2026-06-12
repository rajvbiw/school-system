# Multi-Tenant School ERP + EdTech Platform with AI Diagnostics

A production-ready, multi-tenant SaaS school management and online learning platform. Features include role-specific dashboards, daily attendance tracking, automated grading report cards, student assignment submissions, and a built-in AI Student Performance Diagnostics engine. 

The application is deployed on a highly available, secure, and auto-scaled AWS EKS (Kubernetes 1.30) cluster connected to an AWS RDS MySQL database.

---

## System Architecture

```
                                      [ Internet ]
                                           │
                                           ▼
                                    [ Route 53 DNS ]
                                           │
                                           ▼
                               [ Internet Gateway (IGW) ]
                                           │
                                           ▼
                             [ Network Load Balancer (NLB) ]
                                           │
                                           ▼
┌───────────────────────────────── AWS VPC (ap-south-1) ────────────────────────────────┐
│                                                                                       │
│   ┌─────────────────────────── AWS EKS Cluster (v1.30) ───────────────────────────┐   │
│   │                                                                               │   │
│   │   ┌── Namespace: school-erp ────────────────┐   ┌── Namespace: monitoring ──┐  │   │
│   │   │                                         │   │                          │  │   │
│   │   │  Frontend Pod   ──>  Backend Pod        │   │        Prometheus        │  │   │
│   │   │  (React + Nginx)     (Node.js/Express)  │   │            │             │  │   │
│   │   └───────────────────────────│─────────────┘   │            ▼             │  │   │
│   │                               │                 │         Grafana          │  │   │
│   │                               │                 └────────────┬─────────────┘  │   │
│   └───────────────────────────────┼──────────────────────────────┼────────────────┘   │
│                                   ▼                              ▼                    │
│                        [ Private Database Subnet ]   [ API Server Secure Proxy ]      │
│                        - AWS RDS MySQL               - Node & cAdvisor Metrics        │
│                        - AWS ElastiCache Redis                                        │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

In accordance with our production-aligned cleanup, the infrastructure and deployment configurations are organized as follows:

```
├── .github/workflows/
│   ├── ci.yml                 # Build and test pipeline
│   ├── deploy.yml             # EKS Deployment pipeline
│   └── terraform.yml          # Infrastructure planning & applying
├── k8s/
│   ├── configmap.yaml         # Global environment variables
│   ├── deployment-backend.yaml# Backend Deployment & ClusterIP Service
│   ├── deployment-frontend.yaml# Frontend Deployment & LoadBalancer Service
│   ├── namespace.yaml         # Unified "school-erp" namespace
│   └── secret.yaml            # Base64 database and JWT credentials
├── terraform/
│   ├── main.tf                # Main configuration calls (VPC, EKS, RDS)
│   ├── variables.tf           # Global input variables
│   ├── outputs.tf             # Outputs (endpoints, SG IDs)
│   └── modules/
│       ├── vpc/               # Dynamic Subnets & IGW setup
│       ├── eks/               # Kubernetes cluster v1.30 & Node Group
│       └── rds/               # Secured Private Database subnet group
```

---

## Core DevOps Engineering Highlights

* **VPC CNI Prefix Delegation:** Configured on the EKS DaemonSet to boost pod allocation limits on cost-effective `t3.small` nodes from 11 up to 110 IP addresses per node.
* **Express Trust Proxy Configuration:** Enabled `trust proxy` inside the Express application so that `express-rate-limit` correctly processes client IPs through the Nginx reverse proxy.
* **RDS Node-to-Node Security Group Binding:** Bound EKS worker nodes' shared SG dynamically to RDS inbound access to permit secure database migrations and syncs.
* **Secure API Server Proxy Scraping:** Configured Prometheus to scrape node and container metrics (cAdvisor) securely via the Kubernetes API Server proxy, bypassing network security group blocks on Kubelet's port `10250`.

---

## Core Features

* **Multi-Tenant Routing:** Automatic tenant resolution from custom headers (`X-Tenant-Slug`) or subdomains, mapping user sessions to isolated database contexts.
* **AI Student Diagnostics Engine:** Integrates a custom analytical pedagogical service (`/api/academic/ai-performance-analysis`) that evaluates student performance against class averages and attendance ratios to generate automated performance reports and targeted remedial suggestions.
* **Real-time Communication:** Built-in Socket.io integration inside EKS to broadcast immediate announcements and events across namespaces.

---

## Local Development Setup

To run the application locally on your developer machine:

1. **Clone the repository**:
   ```bash
   git clone <repository-url> school-system
   cd school-system
   ```

2. **Configure Environment Variables**:
   ```bash
   cp .env.example .env
   ```

3. **Launch Docker Services**:
   ```bash
   docker-compose up --build
   ```

4. **Initialize & Seed the Database**:
   Open a separate terminal and execute the seeding script inside the backend container:
   ```bash
   docker exec -it school-system-backend-1 npm run seed
   ```

* **Frontend SPA:** [http://localhost:3000](http://localhost:3000)
* **Backend API:** [http://localhost:5000](http://localhost:5000)

---

## AWS Infrastructure Deployment Guide

### Step 1: Provision Resources via Terraform
Navigate to the terraform folder, initialize, and apply configs:
```bash
cd terraform
terraform init
terraform apply -auto-approve
```

### Step 2: Configure kubectl local context
Fetch cluster authentication credentials to manage the EKS cluster:
```bash
aws eks update-kubeconfig --name school-erp-cluster --region <AWS_REGION>
```

### Step 3: Deploy Application Manifests
Deploy configuration maps, secrets, deployments, and load balancers to EKS:
```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml -n school-erp
kubectl apply -f k8s/secret.yaml -n school-erp
kubectl apply -f k8s/deployment-backend.yaml -n school-erp
kubectl apply -f k8s/deployment-frontend.yaml -n school-erp
```

### Step 4: Seed production Database
Wait for the pods to roll out, and trigger the database seed inside the backend container:
```bash
kubectl exec -n school-erp deployment/school-erp-backend -- node dist/database/seed.js
```

---

## Deploying Monitoring Stack (Prometheus & Grafana)

1. **Deploy the Monitoring Configurations:**
   ```bash
   kubectl apply -f https://raw.githubusercontent.com/kubernetes-sigs/metrics-server/master/deploy/1.8+/deploy.yaml
   
   # Apply Prometheus and Grafana manifests (namespace, configurations, services)
   # (Configurations are mapped via API proxy to read EKS container statistics)
   ```

2. **Access Grafana Dashboard:**
   Retrieve the external DNS hostname for the Grafana LoadBalancer:
   ```bash
   kubectl get svc grafana -n monitoring
   ```
   *The default credentials are:*
   * **Username:** `admin`
   * **Password:** `admin123`

---

## Default Seeded Demo Logins

| Tenant | Role | Email | Password |
| :--- | :--- | :--- | :--- |
| **school-erp** | Admin | `admin@school-erp.com` | `password123` |
| **school-erp** | Teacher | `teacher1@school-erp.com` | `password123` |
| **school-a** | Admin | `admin@school-a.com` | `password123` |
| **school-a** | Teacher | `teacher1@school-a.com` | `password123` |
| **school-a** | Student | `student1@school-a.com` | `password123` |
| **school-a** | Parent | `parent1@school-a.com` | `password123` |
| **school-b** | Admin | `admin@school-b.com` | `password123` |
| **school-b** | Teacher | `teacher1@school-b.com` | `password123` |
