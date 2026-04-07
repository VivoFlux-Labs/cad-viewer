import os
import shutil
from abc import ABC, abstractmethod

class StorageProvider(ABC):
    @abstractmethod
    def upload(self, local_filepath: str, destination_path: str) -> str:
        pass

    @abstractmethod
    def get_url(self, destination_path: str) -> str:
        pass

    @abstractmethod
    def delete(self, destination_path: str) -> bool:
        pass

class LocalStorageProvider(StorageProvider):
    # Static config to match the monorepo structure
    BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../storage/models"))
    BASE_URL = "/storage/models"

    def __init__(self):
        os.makedirs(self.BASE_DIR, exist_ok=True)

    def upload(self, local_filepath: str, destination_path: str) -> str:
        target_path = os.path.join(self.BASE_DIR, destination_path)
        os.makedirs(os.path.dirname(target_path), exist_ok=True)
        shutil.copy2(local_filepath, target_path)
        return self.get_url(destination_path)

    def get_url(self, destination_path: str) -> str:
        return f"{self.BASE_URL}/{destination_path}"

    def delete(self, destination_path: str) -> bool:
        target_path = os.path.join(self.BASE_DIR, destination_path)
        if os.path.exists(target_path):
            os.remove(target_path)
            return True
        return False

class S3StorageProvider(StorageProvider):
    def __init__(self):
        self.bucket = os.getenv("S3_BUCKET", "cad-viewer-bucket")
        self.cdn_domain = os.getenv("CDN_DOMAIN", "https://cdn.cadviewer.local")

    def upload(self, local_filepath: str, destination_path: str) -> str:
        # Optimization implementation placeholder for Boto3
        return self.get_url(destination_path)

    def get_url(self, destination_path: str) -> str:
        return f"{self.cdn_domain}/{destination_path}"

    def delete(self, destination_path: str) -> bool:
        return True

def get_storage_provider() -> StorageProvider:
    provider_type = os.getenv("STORAGE_PROVIDER", "local").lower()
    if provider_type == "s3":
        return S3StorageProvider()
    return LocalStorageProvider()
