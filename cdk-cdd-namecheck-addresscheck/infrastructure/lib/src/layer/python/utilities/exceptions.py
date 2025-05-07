class BaseError(Exception):
    """Base error class for custom exceptions."""
    pass

class ValidationError(BaseError):
    """Raised when input validation fails."""
    pass

class AnalysisNotFoundException(BaseError):
    """Raised when an analysis is not found."""
    pass

class UnauthorizedError(BaseError):
    """Raised when authorization fails."""
    pass

class ResourceNotFoundError(BaseError):
    """Raised when a requested resource is not found."""
    pass

class OnboardingRequestNotFoundException(Exception):
    pass