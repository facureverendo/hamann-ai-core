"""
Exporter Module - CSV & Markdown Generation
Converts AI-generated backlog to Jira-compatible CSV and executive summary.
"""

import pandas as pd
from typing import List, Dict
from datetime import datetime
from pathlib import Path


def json_to_csv(backlog_items: List[Dict], output_path: str) -> None:
    """
    Convert backlog JSON to Jira-compatible CSV format.
    
    Args:
        backlog_items: List of backlog item dictionaries
        output_path: Path where CSV file will be saved
    """
    # Convert to DataFrame with Jira column names
    df = pd.DataFrame(backlog_items)
    
    # Rename columns to match Jira import format
    df = df.rename(columns={
        'issue_type': 'Issue Type',
        'summary': 'Summary',
        'description': 'Description',
        'priority': 'Priority',
        'story_points': 'Story Points'
    })
    
    # Reorder columns to match standard Jira import
    column_order = ['Issue Type', 'Summary', 'Description', 'Priority', 'Story Points']
    df = df[column_order]
    
    # Export to CSV
    df.to_csv(output_path, index=False, encoding='utf-8')
    
    print(f"📊 CSV exportado: {output_path}")


def generate_executive_summary(backlog_items: List[Dict], output_path: str) -> None:
    """
    Generate executive summary markdown document.
    
    Args:
        backlog_items: List of backlog item dictionaries
        output_path: Path where markdown file will be saved
    """
    # Calculate statistics
    total_items = len(backlog_items)
    total_story_points = sum(item['story_points'] for item in backlog_items)
    
    # Count by issue type
    issue_type_counts = {}
    for item in backlog_items:
        issue_type = item['issue_type']
        issue_type_counts[issue_type] = issue_type_counts.get(issue_type, 0) + 1
    
    # Count by priority
    priority_counts = {}
    for item in backlog_items:
        priority = item['priority']
        priority_counts[priority] = priority_counts.get(priority, 0) + 1
    
    # Separate epics and stories
    epics = [item for item in backlog_items if item['issue_type'] == 'Epic']
    stories = [item for item in backlog_items if item['issue_type'] == 'Story']
    tasks = [item for item in backlog_items if item['issue_type'] == 'Task']
    
    # Build markdown content
    md_content = f"""# 📋 Resumen Ejecutivo del Proyecto

**Fecha de generación:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

---

## 📊 Estadísticas Generales

- **Total de Tickets:** {total_items}
- **Story Points Totales:** {total_story_points}
- **Velocidad Estimada (2 semanas):** ~{total_story_points // 3} puntos/sprint
- **Sprints Estimados:** {(total_story_points // (total_story_points // 3 or 1)) or 1}-{(total_story_points // (total_story_points // 3 or 1)) + 1 or 2} sprints

### Distribución por Tipo

"""
    
    for issue_type, count in sorted(issue_type_counts.items()):
        md_content += f"- **{issue_type}:** {count}\n"
    
    md_content += "\n### Distribución por Prioridad\n\n"
    
    for priority in ['High', 'Medium', 'Low']:
        count = priority_counts.get(priority, 0)
        if count > 0:
            md_content += f"- **{priority}:** {count}\n"
    
    # Epics breakdown
    if epics:
        md_content += "\n---\n\n## 🎯 Epics Identificados\n\n"
        for idx, epic in enumerate(epics, 1):
            md_content += f"### {idx}. {epic['summary']}\n\n"
            md_content += f"**Prioridad:** {epic['priority']} | **Story Points:** {epic['story_points']}\n\n"
            md_content += f"{epic['description']}\n\n"
    
    # High priority stories
    high_priority_stories = [s for s in stories if s['priority'] == 'High']
    if high_priority_stories:
        md_content += "---\n\n## 🔥 User Stories de Alta Prioridad\n\n"
        for story in high_priority_stories[:5]:  # Show top 5
            md_content += f"### {story['summary']}\n\n"
            md_content += f"**Story Points:** {story['story_points']}\n\n"
            md_content += f"{story['description']}\n\n"
    
    # Sprint planning recommendation
    md_content += """---

## 📅 Recomendaciones para Sprint Planning

### Sprint 1 (Prioridad Alta)
Enfocarse en los tickets de prioridad **High** para establecer la base del proyecto.

**Objetivos:**
- Completar los Epics fundamentales
- Implementar las funcionalidades core
- Establecer la arquitectura base

### Sprints Siguientes
Continuar con tickets de prioridad **Medium** y **Low**, refinando funcionalidades y agregando features secundarias.

---

## 📝 Próximos Pasos

1. **Revisar el backlog** generado en el archivo CSV
2. **Importar a Jira/Linear** usando la funcionalidad de importación CSV
3. **Refinar estimaciones** con el equipo de desarrollo
4. **Priorizar** según el roadmap del producto
5. **Planificar el primer sprint** con los tickets de alta prioridad

---

## 📎 Archivos Generados

- `jira_backlog.csv` - Backlog completo listo para importar
- `resumen_proyecto.md` - Este documento

**¡Backlog generado exitosamente! 🎉**
"""
    
    # Write to file
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(md_content)
    
    print(f"📄 Resumen ejecutivo generado: {output_path}")


def export_backlog(backlog_items: List[Dict], output_folder: str) -> tuple:
    """
    Export backlog to both CSV and markdown formats.
    
    Args:
        backlog_items: List of backlog item dictionaries
        output_folder: Folder where files will be saved
        
    Returns:
        Tuple of (csv_path, markdown_path)
    """
    output_dir = Path(output_folder)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate timestamped filenames
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    csv_path = output_dir / f"jira_backlog_{timestamp}.csv"
    md_path = output_dir / f"resumen_proyecto_{timestamp}.md"
    
    # Export both formats
    json_to_csv(backlog_items, str(csv_path))
    generate_executive_summary(backlog_items, str(md_path))
    
    return str(csv_path), str(md_path)
