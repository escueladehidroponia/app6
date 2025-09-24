import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeftIcon, ArrowRightIcon, SunIcon, MoonIcon, BookOpenIcon } from '@heroicons/react/24/outline';

const Boton = ({ children, onClick, className = '', ...props }) => (
  <button 
    onClick={onClick} 
    className={`px-3 py-2 rounded-md font-semibold text-sm flex items-center justify-center gap-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 ${className}`}
    {...props}
  >
    {children}
  </button>
);

export default function Lector({ libro, onVolver, onAddAnnotation, onRemoveAnnotation }) {
  const [capituloActual, setCapituloActual] = useState(0);
  const [config, setConfig] = useState(() => {
    const guardado = localStorage.getItem('lectorConfig');
    return guardado ? JSON.parse(guardado) : {
      fontSize: 18,
      theme: 'claro',
    };
  });
  const [selection, setSelection] = useState(null);
  const contentRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('lectorConfig', JSON.stringify(config));
  }, [config]);

  const cambiarCapitulo = (siguiente) => {
    const nuevoIndex = siguiente ? capituloActual + 1 : capituloActual - 1;
    if (nuevoIndex >= 0 && nuevoIndex < libro.capitulos.length) {
      setCapituloActual(nuevoIndex);
      setSelection(null);
    }
  };

  const ajustarFuente = (incremento) => {
    setConfig(c => ({ ...c, fontSize: Math.max(12, Math.min(32, c.fontSize + incremento)) }));
  };

  const handleMouseUp = () => {
    const sel = window.getSelection();
    if (sel.rangeCount > 0 && !sel.isCollapsed) {
      const range = sel.getRangeAt(0);
      // Ignorar selecciones dentro de los botones o la UI
      if (contentRef.current && contentRef.current.contains(range.commonAncestorContainer)) {
        const rect = range.getBoundingClientRect();
        setSelection({ range, rect });
      } else {
        setSelection(null);
      }
    } else {
      setSelection(null);
    }
  };

  const getAbsoluteOffset = (node, offset, container) => {
    const range = document.createRange();
    range.selectNodeContents(container);
    range.setEnd(node, offset);
    return range.toString().length;
  };

  const handleHighlight = () => {
    if (!selection || !contentRef.current) return;

    const { range } = selection;
    const contentDiv = contentRef.current.querySelector('.whitespace-pre-wrap');
    if (!contentDiv) return;

    const start = getAbsoluteOffset(range.startContainer, range.startOffset, contentDiv);
    const end = getAbsoluteOffset(range.endContainer, range.endOffset, contentDiv);

    // Limpiar la UI de selección de todas formas
    setSelection(null);
    window.getSelection().removeAllRanges();

    if (start >= end) {
      console.warn("Highlight failed: Invalid range selected.");
      return;
    }

    const text = range.toString();

    onAddAnnotation(libro.id, capitulo.id, {
      id: Date.now(),
      type: 'highlight',
      start,
      end,
      text,
    });
  };

  const renderContentWithAnnotations = () => {
    const text = capitulo.contenido.find(c => c.artesanoId === 'base')?.texto || 'Este capítulo no tiene contenido base.';
    const annotations = capitulo.annotations || [];
    let lastIndex = 0;
    const parts = [];

    [...annotations]
      .sort((a, b) => a.start - b.start)
      .forEach(annotation => {
        if (annotation.start > lastIndex) {
          parts.push(text.substring(lastIndex, annotation.start));
        }
        parts.push(
          <mark 
            key={annotation.id} 
            className="bg-yellow-300/70 cursor-pointer"
            onClick={() => onRemoveAnnotation(libro.id, capitulo.id, annotation.id)}
          >
            {text.substring(annotation.start, annotation.end)}
          </mark>
        );
        lastIndex = annotation.end;
      });

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts;
  };

  const temas = {
    claro: 'bg-white text-gray-800',
    oscuro: 'bg-gray-800 text-gray-200',
    sepia: 'bg-[#fbf0d9] text-[#5b4636]',
  };

  const capitulo = libro.capitulos[capituloActual];

  return (
    <div className={`w-full h-full flex flex-col ${temas[config.theme]}`}>
      {/* Barra Superior */}
      <header className="flex justify-between items-center p-4 border-b border-gray-300 dark:border-gray-700 flex-shrink-0">
        <Boton onClick={onVolver}><ArrowLeftIcon className="h-5 w-5" /> Volver a Mis Libros</Boton>
        <div className="text-center">
          <h2 className="text-xl font-bold">{libro.titulo}</h2>
          <p className="text-sm">Capítulo {capituloActual + 1} de {libro.capitulos.length}: {capitulo.titulo}</p>
        </div>
        <div className="flex items-center gap-4">
          <Boton onClick={() => ajustarFuente(-2)} disabled={config.fontSize <= 12}>A-</Boton>
          <span>{config.fontSize}px</span>
          <Boton onClick={() => ajustarFuente(2)} disabled={config.fontSize >= 32}>A+</Boton>
          <Boton onClick={() => setConfig(c => ({...c, theme: 'claro'}))}><SunIcon className="h-5 w-5" /></Boton>
          <Boton onClick={() => setConfig(c => ({...c, theme: 'oscuro'}))}><MoonIcon className="h-5 w-5" /></Boton>
          <Boton onClick={() => setConfig(c => ({...c, theme: 'sepia'}))}><BookOpenIcon className="h-5 w-5" /></Boton>
        </div>
      </header>

      {/* Contenido del Libro */}
      <main className="flex-grow overflow-y-auto p-8 md:p-12 lg:p-16 relative" ref={contentRef} onMouseUp={handleMouseUp}>
        {selection && (
          <div 
            style={{ top: selection.rect.top - contentRef.current.getBoundingClientRect().top - 40, left: selection.rect.left - contentRef.current.getBoundingClientRect().left + selection.rect.width / 2 - 30}} 
            className="absolute z-10"
          >
            <Boton onClick={handleHighlight}>Subrayar</Boton>
          </div>
        )}
        <div 
          className="max-w-4xl mx-auto prose dark:prose-invert lg:prose-xl"
          style={{ fontSize: `${config.fontSize}px` }}
        >
          <h3 className="text-2xl font-bold mb-4">{capitulo.titulo}</h3>
          <div className="whitespace-pre-wrap leading-relaxed">
            {renderContentWithAnnotations()}
          </div>
        </div>
      </main>

      {/* Barra Inferior / Paginación */}
      <footer className="flex justify-between items-center p-4 border-t border-gray-300 dark:border-gray-700 flex-shrink-0">
        <Boton onClick={() => cambiarCapitulo(false)} disabled={capituloActual === 0}>
          <ArrowLeftIcon className="h-5 w-5" /> Anterior
        </Boton>
        <span>Página {capituloActual + 1} de {libro.capitulos.length}</span>
        <Boton onClick={() => cambiarCapitulo(true)} disabled={capituloActual >= libro.capitulos.length - 1}>
          Siguiente <ArrowRightIcon className="h-5 w-5" />
        </Boton>
      </footer>
    </div>
  );
}