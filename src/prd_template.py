"""
PRD Template Module - Enterprise-Grade PRD Structure
Based on industry best practices from Google, Meta, Atlassian, Amazon PRFAQ.
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


class EnterprisePRDTemplate:
    """
    Enterprise-grade PRD template structure.
    Based on industry best practices: Google, Meta, Atlassian, Amazon PRFAQ.
    Designed for SaaS B2B enterprise products.
    """
    
    SECTIONS = [
        PRDSection(
            key="business_context",
            title="Business Context Brief",
            priority=SectionPriority.CRITICAL,
            description="Strategic context and business rationale",
            guiding_questions=[
                "What is the business opportunity?",
                "Why now? (Market timing, competitive pressure)",
                "What is the expected business impact?",
                "How does this align with company strategy?"
            ]
        ),
        
        PRDSection(
            key="problem_definition",
            title="Problem Definition",
            priority=SectionPriority.CRITICAL,
            description="Detailed problem analysis",
            guiding_questions=[
                "What problem does this solve?",
                "What is the user's main task/job-to-be-done?",
                "What are the current problems/pain points?",
                "How is this solved today and why doesn't it work?",
                "What is the cost of NOT solving this?"
            ]
        ),
        
        PRDSection(
            key="personas_roles",
            title="Personas & Roles",
            priority=SectionPriority.CRITICAL,
            description="Detailed user personas and roles",
            guiding_questions=[
                "Who are the primary users? (roles, responsibilities)",
                "What are their goals and motivations?",
                "What are their pain points and frustrations?",
                "What is their technical proficiency?",
                "What are their success criteria?"
            ]
        ),
        
        PRDSection(
            key="user_insights",
            title="User Insights & Research Links",
            priority=SectionPriority.IMPORTANT,
            description="Research data, user feedback, and insights",
            guiding_questions=[
                "What user research supports this?",
                "What are the key insights from user interviews?",
                "What data/metrics validate the problem?",
                "Are there customer quotes or feedback?"
            ]
        ),
        
        PRDSection(
            key="opportunity_analysis",
            title="Opportunity & Market Analysis",
            priority=SectionPriority.IMPORTANT,
            description="Market opportunity and competitive landscape",
            guiding_questions=[
                "What is the market size/opportunity?",
                "Who are the competitors and how do they solve this?",
                "What is our differentiation?",
                "What are the market trends?"
            ]
        ),
        
        PRDSection(
            key="solution_overview",
            title="Solution Proposal (General Overview)",
            priority=SectionPriority.CRITICAL,
            description="High-level solution description",
            guiding_questions=[
                "What is the proposed solution?",
                "How does it solve the problem?",
                "What is the core value proposition?",
                "What makes this solution unique?"
            ]
        ),
        
        PRDSection(
            key="functional_requirements",
            title="Functional Requirements",
            priority=SectionPriority.CRITICAL,
            description="Detailed functional specifications",
            guiding_questions=[
                "What are the new screens/views?",
                "What are the key behaviors and interactions?",
                "What are the different states (loading, error, success, empty)?",
                "What is the business logic?",
                "What are the visibility rules (permissions, conditions)?",
                "What are the user flows (happy path + alternatives)?",
                "What are the edge cases and exceptions?",
                "What are the exact UI texts, labels, and messages?",
                "What are the validation rules?",
                "What are the data requirements?"
            ]
        ),
        
        PRDSection(
            key="ux_flows",
            title="UX & Flows",
            priority=SectionPriority.CRITICAL,
            description="User experience and interaction flows",
            guiding_questions=[
                "What are the main user journeys?",
                "What are the preconditions for each flow?",
                "What are the postconditions/outcomes?",
                "What are the alternative paths?",
                "What are the error scenarios?",
                "What are the UI/UX patterns to use?",
                "What are the accessibility requirements?"
            ]
        ),
        
        PRDSection(
            key="technical_requirements",
            title="Technical Requirements",
            priority=SectionPriority.CRITICAL,
            description="Technical specifications and constraints",
            guiding_questions=[
                "What feature flags are needed?",
                "What APIs need to be created/modified?",
                "What are the data models?",
                "What are the dependencies (internal/external)?",
                "What are the performance requirements (latency, throughput)?",
                "What are the scalability requirements?",
                "What are the security requirements?",
                "What are the technical limitations/constraints?",
                "What are the integration points?"
            ]
        ),
        
        PRDSection(
            key="acceptance_criteria",
            title="Acceptance Criteria",
            priority=SectionPriority.CRITICAL,
            description="Definition of done (Gherkin format recommended)",
            guiding_questions=[
                "What are the acceptance criteria (Given/When/Then)?",
                "What defines 'done' for each requirement?",
                "What are the test scenarios?",
                "What are the quality gates?",
                "What are the performance benchmarks?"
            ]
        ),
        
        PRDSection(
            key="kpis_metrics",
            title="KPIs & Metrics",
            priority=SectionPriority.CRITICAL,
            description="Success metrics and KPIs",
            guiding_questions=[
                "What are the primary success metrics?",
                "What are the leading indicators?",
                "What are the lagging indicators?",
                "How will we measure adoption?",
                "How will we measure engagement?",
                "How will we measure business impact?",
                "What are the target values/goals?",
                "How will we track these metrics?"
            ]
        ),
        
        PRDSection(
            key="risks_challenges",
            title="Risks & Challenges",
            priority=SectionPriority.IMPORTANT,
            description="Risks, challenges, and mitigation strategies",
            guiding_questions=[
                "What are the technical risks?",
                "What are the business risks?",
                "What are the user adoption risks?",
                "What could go wrong?",
                "What are the mitigation strategies for each risk?",
                "What are the dependencies that could block us?",
                "What are the open questions/unknowns?"
            ]
        ),
        
        PRDSection(
            key="rollout_plan",
            title="Rollout Plan",
            priority=SectionPriority.IMPORTANT,
            description="Launch and rollout strategy",
            guiding_questions=[
                "What is the rollout strategy (PEA/Beta/GA)?",
                "Who are the pilot customers?",
                "What are the key milestones?",
                "What is the timeline?",
                "What are the go/no-go criteria?",
                "What is the communication plan?",
                "What is the training/documentation plan?",
                "What is the support plan?"
            ]
        ),
        
        PRDSection(
            key="out_of_scope",
            title="Out of Scope",
            priority=SectionPriority.IMPORTANT,
            description="Explicitly excluded items",
            guiding_questions=[
                "What is explicitly NOT included in this version?",
                "What will be addressed in future phases?",
                "What alternatives were considered and rejected?",
                "What feature requests are deferred?"
            ]
        ),
        
        PRDSection(
            key="appendix",
            title="Appendix",
            priority=SectionPriority.OPTIONAL,
            description="Supporting materials",
            guiding_questions=[
                "Are there diagrams (flows, architecture, wireframes)?",
                "Are there technical notes?",
                "Are there example payloads/data mocks?",
                "Are there references or links?",
                "Is there a glossary?"
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


# Keep backward compatibility
PRDTemplate = EnterprisePRDTemplate


@dataclass
class PRD:
    """Represents a complete PRD document."""
    product_name: str
    sections: Dict[str, str]  # section_key -> content
    metadata: Dict[str, str]  # Additional metadata
    
    def is_complete(self) -> bool:
        """Check if all critical sections are filled."""
        critical_sections = EnterprisePRDTemplate.get_critical_sections()
        for section in critical_sections:
            content = self.sections.get(section.key, "").strip()
            if not content or content == "[Content to be filled]":
                return False
        return True
    
    def get_missing_sections(self) -> List[PRDSection]:
        """Get list of missing critical sections."""
        missing = []
        critical_sections = EnterprisePRDTemplate.get_critical_sections()
        for section in critical_sections:
            content = self.sections.get(section.key, "").strip()
            if not content or content == "[Content to be filled]":
                missing.append(section)
        return missing
    
    def to_markdown(self) -> str:
        """Convert PRD to markdown format."""
        md = f"# {self.product_name}\n\n"
        md += "_Product Requirements Document - Generated by Hamann Projects AI_\n\n"
        
        # Add metadata
        if self.metadata:
            md += "**Document Information:**\n"
            for key, value in self.metadata.items():
                md += f"- **{key}**: {value}\n"
            md += "\n"
        
        md += "---\n\n"
        
        # Add table of contents
        md += "## Table of Contents\n\n"
        for i, section in enumerate(EnterprisePRDTemplate.SECTIONS, 1):
            if self.sections.get(section.key):
                md += f"{i}. [{section.title}](#{section.key.replace('_', '-')})\n"
        md += "\n---\n\n"
        
        # Add sections
        for i, section in enumerate(EnterprisePRDTemplate.SECTIONS, 1):
            content = self.sections.get(section.key, "")
            if content and content.strip() and content != "[Content to be filled]":
                md += f"## {i}. {section.title}\n\n"
                md += f"{content}\n\n"
                md += "---\n\n"
        
        return md
