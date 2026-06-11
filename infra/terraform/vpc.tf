resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  tags = {
    Name        = "${var.project_name}-vpc"
    Project     = var.project_name
  }
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id
  tags = {
    Name    = "${var.project_name}-igw"
    Project = var.project_name
  }
}

# Public subnets (2 AZs)
resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true
  tags = {
    Name    = "${var.project_name}-public-${count.index}"
    Project = var.project_name
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  tags = {
    Name    = "${var.project_name}-public-rt"
    Project = var.project_name
  }
}

resource "aws_route" "default" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.igw.id
}

resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = element(aws_subnet.public[*].id, count.index)
  route_table_id = aws_route_table.public.id
}

# Private subnets (2 AZs)
resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, 100 + count.index)
  availability_zone = data.aws_availability_zones.available.names[count.index]
  tags = {
    Name    = "${var.project_name}-private-${count.index}"
    Project = var.project_name
  }
}

resource "aws_nat_gateway" "nat" {
  count         = 2
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = element(aws_subnet.public[*].id, count.index)
  tags = {
    Name    = "${var.project_name}-nat-${count.index}"
    Project = var.project_name
  }
}

resource "aws_eip" "nat" {
  count = 2
  vpc   = true
  tags = {
    Name    = "${var.project_name}-eip-${count.index}"
    Project = var.project_name
  }
}

resource "aws_route_table" "private" {
  count  = 2
  vpc_id = aws_vpc.main.id
  tags = {
    Name    = "${var.project_name}-private-rt-${count.index}"
    Project = var.project_name
  }
}

resource "aws_route" "private_nat" {
  count                   = 2
  route_table_id          = element(aws_route_table.private[*].id, count.index)
  destination_cidr_block  = "0.0.0.0/0"
  nat_gateway_id          = element(aws_nat_gateway.nat[*].id, count.index)
}

resource "aws_route_table_association" "private" {
  count          = length(aws_subnet.private)
  subnet_id      = element(aws_subnet.private[*].id, count.index)
  route_table_id = element(aws_route_table.private[*].id, count.index)
}

# Data source for AZs

data "aws_availability_zones" "available" {}
