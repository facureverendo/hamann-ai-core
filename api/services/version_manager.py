"""
Version Manager Service - Handles versioning, comparison, and diff of PRDs
"""

import json
import difflib
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from datetime import datetime
from openai import OpenAI


class VersionManager:
    """Manages PRD versions and comparisons"""
    
    def __init__(self, project_dir: Path, client: OpenAI):
        self.project_dir = project_dir
        self.client = client
        self.versions_dir = project_dir / "versions"
        self.versions_dir.mkdir(exist_ok=True)
    
    def create_version_metadata(
        self, 
        version: int, 
        files_added: List[str], 
        notes: str = "",
        gaps_detected: int = 0,
        questions_generated: int = 0
    ) -> dict:
        """Create metadata for a new version"""
        metadata = {
            "version": version,
            "created_at": datetime.now().isoformat(),
            "files_added": files_added,
            "notes": notes,
            "gaps_detected": gaps_detected,
            "questions_generated": questions_generated,
            "status": "completed"
        }
        
        # Save metadata
        metadata_file = self.versions_dir / f"v{version}_metadata.json"
        with open(metadata_file, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=2, ensure_ascii=False)
        
        return metadata
    
    def get_version_metadata(self, version: int) -> Optional[dict]:
        """Get metadata for a specific version"""
        metadata_file = self.versions_dir / f"v{version}_metadata.json"
        if metadata_file.exists():
            with open(metadata_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        return None
    
    def get_all_versions(self) -> List[dict]:
        """Get all version metadata sorted by version number"""
        versions = []
        for metadata_file in sorted(self.versions_dir.glob("v*_metadata.json")):
            with open(metadata_file, 'r', encoding='utf-8') as f:
                versions.append(json.load(f))
        return sorted(versions, key=lambda v: v['version'], reverse=True)
    
    def get_prd_content(self, version: int) -> Optional[str]:
        """Get PRD content for a specific version"""
        prd_file = self.project_dir / "outputs" / f"prd_v{version}.md"
        if prd_file.exists():
            with open(prd_file, 'r', encoding='utf-8') as f:
                return f.read()
        return None
    
    def compare_prd_versions(self, version1: int, version2: int) -> dict:
        """
        Compare two PRD versions and return structured diff
        """
        prd1 = self.get_prd_content(version1)
        prd2 = self.get_prd_content(version2)
        
        if not prd1 or not prd2:
            return {
                "error": "One or both versions not found",
                "version1_exists": prd1 is not None,
                "version2_exists": prd2 is not None
            }
        
        # Parse PRDs into sections
        sections1 = self._parse_prd_sections(prd1)
        sections2 = self._parse_prd_sections(prd2)
        
        # Find differences
        added_sections = []
        removed_sections = []
        modified_sections = []
        unchanged_sections = []
        
        all_section_keys = set(sections1.keys()) | set(sections2.keys())
        
        for key in all_section_keys:
            if key not in sections1:
                added_sections.append({
                    "section": key,
                    "title": sections2[key]["title"],
                    "content": sections2[key]["content"][:200] + "..." if len(sections2[key]["content"]) > 200 else sections2[key]["content"]
                })
            elif key not in sections2:
                removed_sections.append({
                    "section": key,
                    "title": sections1[key]["title"]
                })
            elif sections1[key]["content"] != sections2[key]["content"]:
                # Calculate similarity
                similarity = self._calculate_similarity(
                    sections1[key]["content"], 
                    sections2[key]["content"]
                )
                
                modified_sections.append({
                    "section": key,
                    "title": sections2[key]["title"],
                    "similarity": similarity,
                    "changes": self._get_text_diff(
                        sections1[key]["content"],
                        sections2[key]["content"]
                    )
                })
            else:
                unchanged_sections.append(key)
        
        # Generate AI summary of changes
        summary = self._generate_change_summary(
            added_sections,
            removed_sections,
            modified_sections
        )
        
        return {
            "version1": version1,
            "version2": version2,
            "summary": summary,
            "sections_added": len(added_sections),
            "sections_removed": len(removed_sections),
            "sections_modified": len(modified_sections),
            "sections_unchanged": len(unchanged_sections),
            "added": added_sections,
            "removed": removed_sections,
            "modified": modified_sections
        }
    
    def _parse_prd_sections(self, prd_content: str) -> Dict[str, dict]:
        """Parse PRD markdown into sections"""
        sections = {}
        current_section = None
        current_title = ""
        current_content = []
        
        lines = prd_content.split('\n')
        
        for line in lines:
            # Detect section headers (## Title)
            if line.startswith('## '):
                # Save previous section
                if current_section:
                    sections[current_section] = {
                        "title": current_title,
                        "content": '\n'.join(current_content).strip()
                    }
                
                # Start new section
                current_title = line[3:].strip()
                current_section = current_title.lower().replace(' ', '_').replace('/', '_')
                current_content = []
            elif current_section:
                current_content.append(line)
        
        # Save last section
        if current_section:
            sections[current_section] = {
                "title": current_title,
                "content": '\n'.join(current_content).strip()
            }
        
        return sections
    
    def _calculate_similarity(self, text1: str, text2: str) -> float:
        """Calculate similarity ratio between two texts"""
        return difflib.SequenceMatcher(None, text1, text2).ratio()
    
    def _get_text_diff(self, text1: str, text2: str) -> List[dict]:
        """Get line-by-line diff between two texts"""
        lines1 = text1.split('\n')
        lines2 = text2.split('\n')
        
        diff = list(difflib.unified_diff(
            lines1, 
            lines2, 
            lineterm='',
            n=1  # Context lines
        ))
        
        # Parse diff into structured format
        changes = []
        for line in diff[2:]:  # Skip header lines
            if line.startswith('+'):
                changes.append({"type": "added", "content": line[1:]})
            elif line.startswith('-'):
                changes.append({"type": "removed", "content": line[1:]})
            elif line.startswith('@@'):
                continue  # Skip line number markers
            else:
                if line.strip():
                    changes.append({"type": "context", "content": line})
        
        return changes[:50]  # Limit to first 50 changes
    
    def _generate_change_summary(
        self, 
        added: List[dict], 
        removed: List[dict], 
        modified: List[dict]
    ) -> str:
        """Generate AI summary of changes between versions"""
        if not added and not removed and not modified:
            return "No hay cambios significativos entre estas versiones."
        
        changes_description = []
        
        if added:
            changes_description.append(f"Secciones agregadas: {', '.join([s['title'] for s in added])}")
        
        if removed:
            changes_description.append(f"Secciones eliminadas: {', '.join([s['title'] for s in removed])}")
        
        if modified:
            changes_description.append(f"Secciones modificadas: {', '.join([s['title'] for s in modified])}")
        
        summary_text = "\n".join(changes_description)
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": "Eres un asistente que resume cambios en documentos PRD. Genera un resumen conciso y profesional de los cambios."
                    },
                    {
                        "role": "user",
                        "content": f"Resume estos cambios en el PRD:\n{summary_text}\n\nGenera un resumen de 2-3 oraciones destacando lo más importante."
                    }
                ],
                temperature=0.3,
                max_tokens=200
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"Error generating AI summary: {e}")
            return summary_text
    
    def compare_gaps(self, version1: int, version2: int) -> dict:
        """Compare gaps between two versions"""
        # Load analysis files
        analysis1_file = self.project_dir / f"analysis_v{version1}.json"
        analysis2_file = self.project_dir / f"analysis_v{version2}.json"
        
        # For version 1, it might be at the root
        if not analysis1_file.exists() and version1 == 1:
            analysis1_file = self.project_dir / "analysis.json"
        
        if not analysis1_file.exists() or not analysis2_file.exists():
            return {
                "error": "Analysis files not found for comparison",
                "v1_exists": analysis1_file.exists(),
                "v2_exists": analysis2_file.exists()
            }
        
        with open(analysis1_file, 'r', encoding='utf-8') as f:
            analysis1 = json.load(f)
        
        with open(analysis2_file, 'r', encoding='utf-8') as f:
            analysis2 = json.load(f)
        
        gaps1_keys = {gap['section_key'] for gap in analysis1.get('gaps', [])}
        gaps2_keys = {gap['section_key'] for gap in analysis2.get('gaps', [])}
        
        return {
            "version1": version1,
            "version2": version2,
            "gaps_v1": len(gaps1_keys),
            "gaps_v2": len(gaps2_keys),
            "new_gaps": list(gaps2_keys - gaps1_keys),
            "resolved_gaps": list(gaps1_keys - gaps2_keys),
            "common_gaps": list(gaps1_keys & gaps2_keys)
        }
