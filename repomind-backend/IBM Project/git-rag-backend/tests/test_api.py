"""
API Endpoint Integration Tests
Uses unittest.mock to mock Github, Gemini, and Qdrant external dependencies.
"""

import unittest
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

from app.main import app, _tasks
from app.schemas.api_models import IngestStatusResponse, IngestResponse
from app.services.github import RepoFile
from app.database.vector_db import SearchResult


class TestGitRAGApi(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        # Reset the in-memory tasks list before each test
        _tasks.clear()

    def test_health_check(self):
        """Test the health check endpoint returns 200 OK."""
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok", "version": "0.1.0"})

    @patch("app.main.fetch_repo_files", new_callable=AsyncMock)
    @patch("app.main.generate_embeddings", new_callable=AsyncMock)
    @patch("app.main.upsert_documents")
    def test_ingest_repo_success(self, mock_upsert, mock_embed, mock_fetch):
        """Test ingest endpoint successfully starts background task."""
        # Setup mocks
        mock_fetch.return_value = [
            RepoFile(path="main.py", content="print('hello')\nprint('world')")
        ]
        mock_embed.return_value = [[0.1] * 3072]
        mock_upsert.return_value = 1

        payload = {
            "repo_url": "https://github.com/test-user/test-repo",
            "branch": "main",
            "file_extensions": [".py"]
        }

        # Request Ingest (Starts background task)
        response = self.client.post("/api/ingest", json=payload)
        self.assertEqual(response.status_code, 202)
        
        resp_data = response.json()
        self.assertEqual(resp_data["message"], "Ingestion started")
        self.assertEqual(resp_data["repo"], payload["repo_url"])
        self.assertIn("task_id", resp_data)

        # Retrieve task ID and wait/check status
        task_id = resp_data["task_id"]
        
        # Check task tracker contains the task status
        self.assertIn(task_id, _tasks)
        
        # Directly invoke the worker or check status since background tasks run asynchronously.
        # In TestClient, background tasks are executed synchronously before response returns
        # or immediately after, allowing us to inspect the status directly.
        task_status = _tasks[task_id]
        self.assertEqual(task_status.status, "completed")
        self.assertIsNotNone(task_status.result)
        self.assertEqual(task_status.result.files_processed, 1)
        self.assertEqual(task_status.result.chunks_stored, 1)

    def test_ingest_status_not_found(self):
        """Test that polling an invalid task ID returns 404."""
        response = self.client.get("/api/ingest/status/invalid-id")
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json()["detail"], "Unknown task_id")

    def test_ingest_status_polling(self):
        """Test retrieving task status for existing task ID."""
        task_id = "test-task-id"
        _tasks[task_id] = IngestStatusResponse(
            task_id=task_id,
            status="completed",
            result=IngestResponse(
                message="Mock completed",
                repo="https://github.com/mock/repo",
                files_processed=5,
                chunks_stored=10
            )
        )
        response = self.client.get(f"/api/ingest/status/{task_id}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "completed")
        self.assertEqual(data["result"]["chunks_stored"], 10)

    @patch("app.main.generate_embedding", new_callable=AsyncMock)
    @patch("app.main.search_similarity")
    @patch("app.main.answer_query", new_callable=AsyncMock)
    def test_query_rag_success(self, mock_answer, mock_search, mock_embed):
        """Test querying the RAG pipeline."""
        mock_embed.return_value = [0.1] * 3072
        mock_search.return_value = [
            SearchResult(
                file_path="main.py",
                content="print('hello')",
                repo_url="https://github.com/test-user/test-repo",
                score=0.95,
                chunk_index=0,
                total_chunks=1,
                start_line=1,
                end_line=1
            )
        ]
        mock_answer.return_value = "Here is the answer to your query."

        payload = {
            "repo_url": "https://github.com/test-user/test-repo",
            "query": "How do I say hello?",
            "top_k": 5
        }

        response = self.client.post("/api/query", json=payload)
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertEqual(data["answer"], "Here is the answer to your query.")
        self.assertEqual(len(data["sources"]), 1)
        self.assertEqual(data["sources"][0]["file_path"], "main.py")
        self.assertEqual(data["sources"][0]["start_line"], 1)
        self.assertEqual(data["sources"][0]["end_line"], 1)


if __name__ == "__main__":
    unittest.main()
