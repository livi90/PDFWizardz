import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Tag, ArrowRight } from 'lucide-react';
import blogMetadata from '../data/blog_metadata.json';

interface BlogPost {
  id: string;
  title: string;
  description: string;
  author: string;
  date: string;
  category: string;
  tags: string[];
  image: string;
  readTime: string;
}

interface BlogListProps {
  lang: 'ES' | 'EN' | 'DE' | 'FR';
}

const BlogList: React.FC<BlogListProps> = ({ lang }) => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');

  useEffect(() => {
    setPosts(blogMetadata as BlogPost[]);
    
    // Actualizar meta tags para SEO de la página del blog
    document.title = 'Blog - Artículos y Tutoriales sobre PDFs | PDF Wizardz';
    
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', 'Descubre artículos, tutoriales y consejos sobre cómo trabajar con PDFs, organizar documentos, extraer datos y aprovechar al máximo las herramientas de PDF. Todo sobre procesamiento de PDFs, privacidad y automatización.');
    
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', 'Blog - Artículos y Tutoriales sobre PDFs | PDF Wizardz');
    
    let ogDescription = document.querySelector('meta[property="og:description"]');
    if (!ogDescription) {
      ogDescription = document.createElement('meta');
      ogDescription.setAttribute('property', 'og:description');
      document.head.appendChild(ogDescription);
    }
    ogDescription.setAttribute('content', 'Descubre artículos, tutoriales y consejos sobre cómo trabajar con PDFs, organizar documentos, extraer datos y aprovechar al máximo las herramientas de PDF.');
    
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', 'https://pdfwizardz.app/blog');
  }, []);

  const categories = ['Todas', ...Array.from(new Set(posts.map(post => post.category)))];

  const filteredPosts = selectedCategory === 'Todas' 
    ? posts 
    : posts.filter(post => post.category === selectedCategory);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(lang === 'ES' ? 'es-ES' : lang === 'EN' ? 'en-US' : lang === 'DE' ? 'de-DE' : 'fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const translations = {
    ES: {
      title: 'Blog',
      subtitle: 'Artículos y Tutoriales',
      allCategories: 'Todas',
      readMore: 'Leer más',
      minRead: 'min de lectura',
      noPosts: 'No hay artículos disponibles',
      category: 'Categoría',
      tags: 'Etiquetas'
    },
    EN: {
      title: 'Blog',
      subtitle: 'Articles and Tutorials',
      allCategories: 'All',
      readMore: 'Read more',
      minRead: 'min read',
      noPosts: 'No articles available',
      category: 'Category',
      tags: 'Tags'
    },
    DE: {
      title: 'Blog',
      subtitle: 'Artikel und Tutorials',
      allCategories: 'Alle',
      readMore: 'Mehr lesen',
      minRead: 'Min. Lesezeit',
      noPosts: 'Keine Artikel verfügbar',
      category: 'Kategorie',
      tags: 'Tags'
    },
    FR: {
      title: 'Blog',
      subtitle: 'Articles et Tutoriels',
      allCategories: 'Toutes',
      readMore: 'Lire plus',
      minRead: 'min de lecture',
      noPosts: 'Aucun article disponible',
      category: 'Catégorie',
      tags: 'Tags'
    }
  };

  const t = translations[lang];

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-indigo-400 mb-4 pixel-font-header neon-glow-text">
            {t.title}
          </h1>
          <p className="text-gray-400 text-lg md:text-xl">
            {t.subtitle}
          </p>
        </div>

        {/* Categories Filter */}
        <div className="mb-8 flex flex-wrap gap-2 justify-center">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 border-2 border-black font-bold transition-all retro-shadow ${
                selectedCategory === category
                  ? 'bg-indigo-600 text-white border-indigo-400'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Posts Grid */}
        {filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">{t.noPosts}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => (
              <Link
                key={post.id}
                to={`/blog/${post.id}`}
                className="group bg-gray-800 border-4 border-black p-6 hover:-translate-y-2 transition-all retro-shadow hover:shadow-[0_8px_0_0_rgba(0,0,0,0.8)]"
              >
                {post.image && (
                  <div className="mb-4 aspect-video bg-gray-700 border-2 border-gray-600 overflow-hidden">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                    />
                  </div>
                )}
                <div className="flex items-center gap-4 mb-3 text-sm text-gray-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(post.date)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{post.readTime} {t.minRead}</span>
                  </div>
                </div>
                <div className="mb-2">
                  <span className="inline-block bg-indigo-900/50 text-indigo-300 px-2 py-1 text-xs font-bold border border-indigo-600">
                    {post.category}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white mb-3 pixel-font-header group-hover:text-indigo-400 transition-colors">
                  {post.title}
                </h2>
                <p className="text-gray-400 mb-4 line-clamp-3">
                  {post.description}
                </p>
                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="text-xs bg-gray-700 text-gray-300 px-2 py-1 border border-gray-600"
                      >
                        <Tag className="w-3 h-3 inline mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center text-indigo-400 font-bold group-hover:text-indigo-300 transition-colors">
                  {t.readMore}
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogList;

