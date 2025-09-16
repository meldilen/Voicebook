# 🧠 Voice Diary - Machine Learning Overview

**Voice Diary** is an innovative application that allows users to record voice entries, which are automatically analyzed for emotional content using advanced AI. This document outlines the machine learning models currently used in the MVP, along with training details, evaluation results, and future plans.

# Table of Contents
- [🎯 Objective](#-objective)
- [📦 Models Used](#-models-used-mvp)
- 1. 📝 [Whisper Models - Transcription (Voice to Text)](#1--whisper-large-v3---transcription-voice-to-text)
- 2. 🎤 [Fine-tuned Whisper Large V3 - Emotion Recognition](#2--fine-tuned-whisper-large-v3---emotion-recognition-from-voice-speech-audio)
- 3. 💬 [Fine-tuned BART SAMSum - Text Summarization](#3--fine-tuned-bart-based-model-samsum---text-based-summary)
- 4. 💭 [Emotion-english-distilroberta-base - Emotion Recognition](#4--Emotion-english-distilroberta-base---emotion-recognition-from-text)
- 5. 🤖 [OpenHermes-2.5-Mistral-7B - Psychological Insights](#5--openhermes-25-mistral-7b---psychological-insight-extraction-from-text)
- [😊🤝 Emotion Fusion Approach](#-Emotion-Fusion-Approach)
- [🔮 Future Plans](#-future-plans)
- [📌 Summary](#-summary)
- [🔧 Setup & Installation](#-setup--installation)

## 🎯 Objective

The goal of the ML component is to accurately detect emotions in users' voice recordings and extract meaningful summaries from the transcribed text. The insights are used to track emotional patterns and provide helpful psychological feedback.


## 📦 Models Used

### 1. 📝 Whisper Large V3* - Transcription (Voice to Text)

We use **Whisper** models for transcribing user voice recordings into text. The choice of model depends on the language and desired balance between speed and accuracy.

#### 🧪 Experimental Findings

- **Whisper Small**: Very fast, but low accuracy. Suitable only for quick English transcriptions where quality is not critical.
- **Whisper Medium**: Good for English. Decent speed and reliable transcriptions. Sometimes picks up other languages, but language detection is often inaccurate.
- **Whisper Large V3**: High accuracy. Supports proper translation with the right settings. Slower, but offers robust multilingual capabilities.
- **Whisper Large V3 Turbo**: Optimized for speed, but translation support is limited or unavailable. Inconsistent speed – sometimes faster or slower than Medium. Our experiments show that it is not reliable for multilingual use.

> **Official multilingual support** is only available in **Large V3** and **Turbo** models.

#### 🚀 Current Strategy

1. **Use Whisper Large V3** for **language detection**, **transcription** and **translation** (if initially it is not in English)
---

#### 📊 Model Comparison

| Model       | Parameters | Multilingual | Recommended Use                         |
|-------------|------------|--------------|------------------------------------------|
| small       | 244M       | ❌           | Very fast but inaccurate, English only   |
| medium      | 769M       | ❌           | Good for English, unreliable for others  |
| large-v3    | 1550M      | ✅           | High-quality multilingual transcription and translation |
| large-v3-turbo | 798M    | ✅           | Fast but limited translation, inconsistent results |

> All Whisper models are trained on over **680,000 hours** of multilingual and multitask supervised data collected from the web.


The transcribed text is then forwarded to a text-based analysis module for tasks such as emotion extraction, summarization, and supportive feedback (currently under development).

### 2. 🎤 Fine-tuned Whisper Large V3 - Emotion Recognition from Voice (Speech Audio)

We use a **fine-tuned Whisper Large V3** model to classify emotions from raw voice recordings.

#### ⚙️ Preprocessing
- **Audio Loading**: Using Librosa to load `.wav` files.
- **Feature Extraction**: Whisper's feature extractor is applied for normalization and formatting.

#### 🧠 Model Details
- **Base Model**: `openai/whisper-large-v3`
- **Task**: Audio classification
- **Output**: Emotion labels (`Angry`, `Disgust`, `Fearful`, `Happy`, `Neutral`, `Sad`, `Surprised`)

> The **'calm'** emotion was excluded from training due to underrepresentation.

#### 📊 Evaluation Metrics
| Metric     | Value   |
|------------|---------|
| Loss       | 0.5008  |
| Accuracy   | 0.9199  |
| Precision  | 0.9230  |
| Recall     | 0.9199  |
| F1 Score   | 0.9198  |

> The model performs well in distinguishing between multiple emotional states in speech.

### 3. 💬 Fine-tuned BART-based model SAMSum - Text-Based summary
We use a **fine-tuned BART-based model** to generate short summaries from transcribed user voice recordings. This helps distill lengthy or unstructured speech into clear, meaningful insights — ideal for daily reflection and psychological tracking.

#### 🧪 Experimental Findings

We tested multiple summarization approaches and found that dialogue-optimized models provide significantly better results on spoken diary content.

- **BART Large (CNN)**: Trained for news articles — too formal, often misses conversational nuance.
- **T5**: Lightweight and fast, but inconsistent output for long or emotional speech.
- **BART SAMSum**: Specifically fine-tuned on conversational dialogues; excellent at summarizing emotional, informal, or reflective speech.

> `philschmid/bart-large-cnn-samsum` provided the best quality-to-speed tradeoff and handled diary-like entries very naturally.

#### 🚀 Current Strategy

To ensure **reliable summarization of user entries**, we follow this pipeline:
1. Transcribe audio using Whisper (see above).
2. Clean and normalize the resulting text.
3. Run the text through `philschmid/bart-large-cnn-samsum` to generate a concise 1–3 sentence summary.
4. Store/display this summary as the primary daily insight.

This ensures every diary entry receives a structured, emotionally-relevant summary — even when the original voice content is long or repetitive.

---

#### 📊 Model Comparison

| Model                          | Parameters | Trained For     | Summary Quality     | Suitable For Speech |
|-------------------------------|------------|------------------|----------------------|----------------------|
| bart-large-cnn                | 406M       | News articles    | Formal, often dry    | ❌                   |
| t5-small                      | 60M        | General purpose  | Fast, but weak       | ❌                   |
| **bart-large-cnn-samsum**     | 406M       | Dialogues        | ✅ Natural & concise | ✅ Yes               |

> SAMSum-trained BART is fine-tuned on thousands of real human conversations and summaries, making it ideal for user voice journals.

---

The generated summary is later used in downstream modules (e.g., LLM-based reflection, emotional feedback, future search/indexing).

> This summarization step is already **fully deployed and in active use** as part of the Voice Diary MVP.


### 4. 💭 Emotion-english-distilroberta-base - Emotion Recognition from Text

We use the [`j-hartmann/emotion-english-distilroberta-base`](https://huggingface.co/j-hartmann/emotion-english-distilroberta-base) model to detect emotional tone in transcribed text or generated summaries.

#### ⚙️ Preprocessing
- **Input**: Cleaned text from Whisper transcription or SAMSum summarization.
- **Tokenization**: Uses HuggingFace tokenizer (`DistilRobertaTokenizerFast`).
- **Max Length**: Up to 512 tokens per input.

#### 🧠 Model Details
- **Base Model**: `distilroberta-base`
- **Task**: Text classification (Emotion Recognition)
- **Fine-tuned on**: English datasets for emotion classification
- **Output Labels**: `joy`, `sadness`, `anger`, `fear`, `surprise`, `disgust`, `neutral`

#### 📊 Evaluation Metrics
| Metric         | Value (avg.) |
|----------------|--------------|
| Accuracy       | ~0.92        |
| F1 Score       | ~0.91        |
| Inference Time | ~30ms / input |

> Performance may vary depending on the text length and emotional expressiveness. Works best for reflective or dialogue-like text typical for diary entries.

#### 🚀 Current Strategy
1. **Apply after transcription or summarization** to extract emotional tone.
2. **Store predicted emotion label** as part of the diary metadata.
3. **Fuse with audio-based emotion** for richer emotional tracking.


### 5. 🤖 OpenHermes-2.5-Mistral-7B - Psychological Insight Extraction from Text

#### Models Evaluated

1. **teknium/OpenHermes-2.5-Mistral-7B (SELECTED MODEL)** 
   - **Performance**: Optimal balance between response quality and speed
   - **Use Case**: General psychological feedback generation, but needs further debugging

2. **FacebookAI/roberta-base**
   - **Performance**: Fast execution but provides minimal contextual information
   - **Use Case**: Basic text processing where speed is prioritized over depth

3. **mistralai/Mistral-7B-Instruct-v0.2**
   - **Performance**: Produces high-quality results but operates approximately 100x slower than OpenHermes, quantilization approaches will be tested in the future
   - **Use Case**: Situations requiring deep analysis where response time is not critical

4. **zephyr-7b**
   - **Performance**: Moderate speed and quality
   - **Use Case**: General NLP tasks with moderate requirements

5. **FacebookAI/roberta-base** + **finiteautomata/bertweet-base-sentiment-analysis** + **mental/mental-roberta-base**
   - **Performance**: Provides minimal contextual information
   - **Use Case**: Emotional tone assessment in text, Quick mental health-related text processing

#### Prompt Engineering Process

1. **Initial Attempt**:
   - Simple instruction to "analyze this text psychologically"
   - Problems: Unstructured output, inconsistent formatting

2. **Structured JSON Attempt**:
   - Added explicit JSON format requirements
   - Problems: Still produced non-JSON text around output

3. **System Message Integration**:
   - Added `<<SYS>>` tags for role definition
   - Problems: Sometimes missed fields

4. **Current Final Prompt**:
   - Combines system message with strict JSON template
   - Includes clear instructions about specificity
   - Uses [INST] tags for instruction clarity

#### Why This Prompt Works Best

- **Clear Structure**: The exact JSON template prevents hallucination of fields
- **Specific Instructions**: "Be specific and concrete" improves output quality
- **Format Enforcement**: "Output must be valid JSON" reduces errors
- **Context Isolation**: [INST] tags help the model understand task boundaries

## 😊🤝 Emotion Fusion Approach

This method combines emotion predictions from two models: an audio-based model 🎧 and a text-based model ✍️, using a custom similarity matrix 🔍 and weighted fusion ⚖️.

The similarity matrix, personally developed 🛠️, quantifies semantic closeness between emotions based on psychological insights 🧠💡.

By weighting and integrating the outputs, the fusion accounts for cases where vocal tone 🎶 and spoken content 📜 differ — for example, happy speech 😄 with sad content 😢 — inferring the most plausible underlying emotion 🤔💭.

With this fusion approach, we approximate human ability 👤🧩 to interpret mixed signals and understand the true emotional state ❤️🎭 behind voice and words 🗣️📝.

This method improves emotion recognition accuracy 📈 by capturing subtle interactions between voice and text signals, reflecting complex human emotional expression 🌈✨.

![Emotion Similarity Matrix](emotion_sim_matrix.png "Similarity Matrix")
![Emotion Similarity Matrix](pic.jpeg "Similarity Matrix")

## 🔮 Future Plans

We are actively working to enhance the ML component of the Voice Diary app:

- **Multimodal Emotion Fusion**: Combine insights from both **voice** and **text** to improve overall emotion recognition accuracy.
- **Richer Psychological Responses**: Make AI-generated feedback more helpful, empathetic, and tailored.
- **Multilingual Support**: Further improve performance across different languages and accents.

## 📌 Summary

| Component        | Model Used                | Task                             | Status        |
|------------------|---------------------------|----------------------------------|---------------|
| Transcription     | Whisper Small/Medium      | Speech-to-text                   | ✅ In Use      |
| Emotion from Voice | Whisper Large V3 (fine-tuned) | Audio emotion classification     | ✅ In Use      |
| Emotion from Text | Emotion-english-distilroberta-base | Text emotion classification | ✅ In Use    |
| Summary     | Bart-large-cnn-samsum     | Text summary                   | ✅ In Use      |
| Emotional feedback | OpenHermes-2.5-Mistral-7B  | Psychological insight generation | ✅ In Use  |


For more technical details or questions, please feel free to contact the development team.

---

## 🔧 Setup & Installation

This section outlines the steps required to install and run the machine learning components used in the Voice Diary project. It includes installation instructions for Whisper models, fine-tuned Whisper for emotion recognition, and supporting tools like FFmpeg.

### 📦 Python Environment Requirements

Install general dependencies used across different modules:

```bash
pip install torch torchaudio transformers openai-whisper ffmpeg-python librosa numpy pandas more-itertools tqdm tiktoken
```

### 2. Install FFmpeg for Whisper
#### 🪟 Windows

1. **Download FFmpeg**  
   - Get `ffmpeg-git-full.7z` from [gyan.dev](https://www.gyan.dev/ffmpeg/builds/)

2. **Installation**  
   - Extract the archive to `C:\ffmpeg`  
   (This should create a `bin` folder with `ffmpeg.exe` inside)

3. **Add to System PATH**  
   - Press `Win + X` → Select "System"  
   - Click "Advanced system settings"  
   - Go to the "Environment Variables" button  
   - Under "System variables", find and select "Path" → Click "Edit"  
   - Click "New" and add: `C:\ffmpeg\bin`  
   - Click "OK" on all open windows

4. **Final Steps**  
   - Restart your terminal or VSCode  
   - Verify with:  
     ```cmd
     ffmpeg -version
     ```

#### 🍎 macOS
```bash
# Install via Homebrew
brew install ffmpeg

# If you get "command not found":
echo 'export PATH="/opt/homebrew/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

#### 🐧 Linux
```bash
# Ubuntu/Debian
sudo apt update && sudo apt install ffmpeg

# Arch Linux
sudo pacman -S ffmpeg

# Fedora
sudo dnf install ffmpeg
```

##### ✅ Verification

Check FFmpeg is installed correctly:
```bash
ffmpeg -version
```

### 3. 🚀 Running the Models
#### 1. 🎤 Whisper Transcription (Speech-to-Text)

Run the basic Whisper model to transcribe voice:
```bash
python test_whisper.py
```

#### 2. 🧠 Whisper Large V3 (Emotion Recognition)

```bash
python test_whisper_er.py
```

#### 3. 📝 Fine-tuned BART-based model SAMSum

```bash
python samsum_text_summary.py
```

### 4. 💭 Emotion english distilroberta base
```bash
hartman_emotion_from_text.py
```

#### 5. 🤖  Mistral OpenHermes

```bash
pip install accelerate sentencepiece
```
