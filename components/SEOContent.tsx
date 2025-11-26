import React from 'react';
import { Language } from '../types';
import { getTranslation } from '../services/translations';
import { Lock, Shield, Zap, FileText } from 'lucide-react';

interface SEOContentProps {
  toolKey: string; // 'merge', 'split', 'convert', etc.
  lang: Language;
}

const seoContent: Record<string, Record<Language, { title: string; content: string[] }>> = {
  merge: {
    ES: {
      title: '¿Cómo unir archivos PDF gratis?',
      content: [
        'Unir PDFs es una tarea común que muchas personas necesitan realizar diariamente. Ya sea para combinar facturas, fusionar documentos de trabajo, o crear un archivo único a partir de múltiples documentos, tener una herramienta confiable es esencial.',
        'A diferencia de otras herramientas que requieren subir tus archivos a un servidor, nuestra solución procesa todo directamente en tu navegador. Esto significa que tus archivos nunca salen de tu dispositivo, garantizando privacidad total y cumplimiento con normativas RGPD.',
        'En un mundo donde la privacidad digital es cada vez más importante, procesar tus PDFs localmente te da la tranquilidad de saber que tus documentos sensibles nunca son accesibles por terceros. Esto es especialmente importante para documentos financieros, información médica, contratos legales y documentos corporativos confidenciales.',
        'Los casos de uso más comunes incluyen estudiantes que combinan apuntes de diferentes materias, profesionales que fusionan reportes y presentaciones, contadores que unen múltiples facturas en un solo documento, y empresas que consolidan documentos administrativos.',
        'La ventaja de procesar PDFs localmente no solo es la privacidad, sino también la velocidad. No hay tiempo de subida o descarga, y puedes procesar archivos de cualquier tamaño sin límites de servidor.'
      ]
    },
    EN: {
      title: 'How to merge PDF files for free?',
      content: [
        'Merging PDFs is a common task that many people need to perform daily. Whether combining invoices, merging work documents, or creating a single file from multiple documents, having a reliable tool is essential.',
        'Unlike other tools that require uploading your files to a server, our solution processes everything directly in your browser. This means your files never leave your device, ensuring total privacy and GDPR compliance.',
        'In a world where digital privacy is increasingly important, processing your PDFs locally gives you peace of mind knowing that your sensitive documents are never accessible by third parties. This is especially important for financial documents, medical information, legal contracts, and confidential corporate documents.',
        'The most common use cases include students combining notes from different subjects, professionals merging reports and presentations, accountants combining multiple invoices into a single document, and companies consolidating administrative documents.',
        'The advantage of processing PDFs locally is not only privacy but also speed. There is no upload or download time, and you can process files of any size without server limits.'
      ]
    },
    DE: {
      title: 'Wie man PDF-Dateien kostenlos zusammenführt?',
      content: [
        'Das Zusammenführen von PDFs ist eine häufige Aufgabe, die viele Menschen täglich durchführen müssen. Ob es darum geht, Rechnungen zu kombinieren, Arbeitsdokumente zusammenzuführen oder eine einzelne Datei aus mehreren Dokumenten zu erstellen, ein zuverlässiges Tool ist unerlässlich.',
        'Im Gegensatz zu anderen Tools, die das Hochladen Ihrer Dateien auf einen Server erfordern, verarbeitet unsere Lösung alles direkt in Ihrem Browser. Dies bedeutet, dass Ihre Dateien Ihr Gerät nie verlassen und so totale Privatsphäre und DSGVO-Konformität gewährleisten.',
        'In einer Welt, in der digitale Privatsphäre immer wichtiger wird, gibt Ihnen die lokale Verarbeitung Ihrer PDFs die Gewissheit, dass Ihre sensiblen Dokumente niemals von Dritten zugänglich sind. Dies ist besonders wichtig für Finanzdokumente, medizinische Informationen, Rechtsverträge und vertrauliche Unternehmensdokumente.'
      ]
    },
    FR: {
      title: 'Comment fusionner des fichiers PDF gratuitement?',
      content: [
        'Fusionner des PDFs est une tâche courante que de nombreuses personnes doivent effectuer quotidiennement. Que ce soit pour combiner des factures, fusionner des documents de travail ou créer un fichier unique à partir de plusieurs documents, avoir un outil fiable est essentiel.',
        'Contrairement à d\'autres outils qui nécessitent de télécharger vos fichiers sur un serveur, notre solution traite tout directement dans votre navigateur. Cela signifie que vos fichiers ne quittent jamais votre appareil, garantissant une confidentialité totale et une conformité RGPD.',
        'Dans un monde où la confidentialité numérique est de plus en plus importante, le traitement local de vos PDFs vous donne la tranquillité d\'esprit de savoir que vos documents sensibles ne sont jamais accessibles par des tiers. Ceci est particulièrement important pour les documents financiers, les informations médicales, les contrats légaux et les documents d\'entreprise confidentiels.'
      ]
    }
  },
  split: {
    ES: {
      title: 'Cómo dividir PDF y extraer páginas específicas',
      content: [
        'Dividir PDFs es esencial cuando necesitas extraer páginas específicas de un documento largo, separar capítulos de un libro, o aislar secciones importantes de un informe. Nuestra herramienta te permite hacerlo sin subir archivos a internet.',
        'La ventaja principal de procesar PDFs localmente es la seguridad. Tus documentos nunca salen de tu dispositivo, lo que es crucial para información sensible como contratos, informes médicos o documentos financieros.',
        'El procesamiento local también significa velocidad. No hay tiempo de espera por subida o descarga, y puedes procesar archivos de cualquier tamaño sin restricciones de servidor. Esto es especialmente útil para documentos grandes de cientos de páginas.',
        'Los casos de uso más comunes incluyen estudiantes que extraen capítulos específicos de libros de texto, profesionales que separan secciones de informes largos, y empresas que dividen documentos consolidados en archivos individuales para distribución.',
        'La privacidad es fundamental cuando trabajas con documentos que contienen información personal o confidencial. Al procesar localmente, eliminas todos los riesgos asociados con la subida de archivos a servidores de terceros.'
      ]
    },
    EN: {
      title: 'How to split PDF and extract specific pages',
      content: [
        'Splitting PDFs is essential when you need to extract specific pages from a long document, separate chapters from a book, or isolate important sections from a report. Our tool allows you to do this without uploading files to the internet.',
        'The main advantage of processing PDFs locally is security. Your documents never leave your device, which is crucial for sensitive information such as contracts, medical reports, or financial documents.',
        'Local processing also means speed. There is no waiting time for upload or download, and you can process files of any size without server restrictions. This is especially useful for large documents with hundreds of pages.',
        'The most common use cases include students extracting specific chapters from textbooks, professionals separating sections from long reports, and companies splitting consolidated documents into individual files for distribution.',
        'Privacy is fundamental when working with documents containing personal or confidential information. By processing locally, you eliminate all risks associated with uploading files to third-party servers.'
      ]
    },
    DE: {
      title: 'Wie man PDFs teilt und spezifische Seiten extrahiert',
      content: [
        'Das Teilen von PDFs ist unerlässlich, wenn Sie spezifische Seiten aus einem langen Dokument extrahieren, Kapitel aus einem Buch trennen oder wichtige Abschnitte aus einem Bericht isolieren müssen. Unser Tool ermöglicht Ihnen dies, ohne Dateien ins Internet hochzuladen.',
        'Der Hauptvorteil der lokalen Verarbeitung von PDFs ist die Sicherheit. Ihre Dokumente verlassen niemals Ihr Gerät, was für sensible Informationen wie Verträge, medizinische Berichte oder Finanzdokumente entscheidend ist.'
      ]
    },
    FR: {
      title: 'Comment diviser PDF et extraire des pages spécifiques',
      content: [
        'Diviser des PDFs est essentiel lorsque vous devez extraire des pages spécifiques d\'un long document, séparer des chapitres d\'un livre ou isoler des sections importantes d\'un rapport. Notre outil vous permet de le faire sans télécharger de fichiers sur Internet.',
        'Le principal avantage du traitement local des PDFs est la sécurité. Vos documents ne quittent jamais votre appareil, ce qui est crucial pour les informations sensibles telles que les contrats, les rapports médicaux ou les documents financiers.'
      ]
    }
  },
  convert: {
    ES: {
      title: 'Convertir PDF a Word, Excel, PowerPoint e imágenes',
      content: [
        'Convertir PDFs a otros formatos es una necesidad común en el mundo profesional y académico. Ya sea para editar un documento en Word, extraer datos a Excel, crear presentaciones en PowerPoint, o convertir a imágenes para uso web, tener una herramienta confiable es esencial.',
        'Nuestra solución procesa todas las conversiones directamente en tu navegador, sin necesidad de subir archivos a servidores de terceros. Esto garantiza que tus documentos sensibles nunca salgan de tu dispositivo.',
        'La privacidad es especialmente importante cuando trabajas con documentos que contienen información confidencial. Al procesar localmente, eliminas todos los riesgos de filtración de datos y cumples con normativas de privacidad como RGPD.',
        'Los casos de uso más comunes incluyen profesionales que convierten contratos a Word para edición, contadores que extraen datos de facturas a Excel, estudiantes que crean presentaciones desde PDFs, y diseñadores que convierten PDFs a imágenes para proyectos web.',
        'La velocidad es otra ventaja clave. No hay tiempo de espera por subida o descarga, y puedes procesar múltiples archivos simultáneamente sin límites de servidor.'
      ]
    },
    EN: {
      title: 'Convert PDF to Word, Excel, PowerPoint and images',
      content: [
        'Converting PDFs to other formats is a common need in the professional and academic world. Whether editing a document in Word, extracting data to Excel, creating presentations in PowerPoint, or converting to images for web use, having a reliable tool is essential.',
        'Our solution processes all conversions directly in your browser, without needing to upload files to third-party servers. This ensures your sensitive documents never leave your device.',
        'Privacy is especially important when working with documents containing confidential information. By processing locally, you eliminate all data breach risks and comply with privacy regulations such as GDPR.',
        'The most common use cases include professionals converting contracts to Word for editing, accountants extracting invoice data to Excel, students creating presentations from PDFs, and designers converting PDFs to images for web projects.',
        'Speed is another key advantage. There is no waiting time for upload or download, and you can process multiple files simultaneously without server limits.'
      ]
    },
    DE: {
      title: 'PDF in Word, Excel, PowerPoint und Bilder konvertieren',
      content: [
        'Das Konvertieren von PDFs in andere Formate ist ein häufiger Bedarf in der professionellen und akademischen Welt. Ob es darum geht, ein Dokument in Word zu bearbeiten, Daten nach Excel zu extrahieren, Präsentationen in PowerPoint zu erstellen oder in Bilder für die Webnutzung zu konvertieren, ein zuverlässiges Tool ist unerlässlich.',
        'Unsere Lösung verarbeitet alle Konvertierungen direkt in Ihrem Browser, ohne dass Dateien auf Server von Dritten hochgeladen werden müssen. Dies stellt sicher, dass Ihre sensiblen Dokumente Ihr Gerät niemals verlassen.'
      ]
    },
    FR: {
      title: 'Convertir PDF en Word, Excel, PowerPoint et images',
      content: [
        'Convertir des PDFs en d\'autres formats est un besoin courant dans le monde professionnel et universitaire. Que ce soit pour éditer un document dans Word, extraire des données vers Excel, créer des présentations dans PowerPoint ou convertir en images pour une utilisation web, avoir un outil fiable est essentiel.',
        'Notre solution traite toutes les conversions directement dans votre navigateur, sans avoir besoin de télécharger des fichiers sur des serveurs tiers. Cela garantit que vos documents sensibles ne quittent jamais votre appareil.'
      ]
    }
  },
  edit: {
    ES: {
      title: 'Editar PDF: Agregar marcas de agua y numeración',
      content: [
        'Editar PDFs agregando marcas de agua, numeración de páginas y overlays de imagen es esencial para proteger documentos, organizar contenido y personalizar presentaciones. Nuestra herramienta te permite hacerlo sin subir archivos a internet.',
        'Las marcas de agua son fundamentales para proteger documentos confidenciales y establecer propiedad intelectual. Al procesar localmente, garantizas que tus documentos nunca sean accesibles por terceros durante el proceso de edición.',
        'La numeración de páginas es útil para documentos largos que necesitan organización profesional, como informes, manuales o contratos. Procesar esto localmente significa que no hay riesgo de que tus documentos sean interceptados durante la edición.',
        'Los casos de uso más comunes incluyen empresas que agregan logos a documentos corporativos, profesionales que numeran páginas en informes largos, estudiantes que marcan documentos con información personal, y organizaciones que protegen documentos con marcas de agua de confidencialidad.',
        'La privacidad es crucial cuando trabajas con documentos que contienen información sensible. Al procesar localmente, eliminas todos los riesgos asociados con la subida de archivos a servidores de terceros para edición.'
      ]
    },
    EN: {
      title: 'Edit PDF: Add watermarks and page numbering',
      content: [
        'Editing PDFs by adding watermarks, page numbering, and image overlays is essential for protecting documents, organizing content, and customizing presentations. Our tool allows you to do this without uploading files to the internet.',
        'Watermarks are fundamental for protecting confidential documents and establishing intellectual property. By processing locally, you ensure your documents are never accessible by third parties during the editing process.',
        'Page numbering is useful for long documents that need professional organization, such as reports, manuals, or contracts. Processing this locally means there is no risk of your documents being intercepted during editing.',
        'The most common use cases include companies adding logos to corporate documents, professionals numbering pages in long reports, students marking documents with personal information, and organizations protecting documents with confidentiality watermarks.',
        'Privacy is crucial when working with documents containing sensitive information. By processing locally, you eliminate all risks associated with uploading files to third-party servers for editing.'
      ]
    },
    DE: {
      title: 'PDF bearbeiten: Wasserzeichen und Seitennummerierung hinzufügen',
      content: [
        'Das Bearbeiten von PDFs durch Hinzufügen von Wasserzeichen, Seitennummerierung und Bild-Overlays ist unerlässlich für den Schutz von Dokumenten, die Organisation von Inhalten und die Anpassung von Präsentationen. Unser Tool ermöglicht Ihnen dies, ohne Dateien ins Internet hochzuladen.',
        'Wasserzeichen sind grundlegend für den Schutz vertraulicher Dokumente und die Feststellung geistigen Eigentums. Durch die lokale Verarbeitung stellen Sie sicher, dass Ihre Dokumente während des Bearbeitungsprozesses niemals von Dritten zugänglich sind.'
      ]
    },
    FR: {
      title: 'Modifier PDF: Ajouter filigranes et numérotation',
      content: [
        'Modifier des PDFs en ajoutant des filigranes, la numérotation des pages et des superpositions d\'images est essentiel pour protéger les documents, organiser le contenu et personnaliser les présentations. Notre outil vous permet de le faire sans télécharger de fichiers sur Internet.',
        'Les filigranes sont fondamentaux pour protéger les documents confidentiels et établir la propriété intellectuelle. En traitant localement, vous garantissez que vos documents ne sont jamais accessibles par des tiers pendant le processus d\'édition.'
      ]
    }
  },
  imagesToPdf: {
    ES: {
      title: 'Convertir imágenes a PDF sin subir archivos',
      content: [
        'Convertir múltiples imágenes JPG o PNG a un solo PDF es una tarea común para estudiantes, profesionales y empresas. Ya sea para crear un documento único a partir de fotos, escaneos o capturas de pantalla, tener una herramienta confiable es esencial.',
        'Nuestra solución procesa todas las conversiones directamente en tu navegador, sin necesidad de subir imágenes a servidores de terceros. Esto garantiza que tus imágenes privadas nunca salgan de tu dispositivo.',
        'La privacidad es especialmente importante cuando trabajas con imágenes que contienen información personal, documentos escaneados o fotografías sensibles. Al procesar localmente, eliminas todos los riesgos de filtración de datos.',
        'Los casos de uso más comunes incluyen estudiantes que crean PDFs desde apuntes escaneados, profesionales que consolidan capturas de pantalla en un documento, empresas que digitalizan documentos físicos, y diseñadores que compilan imágenes en un portfolio PDF.',
        'La velocidad es otra ventaja clave. No hay tiempo de espera por subida o descarga, y puedes procesar múltiples imágenes simultáneamente sin límites de servidor. El ajuste automático a formato A4 garantiza que tus PDFs tengan un aspecto profesional.'
      ]
    },
    EN: {
      title: 'Convert images to PDF without uploading files',
      content: [
        'Converting multiple JPG or PNG images to a single PDF is a common task for students, professionals, and businesses. Whether creating a single document from photos, scans, or screenshots, having a reliable tool is essential.',
        'Our solution processes all conversions directly in your browser, without needing to upload images to third-party servers. This ensures your private images never leave your device.',
        'Privacy is especially important when working with images containing personal information, scanned documents, or sensitive photographs. By processing locally, you eliminate all data breach risks.',
        'The most common use cases include students creating PDFs from scanned notes, professionals consolidating screenshots into a document, businesses digitizing physical documents, and designers compiling images into a PDF portfolio.',
        'Speed is another key advantage. There is no waiting time for upload or download, and you can process multiple images simultaneously without server limits. Automatic A4 format adjustment ensures your PDFs have a professional appearance.'
      ]
    },
    DE: {
      title: 'Bilder in PDF konvertieren ohne Dateien hochzuladen',
      content: [
        'Das Konvertieren mehrerer JPG- oder PNG-Bilder in ein einzelnes PDF ist eine häufige Aufgabe für Studenten, Fachkräfte und Unternehmen. Ob es darum geht, ein einzelnes Dokument aus Fotos, Scans oder Screenshots zu erstellen, ein zuverlässiges Tool ist unerlässlich.',
        'Unsere Lösung verarbeitet alle Konvertierungen direkt in Ihrem Browser, ohne dass Bilder auf Server von Dritten hochgeladen werden müssen. Dies stellt sicher, dass Ihre privaten Bilder Ihr Gerät niemals verlassen.'
      ]
    },
    FR: {
      title: 'Convertir images en PDF sans télécharger de fichiers',
      content: [
        'Convertir plusieurs images JPG ou PNG en un seul PDF est une tâche courante pour les étudiants, les professionnels et les entreprises. Que ce soit pour créer un document unique à partir de photos, de scans ou de captures d\'écran, avoir un outil fiable est essentiel.',
        'Notre solution traite toutes les conversions directement dans votre navigateur, sans avoir besoin de télécharger des images sur des serveurs tiers. Cela garantit que vos images privées ne quittent jamais votre appareil.'
      ]
    }
  }
};

const SEOContent: React.FC<SEOContentProps> = ({ toolKey, lang }) => {
  const content = seoContent[toolKey]?.[lang];
  
  if (!content) return null;

  const t = getTranslation(lang);

  return (
    <div className="mt-12 space-y-8">
      {/* Sección de Contenido SEO */}
      <div className="bg-gray-800 border-4 border-gray-700 rounded-lg p-8">
        <h2 className="text-3xl font-bold text-indigo-400 mb-6 pixel-font-header">
          {content.title}
        </h2>
        <div className="space-y-4 text-gray-300 text-lg leading-relaxed">
          {content.content.map((paragraph, idx) => (
            <p key={idx}>{paragraph}</p>
          ))}
        </div>
      </div>

      {/* Sección de Privacidad */}
      <div className="bg-indigo-900/30 border-4 border-indigo-500 rounded-lg p-8">
        <div className="flex items-start gap-4 mb-6">
          <Lock className="w-8 h-8 text-indigo-400 flex-shrink-0" />
          <div>
            <h3 className="text-2xl font-bold text-indigo-400 mb-4">
              {lang === 'ES' ? '🔒 Privacidad 100% Garantizada' : 
               lang === 'EN' ? '🔒 100% Privacy Guaranteed' :
               lang === 'DE' ? '🔒 100% Privatsphäre garantiert' :
               '🔒 Confidentialité 100% Garantie'}
            </h3>
            <p className="text-gray-300 text-lg mb-4">
              {lang === 'ES' 
                ? 'Esta herramienta procesa tus archivos completamente en tu navegador. Ningún archivo se sube a internet, lo que significa:'
                : lang === 'EN'
                ? 'This tool processes your files completely in your browser. No files are uploaded to the internet, which means:'
                : lang === 'DE'
                ? 'Dieses Tool verarbeitet Ihre Dateien vollständig in Ihrem Browser. Keine Dateien werden ins Internet hochgeladen, was bedeutet:'
                : 'Cet outil traite vos fichiers complètement dans votre navigateur. Aucun fichier n\'est téléchargé sur Internet, ce qui signifie:'}
            </p>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start gap-2">
                <Shield className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-1" />
                <span>
                  {lang === 'ES' ? 'Cumplimiento total con RGPD' :
                   lang === 'EN' ? 'Full GDPR compliance' :
                   lang === 'DE' ? 'Vollständige DSGVO-Konformität' :
                   'Conformité totale RGPD'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-1" />
                <span>
                  {lang === 'ES' ? 'Sin riesgo de filtración de datos' :
                   lang === 'EN' ? 'No risk of data breaches' :
                   lang === 'DE' ? 'Kein Risiko von Datenlecks' :
                   'Aucun risque de fuite de données'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-1" />
                <span>
                  {lang === 'ES' ? 'Procesamiento instantáneo sin esperas' :
                   lang === 'EN' ? 'Instant processing without waiting' :
                   lang === 'DE' ? 'Sofortige Verarbeitung ohne Wartezeit' :
                   'Traitement instantané sans attente'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-1" />
                <span>
                  {lang === 'ES' ? 'Ideal para documentos sensibles' :
                   lang === 'EN' ? 'Ideal for sensitive documents' :
                   lang === 'DE' ? 'Ideal für sensible Dokumente' :
                   'Idéal pour les documents sensibles'}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="bg-gray-800/50 border-2 border-gray-700 rounded-lg p-6 mt-6">
          <h4 className="text-xl font-bold text-gray-300 mb-3">
            {lang === 'ES' ? '¿Por qué es importante la privacidad en PDFs?' :
             lang === 'EN' ? 'Why is privacy important in PDFs?' :
             lang === 'DE' ? 'Warum ist Privatsphäre bei PDFs wichtig?' :
             'Pourquoi la confidentialité est-elle importante dans les PDFs?'}
          </h4>
          <p className="text-gray-400 text-base">
            {lang === 'ES' 
              ? 'Los PDFs a menudo contienen información sensible: datos personales, información financiera, contratos legales. Al procesarlos localmente, eliminas todos los riesgos asociados con la subida de archivos a servidores de terceros.'
              : lang === 'EN'
              ? 'PDFs often contain sensitive information: personal data, financial information, legal contracts. By processing them locally, you eliminate all risks associated with uploading files to third-party servers.'
              : lang === 'DE'
              ? 'PDFs enthalten oft sensible Informationen: personenbezogene Daten, Finanzinformationen, Rechtsverträge. Durch die lokale Verarbeitung eliminieren Sie alle Risiken, die mit dem Hochladen von Dateien auf Server von Dritten verbunden sind.'
              : 'Les PDFs contiennent souvent des informations sensibles: données personnelles, informations financières, contrats légaux. En les traitant localement, vous éliminez tous les risques associés au téléchargement de fichiers sur des serveurs tiers.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SEOContent;

