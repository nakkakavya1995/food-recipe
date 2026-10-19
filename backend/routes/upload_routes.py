import os
import secrets
from flask import Blueprint, request, jsonify, current_app, send_from_directory
from werkzeug.utils import secure_filename
from config.settings import Config

upload_bp = Blueprint("uploads", __name__)

ALLOWED_VIDEO_EXTENSIONS = {"mp4", "webm", "mov", "m4v", "ogg", "avi", "mkv"}
ALLOWED_IMAGE_EXTENSIONS = {"jpg", "jpeg", "png", "webp", "gif"}
def allowed_file(filename, allowed_extensions):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in allowed_extensions
@upload_bp.post("/video")
def upload_video():
    """
    Upload a cooking video file (.mp4, .webm, .mov, etc.)
    Saves file to backend/uploads/videos/ and returns accessible URL.
    """
    if "video" not in request.files and "file" not in request.files:
        return jsonify(message="No video file provided in form-data ('video' or 'file')."), 400

    file = request.files.get("video") or request.files.get("file")

    if not file or file.filename == "":
        return jsonify(message="No video file selected."), 400

    if not allowed_file(file.filename, ALLOWED_VIDEO_EXTENSIONS):
        return jsonify(
            message=f"Unsupported video format. Allowed formats: {', '.join(sorted(ALLOWED_VIDEO_EXTENSIONS))}"
        ), 400

    # Ensure uploads/videos directory exists
    video_dir = os.path.join(Config.UPLOAD_FOLDER, "videos")
    os.makedirs(video_dir, exist_ok=True)

    original_ext = file.filename.rsplit(".", 1)[1].lower()
    safe_name = f"video_{secrets.token_hex(8)}.{original_ext}"
    target_path = os.path.join(video_dir, safe_name)

    try:
        file.save(target_path)
    except Exception as e:
        current_app.logger.exception("Failed to save uploaded video")
        return jsonify(message=f"Failed to save video: {str(e)}"), 500

    # Build relative and absolute URL
    relative_url = f"/uploads/videos/{safe_name}"
    # Use host from request so it works with localhost or local network IP
    host_url = request.host_url.rstrip("/")
    full_url = f"{host_url}{relative_url}"

    return jsonify({
        "status": "success",
        "message": "Cooking video uploaded successfully!",
        "video_url": full_url,
        "relative_url": relative_url,
        "filename": safe_name
    }), 201


@upload_bp.post("/image")
def upload_image():
    """
    Upload a recipe cover image file (.jpg, .png, .webp, etc.)
    """
    if "image" not in request.files and "file" not in request.files:
        return jsonify(message="No image file provided in form-data ('image' or 'file')."), 400

    file = request.files.get("image") or request.files.get("file")

    if not file or file.filename == "":
        return jsonify(message="No image file selected."), 400

    if not allowed_file(file.filename, ALLOWED_IMAGE_EXTENSIONS):
        return jsonify(
            message=f"Unsupported image format. Allowed formats: {', '.join(sorted(ALLOWED_IMAGE_EXTENSIONS))}"
        ), 400

    image_dir = os.path.join(Config.UPLOAD_FOLDER, "images")
    os.makedirs(image_dir, exist_ok=True)

    original_ext = file.filename.rsplit(".", 1)[1].lower()
    safe_name = f"img_{secrets.token_hex(8)}.{original_ext}"
    target_path = os.path.join(image_dir, safe_name)

    try:
        file.save(target_path)
    except Exception as e:
        current_app.logger.exception("Failed to save uploaded image")
        return jsonify(message=f"Failed to save image: {str(e)}"), 500

    relative_url = f"/uploads/images/{safe_name}"
    host_url = request.host_url.rstrip("/")
    full_url = f"{host_url}{relative_url}"

    return jsonify({
        "status": "success",
        "message": "Image uploaded successfully!",
        "image_url": full_url,
        "relative_url": relative_url,
        "filename": safe_name
    }), 201
