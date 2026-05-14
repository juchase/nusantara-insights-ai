import os

# Centralized model paths configuration
# Get the ai-service root directory (app/config -> app -> ai-service)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODELS_DIR = os.path.join(BASE_DIR, "models")

# Model file paths
SENTIMENT_MODEL_PATH = os.path.join(MODELS_DIR, "sentiment_model.pkl")
SENTIMENT_VECTORIZER_PATH = os.path.join(MODELS_DIR, "sentiment_vectorizer.pkl")
DEMAND_MODEL_PATH = os.path.join(MODELS_DIR, "demand_model.pkl")

# Ensure models directory exists
os.makedirs(MODELS_DIR, exist_ok=True)
