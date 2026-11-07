"""
AI & Computer Vision Face Engine:
Handles Face Detection, Liveness Check (Blur/Quality), Deep Metric Embedding Extraction,
and Fast Vectorized Similarity Matching.
"""

import io
import json
import base64
import io
import json
import base64
import numpy as np
from PIL import Image
from typing import List, Tuple, Optional, Dict, Any

try:
    import cv2
except Exception as _cv_err:
    cv2 = None
    print(f"[FaceEngine] OpenCV load warning: {_cv_err}. Using PIL & NumPy fallbacks.")

# Global model cache
_facenet_model = None
_face_cascade = None


def get_face_cascade():
    """Load OpenCV Haar Cascade for fast, reliable face detection."""
    global _face_cascade
    if _face_cascade is None and cv2 is not None:
        try:
            cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
            _face_cascade = cv2.CascadeClassifier(cascade_path)
        except Exception as e:
            print(f"[FaceEngine] Cascade error: {e}")
            _face_cascade = None
    return _face_cascade


def get_facenet_model():
    """Lazily load PyTorch FaceNet (InceptionResnetV1) model."""
    global _facenet_model
    if _facenet_model is None:
        try:
            import torch
            from facenet_pytorch import InceptionResnetV1
            model = InceptionResnetV1(pretrained="vggface2").eval()
            _facenet_model = model
        except Exception as e:
            print(f"[FaceEngine] FaceNet load notice: {e}. Using native descriptor fallback.")
            _facenet_model = "OPENCV_FALLBACK"
    return _facenet_model


def decode_base64_image(image_base64: str) -> np.ndarray:
    """Decode a base64 string or data URL into an image array."""
    if "," in image_base64:
        image_base64 = image_base64.split(",", 1)[1]
    image_bytes = base64.b64decode(image_base64)
    if cv2 is not None:
        try:
            np_arr = np.frombuffer(image_bytes, np.uint8)
            image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
            if image is not None:
                return image
        except Exception:
            pass
    # Resilient PIL fallback
    try:
        pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        return np.array(pil_img)
    except Exception as e:
        raise ValueError(f"Could not decode image from base64 string: {e}")


def check_image_quality(gray_img: np.ndarray) -> Tuple[bool, float]:
    """
    Check if the image is sharp enough for recognition using the Laplacian variance method.
    Returns (is_acceptable, sharpness_score).
    """
    if cv2 is not None:
        try:
            variance = cv2.Laplacian(gray_img, cv2.CV_64F).var()
            return (variance >= 25.0, float(variance))
        except Exception:
            pass
    # Resilient NumPy variance fallback
    var = float(np.var(gray_img))
    return (var >= 20.0, var)


def detect_faces(bgr_image: np.ndarray) -> List[Tuple[int, int, int, int]]:
    """
    Detect faces in image.
    Returns list of bounding boxes: [(x, y, w, h), ...]
    """
    if cv2 is not None:
        try:
            if len(bgr_image.shape) == 3 and bgr_image.shape[2] == 3:
                gray = cv2.cvtColor(bgr_image, cv2.COLOR_BGR2GRAY)
            else:
                gray = bgr_image
            cascade = get_face_cascade()
            if cascade is not None:
                faces = cascade.detectMultiScale(
                    gray,
                    scaleFactor=1.15,
                    minNeighbors=5,
                    minSize=(60, 60),
                    flags=cv2.CASCADE_SCALE_IMAGE
                )
                if len(faces) > 0:
                    return [tuple(map(int, f)) for f in faces]
        except Exception:
            pass
    # Fallback candidate region: center 80% of image
    h, w = bgr_image.shape[:2]
    return [(int(w * 0.1), int(h * 0.1), int(w * 0.8), int(h * 0.8))]


def extract_face_embedding(bgr_image: np.ndarray, box: Optional[Tuple[int, int, int, int]] = None) -> List[float]:
    """
    Extract a normalized deep metric embedding vector for a given face region.
    Returns a normalized float vector (512-d via FaceNet or 128-d via CV descriptor).
    """
    if box:
        x, y, w, h = box
        # Add small margin
        h_img, w_img = bgr_image.shape[:2]
        pad = int(0.1 * min(w, h))
        x1, y1 = max(0, x - pad), max(0, y - pad)
        x2, y2 = min(w_img, x + w + pad), min(h_img, y + h + pad)
        face_crop = bgr_image[y1:y2, x1:x2]
    else:
        face_crop = bgr_image

    if face_crop.size == 0:
        face_crop = bgr_image

    model = get_facenet_model()

    if model is not None and model != "OPENCV_FALLBACK":
        try:
            import torch
            from torchvision import transforms
            # Preprocess for InceptionResnetV1: 160x160 RGB, normalized [-1, 1]
            rgb_face = cv2.cvtColor(face_crop, cv2.COLOR_BGR2RGB)
            pil_img = Image.fromarray(rgb_face).resize((160, 160))
            transform = transforms.Compose([
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.5, 0.5, 0.5], std=[0.5, 0.5, 0.5])
            ])
            tensor = transform(pil_img).unsqueeze(0)
            with torch.no_grad():
                embedding = model(tensor).squeeze(0).numpy()
            # L2 normalize
            norm = np.linalg.norm(embedding)
            if norm > 0:
                embedding = embedding / norm
            return embedding.tolist()
        except Exception as e:
            print(f"[FaceEngine] PyTorch inference fallback triggered: {e}")

    # Robust Descriptor Fallback: 128-d spatial & intensity statistics
    if cv2 is not None:
        try:
            face_resized = cv2.resize(face_crop, (64, 64))
            gray_crop = cv2.cvtColor(face_resized, cv2.COLOR_BGR2GRAY)
        except Exception:
            pil_img = Image.fromarray(face_crop).resize((64, 64)).convert("L")
            gray_crop = np.array(pil_img)
    else:
        pil_img = Image.fromarray(face_crop).resize((64, 64)).convert("L")
        gray_crop = np.array(pil_img)
    
    # Compute 8x8 block mean and standard deviations (64 + 64 = 128 features)
    blocks = []
    for r in range(0, 64, 8):
        for c in range(0, 64, 8):
            blk = gray_crop[r:r+8, c:c+8]
            blocks.append(float(np.mean(blk)))
            blocks.append(float(np.std(blk)))
            
    vec = np.array(blocks[:128], dtype=np.float32)
    norm = np.linalg.norm(vec)
    if norm > 0:
        vec = vec / norm
    return vec.tolist()


def compute_similarity(embedding_a: List[float], embedding_b: List[float]) -> float:
    """
    Compute Cosine Similarity between two L2-normalized embedding vectors.
    Range: -1.0 to 1.0 (Higher is closer; 1.0 = identical face).
    """
    a = np.array(embedding_a, dtype=np.float32)
    b = np.array(embedding_b, dtype=np.float32)
    
    # Handle dimension mismatch if any
    min_dim = min(len(a), len(b))
    a = a[:min_dim]
    b = b[:min_dim]
    
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))


class StudentEmbeddingCache:
    """
    In-memory matrix cache of enrolled student embeddings for sub-millisecond lookups.
    """
    def __init__(self):
        self.student_ids: List[int] = []
        self.roll_numbers: List[str] = []
        self.full_names: List[str] = []
        self.matrix: Optional[np.ndarray] = None
        self.dim: int = 0

    def refresh(self, students: List[Any]):
        """Load enrolled students into cache."""
        ids = []
        rolls = []
        names = []
        vectors = []

        for s in students:
            if s.face_embedding and s.is_active:
                try:
                    vec = json.loads(s.face_embedding) if isinstance(s.face_embedding, str) else s.face_embedding
                    if isinstance(vec, list) and len(vec) > 0:
                        ids.append(s.id)
                        rolls.append(s.roll_number)
                        names.append(s.full_name)
                        vectors.append(vec)
                except Exception:
                    continue

        self.student_ids = ids
        self.roll_numbers = rolls
        self.full_names = names

        if len(vectors) > 0:
            # Normalize vector lengths
            self.dim = len(vectors[0])
            uniform_vectors = [v[:self.dim] if len(v) >= self.dim else v + [0.0]*(self.dim-len(v)) for v in vectors]
            arr = np.array(uniform_vectors, dtype=np.float32)
            # Ensure rows are L2 normalized
            norms = np.linalg.norm(arr, axis=1, keepdims=True)
            norms[norms == 0] = 1.0
            self.matrix = arr / norms
        else:
            self.matrix = None

    def match(self, query_vector: List[float], threshold: float = 0.65) -> Optional[Dict[str, Any]]:
        """
        Match a query vector against all cached student embeddings.
        Returns best match dictionary if cosine similarity >= threshold, else None.
        """
        if self.matrix is None or len(self.student_ids) == 0:
            return None

        q = np.array(query_vector, dtype=np.float32)
        if len(q) >= self.dim:
            q = q[:self.dim]
        else:
            q = np.pad(q, (0, self.dim - len(q)))

        q_norm = np.linalg.norm(q)
        if q_norm > 0:
            q = q / q_norm

        # Vectorized dot product for all enrolled students simultaneously (1 matrix-vector multiplication)
        similarities = np.dot(self.matrix, q)
        best_idx = int(np.argmax(similarities))
        best_sim = float(similarities[best_idx])

        if best_sim >= threshold:
            return {
                "student_id": self.student_ids[best_idx],
                "roll_number": self.roll_numbers[best_idx],
                "full_name": self.full_names[best_idx],
                "confidence": round(best_sim, 4)
            }
        return None


# Global active embedding cache instance
embedding_cache = StudentEmbeddingCache()
