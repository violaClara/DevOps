import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

@patch("main.process_pdf_to_base64_image")
@patch("main.client.chat.completions.create")
@pytest.mark.asyncio
async def test_extract_pdf_success(mock_create, mock_process_pdf):
    # Mock OpenRouter response
    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = '''```json
{
  "tanggal": "2023-10-27",
  "nama_pengirim": "John Doe",
  "nama_pt": "PT Solusi Sukses",
  "penerima": "Jane Smith",
  "total_harga": "1500000"
}
```'''
    
    # Since it's an async call, we need to return a coroutine
    async def async_mock(*args, **kwargs):
        return mock_response
    
    mock_create.side_effect = async_mock

    # Mock PDF to base64 conversion
    mock_process_pdf.return_value = "fake_base64_string"

    # We need a dummy PDF content to upload
    dummy_pdf_content = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"

    # Make sure we have an API key set temporarily for the test so it doesn't fail on the key check
    import os
    original_key = os.environ.get("OPENROUTER_API_KEY")
    os.environ["OPENROUTER_API_KEY"] = "test_key"
    
    import main
    main.OPENROUTER_API_KEY = "test_key"

    response = client.post(
        "/api/extract-pdf",
        files={"file": ("test.pdf", dummy_pdf_content, "application/pdf")}
    )

    # Restore the original key
    if original_key is not None:
         os.environ["OPENROUTER_API_KEY"] = original_key
    else:
         del os.environ["OPENROUTER_API_KEY"]
         
    main.OPENROUTER_API_KEY = original_key if original_key else ""

    assert response.status_code == 200
    json_response = response.json()
    assert json_response["status"] == "success"
    assert "data" in json_response
    assert json_response["data"]["nama_pengirim"] == "John Doe"
    assert json_response["data"]["total_harga"] == "1500000"
