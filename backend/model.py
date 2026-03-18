"""
model.py
ML Model: TF-IDF Vectorizer + Logistic Regression
- Trains on a built-in dataset (no download required)
- Saves model and vectorizer using joblib
- Exposes predict() function used by main.py
"""

import os
import joblib
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

from preprocess import clean_text

# Paths where trained model/vectorizer are saved
MODEL_PATH = "hate_speech_model_v2.joblib"
VECTORIZER_PATH = "tfidf_vectorizer_v2.joblib"

# ── Labels ───────────────────────────────────────────────────────────
LABELS = {0: "hate speech", 1: "offensive language", 2: "neutral"}

# ── Built-in training dataset ─────────────────────────────────────────
# A curated set of examples covering all three categories.
# In production, replace with the full Davidson et al. (2017) dataset.
TRAIN_DATA = [
    # --- HATE SPEECH (label 0) ---
    ("i hate all people from that country they should die", 0),
    ("kill all the jews they are destroying our society", 0),
    ("those people are subhuman vermin and should be exterminated", 0),
    ("all immigrants are criminals and should be deported immediately", 0),
    ("i hope every muslim dies in a fire", 0),
    ("i will fucking kill all of you dirty retards", 0),
    ("you filthy niggers belong in cages hanging from trees", 0),
    ("all faggots should be burned alive i fucking hate them", 0),
    ("dumbass spics go back to your own fucking country and die", 0),
    ("black people are animals and belong in cages", 0),
    ("women are inferior and should stay in the kitchen forever", 0),
    ("gay people are an abomination and deserve to suffer", 0),
    ("those foreigners are invading our country destroy them all", 0),
    ("all refugees are terrorists and should be shot on sight", 0),
    ("this race is inferior and should be wiped from the earth", 0),
    ("i despise every single person of that religion", 0),
    ("we need to eliminate these people from our society completely", 0),
    ("these animals are ruining our great nation kill them", 0),
    ("all of them are rapists and murderers they must go", 0),
    ("that ethnic group is a parasite on society destroy them", 0),
    ("lets cleanse our country of these worthless people now", 0),
    ("death to all of them we need ethnic cleansing now", 0),
    ("every jew every black every muslim should be wiped out", 0),
    ("these people are vermin they need to be exterminated completely", 0),

    # --- OFFENSIVE LANGUAGE (label 1) ---
    ("you are so stupid i cant believe you said that", 1),
    ("what a complete idiot you are seriously pathetic loser", 1),
    ("shut the hell up nobody wants to hear your dumb opinion", 1),
    ("this is absolute garbage you moron learn to think", 1),
    ("you are a worthless piece of garbage go away", 1),
    ("fuck you asshole", 1),
    ("you are a fucking bitch", 1),
    ("shut the fuck up you cunt", 1),
    ("go fuck yourself you piece of shit", 1),
    ("bullshit you are a motherfucker", 1),
    ("fuck u aashole", 1),
    
    # NEW TELUGU (TENGLISH) EXAMPLES
    ("dengey ra pooka", 1),
    ("neeku asalu burra ledu", 1),
    ("entra nee overaction", 1),
    
    ("that was the dumbest thing ive ever heard you fool", 1),
    ("what an absolute buffoon you are completely useless", 1),
    ("go to hell you worthless excuse for a human being", 1),
    ("you are brain dead and have no clue whatsoever idiot", 1),
    ("this person is a complete jackass and utter failure", 1),
    ("what a loser you are just pathetically dumb and useless", 1),
    ("you disgust me you are such a horrible awful person", 1),
    ("stop being such a whiny little baby and grow up", 1),
    ("this is trash content made by a complete imbecile", 1),
    ("get lost you absolute moron nobody needs your stupidity", 1),
    ("you are one of the most annoying stupid people i know", 1),
    ("that comment was completely retarded what were you thinking", 1),
    ("what a disgusting filthy pig you really are awful", 1),
    ("you are beyond dumb honestly the worst person ever", 1),
    ("this idiot thinks he knows everything but knows nothing", 1),

    # --- NEUTRAL (label 2) ---
    ("i love spending time with my family on weekends", 2),
    ("the weather today is really nice and sunny outside", 2),
    ("i am studying machine learning and artificial intelligence", 2),
    ("hello how are you doing today hope you are well", 2),
    ("we should all respect each other and be kind", 2),
    ("the football match was really exciting to watch last night", 2),
    ("i went to the market and bought some fresh vegetables", 2),
    ("today is a beautiful day to go for a walk", 2),
    ("she is working on an important research project for school", 2),
    ("the new movie was absolutely fantastic i really enjoyed it", 2),
    ("i love learning new programming languages every single day", 2),
    ("the team worked hard and delivered a great presentation", 2),
    ("good morning everyone hope you have a wonderful productive day", 2),
    ("i want to travel the world and meet new people", 2),
    ("science and technology are advancing at an incredible rate", 2),
    ("the children played happily in the park all afternoon", 2),
    ("she cooked a delicious meal for her entire family", 2),
    ("we should promote peace and understanding around the world", 2),
    ("the library has many fascinating books to read and enjoy", 2),
    ("diversity makes our society richer stronger and more vibrant", 2),
    ("i enjoy helping others and volunteering in my community", 2),
    ("the sunrise this morning was breathtakingly beautiful and peaceful", 2),
    ("learning new skills every day makes life more meaningful", 2),
    ("the community came together to clean up the local park", 2),
    ("innovation and creativity drive progress in our modern world", 2),
    ("nuvvu chala manche vadivi", 2),
    ("ivvala climate chala bagundi", 2),
    ("nenu roju coding chestanu", 2)
]


def build_dataframe():
    """Convert the training list into a DataFrame."""
    df = pd.DataFrame(TRAIN_DATA, columns=["text", "label"])
    df["clean_text"] = df["text"].apply(clean_text)
    return df


def train_model():
    """Train TF-IDF + Logistic Regression and save to disk."""
    print("Training model…")
    df = build_dataframe()

    X = df["clean_text"]
    y = df["label"]

    # Split (stratified to keep class balance)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # TF-IDF vectorizer
    vectorizer = TfidfVectorizer(
        max_features=5000,
        ngram_range=(1, 2),   # unigrams + bigrams
        min_df=1,
    )
    X_train_tfidf = vectorizer.fit_transform(X_train)
    X_test_tfidf  = vectorizer.transform(X_test)

    # Logistic Regression
    model = LogisticRegression(
        C=1.0,
        max_iter=1000,
        class_weight="balanced",
        random_state=42,
    )
    model.fit(X_train_tfidf, y_train)

    # Evaluation
    y_pred = model.predict(X_test_tfidf)
    print(classification_report(y_test, y_pred, target_names=list(LABELS.values())))

    # Persist
    joblib.dump(model,      MODEL_PATH)
    joblib.dump(vectorizer, VECTORIZER_PATH)
    print(f"Model saved → {MODEL_PATH}")
    print(f"Vectorizer saved → {VECTORIZER_PATH}")

    return model, vectorizer


def load_model():
    """Load saved model and vectorizer, training first if needed."""
    if not os.path.exists(MODEL_PATH) or not os.path.exists(VECTORIZER_PATH):
        train_model()
    model      = joblib.load(MODEL_PATH)
    vectorizer = joblib.load(VECTORIZER_PATH)
    return model, vectorizer


def predict(text: str):
    """
    Run hate speech prediction on a single string.

    Returns:
        dict with keys:
            prediction   – human-readable label (str)
            confidence   – probability of the top class (float 0-1)
            probabilities – dict of all class probabilities
    """
    model, vectorizer = load_model()

    cleaned  = clean_text(text)
    vec      = vectorizer.transform([cleaned])
    probs    = model.predict_proba(vec)[0]          # shape: (3,)
    pred_idx = int(np.argmax(probs))
    label    = LABELS[pred_idx]
    confidence = float(probs[pred_idx])

    probabilities = {LABELS[i]: float(p) for i, p in enumerate(probs)}

    return {
        "prediction":    label,
        "confidence":    confidence,
        "probabilities": probabilities,
    }


# Allow direct execution → trains the model
if __name__ == "__main__":
    train_model()
