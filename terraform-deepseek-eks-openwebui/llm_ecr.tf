# ECR Repository for Neuron Images
resource "aws_ecr_repository" "neuron_ecr" {
  count = var.is_neuron ? 1 : 0
  provider = aws.llm

  name                 = "llm-neuron"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = merge(var.tags, {
    Type = "LLM-Infrastructure"
  })
} 