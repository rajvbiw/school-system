# Multi-Tenant School ERP + EdTech Platform

A production-ready, multi-tenant school management and online learning platform. Each school tenant gets isolated namespaces, dedicated branding (custom emblems and HSL primary colors), and secure isolated database contexts. The system provides modules for role-specific dashboards, daily attendance markings, grading report cards, student file submissions, and billing checkout integrations.

---

## Infrastructure Architecture

### System Topology Map (ASCII)
```
Browser (school-a.edtech.com) ──> Route53 ──> CloudFront (Assets) ──> ALB (EKS Ingress)
                                                                            │
   ┌───────────────────────────────── EKS Cluster ──────────────────────────┴───────────────┐
   │                                                                                        │
   │   ┌── Namespace: school-a ──────────────────┐   ┌── Namespace: school-b ────────────┐   │
   │   │  Frontend Pod ──> Backend Pod           │   │  Frontend Pod ──> Backend Pod     │   │
   │   └─────────────────────│───────────────────┘   └─────────────────────│─────────────┘   │
   │                         └───────────────┐   ┌─────────────────────────┘                 │
   └─────────────────────────────────────────┼───┼──────────────────────────────────────────┘
                                             ▼   ▼
                                    RDS MySQL (Private) + ElastiCache Redis (Private)
                                    S3 Buckets (Uploads via Pre-signed URLs)
```

1. **Routing Layer**: Route53 routes requests to CloudFront (for built static assets) or the Application Load Balancer (ALB) acting as EKS Ingress.
2. **Compute (EKS)**: Deployed using Kubernetes namespaces per school tenant (e.g. `school-a`, `school-b`). Each namespace contains backend and frontend pods running isolated contexts.
3. **Database & Caching**: Backend pods query a private RDS MySQL database and cache student transcripts in ElastiCache Redis.
4. **Continuous Deployment**: GitHub Actions directly deploys container images to target namespaces on the EKS cluster.

---

## Prerequisites

Ensure the following tools are installed:
- **Node.js v18** and **npm**
- **Docker** and **docker-compose**
- **AWS CLI v2** (configured with target deploy credentials)
- **Terraform v1.5.0+**
- **kubectl** and **helm v3**

---

## Local Development Setup

To run the application locally on your developer machine:

1. **Clone the repository**:
   ```bash
   git clone <repository-url> school-erp
   cd school-erp
   ```

2. **Configure Environment Variables**:
   ```bash
   cp .env.example .env
   ```

3. **Launch Docker Services**:
   This spins up MySQL, Redis, Adminer (DB dashboard), Backend, and Frontend.
   ```bash
   docker-compose up --build
   ```

4. **Initialize & Seed the Database**:
   Open a separate shell and execute the migrations inside the running backend container:
   ```bash
   docker exec -it school_erp_backend npm run seed
   ```

### Local Endpoints
- **Frontend SPA**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **Adminer DB Client**: [http://localhost:8080](http://localhost:8080) (Use credentials: Host: `mysql`, User: `school_erp_user`, Password: `school_erp_password`, Database: `school_erp_main`)

---

## Environment Variables Directory

| Variable | Description | Default Value |
| :--- | :--- | :--- |
| `PORT` | Local express backend server port | `5000` |
| `JWT_SECRET` | Primary signing key for JWT Access Tokens | `super_secret_jwt_access_key_32_characters_minimum` |
| `JWT_REFRESH_SECRET` | Signing key for JWT Refresh Tokens | `super_secret_jwt_refresh_key_32_characters_minimum` |
| `DB_HOST` | MySQL hostname (docker service name locally) | `127.0.0.1` |
| `REDIS_HOST` | Redis cache service address | `127.0.0.1` |
| `S3_BUCKET_NAME` | AWS S3 Bucket for attachments and profile pictures | `school-erp-uploads` |

---

## GitHub Actions Secret Setup

To configure the GitHub Actions workflow, save these secrets in your repository settings:

| GitHub Secret | Description |
| :--- | :--- |
| `AWS_ACCOUNT_ID` | AWS Account identifier for ECR registry target |
| `AWS_REGION` | AWS Region (e.g. `us-east-1`) |
| `AWS_ROLE_ARN` | IAM Role ARN assumed by GitHub Actions via OIDC |
| `SLACK_WEBHOOK` | Webhook URL for posting deployment statuses |

---

## AWS Deployment Guide

### Step 1: Provision Cloud Resources (Terraform)
Navigate to the Terraform folder and apply configs:
```bash
cd terraform/environments/dev
terraform init
terraform workspace select dev || terraform workspace new dev
terraform apply -auto-approve
```

### Step 2: Configure kubectl
Fetch cluster authentication credentials:
```bash
aws eks update-kubeconfig --name school-erp-cluster --region us-east-1
```

### Step 3: Deploy Frontend & Backend to EKS (Helm)
Deploy school workloads directly using Helm:
```bash
# Deploy Tenant School A
helm upgrade --install school-a helm/school-erp -f helm/school-erp/values-school-a.yaml -n school-a --create-namespace

# Deploy Tenant School B
helm upgrade --install school-b helm/school-erp -f helm/school-erp/values-school-b.yaml -n school-b --create-namespace
```

Alternatively, you can apply using Kustomize overlays:
```bash
kubectl apply -k k8s/tenants/school-a
kubectl apply -k k8s/tenants/school-b
```

### Step 4: Deploy Monitoring Stack (Prometheus & Grafana)
Deploy Prometheus and Grafana in the cluster to gather metrics and run dashboards:
```bash
kubectl apply -f k8s/monitoring/namespace.yaml
kubectl apply -f k8s/monitoring/prometheus.yaml
kubectl apply -f k8s/monitoring/grafana.yaml
```

### Step 5: Retrieve External IP Addresses & Access Dashboards
Since the Services are defined as `LoadBalancer` type, AWS will provision Network Load Balancers (NLB). Fetch the external DNS addresses:

```bash
# 1. Access the React Frontend
kubectl get svc frontend-lb -n school-a

# 2. Access the Prometheus Server
kubectl get svc prometheus -n monitoring

# 3. Access the Grafana Dashboard
kubectl get svc grafana -n monitoring
```

*Note: In AWS EKS, the external IP address is returned as an ELB DNS name. Copy and paste the DNS name into your browser to access the frontend, Prometheus (port 9090), and Grafana (port 80). The default Grafana username is `admin` and password is `admin123`. The Prometheus datasource comes pre-configured.*

---

## Adding a New School Tenant

To provision a new school (e.g., `school-c`):

1. **Create Value Override File**:
   Create `helm/school-erp/values-school-c.yaml`:
   ```yaml
   tenant:
     slug: "school-c"
     name: "Springfield High"
     primaryColor: "#EC4899"
   ingress:
     host: "school-c.edtech.example.com"
   mysql:
     database: "school_c_db"
   ```

2. **Deploy via Helm**:
   Run the Helm upgrade command to provision the new tenant namespace and workloads:
   ```bash
   helm upgrade --install school-c helm/school-erp -f helm/school-erp/values-school-c.yaml -n school-c --create-namespace
   ```

3. **Or Deploy via Kustomize**:
   Create a directory `k8s/tenants/school-c`, copy the `kustomization.yaml` from `school-a`, change namespace and literals to `school-c`, and run:
   ```bash
   kubectl apply -k k8s/tenants/school-c
   ```

---

## AWS Free Tier & Cost Minimization Details

To run this platform cost-effectively:
- **RDS Database**: Uses `db.t3.micro` which is covered under the AWS 12-Month Free Tier (750 hours/month).
- **Redis Cache**: Uses `cache.t3.micro` which is covered under the AWS 12-Month Free Tier (750 hours/month).
- **Storage**: S3 bucket uploads use the standard class, providing 5GB free.
- **EKS Nodes**: The EKS Control Plane costs $0.10/hour, which is a fixed fee. The worker nodes run on `t3.medium` or `t3.small` (minimum 2 nodes) to maintain enough RAM for backend, frontend, Prometheus, and Grafana containers. Using `t3.small` is recommended for maximum cost savings.

---

## AWS Cost Breakdown & Estimations

### AWS Free Tier Items Included
- **RDS MySQL**: db.t3.micro (750 hours free per month on 12-months free tier)
- **ElastiCache Redis**: cache.t3.micro (750 hours free per month on 12-months free tier)
- **S3 Standard**: 5GB Storage (12-months free tier)

### Paid Resources (Approximate Costs)
- **EKS Control Plane**: $0.10/hour (~$72/month)
- **EKS worker nodes (EC2)**: 2x t3.medium (~$60/month total)
- **Application Load Balancer**: ~$20/month
- **VPC NAT Gateway**: ~$32/month

*Staging/Dev estimate runs around $10-20/month if scaled down outside operations hours using KEDA triggers, and production hosting spans $150-200/month.*

---

## Default Demo Logins

| Tenant | Role | Email | Password |
| :--- | :--- | :--- | :--- |
| **school-a** | Admin | `admin@school-a.com` | `password123` |
| **school-a** | Teacher | `teacher1@school-a.com` | `password123` |
| **school-a** | Student | `student1@school-a.com` | `password123` |
| **school-a** | Parent | `parent1@school-a.com` | `password123` |
| **school-b** | Admin | `admin@school-b.com` | `password123` |
| **school-b** | Teacher | `teacher1@school-b.com` | `password123` |
