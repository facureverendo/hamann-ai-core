#!/usr/bin/env python3
"""
Hamann Projects AI - The Engine
Automated Backlog Generation from Unstructured Client Information

Usage:
    1. Place client files (PDFs, audio, text) in the /inputs folder
    2. Run: python main.py
    3. Find generated backlog in /outputs folder
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from openai import OpenAI

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / 'src'))

from ingestor import process_inputs_folder
from brain import generate_backlog
from exporter import export_backlog
from prd_builder import analyze_input, generate_questions, build_prd
from diagram_generator import add_diagrams_to_prd
from language_detector import detect_language


def print_banner():
    """Print welcome banner."""
    banner = """
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║           🚀 HAMANN PROJECTS AI - THE ENGINE 🚀            ║
║                                                           ║
║        Transformando Ideas en Backlogs Estructurados      ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    """
    print(banner)


def check_environment():
    """Check that environment is properly configured."""
    if not os.getenv('OPENAI_API_KEY'):
        print("❌ ERROR: OPENAI_API_KEY no encontrada")
        print("\nPor favor:")
        print("1. Copia el archivo .env.example a .env")
        print("2. Agrega tu API key de OpenAI en el archivo .env")
        print("3. Obtén tu API key en: https://platform.openai.com/api-keys")
        sys.exit(1)
    
    print("✅ Variables de entorno cargadas correctamente")


def interactive_questioning(gaps) -> dict:
    """
    Present questions to user and collect answers interactively.
    
    Args:
        gaps: List of Gap objects with questions
        
    Returns:
        Dictionary mapping section_key to user answer
    """
    answers = {}
    
    print("\n" + "="*60)
    print("🤔 NECESITO MÁS INFORMACIÓN PARA COMPLETAR EL PRD")
    print("="*60)
    print("\nPara crear un PRD completo y profesional, necesito que respondas")
    print("algunas preguntas sobre tu producto/proyecto:\n")
    
    for i, gap in enumerate(gaps, 1):
        print(f"\n{'─'*60}")
        print(f"[{i}/{len(gaps)}] {gap.section_title}")
        if gap.context:
            print(f"💡 Contexto: {gap.context}")
        print(f"\n❓ {gap.question}")
        
        if gap.options:
            # Multiple choice
            print("\nOpciones:")
            for j, option in enumerate(gap.options, 1):
                print(f"  {j}. {option}")
            answer = input("\n👉 Tu respuesta (número o texto libre): ").strip()
            
            # Try to map number to option
            try:
                option_idx = int(answer) - 1
                if 0 <= option_idx < len(gap.options):
                    answer = gap.options[option_idx]
            except ValueError:
                pass  # User provided text, use as-is
        else:
            # Free text
            answer = input("\n👉 Tu respuesta: ").strip()
        
        if answer:
            answers[gap.section_key] = answer
        else:
            print("⚠️  Respuesta vacía, saltando esta pregunta...")
    
    print("\n" + "="*60)
    print(f"✅ Recibidas {len(answers)} respuestas")
    print("="*60 + "\n")
    
    return answers


def main():
    """Main execution flow with PRD generation."""
    print_banner()
    
    # Load environment variables
    load_dotenv()
    check_environment()
    
    # Initialize OpenAI client
    try:
        client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        print("✅ Cliente OpenAI inicializado")
    except Exception as e:
        print(f"❌ Error inicializando cliente OpenAI: {str(e)}")
        sys.exit(1)
    
    # Define paths
    project_root = Path(__file__).parent
    inputs_folder = project_root / 'inputs'
    outputs_folder = project_root / 'outputs'
    
    print(f"\n📂 Carpeta de inputs: {inputs_folder}")
    print(f"📂 Carpeta de outputs: {outputs_folder}\n")
    
    # Step 1: Ingest all input files
    print("="*60)
    print("PASO 1: INGESTA DE ARCHIVOS")
    print("="*60)
    
    try:
        unified_context = process_inputs_folder(str(inputs_folder), client)
        context_length = len(unified_context)
        print(f"✅ Contexto unificado creado ({context_length:,} caracteres)\n")
    except FileNotFoundError as e:
        print(f"❌ {str(e)}")
        print(f"\nAsegúrate de que la carpeta {inputs_folder} existe y contiene archivos.")
        sys.exit(1)
    except ValueError as e:
        print(f"❌ {str(e)}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error inesperado durante la ingesta: {str(e)}")
        sys.exit(1)
    
    # Step 1.5: Detect language
    print("🌍 Detectando idioma del contexto...")
    try:
        lang_info = detect_language(unified_context, client)
        language_code = lang_info["language_code"]
        language_name = lang_info["language_name"]
        print(f"✅ Idioma detectado: {language_name} ({language_code})")
        print(f"   • Confianza: {lang_info['confidence']:.0%}")
        if lang_info.get("reasoning"):
            print(f"   • Razón: {lang_info['reasoning']}")
        print()
    except Exception as e:
        print(f"⚠️  Error detectando idioma: {str(e)}")
        print("   • Usando idioma por defecto: Español (es)\n")
        language_code = "es"
    
    # Step 2: Analyze input and detect gaps
    print("="*60)
    print("PASO 2: ANÁLISIS Y DETECCIÓN DE GAPS")
    print("="*60)
    
    try:
        print("🧠 Analizando el contexto con IA...")
        analysis = analyze_input(unified_context, client, language_code=language_code)
        
        print(f"✅ Análisis completado:")
        print(f"   • Producto: {analysis.product_name}")
        print(f"   • Features explícitas: {len(analysis.explicit_features)}")
        print(f"   • Secciones extraídas: {len(analysis.extracted_info)}")
        print(f"   • Gaps identificados: {len(analysis.gaps)}\n")
        
    except Exception as e:
        print(f"❌ Error analizando input: {str(e)}")
        sys.exit(1)
    
    # Step 3: Generate questions for gaps
    print("="*60)
    print("PASO 3: GENERACIÓN DE PREGUNTAS")
    print("="*60)
    
    try:
        if analysis.gaps:
            print("🤔 Generando preguntas para completar información faltante...")
            questions = generate_questions(analysis, client, max_questions=15, language_code=language_code)
            print(f"✅ Generadas {len(questions)} preguntas\n")
        else:
            print("✅ No se detectaron gaps críticos, el contexto está completo\n")
            questions = []
            
    except Exception as e:
        print(f"❌ Error generando preguntas: {str(e)}")
        sys.exit(1)
    
    # Step 4: Interactive questioning
    user_answers = {}
    if questions:
        print("="*60)
        print("PASO 4: COMPLETADO INTERACTIVO")
        print("="*60)
        
        try:
            user_answers = interactive_questioning(questions)
        except KeyboardInterrupt:
            print("\n\n⚠️  Cuestionario interrumpido. Continuando con información disponible...")
        except Exception as e:
            print(f"❌ Error en cuestionario: {str(e)}")
            print("Continuando con información disponible...")
    
    # Step 5: Build PRD
    print("="*60)
    print(f"PASO {'5' if questions else '4'}: GENERACIÓN DE PRD")
    print("="*60)
    
    try:
        print("📝 Construyendo PRD profesional...")
        prd = build_prd(analysis, user_answers, client, language_code=language_code)
        
        # Add diagrams to appendix
        print("📊 Generando diagramas...")
        diagrams = add_diagrams_to_prd(prd.sections, prd.product_name, client)
        if diagrams:
            prd.sections['appendix'] = diagrams
        
        # Export PRD
        from datetime import datetime
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        prd_filename = f"prd_{timestamp}.md"
        prd_path = outputs_folder / prd_filename
        
        outputs_folder.mkdir(exist_ok=True)
        with open(prd_path, 'w', encoding='utf-8') as f:
            f.write(prd.to_markdown())
        
        print(f"✅ PRD generado: {prd_path}")
        print(f"   • Completitud: {'✅ Completo' if prd.is_complete() else '⚠️  Parcial'}")
        print(f"   • Secciones: {len([s for s in prd.sections.values() if s])}\n")
        
    except Exception as e:
        print(f"❌ Error generando PRD: {str(e)}")
        sys.exit(1)
    
    # Step 6: Generate backlog from PRD
    print("="*60)
    print(f"PASO {'6' if questions else '5'}: GENERACIÓN DE BACKLOG")
    print("="*60)
    
    try:
        # Use PRD content as context for backlog generation (better quality)
        prd_context = prd.to_markdown()
        backlog_items = generate_backlog(prd_context, client)
        print(f"✅ Backlog generado exitosamente\n")
    except Exception as e:
        print(f"❌ Error generando backlog: {str(e)}")
        sys.exit(1)
    
    # Step 7: Export backlog
    print("="*60)
    print(f"PASO {'7' if questions else '6'}: EXPORTACIÓN DE BACKLOG")
    print("="*60)
    
    try:
        csv_path, md_path = export_backlog(backlog_items, str(outputs_folder))
        print(f"✅ Exportación completada\n")
    except Exception as e:
        print(f"❌ Error exportando resultados: {str(e)}")
        sys.exit(1)
    
    # Success summary
    print("="*60)
    print("🎉 ¡PROCESO COMPLETADO EXITOSAMENTE!")
    print("="*60)
    print(f"\n📊 Archivos generados:")
    print(f"   • PRD:        {prd_path}")
    print(f"   • CSV (Jira): {csv_path}")
    print(f"   • Resumen:    {md_path}")
    print(f"\n📈 Estadísticas:")
    print(f"   • Total de tickets: {len(backlog_items)}")
    print(f"   • Story points totales: {sum(item['story_points'] for item in backlog_items)}")
    
    # Count by type
    epics = sum(1 for item in backlog_items if item['issue_type'] == 'Epic')
    stories = sum(1 for item in backlog_items if item['issue_type'] == 'Story')
    tasks = sum(1 for item in backlog_items if item['issue_type'] == 'Task')
    
    print(f"   • Epics: {epics} | Stories: {stories} | Tasks: {tasks}")
    
    print("\n🚀 Próximos pasos:")
    print("   1. Revisa el PRD generado para validar completitud")
    print("   2. Revisa el archivo CSV del backlog")
    print("   3. Importa el CSV a Jira o Linear")
    print("   4. Comparte el PRD con stakeholders")
    print("\n" + "="*60 + "\n")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Proceso interrumpido por el usuario")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Error fatal: {str(e)}")
        sys.exit(1)
