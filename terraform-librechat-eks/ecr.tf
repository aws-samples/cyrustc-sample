resource "aws_ecr_repository" "librechat" {
  name                 = var.ecr_repository_name
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = var.tags
}

# ECR Lifecycle Policy to limit the number of images
resource "aws_ecr_lifecycle_policy" "librechat" {
  repository = aws_ecr_repository.librechat.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 5 images"
        selection = {
          tagStatus     = "any"
          countType     = "imageCountMoreThan"
          countNumber   = 5
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

# Output the repository URL
output "repository_url" {
  description = "The URL of the ECR repository"
  value       = aws_ecr_repository.librechat.repository_url
}