from typing import TypedDict, List, Literal, Optional, Dict, Any
from enum import Enum

class AnalysisStatus(str, Enum):
    CREATED = "CREATED"
    STARTED = "STARTED"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class OnboardingStatus(str, Enum):
    CREATED = "CREATED"
    CHECKING = "CHECKING"
    READY_TO_CHECK = "READY_TO_CHECK"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class PageData(TypedDict):
    page: int
    content: str
    tokenInput: int
    tokenOutput: int

class ObjectData(TypedDict):
    object: str
    data: List[PageData]
    numberOfPages: int
    tokenInput: int
    tokenOutput: int

class ChatMessage(TypedDict):
    role: Literal['human', 'assistant']
    content: str
    timestamp: str  # ISO 8601 UTC timestamp

class AnalysisResult(TypedDict):
    analysis: str
    result: str
    inputToken: int
    outputToken: int

class AnalysisItem(TypedDict):
    pk: str  # Format: ID#{analysisId}
    sk: str  # Format: METADATA
    analysisId: str
    description: str
    documentType: str
    objectsData: List[ObjectData]
    chatHistory: List[ChatMessage]
    status: AnalysisStatus  # Updated to use enum
    yearMonth: str
    createdAt: str  # ISO 8601 UTC timestamp
    lastUpdatedAt: str  # ISO 8601 UTC timestamp
    ttl: Optional[int] 
    analysisParameters: Optional[Dict[str, Any]]
    analysisResults: Optional[List[AnalysisResult]]
    
class PromptItem(TypedDict):
    pk: str  # Prompt ID
    type: str  # SYSTEM | USER | ASSISTANT | FUNCTION
    content: str
    metadata: Dict[str, Any]
    createdAt: str  # ISO 8601 UTC timestamp
    lastUpdatedAt: str  # ISO 8601 UTC timestamp
    ttl: Optional[int]