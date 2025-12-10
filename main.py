#!/usr/bin/env python3
"""
Haman Projects AI - The Engine
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


def print_banner():
    """Print welcome banner."""
    banner = """
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║           🚀 HAMAN PROJECTS AI - THE ENGINE 🚀           ║
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


def main():
    """Main execution flow."""
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
    print("=" * 60)
    print("PASO 1: INGESTA DE ARCHIVOS")
    print("=" * 60)
    
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
    
    # Step 2: Generate backlog with AI
    print("=" * 60)
    print("PASO 2: GENERACIÓN DE BACKLOG CON IA")
    print("=" * 60)
    
    try:
        backlog_items = generate_backlog(unified_context, client)
        print(f"✅ Backlog generado exitosamente\n")
    except Exception as e:
        print(f"❌ Error generando backlog: {str(e)}")
        sys.exit(1)
    
    # Step 3: Export to CSV and Markdown
    print("=" * 60)
    print("PASO 3: EXPORTACIÓN DE RESULTADOS")
    print("=" * 60)
    
    try:
        csv_path, md_path = export_backlog(backlog_items, str(outputs_folder))
        print(f"✅ Exportación completada\n")
    except Exception as e:
        print(f"❌ Error exportando resultados: {str(e)}")
        sys.exit(1)
    
    # Success summary
    print("=" * 60)
    print("🎉 ¡PROCESO COMPLETADO EXITOSAMENTE!")
    print("=" * 60)
    print(f"\n📊 Archivos generados:")
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
    print("   1. Revisa el archivo CSV generado")
    print("   2. Importa el CSV a Jira o Linear")
    print("   3. Lee el resumen ejecutivo para insights del proyecto")
    print("\n" + "=" * 60 + "\n")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Proceso interrumpido por el usuario")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Error fatal: {str(e)}")
        sys.exit(1)
