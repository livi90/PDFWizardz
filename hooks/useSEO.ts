import { useEffect } from 'react';
import { ViewType, Language } from '../types';

interface SEOMetadata {
  title: string;
  description: string;
  keywords?: string;
}

const seoMetadata: Record<ViewType, Record<Language, SEOMetadata>> = {
  HOME: {
    ES: {
      title: 'PDF Wizardz - Organizador PDF con IA y Privacidad 100% Local',
      description: 'Organiza, renombra y procesa PDFs con IA sin subir archivos a internet. Procesamiento 100% en tu navegador. Privacidad garantizada RGPD. Alternativa segura a otros editores de PDF.',
      keywords: 'organizar PDF, renombrar PDF automático, IA PDF privada, procesar PDF local, alternativa iLovePDF segura'
    },
    EN: {
      title: 'PDF Wizardz - AI PDF Organizer with 100% Local Privacy',
      description: 'Organize, rename and process PDFs with AI without uploading files to the internet. 100% browser processing. GDPR privacy guaranteed. Secure alternative to iLovePDF.',
      keywords: 'organize PDF, rename PDF automatic, private AI PDF, local PDF processing, secure iLovePDF alternative'
    },
    DE: {
      title: 'PDF Wizardz - PDF-Organisator mit KI und 100% lokaler Privatsphäre',
      description: 'Organisieren, umbenennen und verarbeiten Sie PDFs mit KI, ohne Dateien ins Internet hochzuladen. 100% Browser-Verarbeitung. DSGVO-Datenschutz garantiert.',
      keywords: 'PDF organisieren, PDF automatisch umbenennen, private KI PDF, lokale PDF-Verarbeitung'
    },
    FR: {
      title: 'PDF Wizardz - Organisateur PDF avec IA et Confidentialité 100% Locale',
      description: 'Organisez, renommez et traitez les PDFs avec IA sans télécharger de fichiers sur Internet. Traitement 100% dans le navigateur. Confidentialité RGPD garantie.',
      keywords: 'organiser PDF, renommer PDF automatique, IA PDF privée, traitement PDF local'
    }
  },
  AI_ORGANIZER: {
    ES: {
      title: 'Renombrar 100 PDFs Automáticamente por Contenido con IA - PDF Wizardz',
      description: 'Renombra masivamente archivos PDF usando IA. Extrae fecha, entidad y categoría automáticamente. Organiza carpetas desordenadas sin subir archivos a internet. Procesamiento 100% local y privado.',
      keywords: 'renombrar PDF masivo, organizar PDF automático, renombrar 100 PDFs, IA para organizar PDF, extraer datos PDF automático'
    },
    EN: {
      title: 'Rename 100 PDFs Automatically by Content with AI - PDF Wizardz',
      description: 'Mass rename PDF files using AI. Automatically extract date, entity and category. Organize messy folders without uploading files to the internet. 100% local and private processing.',
      keywords: 'mass rename PDF, organize PDF automatic, rename 100 PDFs, AI organize PDF, extract PDF data automatic'
    },
    DE: {
      title: '100 PDFs automatisch nach Inhalt mit KI umbenennen - PDF Wizardz',
      description: 'Benennen Sie PDF-Dateien massenhaft mit KI um. Extrahieren Sie automatisch Datum, Entität und Kategorie. Organisieren Sie unordentliche Ordner ohne Dateien ins Internet hochzuladen.',
      keywords: 'PDF massenhaft umbenennen, PDF automatisch organisieren, 100 PDFs umbenennen'
    },
    FR: {
      title: 'Renommer 100 PDFs Automatiquement par Contenu avec IA - PDF Wizardz',
      description: 'Renommez en masse des fichiers PDF avec IA. Extrayez automatiquement la date, l\'entité et la catégorie. Organisez des dossiers désordonnés sans télécharger de fichiers sur Internet.',
      keywords: 'renommer PDF en masse, organiser PDF automatique, renommer 100 PDFs'
    }
  },
  EXCEL_TEMPLATE: {
    ES: {
      title: 'Rellenar Plantillas Excel desde PDF con IA - Extraer Datos de Facturas',
      description: 'Extrae datos de facturas PDF y rellena plantillas Excel automáticamente. Procesa múltiples facturas a la vez. Pasa datos de PDF a Excel sin subir archivos. Privacidad 100% local.',
      keywords: 'rellenar plantilla Excel PDF, extraer datos factura Excel, pasar PDF a Excel automático, plantilla Excel facturas, datos PDF a Excel'
    },
    EN: {
      title: 'Fill Excel Templates from PDF with AI - Extract Invoice Data',
      description: 'Extract data from invoice PDFs and automatically fill Excel templates. Process multiple invoices at once. Transfer PDF data to Excel without uploading files. 100% local privacy.',
      keywords: 'fill Excel template PDF, extract invoice data Excel, PDF to Excel automatic, Excel template invoices, PDF data to Excel'
    },
    DE: {
      title: 'Excel-Vorlagen aus PDF mit KI ausfüllen - Rechnungsdaten extrahieren',
      description: 'Extrahieren Sie Daten aus Rechnungs-PDFs und füllen Sie Excel-Vorlagen automatisch aus. Verarbeiten Sie mehrere Rechnungen gleichzeitig. 100% lokale Privatsphäre.',
      keywords: 'Excel-Vorlage PDF ausfüllen, Rechnungsdaten Excel extrahieren, PDF zu Excel automatisch'
    },
    FR: {
      title: 'Remplir Modèles Excel depuis PDF avec IA - Extraire Données de Factures',
      description: 'Extrayez les données des factures PDF et remplissez automatiquement les modèles Excel. Traitez plusieurs factures à la fois. Confidentialité 100% locale.',
      keywords: 'remplir modèle Excel PDF, extraire données facture Excel, PDF vers Excel automatique'
    }
  },
  STUDY: {
    ES: {
      title: 'Generar Exámenes y Flashcards desde PDF Gratis - PDF Wizardz',
      description: 'Crea tests tipo examen y flashcards automáticamente desde tus PDFs. Genera preguntas de opción múltiple y tarjetas de estudio con IA. Perfecto para estudiantes y opositores. 100% gratis y privado.',
      keywords: 'crear test PDF, generar quiz PDF, flashcards PDF automático, preguntas examen PDF, estudiar PDF con IA, resumir PDF a preguntas'
    },
    EN: {
      title: 'Generate Exams and Flashcards from PDF Free - PDF Wizardz',
      description: 'Create exam-style tests and flashcards automatically from your PDFs. Generate multiple choice questions and study cards with AI. Perfect for students and exam takers. 100% free and private.',
      keywords: 'create test PDF, generate quiz PDF, flashcards PDF automatic, exam questions PDF, study PDF with AI'
    },
    DE: {
      title: 'Prüfungen und Karteikarten aus PDF generieren - PDF Wizardz',
      description: 'Erstellen Sie automatisch Prüfungstests und Karteikarten aus Ihren PDFs. Generieren Sie Multiple-Choice-Fragen mit KI. Perfekt für Studenten.',
      keywords: 'Test PDF erstellen, Quiz PDF generieren, Karteikarten PDF automatisch'
    },
    FR: {
      title: 'Générer Examens et Cartes Mémoire depuis PDF Gratuit - PDF Wizardz',
      description: 'Créez automatiquement des tests de type examen et des cartes mémoire à partir de vos PDFs. Générez des questions à choix multiples avec IA. 100% gratuit et privé.',
      keywords: 'créer test PDF, générer quiz PDF, cartes mémoire PDF automatique'
    }
  },
  MERGE: {
    ES: {
      title: 'Unir PDFs sin Subir Archivos - Procesamiento 100% Local',
      description: 'Fusiona múltiples PDFs en uno solo. Procesamiento completamente en tu navegador. Tus archivos nunca salen de tu PC. Alternativa segura y privada.',
      keywords: 'unir PDF, fusionar PDF, combinar PDF, unir PDF sin internet, PDF local'
    },
    EN: {
      title: 'Merge PDFs Without Uploading Files - 100% Local Processing',
      description: 'Merge multiple PDFs into one. Processing completely in your browser. Your files never leave your PC. Secure and private alternative.',
      keywords: 'merge PDF, combine PDF, join PDF, merge PDF no upload, local PDF'
    },
    DE: {
      title: 'PDFs zusammenführen ohne Dateien hochzuladen - 100% lokale Verarbeitung',
      description: 'Führen Sie mehrere PDFs zu einem zusammen. Verarbeitung vollständig in Ihrem Browser. Ihre Dateien verlassen nie Ihren PC.',
      keywords: 'PDFs zusammenführen, PDFs kombinieren, PDFs lokal'
    },
    FR: {
      title: 'Fusionner PDFs sans Télécharger de Fichiers - Traitement 100% Local',
      description: 'Fusionnez plusieurs PDFs en un seul. Traitement complètement dans votre navigateur. Vos fichiers ne quittent jamais votre PC.',
      keywords: 'fusionner PDF, combiner PDF, PDF local'
    }
  },
  SPLIT: {
    ES: {
      title: 'Dividir PDF y Extraer Páginas - Sin Subir Archivos',
      description: 'Separa PDFs en páginas individuales o extrae rangos específicos. Todo el procesamiento en tu navegador. Privacidad garantizada.',
      keywords: 'dividir PDF, extraer páginas PDF, separar PDF, dividir PDF local'
    },
    EN: {
      title: 'Split PDF and Extract Pages - Without Uploading Files',
      description: 'Split PDFs into individual pages or extract specific ranges. All processing in your browser. Privacy guaranteed.',
      keywords: 'split PDF, extract PDF pages, separate PDF, split PDF local'
    },
    DE: {
      title: 'PDF teilen und Seiten extrahieren - Ohne Dateien hochzuladen',
      description: 'Teilen Sie PDFs in einzelne Seiten oder extrahieren Sie bestimmte Bereiche. Alle Verarbeitung in Ihrem Browser.',
      keywords: 'PDF teilen, PDF-Seiten extrahieren, PDF lokal teilen'
    },
    FR: {
      title: 'Diviser PDF et Extraire Pages - Sans Télécharger de Fichiers',
      description: 'Divisez les PDFs en pages individuelles ou extrayez des plages spécifiques. Tout le traitement dans votre navigateur.',
      keywords: 'diviser PDF, extraire pages PDF, PDF local'
    }
  },
  EDIT: {
    ES: {
      title: 'Editar PDF: Agregar Marca de Agua y Numeración - 100% Local',
      description: 'Agrega marcas de agua, numeración de páginas y overlays de imagen a tus PDFs. Procesamiento completamente local. Sin subir archivos.',
      keywords: 'marca de agua PDF, numerar páginas PDF, editar PDF local, agregar logo PDF'
    },
    EN: {
      title: 'Edit PDF: Add Watermark and Page Numbers - 100% Local',
      description: 'Add watermarks, page numbering and image overlays to your PDFs. Completely local processing. No file uploads.',
      keywords: 'PDF watermark, number PDF pages, edit PDF local, add logo PDF'
    },
    DE: {
      title: 'PDF bearbeiten: Wasserzeichen und Seitennummerierung - 100% lokal',
      description: 'Fügen Sie Wasserzeichen, Seitennummerierung und Bild-Overlays zu Ihren PDFs hinzu. Vollständig lokale Verarbeitung.',
      keywords: 'PDF Wasserzeichen, PDF Seiten nummerieren, PDF lokal bearbeiten'
    },
    FR: {
      title: 'Modifier PDF: Ajouter Filigrane et Numérotation - 100% Local',
      description: 'Ajoutez des filigranes, la numérotation des pages et des superpositions d\'images à vos PDFs. Traitement complètement local.',
      keywords: 'filigrane PDF, numéroter pages PDF, modifier PDF local'
    }
  },
  CONVERT: {
    ES: {
      title: 'Convertir PDF a Word, Excel, PowerPoint e Imágenes - Sin Subir',
      description: 'Convierte PDFs a Word, Excel, PowerPoint, imágenes JPG o texto. Todo el procesamiento en tu navegador. Privacidad 100% garantizada.',
      keywords: 'convertir PDF Word, PDF a Excel, PDF a PowerPoint, PDF a imagen, convertir PDF local'
    },
    EN: {
      title: 'Convert PDF to Word, Excel, PowerPoint and Images - No Upload',
      description: 'Convert PDFs to Word, Excel, PowerPoint, JPG images or text. All processing in your browser. 100% privacy guaranteed.',
      keywords: 'convert PDF Word, PDF to Excel, PDF to PowerPoint, PDF to image, convert PDF local'
    },
    DE: {
      title: 'PDF in Word, Excel, PowerPoint und Bilder konvertieren - Kein Upload',
      description: 'Konvertieren Sie PDFs in Word, Excel, PowerPoint, JPG-Bilder oder Text. Alle Verarbeitung in Ihrem Browser.',
      keywords: 'PDF Word konvertieren, PDF zu Excel, PDF zu PowerPoint, PDF lokal konvertieren'
    },
    FR: {
      title: 'Convertir PDF en Word, Excel, PowerPoint et Images - Sans Upload',
      description: 'Convertissez les PDFs en Word, Excel, PowerPoint, images JPG ou texte. Tout le traitement dans votre navigateur.',
      keywords: 'convertir PDF Word, PDF vers Excel, PDF vers PowerPoint, convertir PDF local'
    }
  },
  IMG_TO_PDF: {
    ES: {
      title: 'Convertir Imágenes a PDF - Sin Subir Archivos',
      description: 'Convierte múltiples imágenes JPG/PNG a un solo PDF. Ajuste automático a A4. Procesamiento 100% en tu navegador.',
      keywords: 'imágenes a PDF, JPG a PDF, PNG a PDF, convertir imágenes PDF local'
    },
    EN: {
      title: 'Convert Images to PDF - Without Uploading Files',
      description: 'Convert multiple JPG/PNG images to a single PDF. Automatic A4 fit. 100% processing in your browser.',
      keywords: 'images to PDF, JPG to PDF, PNG to PDF, convert images PDF local'
    },
    DE: {
      title: 'Bilder in PDF konvertieren - Ohne Dateien hochzuladen',
      description: 'Konvertieren Sie mehrere JPG/PNG-Bilder in ein einzelnes PDF. Automatische A4-Anpassung.',
      keywords: 'Bilder zu PDF, JPG zu PDF, PNG zu PDF, Bilder PDF lokal'
    },
    FR: {
      title: 'Convertir Images en PDF - Sans Télécharger de Fichiers',
      description: 'Convertissez plusieurs images JPG/PNG en un seul PDF. Ajustement automatique A4.',
      keywords: 'images vers PDF, JPG vers PDF, PNG vers PDF, images PDF local'
    }
  },
  ORACLE: {
    ES: {
      title: 'Generador de Mapas Mentales desde PDF - Oráculo Visual',
      description: 'Crea mapas mentales interactivos automáticamente desde PDFs. La IA extrae conceptos clave y sus relaciones, generando un grafo visual navegable. Perfecto para estudiar y visualizar conocimiento complejo.',
      keywords: 'mapa mental PDF, generar mapa mental, visualizar conocimiento, grafo de conceptos, estudiar con mapas mentales'
    },
    EN: {
      title: 'Mind Map Generator from PDF - Visual Oracle',
      description: 'Create interactive mind maps automatically from PDFs. AI extracts key concepts and their relationships, generating a navigable visual graph. Perfect for studying and visualizing complex knowledge.',
      keywords: 'mind map PDF, generate mind map, visualize knowledge, concept graph, study with mind maps'
    },
    DE: {
      title: 'Mindmap-Generator aus PDF - Visuelles Orakel',
      description: 'Erstellen Sie automatisch interaktive Mindmaps aus PDFs. KI extrahiert Schlüsselkonzepte und ihre Beziehungen und erstellt einen navigierbaren visuellen Graphen.',
      keywords: 'Mindmap PDF, Mindmap generieren, Wissen visualisieren, Konzeptgraph'
    },
    FR: {
      title: 'Générateur de Cartes Mentales depuis PDF - Oracle Visuel',
      description: 'Créez automatiquement des cartes mentales interactives à partir de PDFs. L\'IA extrait les concepts clés et leurs relations, créant un graphe visuel navigable.',
      keywords: 'carte mentale PDF, générer carte mentale, visualiser connaissances, graphe de concepts'
    }
  },
  CHAT: {
    ES: {
      title: 'Interrogador de PDFs con IA - Haz Preguntas sobre Documentos',
      description: 'Invoca al espíritu del documento. Haz preguntas sobre el contenido del PDF y obtén respuestas precisas basadas en el texto completo. Límite: 3 preguntas por documento (gratis). Procesamiento 100% local.',
      keywords: 'preguntar PDF, chat PDF, interrogador PDF, hacer preguntas PDF, IA conversacional PDF, preguntas sobre documentos'
    },
    EN: {
      title: 'PDF Interrogator with AI - Ask Questions about Documents',
      description: 'Invoke the document spirit. Ask questions about PDF content and get precise answers based on the full text. Limit: 3 questions per document (free). 100% local processing.',
      keywords: 'ask PDF, chat PDF, PDF interrogator, ask questions PDF, conversational AI PDF, questions about documents'
    },
    DE: {
      title: 'PDF-Befrager mit KI - Stellen Sie Fragen zu Dokumenten',
      description: 'Beschwören Sie den Geist des Dokuments. Stellen Sie Fragen zum PDF-Inhalt und erhalten Sie präzise Antworten basierend auf dem vollständigen Text. Limit: 3 Fragen pro Dokument (kostenlos).',
      keywords: 'PDF fragen, PDF Chat, PDF Befrager, Fragen PDF stellen, konversationelle KI PDF'
    },
    FR: {
      title: 'Interrogateur de PDF avec IA - Posez des Questions sur les Documents',
      description: 'Invoquez l\'esprit du document. Posez des questions sur le contenu du PDF et obtenez des réponses précises basées sur le texte complet. Limite: 3 questions par document (gratuit).',
      keywords: 'demander PDF, chat PDF, interrogateur PDF, poser questions PDF, IA conversationnelle PDF'
    }
  },
  PRICING: {
    ES: {
      title: 'Planes y Precios - PDF Wizardz Premium',
      description: 'Elige tu plan: Gratis o Premium. Desbloquea funciones avanzadas como plantillas Excel, chat ilimitado y procesamiento de PDFs grandes. Activa tu licencia con Gumroad.',
      keywords: 'precios PDF wizardz, plan premium PDF, suscripción PDF, activar licencia PDF, PDF wizardz premium'
    },
    EN: {
      title: 'Plans and Pricing - PDF Wizardz Premium',
      description: 'Choose your plan: Free or Premium. Unlock advanced features like Excel templates, unlimited chat, and large PDF processing. Activate your license with Gumroad.',
      keywords: 'PDF wizardz pricing, PDF premium plan, PDF subscription, activate PDF license, PDF wizardz premium'
    },
    DE: {
      title: 'Pläne und Preise - PDF Wizardz Premium',
      description: 'Wählen Sie Ihren Plan: Kostenlos oder Premium. Schalten Sie erweiterte Funktionen wie Excel-Vorlagen, unbegrenzten Chat und große PDF-Verarbeitung frei.',
      keywords: 'PDF wizardz Preise, PDF Premium Plan, PDF Abonnement, PDF Lizenz aktivieren'
    },
    FR: {
      title: 'Plans et Tarifs - PDF Wizardz Premium',
      description: 'Choisissez votre plan: Gratuit ou Premium. Débloquez des fonctionnalités avancées comme les modèles Excel, le chat illimité et le traitement de PDFs volumineux.',
      keywords: 'tarifs PDF wizardz, plan premium PDF, abonnement PDF, activer licence PDF'
    }
  },
  LANDING_FACTURAS_EXCEL: {
    ES: {
      title: 'Cómo Pasar Facturas a Excel con IA Gratis - Extraer Datos Automáticamente',
      description: 'Pasa facturas PDF a Excel automáticamente con IA. Extrae datos de facturas (fecha, total, IVA, proveedor) y rellena plantillas Excel sin escribir. Procesa múltiples facturas a la vez. 100% gratis y privado. Sin subir archivos.',
      keywords: 'pasar facturas a excel, extraer datos factura pdf excel, factura pdf a excel automático, rellenar excel desde factura pdf, convertir factura pdf excel gratis, extraer datos factura con ia'
    },
    EN: {
      title: 'How to Convert Invoices to Excel with Free AI - Extract Data Automatically',
      description: 'Convert invoice PDFs to Excel automatically with AI. Extract invoice data (date, total, VAT, supplier) and fill Excel templates without typing. Process multiple invoices at once. 100% free and private. No file uploads.',
      keywords: 'convert invoices to excel, extract invoice data pdf excel, invoice pdf to excel automatic, fill excel from invoice pdf, convert invoice pdf excel free, extract invoice data with ai'
    },
    DE: {
      title: 'Rechnungen zu Excel mit kostenloser KI konvertieren - Daten automatisch extrahieren',
      description: 'Konvertieren Sie Rechnungs-PDFs automatisch mit KI zu Excel. Extrahieren Sie Rechnungsdaten (Datum, Gesamtbetrag, MwSt, Lieferant) und füllen Sie Excel-Vorlagen ohne Tippen aus. Verarbeiten Sie mehrere Rechnungen gleichzeitig. 100% kostenlos und privat.',
      keywords: 'Rechnungen zu Excel, Rechnungsdaten PDF Excel extrahieren, Rechnung PDF zu Excel automatisch, Excel aus Rechnung PDF füllen'
    },
    FR: {
      title: 'Comment Convertir Factures en Excel avec IA Gratuite - Extraire Données Automatiquement',
      description: 'Convertissez les factures PDF en Excel automatiquement avec IA. Extrayez les données de factures (date, total, TVA, fournisseur) et remplissez les modèles Excel sans taper. Traitez plusieurs factures à la fois. 100% gratuit et privé.',
      keywords: 'convertir factures excel, extraire données facture pdf excel, facture pdf excel automatique, remplir excel depuis facture pdf'
    }
  },
  LANDING_GENERADOR_TEST: {
    ES: {
      title: 'Generador de Preguntas Tipo Test desde PDF Gratis - Crear Exámenes con IA',
      description: 'Genera preguntas tipo test automáticamente desde PDFs. Crea exámenes de opción múltiple, flashcards y quizzes desde tus apuntes. Perfecto para estudiantes, opositores y profesores. 100% gratis. Procesamiento local sin subir archivos.',
      keywords: 'generar preguntas test pdf, crear examen desde pdf, preguntas tipo test pdf, generador test pdf gratis, hacer examen desde pdf, crear quiz pdf automático, preguntas opción múltiple pdf'
    },
    EN: {
      title: 'Test Question Generator from PDF Free - Create Exams with AI',
      description: 'Generate test questions automatically from PDFs. Create multiple choice exams, flashcards and quizzes from your notes. Perfect for students, exam takers and teachers. 100% free. Local processing without uploading files.',
      keywords: 'generate test questions pdf, create exam from pdf, test questions pdf, test generator pdf free, make exam from pdf, create quiz pdf automatic, multiple choice questions pdf'
    },
    DE: {
      title: 'Testfragen-Generator aus PDF kostenlos - Prüfungen mit KI erstellen',
      description: 'Generieren Sie automatisch Testfragen aus PDFs. Erstellen Sie Multiple-Choice-Prüfungen, Karteikarten und Quizze aus Ihren Notizen. Perfekt für Studenten und Lehrer. 100% kostenlos. Lokale Verarbeitung.',
      keywords: 'Testfragen PDF generieren, Prüfung aus PDF erstellen, Testfragen PDF, Test Generator PDF kostenlos'
    },
    FR: {
      title: 'Générateur de Questions Type Test depuis PDF Gratuit - Créer Examens avec IA',
      description: 'Générez automatiquement des questions de test à partir de PDFs. Créez des examens à choix multiples, des cartes mémoire et des quiz à partir de vos notes. Parfait pour les étudiants et les enseignants. 100% gratuit.',
      keywords: 'générer questions test pdf, créer examen depuis pdf, questions type test pdf, générateur test pdf gratuit'
    }
  },
  LANDING_MODELO_TRIBUTARIO: {
    ES: {
      title: 'Rellenar Modelo Tributario desde PDF Automáticamente - Extraer Datos Fiscales con IA',
      description: 'Rellena modelos tributarios y declaraciones fiscales automáticamente desde PDFs. Extrae datos fiscales (NIF, importes, fechas) y completa formularios Hacienda sin escribir. Procesamiento 100% local y privado. Sin subir documentos sensibles.',
      keywords: 'rellenar modelo tributario pdf, extraer datos fiscales pdf, completar declaración fiscal pdf, rellenar formulario hacienda pdf, extraer datos tributarios pdf, automatizar modelo tributario'
    },
    EN: {
      title: 'Fill Tax Model from PDF Automatically - Extract Tax Data with AI',
      description: 'Fill tax models and tax returns automatically from PDFs. Extract tax data (tax ID, amounts, dates) and complete tax forms without typing. 100% local and private processing. No uploading sensitive documents.',
      keywords: 'fill tax model pdf, extract tax data pdf, complete tax return pdf, fill tax form pdf, extract tax information pdf, automate tax model'
    },
    DE: {
      title: 'Steuermodell aus PDF automatisch ausfüllen - Steuerdaten mit KI extrahieren',
      description: 'Füllen Sie Steuermodelle und Steuererklärungen automatisch aus PDFs aus. Extrahieren Sie Steuerdaten (Steuer-ID, Beträge, Daten) und vervollständigen Sie Steuerformulare ohne Tippen. 100% lokale und private Verarbeitung.',
      keywords: 'Steuermodell PDF ausfüllen, Steuerdaten PDF extrahieren, Steuererklärung PDF vervollständigen'
    },
    FR: {
      title: 'Remplir Modèle Fiscal depuis PDF Automatiquement - Extraire Données Fiscales avec IA',
      description: 'Remplissez automatiquement les modèles fiscaux et les déclarations fiscales à partir de PDFs. Extrayez les données fiscales (numéro fiscal, montants, dates) et complétez les formulaires fiscaux sans taper. Traitement 100% local et privé.',
      keywords: 'remplir modèle fiscal pdf, extraire données fiscales pdf, compléter déclaration fiscale pdf'
    }
  },
  TEMPLATE_EDITOR: {
    ES: {
      title: 'Editor de Plantillas Excel - La Forja de Plantillas - Insertar Variables en Excel',
      description: 'Crea plantillas Excel con marcadores {{TOTAL}}, {{FECHA}}, etc. sin necesidad de Excel instalado. Editor visual de plantillas en el navegador. Inserta campos personalizados (variables) haciendo clic en celdas. 100% gratis y privado.',
      keywords: 'editor plantilla excel, crear plantilla excel, insertar variables excel, editor excel online, plantilla excel con marcadores, forja de Plantillas, template editor excel'
    },
    EN: {
      title: 'Excel Template Editor - The Rune Forge - Insert Variables in Excel',
      description: 'Create Excel templates with markers {{TOTAL}}, {{DATE}}, etc. without Excel installed. Visual template editor in browser. Insert runes (variables) by clicking cells. 100% free and private.',
      keywords: 'excel template editor, create excel template, insert variables excel, excel editor online, excel template with markers, rune forge, template editor excel'
    },
    DE: {
      title: 'Excel-Vorlagen-Editor - Die Runenschmiede - Variablen in Excel einfügen',
      description: 'Erstellen Sie Excel-Vorlagen mit Markern {{GESAMT}}, {{DATUM}} usw. ohne Excel-Installation. Visueller Vorlagen-Editor im Browser. Fügen Sie Runen (Variablen) durch Klicken auf Zellen ein. 100% kostenlos und privat.',
      keywords: 'Excel-Vorlagen-Editor, Excel-Vorlage erstellen, Variablen Excel einfügen, Excel-Editor online, Excel-Vorlage mit Markern, Runenschmiede'
    },
    FR: {
      title: 'Éditeur de Modèles Excel - La Forge des Runes - Insérer Variables dans Excel',
      description: 'Créez des modèles Excel avec des marqueurs {{TOTAL}}, {{DATE}}, etc. sans Excel installé. Éditeur de modèles visuel dans le navigateur. Insérez des runes (variables) en cliquant sur les cellules. 100% gratuit et privé.',
      keywords: 'éditeur modèle excel, créer modèle excel, insérer variables excel, éditeur excel en ligne, modèle excel avec marqueurs, forge des runes'
    }
  }
};

export const useSEO = (view: ViewType, lang: Language) => {
  useEffect(() => {
    const metadata = seoMetadata[view][lang];
    
    // Actualizar título
    document.title = metadata.title;
    
    // Actualizar o crear meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', metadata.description);
    
    // Actualizar o crear meta keywords
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metadata.keywords) {
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta');
        metaKeywords.setAttribute('name', 'keywords');
        document.head.appendChild(metaKeywords);
      }
      metaKeywords.setAttribute('content', metadata.keywords);
    }
    
    // Actualizar Open Graph
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', metadata.title);
    
    let ogDescription = document.querySelector('meta[property="og:description"]');
    if (!ogDescription) {
      ogDescription = document.createElement('meta');
      ogDescription.setAttribute('property', 'og:description');
      document.head.appendChild(ogDescription);
    }
    ogDescription.setAttribute('content', metadata.description);
    
  }, [view, lang]);
};

