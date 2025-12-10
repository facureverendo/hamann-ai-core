"""
Ingestor Module - File Reading & Content Extraction
Handles PDF, Audio, and Text file processing to create unified context.
"""

import os
from pathlib import Path
from typing import Optional
import pypdf
from openai import OpenAI


def read_pdf(filepath: str) -> str:
    """
    Extract text content from a PDF file.
    
    Args:
        filepath: Path to the PDF file
        
    Returns:
        Extracted text content
    """
    try:
        text_content = []
        with open(filepath, 'rb') as file:
            pdf_reader = pypdf.PdfReader(file)
            for page_num, page in enumerate(pdf_reader.pages, 1):
                text = page.extract_text()
                if text.strip():
                    text_content.append(f"--- Page {page_num} ---\n{text}")
        
        return "\n\n".join(text_content)
    except Exception as e:
        return f"[ERROR reading PDF {filepath}: {str(e)}]"


def transcribe_audio(filepath: str, client: OpenAI) -> str:
    """
    Transcribe audio file using OpenAI Whisper API.
    
    Args:
        filepath: Path to the audio file (mp3, wav, m4a, etc.)
        client: OpenAI client instance
        
    Returns:
        Transcribed text
    """
    try:
        with open(filepath, 'rb') as audio_file:
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="text"
            )
        return transcript
    except Exception as e:
        return f"[ERROR transcribing audio {filepath}: {str(e)}]"


def read_text(filepath: str) -> str:
    """
    Read plain text file content.
    
    Args:
        filepath: Path to the text file
        
    Returns:
        File content
    """
    try:
        with open(filepath, 'r', encoding='utf-8') as file:
            return file.read()
    except UnicodeDecodeError:
        # Try with latin-1 encoding if utf-8 fails
        try:
            with open(filepath, 'r', encoding='latin-1') as file:
                return file.read()
        except Exception as e:
            return f"[ERROR reading text file {filepath}: {str(e)}]"
    except Exception as e:
        return f"[ERROR reading text file {filepath}: {str(e)}]"


def process_inputs_folder(folder_path: str, client: OpenAI) -> str:
    """
    Process all supported files in the inputs folder and create unified context.
    
    Supported formats:
    - PDF: .pdf
    - Audio: .mp3, .wav, .m4a, .ogg
    - Text: .txt, .md
    
    Args:
        folder_path: Path to the inputs folder
        client: OpenAI client instance
        
    Returns:
        Unified context string with all extracted content
    """
    folder = Path(folder_path)
    
    if not folder.exists():
        raise FileNotFoundError(f"Inputs folder not found: {folder_path}")
    
    # Define supported file extensions
    audio_extensions = {'.mp3', '.wav', '.m4a', '.ogg', '.flac'}
    pdf_extensions = {'.pdf'}
    text_extensions = {'.txt', '.md', '.text'}
    
    context_parts = []
    files_processed = 0
    
    # Get all files in the folder
    files = sorted(folder.iterdir())
    
    for file_path in files:
        if not file_path.is_file():
            continue
            
        file_ext = file_path.suffix.lower()
        file_name = file_path.name
        
        print(f"📄 Processing: {file_name}")
        
        if file_ext in pdf_extensions:
            content = read_pdf(str(file_path))
            context_parts.append(f"=== PDF Document: {file_name} ===\n{content}")
            files_processed += 1
            
        elif file_ext in audio_extensions:
            content = transcribe_audio(str(file_path), client)
            context_parts.append(f"=== Audio Transcription: {file_name} ===\n{content}")
            files_processed += 1
            
        elif file_ext in text_extensions:
            content = read_text(str(file_path))
            context_parts.append(f"=== Text Document: {file_name} ===\n{content}")
            files_processed += 1
        else:
            print(f"⚠️  Skipping unsupported file: {file_name}")
    
    if files_processed == 0:
        raise ValueError("No supported files found in inputs folder. Supported: PDF, Audio (mp3/wav/m4a), Text (txt/md)")
    
    print(f"✅ Processed {files_processed} file(s)")
    
    # Combine all content with clear separators
    unified_context = "\n\n" + "="*80 + "\n\n".join(context_parts) + "\n\n" + "="*80
    
    return unified_context
