"""Brief Processor - flujo de brief iterativo para features sin documentos iniciales"""
from __future__ import annotations

import os
import re
import json
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime
from openai import OpenAI

from api.services.project_processor import ProjectProcessor
from api.models.project_state import ProjectState
from src.brief_template import (
    get_initial_brief_prompt,
    get_refinement_prompt,
    get_question_generation_prompt,
    get_readiness_check_prompt,
)

project_root = Path(__file__).parent.parent.parent
PROJECTS_DIR = project_root / "projects"


class BriefProcessor:
    def __init__(self):
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.project_processor = ProjectProcessor()
        PROJECTS_DIR.mkdir(exist_ok=True)

    # Helpers
    def _get_project_dir(self, project_id: str) -> Path:
        return PROJECTS_DIR / project_id

    def _brief_file(self, project_id: str) -> Path:
        return self._get_project_dir(project_id) / "brief.md"

    def _prd_file(self, project_id: str) -> Path:
        return self._get_project_dir(project_id) / "prd.md"

    def _load_state(self, project_id: str) -> ProjectState:
        state = self.project_processor.load_state(project_id)
        if not state:
            raise ValueError(f"Project {project_id} not found")
        return state

    def _save_state(self, state: ProjectState):
        state.updated_at = datetime.now().isoformat()
        self.project_processor.save_state(state)

    def _read_brief(self, project_id: str) -> str:
        brief_path = self._brief_file(project_id)
        return brief_path.read_text(encoding="utf-8") if brief_path.exists() else ""

    def _write_brief(self, project_id: str, content: str):
        brief_path = self._brief_file(project_id)
        brief_path.parent.mkdir(parents=True, exist_ok=True)
        brief_path.write_text(content.strip() + "\n", encoding="utf-8")

    def _read_prd(self, project_id: str) -> str:
        prd_path = self._prd_file(project_id)
        return prd_path.read_text(encoding="utf-8") if prd_path.exists() else ""

    def _write_prd(self, project_id: str, content: str):
        prd_path = self._prd_file(project_id)
        prd_path.parent.mkdir(parents=True, exist_ok=True)
        prd_path.write_text(content.strip() + "\n", encoding="utf-8")

    # Brief generation
    def generate_initial_brief(
        self,
        project_id: str,
        suggestion: Dict,
        workspace_context: Dict,
        language_code: str = "es"
    ) -> Dict:
        state = self._load_state(project_id)

        prompt = get_initial_brief_prompt(
            suggestion=suggestion,
            workspace_context=workspace_context,
            language_code=language_code,
        )

        response = self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Eres un PM senior. Genera un brief conciso y estructurado en markdown, sin inventar funcionalidades no mencionadas."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.6,
            max_tokens=2000,
        )
        brief_content = response.choices[0].message.content.strip()

        # Guardar
        self._write_brief(project_id, brief_content)
        state.brief_generated = True
        state.brief_content = brief_content
        state.brief_iterations = 1

        # Evaluar readiness
        readiness_prompt = get_readiness_check_prompt(brief_content)
        readiness_resp = self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Evalúa si el brief está listo para convertirse en PRD. Responde solo con yes/no y breve justificación."},
                {"role": "user", "content": readiness_prompt},
            ],
            temperature=0.2,
            max_tokens=200,
        )
        readiness_text = readiness_resp.choices[0].message.content.lower()
        state.brief_ready_for_prd = "yes" in readiness_text or "listo" in readiness_text

        self._save_state(state)

        return {
            "brief_content": brief_content,
            "ready_for_prd": state.brief_ready_for_prd,
            "iterations": state.brief_iterations,
        }

    def generate_brief_questions(self, project_id: str) -> Dict:
        state = self._load_state(project_id)
        brief_content = self._read_brief(project_id)
        prompt = get_question_generation_prompt(brief_content)

        response = self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Genera preguntas concretas para mejorar el brief."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.5,
            max_tokens=800,
        )
        # Esperamos JSON simple
        try:
            data = json.loads(response.choices[0].message.content)
            questions = data.get("questions", [])
        except Exception:
            questions = []
        return {"questions": questions}

    def refine_brief_with_question(
        self,
        project_id: str,
        user_question: str,
        conversation_history: Optional[List[Dict]] = None,
    ) -> Dict:
        state = self._load_state(project_id)
        brief_content = self._read_brief(project_id)
        history = conversation_history or []

        prompt = get_refinement_prompt(
            brief_content=brief_content,
            user_question=user_question,
            conversation_history=history,
        )

        response = self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Refina el brief según la pregunta del usuario. Devuelve solo el brief actualizado en markdown."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.6,
            max_tokens=2000,
        )
        updated_brief = response.choices[0].message.content.strip()

        self._write_brief(project_id, updated_brief)
        state.brief_iterations += 1
        state.brief_content = updated_brief
        self._save_state(state)

        return {
            "brief_content": updated_brief,
            "iterations": state.brief_iterations,
        }

    def refine_brief_with_answer(
        self,
        project_id: str,
        question_id: str,
        answer: str,
    ) -> Dict:
        state = self._load_state(project_id)
        brief_content = self._read_brief(project_id)

        prompt = (
            "Tenemos un brief en markdown. Incorpora la respuesta del usuario en el lugar adecuado para enriquecer el brief.\n"
            f"Respuesta del usuario (pregunta {question_id}): {answer}\n\n"
            f"Brief actual:\n{brief_content}"
        )

        response = self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Actualiza el brief incorporando la nueva respuesta. Devuelve solo el brief en markdown."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.5,
            max_tokens=2000,
        )
        updated_brief = response.choices[0].message.content.strip()

        self._write_brief(project_id, updated_brief)
        state.brief_iterations += 1
        state.brief_content = updated_brief
        self._save_state(state)

        return {
            "brief_content": updated_brief,
            "iterations": state.brief_iterations,
        }

    # Deletions
    def delete_brief_section(self, project_id: str, section_id: str) -> Dict:
        brief_content = self._read_brief(project_id)
        pattern = rf"(##+\s+{re.escape(section_id)}.*?)(?=\n##+\s|\Z)"
        new_content, removed = re.subn(pattern, "", brief_content, flags=re.IGNORECASE | re.DOTALL)
        if removed == 0:
            return {"brief_content": brief_content, "deleted": False}

        self._write_brief(project_id, new_content.strip())
        state = self._load_state(project_id)
        state.brief_deleted_sections.append(section_id)
        state.brief_content = new_content.strip()
        self._save_state(state)
        return {"brief_content": new_content.strip(), "deleted": True, "section": section_id}

    def delete_brief_block(self, project_id: str, section_id: str, block_text: str) -> Dict:
        brief_content = self._read_brief(project_id)
        pattern = re.escape(block_text.strip())
        new_content, removed = re.subn(pattern, "", brief_content, count=1, flags=re.IGNORECASE)
        if removed == 0:
            return {"brief_content": brief_content, "deleted": False}

        self._write_brief(project_id, new_content.strip())
        state = self._load_state(project_id)
        state.brief_content = new_content.strip()
        self._save_state(state)
        return {"brief_content": new_content.strip(), "deleted": True, "block": block_text}

    # PRD Conversion & deletions
    def convert_brief_to_prd(self, project_id: str, language_code: str = "es") -> Dict:
        brief_content = self._read_brief(project_id)
        if not brief_content.strip():
            raise ValueError("Brief vacío, genere o refine antes de convertir a PRD")

        prompt = (
            "Convierte el siguiente brief en un PRD estructurado. Usa secciones típicas de PRD y sé conciso."
            " Devuelve markdown con encabezados por sección.\n\n" + brief_content
        )

        response = self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Eres un PM senior. Crea un PRD limpio basado en el brief dado."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.5,
            max_tokens=3000,
        )
        prd_content = response.choices[0].message.content.strip()

        self._write_prd(project_id, prd_content)
        state = self._load_state(project_id)
        state.prd_built = True
        state.brief_ready_for_prd = True
        self._save_state(state)

        return {"prd_generated": True, "prd_content": prd_content}

    def delete_prd_section(self, project_id: str, section_key: str) -> Dict:
        prd_content = self._read_prd(project_id)
        pattern = rf"(##+\s+{re.escape(section_key)}.*?)(?=\n##+\s|\Z)"
        new_content, removed = re.subn(pattern, "", prd_content, flags=re.IGNORECASE | re.DOTALL)
        if removed == 0:
            return {"prd_content": prd_content, "deleted": False}

        self._write_prd(project_id, new_content.strip())
        state = self._load_state(project_id)
        state.prd_deleted_sections.append(section_key)
        self._save_state(state)
        return {"prd_content": new_content.strip(), "deleted": True, "section": section_key}

    def delete_prd_block(self, project_id: str, section_key: str, block_text: str) -> Dict:
        prd_content = self._read_prd(project_id)
        pattern = re.escape(block_text.strip())
        new_content, removed = re.subn(pattern, "", prd_content, count=1, flags=re.IGNORECASE)
        if removed == 0:
            return {"prd_content": prd_content, "deleted": False}

        self._write_prd(project_id, new_content.strip())
        state = self._load_state(project_id)
        state.prd_deleted_blocks.append({"section": section_key, "text": block_text})
        self._save_state(state)
        return {"prd_content": new_content.strip(), "deleted": True, "block": block_text}