"""Shared API Gateway configuration."""

from aws_lambda_powertools.event_handler import CORSConfig, APIGatewayRestResolver
from aws_lambda_powertools import Logger, Metrics, Tracer

# Initialize Powertools
logger = Logger()
tracer = Tracer()
metrics = Metrics(namespace="DigDoc", service="api")

# Configure CORS
cors_config = CORSConfig(
    allow_origin="*",
    allow_headers=["Content-Type", "Authorization"],
    max_age=300,
)

# Create API Gateway resolver with CORS
app = APIGatewayRestResolver(cors=cors_config) 