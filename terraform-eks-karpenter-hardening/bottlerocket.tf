resource "aws_ecr_repository" "cis_bootstrap" {
  name                 = "cis-bootstrap"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}