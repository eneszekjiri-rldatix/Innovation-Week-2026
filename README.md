# Hand Hygiene Audit API

AI-powered hand hygiene compliance checker that analyzes videos of hand washing procedures against hygiene audit standards using AWS Bedrock (Claude).

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

### AWS Configuration

Ensure your AWS credentials are configured. The app uses `boto3` which reads from:
- Environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)
- AWS credentials file (`~/.aws/credentials`)
- IAM role (if running on AWS)

You need Bedrock model access enabled for Claude in your AWS account.

### Environment Variables (Optional)

| Variable | Default | Description |
|----------|---------|-------------|
| `HYGIENE_AWS_REGION` | `eu-west-1` | AWS region for Bedrock |
| `HYGIENE_BEDROCK_MODEL_ID` | `anthropic.claude-sonnet-4-20250514` | Bedrock model to use |
| `HYGIENE_MAX_FRAMES` | `20` | Max frames to extract from video |
| `HYGIENE_FRAME_INTERVAL_SECONDS` | `1.0` | Seconds between frame captures |

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
│       ├── video_processor.py  # Frame extraction from video
│       └── analysis.py         # LangChain + Bedrock analysis
├── results/                 # Saved JSON audit results
├── uploads/                 # Temporary video uploads
├── requirements.txt
└── README.md
```
