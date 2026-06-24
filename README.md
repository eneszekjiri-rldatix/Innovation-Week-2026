# Hand Hygiene Audit API

AI-powered hand hygiene compliance checker that analyzes videos of hand washing procedures against hygiene audit standards using AWS Bedrock.

## Audit Criteria

The system evaluates videos against four key compliance questions:

1. **Bare Below the Elbows** – Staff have no watches, jewellery, or long sleeves below the elbow
2. **Cuts and Grazes Covered** – Any wounds are covered with a waterproof plaster
3. **Correct Hand Hygiene Technique** – Proper WHO/NHS hand washing steps are followed
4. **Paper Towel Disposal** – Towels are disposed of without touching the waste bin lid

## Setup

### Prerequisites

- Python 3.11+
- AWS credentials configured with access to Amazon Bedrock
- FFmpeg (optional, OpenCV handles most formats)

### Installation

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
```

### AWS Bedrock Configuration

The project includes a local `.env` file with placeholders. Once you have Bedrock access, replace:

```env
AWS_ACCESS_KEY_ID=<INSERT AWS ACCESS KEY ID HERE>
AWS_SECRET_ACCESS_KEY=<INSERT AWS SECRET ACCESS KEY HERE>
```

The app loads these values automatically and uses `boto3` through LangChain's `ChatBedrock` integration.

You need Bedrock model access enabled in your AWS account.

For local upload testing without calling Bedrock, set:

```env
HYGIENE_USE_MOCK=true
```

### Environment Variables (Optional)

| Variable | Default | Description |
|----------|---------|-------------|
| `HYGIENE_AWS_REGION` | `eu-west-1` | AWS region for Bedrock |
| `HYGIENE_BEDROCK_MODEL_ID` | `global.amazon.nova-2-lite-v1:0` | Bedrock model to use |
| `HYGIENE_MAX_FRAMES` | `20` | Max one-frame-per-second samples to extract from video |
| `HYGIENE_SAVED_VIDEOS_DIR` | Desktop `Hand Hygiene Audit Videos` folder | Folder where uploaded videos are saved locally |
| `HYGIENE_USE_MOCK` | `false` | Set to `true` to return dummy JSON without calling Bedrock |
| `HYGIENE_INPUT_TOKEN_PRICE_PER_1K_USD` | `0.0008` | Estimated input token price per 1K tokens |
| `HYGIENE_OUTPUT_TOKEN_PRICE_PER_1K_USD` | `0.004` | Estimated output token price per 1K tokens |

## Running the App

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`.

Interactive docs at `http://localhost:8000/docs`.

## API Endpoints

### `POST /analyze`

Upload a video for hand hygiene compliance analysis.

```bash
curl -X POST http://localhost:8000/analyze \
  -F "video=@handwashing_video.mp4"
```

**Response:**
```json
{
  "status": "success",
  "result": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2026-06-23T12:00:00Z",
    "video_filename": "handwashing_video.mp4",
    "ai_agent": "global.amazon.nova-2-lite-v1:0",
    "usage": {
      "input_tokens": 18432,
      "output_tokens": 612,
      "total_tokens": 19044,
      "input_cost_per_1k_usd": 0.0008,
      "output_cost_per_1k_usd": 0.004,
      "estimated_cost_usd": 0.01719
    },
    "bare_below_elbows": {
      "question": "Staff are 'Bare Below the Elbows'",
      "status": "compliant",
      "confidence": 0.92,
      "observations": "No visible watches, jewellery, or long sleeves observed."
    },
    "cuts_covered": {
      "question": "Cuts and grazes are covered with a waterproof plaster",
      "status": "unable_to_determine",
      "confidence": 0.5,
      "observations": "No visible cuts or grazes detected on hands."
    },
    "correct_technique": {
      "question": "The correct hand hygiene technique is used when washing hands",
      "status": "compliant",
      "confidence": 0.85,
      "observations": "Multiple hand washing steps observed including palm-to-palm and interlaced fingers."
    },
    "paper_towel_disposal": {
      "question": "Paper towels are disposed of without touching the waste bin lid",
      "status": "non_compliant",
      "confidence": 0.78,
      "observations": "Staff member touched bin lid with hand to open it."
    },
    "overall_compliant": false,
    "summary": "Hand washing technique is good but paper towel disposal was non-compliant."
  }
}
```

### `GET /results`

List all previous audit results.

### `GET /results/{result_id}`

Get a specific audit result by ID.

### `GET /health`

Health check endpoint.

## Project Structure

```
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application & endpoints
│   ├── config.py            # App configuration (env vars)
│   ├── models.py            # Pydantic data models
│   └── services/
│       ├── __init__.py
│       ├── frame_sampling.py   # One-frame-per-second sampling algorithm
│       ├── video_processor.py  # Frame extraction and image encoding
│       └── analysis.py         # LangChain + Bedrock analysis
├── results/                 # Saved JSON audit results
├── uploads/                 # Temporary video uploads
├── requirements.txt
└── README.md
```
