import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Calendar, Clock, Tag, ArrowLeft, User } from 'lucide-react';
import blogMetadata from '../data/blog_metadata.json';

interface BlogPostData {
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

interface BlogPostProps {
  lang: 'ES' | 'EN' | 'DE' | 'FR';
}

const BlogPost: React.FC<BlogPostProps> = ({ lang }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPostData | null>(null);
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadPost = async () => {
      try {
        // Buscar el post en los metadatos
        const postData = (blogMetadata as BlogPostData[]).find(p => p.id === id);
        
        if (!postData) {
          navigate('/blog');
          return;
        }

        setPost(postData);

        // Actualizar meta tags para SEO
        document.title = `${postData.title} | PDF Wizardz Blog`;
        
        // Meta description
        let metaDescription = document.querySelector('meta[name="description"]');
        if (!metaDescription) {
          metaDescription = document.createElement('meta');
          metaDescription.setAttribute('name', 'description');
          document.head.appendChild(metaDescription);
        }
        metaDescription.setAttribute('content', postData.description);

        // Open Graph tags
        let ogTitle = document.querySelector('meta[property="og:title"]');
        if (!ogTitle) {
          ogTitle = document.createElement('meta');
          ogTitle.setAttribute('property', 'og:title');
          document.head.appendChild(ogTitle);
        }
        ogTitle.setAttribute('content', postData.title);

        let ogDescription = document.querySelector('meta[property="og:description"]');
        if (!ogDescription) {
          ogDescription = document.createElement('meta');
          ogDescription.setAttribute('property', 'og:description');
          document.head.appendChild(ogDescription);
        }
        ogDescription.setAttribute('content', postData.description);

        let ogImage = document.querySelector('meta[property="og:image"]');
        if (!ogImage) {
          ogImage = document.createElement('meta');
          ogImage.setAttribute('property', 'og:image');
          document.head.appendChild(ogImage);
        }
        ogImage.setAttribute('content', postData.image || 'https://pdfwizardz.app/Images/Logo_wizard-removebg-preview.png');

        let ogUrl = document.querySelector('meta[property="og:url"]');
        if (!ogUrl) {
          ogUrl = document.createElement('meta');
          ogUrl.setAttribute('property', 'og:url');
          document.head.appendChild(ogUrl);
        }
        ogUrl.setAttribute('content', `https://pdfwizardz.app/blog/${postData.id}`);

        let ogType = document.querySelector('meta[property="og:type"]');
        if (!ogType) {
          ogType = document.createElement('meta');
          ogType.setAttribute('property', 'og:type');
          document.head.appendChild(ogType);
        }
        ogType.setAttribute('content', 'article');

        // Twitter Card tags
        let twitterCard = document.querySelector('meta[name="twitter:card"]');
        if (!twitterCard) {
          twitterCard = document.createElement('meta');
          twitterCard.setAttribute('name', 'twitter:card');
          document.head.appendChild(twitterCard);
        }
        twitterCard.setAttribute('content', 'summary_large_image');

        let twitterTitle = document.querySelector('meta[name="twitter:title"]');
        if (!twitterTitle) {
          twitterTitle = document.createElement('meta');
          twitterTitle.setAttribute('name', 'twitter:title');
          document.head.appendChild(twitterTitle);
        }
        twitterTitle.setAttribute('content', postData.title);

        let twitterDescription = document.querySelector('meta[name="twitter:description"]');
        if (!twitterDescription) {
          twitterDescription = document.createElement('meta');
          twitterDescription.setAttribute('name', 'twitter:description');
          document.head.appendChild(twitterDescription);
        }
        twitterDescription.setAttribute('content', postData.description);

        let twitterImage = document.querySelector('meta[name="twitter:image"]');
        if (!twitterImage) {
          twitterImage = document.createElement('meta');
          twitterImage.setAttribute('name', 'twitter:image');
          document.head.appendChild(twitterImage);
        }
        twitterImage.setAttribute('content', postData.image || 'https://pdfwizardz.app/Images/Logo_wizard-removebg-preview.png');

        // Canonical URL
        let canonical = document.querySelector('link[rel="canonical"]');
        if (!canonical) {
          canonical = document.createElement('link');
          canonical.setAttribute('rel', 'canonical');
          document.head.appendChild(canonical);
        }
        canonical.setAttribute('href', `https://pdfwizardz.app/blog/${postData.id}`);

        // Article meta tags
        let articleAuthor = document.querySelector('meta[property="article:author"]');
        if (!articleAuthor) {
          articleAuthor = document.createElement('meta');
          articleAuthor.setAttribute('property', 'article:author');
          document.head.appendChild(articleAuthor);
        }
        articleAuthor.setAttribute('content', postData.author);

        let articlePublishedTime = document.querySelector('meta[property="article:published_time"]');
        if (!articlePublishedTime) {
          articlePublishedTime = document.createElement('meta');
          articlePublishedTime.setAttribute('property', 'article:published_time');
          document.head.appendChild(articlePublishedTime);
        }
        articlePublishedTime.setAttribute('content', new Date(postData.date).toISOString());

        // Tags como article:tag
        postData.tags.forEach((tag, index) => {
          let articleTag = document.querySelector(`meta[property="article:tag"][content="${tag}"]`);
          if (!articleTag) {
            articleTag = document.createElement('meta');
            articleTag.setAttribute('property', 'article:tag');
            articleTag.setAttribute('content', tag);
            document.head.appendChild(articleTag);
          }
        });

        // Cargar el contenido del archivo markdown desde la carpeta public
        // Los archivos deben estar en public/posts/ para que sean accesibles
        const response = await fetch(`/posts/${id}-.md`);
        if (response.ok) {
          const markdownContent = await response.text();
          setContent(markdownContent);
        } else {
          console.error('Markdown file not found');
          setContent(`# ${postData.title}\n\n${postData.description}\n\n*Contenido del artículo pendiente de cargar.*`);
        }
      } catch (error) {
        console.error('Error loading post:', error);
        if (post) {
          setContent(`# ${post.title}\n\n${post.description}\n\n*Error al cargar el contenido del artículo.*`);
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadPost();
    }
  }, [id, navigate]);

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
      back: 'Volver al blog',
      by: 'Por',
      category: 'Categoría',
      tags: 'Etiquetas',
      minRead: 'min de lectura',
      loading: 'Cargando artículo...',
      notFound: 'Artículo no encontrado'
    },
    EN: {
      back: 'Back to blog',
      by: 'By',
      category: 'Category',
      tags: 'Tags',
      minRead: 'min read',
      loading: 'Loading article...',
      notFound: 'Article not found'
    },
    DE: {
      back: 'Zurück zum Blog',
      by: 'Von',
      category: 'Kategorie',
      tags: 'Tags',
      minRead: 'Min. Lesezeit',
      loading: 'Artikel wird geladen...',
      notFound: 'Artikel nicht gefunden'
    },
    FR: {
      back: 'Retour au blog',
      by: 'Par',
      category: 'Catégorie',
      tags: 'Tags',
      minRead: 'min de lecture',
      loading: 'Chargement de l\'article...',
      notFound: 'Article non trouvé'
    }
  };

  const t = translations[lang];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-900 py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 text-lg mb-4">{t.notFound}</p>
          <Link
            to="/blog"
            className="inline-block bg-indigo-600 text-white border-2 border-black px-6 py-2 font-bold retro-shadow hover:bg-indigo-500 transition-colors"
          >
            {t.back}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 mb-8 font-bold transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          {t.back}
        </Link>

        {/* Header */}
        <article className="bg-gray-800 border-4 border-black p-8 md:p-12 retro-shadow">
          {post.image && (
            <div className="mb-8 aspect-video bg-gray-700 border-2 border-gray-600 overflow-hidden">
              <img
                src={post.image}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="mb-6">
            <span className="inline-block bg-indigo-900/50 text-indigo-300 px-3 py-1 text-sm font-bold border border-indigo-600 mb-4">
              {post.category}
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 pixel-font-header neon-glow-text">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 mb-6 text-gray-400">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5" />
              <span>{t.by} <strong className="text-gray-300">{post.author}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <span>{formatDate(post.date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span>{post.readTime} {t.minRead}</span>
            </div>
          </div>

          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {post.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 bg-gray-700 text-gray-300 px-3 py-1 text-sm border border-gray-600"
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Content */}
          <div className="prose prose-invert prose-lg max-w-none">
            <div className="markdown-content text-gray-200 leading-relaxed">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({node, ...props}) => <h1 className="text-3xl font-bold text-white mb-4 mt-8 pixel-font-header" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-2xl font-bold text-indigo-400 mb-3 mt-6 pixel-font-header" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-xl font-bold text-indigo-300 mb-2 mt-4" {...props} />,
                  p: ({node, ...props}) => <p className="mb-4 text-gray-200" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc list-inside mb-4 space-y-2 text-gray-200" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-4 space-y-2 text-gray-200" {...props} />,
                  li: ({node, ...props}) => <li className="ml-4" {...props} />,
                  strong: ({node, ...props}) => <strong className="font-bold text-white" {...props} />,
                  em: ({node, ...props}) => <em className="italic text-indigo-300" {...props} />,
                  a: ({node, ...props}) => <a className="text-indigo-400 hover:text-indigo-300 underline" {...props} />,
                  code: ({node, ...props}) => <code className="bg-gray-900 text-indigo-300 px-2 py-1 rounded border border-gray-700 text-sm" {...props} />,
                  pre: ({node, ...props}) => <pre className="bg-gray-900 p-4 rounded border border-gray-700 overflow-x-auto mb-4" {...props} />,
                  blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-indigo-500 pl-4 italic text-gray-300 my-4" {...props} />,
                  img: ({node, ...props}) => <img className="rounded border-2 border-gray-700 my-4 max-w-full" {...props} />,
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          </div>
        </article>

        {/* Related Posts or Back to Blog */}
        <div className="mt-8 text-center">
          <Link
            to="/blog"
            className="inline-block bg-indigo-600 text-white border-2 border-black px-8 py-3 font-bold retro-shadow hover:bg-indigo-500 transition-colors"
          >
            {t.back}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BlogPost;

