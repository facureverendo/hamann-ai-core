"""
PRD Template Module - Standard PRD Structure
Defines the professional PRD template and required sections.
"""

from typing import Dict, List, Optional
from dataclasses import dataclass
from enum import Enum


class SectionPriority(Enum):
    """Priority levels for PRD sections."""
    CRITICAL = "critical"  # Must be filled
    IMPORTANT = "important"  # Should be filled
    OPTIONAL = "optional"  # Nice to have


@dataclass
class PRDSection:
    """Represents a section in the PRD template."""
    key: str
    title: str
    priority: SectionPriority
    description: str
    guiding_questions: List[str]
    example: Optional[str] = None


class PRDTemplate:
    """
    Standard PRD template structure.
    Based on industry best practices for product requirements documents.
    """
    
    SECTIONS = [
        PRDSection(
            key="executive_summary",
            title="Executive Summary",
            priority=SectionPriority.CRITICAL,
            description="High-level overview of the product/feature",
            guiding_questions=[
                "What is being built? (one sentence)",
                "Why is it important? (business objective)",
                "Who is it for? (target users)",
                "When is it needed? (timeline/urgency)"
            ],
            example="Building a mobile app for dog walking services to connect pet owners with professional dog walkers, targeting urban pet owners who need flexible walking services."
        ),
        
        PRDSection(
            key="problem_statement",
            title="Problem Statement",
            priority=SectionPriority.CRITICAL,
            description="Clear articulation of the problem being solved",
            guiding_questions=[
                "What is the current situation?",
                "What are the main pain points?",
                "What is the impact/cost of not solving this?",
                "Who experiences this problem?"
            ]
        ),
        
        PRDSection(
            key="goals_metrics",
            title="Goals & Success Metrics",
            priority=SectionPriority.CRITICAL,
            description="Measurable objectives and KPIs",
            guiding_questions=[
                "What are the primary goals?",
                "How will success be measured?",
                "What are the key metrics (KPIs)?",
                "What defines 'done'?"
            ]
        ),
        
        PRDSection(
            key="user_personas",
            title="User Personas & Use Cases",
            priority=SectionPriority.IMPORTANT,
            description="Target users and their scenarios",
            guiding_questions=[
                "Who are the primary users?",
                "What are their main use cases?",
                "What are their goals and motivations?",
                "What are their pain points?"
            ]
        ),
        
        PRDSection(
            key="functional_requirements",
            title="Functional Requirements",
            priority=SectionPriority.CRITICAL,
            description="Core features and capabilities",
            guiding_questions=[
                "What MUST the product do? (core features)",
                "What SHOULD it do? (important but not critical)",
                "What COULD it do? (nice to have)",
                "What are the key user workflows?"
            ]
        ),
        
        PRDSection(
            key="user_experience",
            title="User Experience & Flows",
            priority=SectionPriority.IMPORTANT,
            description="User journey and interaction design",
            guiding_questions=[
                "What is the main user journey?",
                "What are the key user flows?",
                "What are the UI/UX considerations?",
                "Are there any specific design requirements?"
            ]
        ),
        
        PRDSection(
            key="technical_requirements",
            title="Technical Requirements",
            priority=SectionPriority.IMPORTANT,
            description="Technical constraints and specifications",
            guiding_questions=[
                "What platforms/technologies are required?",
                "Are there integration requirements?",
                "What are the performance requirements?",
                "Are there security/compliance needs?"
            ]
        ),
        
        PRDSection(
            key="acceptance_criteria",
            title="Acceptance Criteria",
            priority=SectionPriority.CRITICAL,
            description="Definition of done and quality standards",
            guiding_questions=[
                "What defines 'done' for this product?",
                "What are the testing requirements?",
                "What are the quality standards?",
                "What are the launch criteria?"
            ]
        ),
        
        PRDSection(
            key="assumptions_dependencies",
            title="Assumptions & Dependencies",
            priority=SectionPriority.IMPORTANT,
            description="Assumptions made and external dependencies",
            guiding_questions=[
                "What assumptions are being made?",
                "What are the external dependencies?",
                "What are the risks?",
                "What could block progress?"
            ]
        ),
        
        PRDSection(
            key="out_of_scope",
            title="Out of Scope",
            priority=SectionPriority.OPTIONAL,
            description="What is explicitly NOT included",
            guiding_questions=[
                "What is explicitly NOT included in this version?",
                "What will be addressed in future phases?",
                "What alternatives were considered and rejected?"
            ]
        ),
        
        PRDSection(
            key="appendix",
            title="Appendix",
            priority=SectionPriority.OPTIONAL,
            description="Supporting materials and references",
            guiding_questions=[
                "Are there diagrams to include?",
                "Are there references or research?",
                "Is there a glossary needed?"
            ]
        )
    ]
    
    @classmethod
    def get_section(cls, key: str) -> Optional[PRDSection]:
        """Get a section by its key."""
        for section in cls.SECTIONS:
            if section.key == key:
                return section
        return None
    
    @classmethod
    def get_critical_sections(cls) -> List[PRDSection]:
        """Get all critical sections."""
        return [s for s in cls.SECTIONS if s.priority == SectionPriority.CRITICAL]
    
    @classmethod
    def get_important_sections(cls) -> List[PRDSection]:
        """Get all important sections."""
        return [s for s in cls.SECTIONS if s.priority == SectionPriority.IMPORTANT]
    
    @classmethod
    def get_all_questions(cls) -> Dict[str, List[str]]:
        """Get all guiding questions organized by section."""
        return {
            section.key: section.guiding_questions 
            for section in cls.SECTIONS
        }
    
    @classmethod
    def generate_markdown_template(cls) -> str:
        """Generate an empty PRD template in markdown format."""
        template = "# [Product/Feature Name]\n\n"
        template += "_Generated by Hamann Projects AI_\n\n"
        template += "---\n\n"
        
        for i, section in enumerate(cls.SECTIONS, 1):
            template += f"## {i}. {section.title}\n\n"
            template += f"_{section.description}_\n\n"
            
            # Add guiding questions as comments
            template += "<!-- Guiding questions:\n"
            for question in section.guiding_questions:
                template += f"- {question}\n"
            template += "-->\n\n"
            
            template += "[Content to be filled]\n\n"
            template += "---\n\n"
        
        return template


@dataclass
class PRD:
    """Represents a complete PRD document."""
    product_name: str
    sections: Dict[str, str]  # section_key -> content
    metadata: Dict[str, str]  # Additional metadata
    
    def is_complete(self) -> bool:
        """Check if all critical sections are filled."""
        critical_sections = PRDTemplate.get_critical_sections()
        for section in critical_sections:
            content = self.sections.get(section.key, "").strip()
            if not content or content == "[Content to be filled]":
                return False
        return True
    
    def get_missing_sections(self) -> List[PRDSection]:
        """Get list of missing critical sections."""
        missing = []
        critical_sections = PRDTemplate.get_critical_sections()
        for section in critical_sections:
            content = self.sections.get(section.key, "").strip()
            if not content or content == "[Content to be filled]":
                missing.append(section)
        return missing
    
    def to_markdown(self) -> str:
        """Convert PRD to markdown format."""
        md = f"# {self.product_name}\n\n"
        md += "_Generated by Hamann Projects AI_\n\n"
        
        # Add metadata
        if self.metadata:
            md += "**Document Information:**\n"
            for key, value in self.metadata.items():
                md += f"- **{key}**: {value}\n"
            md += "\n"
        
        md += "---\n\n"
        
        # Add sections
        for i, section in enumerate(PRDTemplate.SECTIONS, 1):
            content = self.sections.get(section.key, "")
            if content and content.strip() and content != "[Content to be filled]":
                md += f"## {i}. {section.title}\n\n"
                md += f"{content}\n\n"
                md += "---\n\n"
        
        return md
