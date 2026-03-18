"""
preprocess.py
Text cleaning pipeline:
  - Lowercase
  - Remove URLs, mentions, hashtags
  - Remove punctuation & special characters
  - Remove stopwords
  - Tokenization
"""

import re
import string
import nltk

# Download required NLTK data (only runs once)
nltk.download("stopwords", quiet=True)
nltk.download("punkt", quiet=True)

from nltk.corpus import stopwords

STOPWORDS = set(stopwords.words("english"))

def clean_text(text: str) -> str:
    """Full preprocessing pipeline. Returns cleaned string."""
    if not isinstance(text, str):
        return ""

    # Lowercase
    text = text.lower()

    # Remove URLs
    text = re.sub(r"http\S+|www\S+", "", text)

    # Remove Twitter-style mentions and hashtags
    text = re.sub(r"@\w+|#\w+", "", text)

    # Remove punctuation and special characters
    text = text.translate(str.maketrans("", "", string.punctuation))
    text = re.sub(r"[^a-z\s]", "", text)

    # Tokenize
    tokens = text.split()

    # Remove stopwords (but keep important negative/directional words)
    keep_words = {"not", "no", "never", "nor", "neither", "nothing"}
    tokens = [t for t in tokens if t not in STOPWORDS or t in keep_words]

    return " ".join(tokens)
